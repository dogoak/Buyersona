import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Helpers ──

async function callGemini(req: Request, prompt: string, model: string) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const proxyUrl = `${supabaseUrl}/functions/v1/gemini-proxy`;
    const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.get('Authorization') || '' },
        body: JSON.stringify({ action: 'generate_icp', model, contents: prompt, config: { responseMimeType: 'application/json' } })
    });
    if (!res.ok) throw new Error(`Gemini error: ${res.status} - ${await res.text()}`);
    const data = await res.json();
    return data.text;
}

async function callApify(req: Request, action: string, payload: any) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const proxyUrl = `${supabaseUrl}/functions/v1/apify-proxy`;
    const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.get('Authorization') || '' },
        body: JSON.stringify({ action, payload })
    });
    if (!res.ok) {
        console.warn(`Apify ${action} warn: ${res.status}`);
        return null;
    }
    return await res.json();
}

async function searchApolloCompanies(apiKey: string, filters: any, perPage = 10): Promise<any[]> {
    const payload = { ...filters, per_page: perPage };
    console.log("[Apollo API] Searching Companies with payload:", JSON.stringify(payload));
    const res = await fetch('https://api.apollo.io/api/v1/mixed_companies/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        console.error(`Apollo API Companies error: ${res.status} - ${await res.text().catch(()=>'')}`);
        return [];
    }
    const data = await res.json();
    return data.organizations || [];
}

async function searchApolloPeople(apiKey: string, filters: any, perPage = 5): Promise<any[]> {
    const payload = { ...filters, per_page: perPage, contact_email_status: ["verified", "likely"] };
    console.log("[Apollo API] Searching People with payload:", JSON.stringify(payload));
    const res = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const errText = await res.text();
        // If it fails with strict email requirement, try without it
        if (filters.contact_email_status) {
            console.warn(`[Apollo API] Retrying without email strict status...`);
            const retryPayload = { ...filters, per_page: perPage };
            const retryRes = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
                body: JSON.stringify(retryPayload)
            });
            if (retryRes.ok) {
                const retryData = await retryRes.json();
                return retryData.people || [];
            }
        }
        console.error(`Apollo API People error: ${res.status} - ${errText.slice(0, 300)}`);
        return [];
    }
    const data = await res.json();
    return data.people || [];
}

function buildBusinessDNA(report: any): string {
    if (!report?.analysis_result) return "";
    const ar = report.analysis_result;
    const parts: string[] = [];
    parts.push(`EMPRESA: ${report.business_name}`);
    if (ar.summary) parts.push(`RESUMEN ESTRATÉGICO: ${String(ar.summary).slice(0, 800)}`);
    if (ar.blueOcean) parts.push(`ESTRATEGIA BLUE OCEAN: ${JSON.stringify(ar.blueOcean).slice(0, 400)}`);
    if (ar.competitors) parts.push(`COMPETIDORES ANALIZADOS: ${JSON.stringify(ar.competitors).slice(0, 400)}`);
    if (ar.growthOpportunities) parts.push(`OPORTUNIDADES DE CRECIMIENTO: ${JSON.stringify(ar.growthOpportunities).slice(0, 400)}`);
    return parts.join('\n\n');
}

// ── Main Handler ──
export default Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    let campaign_id = '';
    try {
        const body = await req.json();
        campaign_id = body.campaign_id;
    } catch {
        return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!campaign_id) {
        return new Response(JSON.stringify({ success: false, error: 'Missing campaign_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
        return new Response(JSON.stringify({ success: false, error: 'Missing auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const adminDb = createClient(supabaseUrl, serviceRoleKey);

    try {
        console.log(`[Prospector V5 ABM] Starting for campaign ${campaign_id}`);
        // ═══════════════════════════════════════════
        // STEP 0: Fetch campaign & update status
        // ═══════════════════════════════════════════
        const { data: campaign, error: cErr } = await supabase
            .from('prospecting_campaigns')
            .select('*, business_reports(business_name, analysis_result)')
            .eq('id', campaign_id)
            .single();

        if (cErr || !campaign) throw new Error(`Campaign not found: ${cErr?.message}`);
        await adminDb.from('prospecting_campaigns').update({ status: 'running' }).eq('id', campaign_id);

        const modelUsed = campaign.model_used || 'gemini-2.5-flash';
        const apolloKey = Deno.env.get('APOLLO_API_KEY') || '';

        // ═══════════════════════════════════════════
        // STEP 1: Build Context & DNA
        // ═══════════════════════════════════════════
        console.log('[Step 1] Building Business DNA...');
        let businessDNA = campaign.business_report_id && campaign.business_reports
            ? buildBusinessDNA(campaign.business_reports)
            : `Company context not available. Seed clients: ${JSON.stringify(campaign.input_clients)}`;

        // Process seed clients briefly
        const seedClients = (campaign.input_clients || []).map((c: any) => {
            if (typeof c === 'string') return { name: c, website: '', linkedin: '', industry: '', notes: '' };
            return c;
        });

        const seedClientsSummary = seedClients.map((c: any) =>
            `- ${c.name}${c.website ? ` (${c.website})` : ''}${c.industry ? ` [${c.industry}]` : ''}${c.notes ? ` — ${c.notes}` : ''}`
        ).join('\n');

        const searchConfig = campaign.search_config || {};
        const targetRegion = searchConfig.region || 'Argentina';
        const maxLeads = searchConfig.max_leads || 5; // Limiting to top 5 for Deep Profiling by default if not set

        // ═══════════════════════════════════════════
        // STEP 2: Gemini generates Company ICP & Apollo Filters
        // ═══════════════════════════════════════════
        console.log('[Step 2] Generating B2B Company ICP + Apollo Filters...');
        const icpPrompt = `
Eres un experto en Account-Based Marketing (ABM) B2B. Tu meta es perfilar EMPRESAS objetivo (no personas) basándote en este contexto.

## ADN DE EMPRESA
${businessDNA.slice(0, 3000)}

## CLIENTES SEMILLA (Mejores Clientes)
${seedClientsSummary}

## PREFERENCIAS
Región: ${targetRegion}
Roles objetivo a futuro: ${searchConfig.roles?.join(', ') || 'Dueño, CEO, Director, Compras'}
Industrias: ${searchConfig.industries?.join(', ') || 'Cualquiera'}

Genera los filtros exactos para Apollo.io "mixed_companies/search" y "mixed_people/search". Opciones válidas de Apollo:
Para empresas: q_organization_keyword_tags (array de strings), organization_locations (array de strings)
Para personas: person_titles (array de strings con nombres de cargos)

Responde SOLO en JSON:
{
  "icp_summary": "Resumen de por qué estas empresas son el blanco ideal...",
  "company_filters": {
    "organization_locations": ["Argentina"],
    "q_organization_keyword_tags": ["ecommerce", "moda"]
  },
  "decision_maker_titles": ["CEO", "Director", "Gerente de Compras", "Fundador"],
  "value_hooks": ["Argumento de venta 1", "Argumento 2"]
}`;

        const icpText = await callGemini(req, icpPrompt, modelUsed);
        let icpDef: any;
        try {
            icpDef = JSON.parse(icpText.replace(/```(?:json)?|```/g, '').trim());
        } catch (e) {
            console.error("Fallo parseando ICP:", e);
            throw new Error("La IA no generó el formato correcto de ICP.");
        }
        await adminDb.from('prospecting_campaigns').update({ icp_definition: icpDef }).eq('id', campaign_id);

        if (!apolloKey) throw new Error("Falta APOLLO_API_KEY en las variables de entorno.");

        // ═══════════════════════════════════════════
        // STEP 3: Company Sourcing (Buscar las empresas objetivo)
        // ═══════════════════════════════════════════
        console.log('[Step 3] Hunting Target Companies (ABM)...');
        let companies = await searchApolloCompanies(apolloKey, icpDef.company_filters, (maxLeads * 2));
        
        // Iterative fallback if no companies found
        if (companies.length === 0) {
            console.warn('[Step 3] No companies found. Retrying with relaxed filters (location only)...');
            const relaxedFilters = { organization_locations: [targetRegion] };
            companies = await searchApolloCompanies(apolloKey, relaxedFilters, (maxLeads * 2));
        }

        if (companies.length === 0) {
            throw new Error(`No se encontraron empresas (cuentas) en la región ${targetRegion} que coincidan con la búsqueda.`);
        }
        
        console.log(`[Step 3] Found ${companies.length} initial companies. Proceeding to top ${maxLeads}.`);
        const topCompanies = companies.slice(0, maxLeads);

        // ═══════════════════════════════════════════
        // STEP 4: Decision-Maker Hunt & Deep Profiling
        // ═══════════════════════════════════════════
        console.log('[Step 4] Tracking Decision Makers and executing Deep Profiling (Artilleria Pesada)...');
        const enrichedAccounts = [];

        // Hacemos el procesamiento en paralelo para no consumir tanto tiempo de ejecución de la Edge Function
        const profilePromises = topCompanies.map(async (company: any) => {
            let dm: any = null;
            let socialFootprint = "";
            let emailStatus = 'no_email';

            // 4.A Find Decision Maker via Apollo
            if (company.primary_domain) {
                const dmFilters = {
                    q_organization_domains: company.primary_domain,
                    person_titles: icpDef.decision_maker_titles
                };
                const people = await searchApolloPeople(apolloKey, dmFilters, 3);
                if (people.length > 0) {
                    dm = people[0]; // Take the most relevant matched person
                    emailStatus = dm.email ? 'found_email' : 'found_linkedin_only';
                }
            }

            // 4.B Deep Profiling (Scraping SERP para capturar "contexto" a nivel de la persona o de la empresa)
            // Esto es un reemplazo iterativo a scrapear redes completas, hacemos un query exhaustivo en Google.
            const queryName = dm ? `${dm.first_name} ${dm.last_name}` : "noticias OR novedades";
            const queryCompany = company.name || company.primary_domain;
            try {
                // Buscamos que dice Google de esta persona y la empresa
                const serpData = await callApify(req, 'scrape_google_serp', {
                    queries: [`"${queryName}" "${queryCompany}" LinkedIn OR noticias OR "entrevista"`]
                });
                
                let snippetCollected = "";
                if (serpData?.result?.queries?.[0]?.organicResults) {
                    const topResults = serpData.result.queries[0].organicResults.slice(0, 3);
                    snippetCollected = topResults.map((r: any) => `${r.title} - ${r.description}`).join(' | ');
                }
                
                if (snippetCollected) {
                    socialFootprint = `Encontramos esto en la web reciente: ${snippetCollected}`;
                } else {
                    socialFootprint = `Empresa sólida ubicada en ${company.city || company.country}. Industria: ${company.industry}. Tecnologías detectadas: ${company.seo_description?.slice(0, 100) || 'N/A'}`;
                }
            } catch (e: any) {
                console.warn(`[Step 4B] SERP scraping param error for ${queryCompany}:`, e.message);
                socialFootprint = `Información general: ${company.seo_description || 'Sin descripción corporativa'}`;
            }

            // Normalize account entity
            return {
                company_name: company.name || '',
                company_website: company.website_url || company.primary_domain || '',
                location: [company.city, company.country].filter(Boolean).join(', '),
                industry: company.industry || '',
                
                // Decision Maker info (if found)
                full_name: dm ? `${dm.first_name || ''} ${dm.last_name || ''}`.trim() : 'Fantasma (Oportunidad Institucional)',
                job_title: dm ? dm.title || dm.headline : 'Tomador de Decisiones General',
                email: dm ? dm.email || '' : '',
                linkedin_url: dm ? dm.linkedin_url : company.linkedin_url || '',
                photo_url: dm ? dm.photo_url : company.logo_url || '',
                
                // Status tagging based on user's ABM feedback
                data_source: dm ? 'apollo_person + deep_search' : 'apollo_company_only_ghost',
                
                // Secret Context for AI
                _internal_context: socialFootprint
            };
        });

        const resolvedAccounts = await Promise.all(profilePromises);
        enrichedAccounts.push(...resolvedAccounts);

        // ═══════════════════════════════════════════
        // STEP 5: Generating Hyper-Personalized Outreach
        // ═══════════════════════════════════════════
        console.log('[Step 5] Generating Hyper-Personalized Outreach...');
        
        const myCompanyName = campaign.business_reports?.business_name || 'nuestra empresa';
        const valueHooksText = icpDef.value_hooks?.join('\n- ') || 'Soluciones de alto impacto';

        // Prepare context blocks for each lead to prompt Gemini in ONE big call
        const leadsForPrompt = enrichedAccounts.map((a, i) => `
[ID: ${i}]
Empresa: ${a.company_name}
Decisor Encontrado: ${a.full_name} (${a.job_title})
Huella y Contexto Digital: ${a._internal_context}
Emails a enviar a: ${a.email ? 'Casilla personal' : 'Solo tenemos LinkedIn del decisor o contacto empresa'}
`).join('\n');

        const outreachPrompt = `
Eres un Account Executive B2B y maestro en ventas corporativas. Estás aplicando Account-Based Marketing para prospectar las cuentas clave.

## TUS ARMAS DE VENTA (Empresa: ${myCompanyName})
- ${valueHooksText}

## EL CONTEXTO
Estás escribiendo correos/mensajes uno-a-uno a los decisores directos. Para cada cuenta, recolectamos 'Huella y Contexto Digital' en internet. Usa ese contexto como el *gancho* inicial para que sepan que hiciste la tarea. ¡Que no parezca automatizado!

## TUS LEADS
${leadsForPrompt}

## TU TAREA
Para cada lead generado [ID], devuelve:
1. match_score (0-100)
2. reason_for_match (Por qué esta empresa encaja en nuestro ICP, en español)
3. outreach (El mensaje para contacto). 
   - Si dice "Decisor Encontrado: Fantasma...", aclara en 'reason_for_match' que no sabemos su email y redirige el correo de forma institucional, o recomienda prospectar por corporativo.
   - Variantes requeridas: email_formal (120 words max), email_direct (audaz, al punto), linkedin_dm (40 words max).

Responde EXACTAMENTE con este JSON array:
[
  {
    "lead_index": 0,
    "match_score": 90,
    "reason_for_match": "Bla bla...",
    "outreach": {
      "email_formal": { "subject": "Viendo el crecimiento en [Contexto]", "body": "Hola [Nombre]..." },
      "email_direct": { "subject": "Idea audaz", "body": "..." },
      "linkedin_dm": { "message": "..." }
    }
  }
]`;

        let outreachResults: any[] = [];
        try {
            const outreachText = await callGemini(req, outreachPrompt, modelUsed);
            outreachResults = JSON.parse(outreachText.replace(/```(?:json)?|```/g, '').trim());
        } catch (e: any) {
            console.error(`[Step 5] Fallo en la generación de IA: ${e.message}`);
            // Fallback content in case Gemini parsing fails completely
            outreachResults = enrichedAccounts.map((_, i) => ({
                lead_index: i,
                match_score: 70,
                reason_for_match: 'Alineación de industria y perfil (generado estático por error de IA).',
                outreach: {
                    email_formal: { subject: `Soluciones para ${enrichedAccounts[i].company_name}`, body: 'Hola, me gustaría conversar sobre mejoras operativas...' },
                    email_direct: { subject: 'Conversación', body: 'Rápida consulta...' },
                    linkedin_dm: { message: 'Hola! Vi tu perfil corporativo y creo que podríamos conversar.' }
                }
            }));
        }

        // ═══════════════════════════════════════════
        // STEP 6: Assembling Final DB and Saving
        // ═══════════════════════════════════════════
        console.log('[Step 6] Final assembly and storing.');
        
        const finalProspects = enrichedAccounts.map((lead, i) => {
            const out = outreachResults.find((o: any) => o.lead_index === i) || outreachResults[i] || {};
            
            // Clean up internal context from the final output payload to keep DB clean
            const cleanLead = { ...lead };
            delete cleanLead._internal_context;

            // Handle the "ghost" edge case beautifully for the user dashboard
            let note = cleanLead.data_source.includes('ghost') 
                ? '⚠️ No se encontró la huella digital personal del tomador de decisiones. El outreach es corporativo.' 
                : '✅ Decisor identificado exitosamente.';

            return {
                ...cleanLead,
                match_score: out.match_score || 50,
                reason_for_match: `${note} ${out.reason_for_match || ''}`,
                outreach: out.outreach || {}
            };
        });

        // Ordenamos por score
        finalProspects.sort((a, b) => b.match_score - a.match_score);

        await adminDb.from('prospecting_campaigns').update({
            status: 'completed',
            prospects_list: finalProspects
        }).eq('id', campaign_id);

        console.log(`[Success] Processed ${finalProspects.length} accounts.`);
        return new Response(JSON.stringify({ success: true, prospectsFound: finalProspects.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error('[Prospector v5 ABM] Fatal error:', error);
        try {
            await adminDb.from('prospecting_campaigns').update({
                status: 'failed',
                error_details: error.message
            }).eq('id', campaign_id);
        } catch (_) {}
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
