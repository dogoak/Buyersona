import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'No authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } }
        });

        // Admin client bypasses RLS - used for data lookups in payment flow
        const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Verify user identity using the JWT in the Authorization header
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Auth Error:', JSON.stringify(authError));
            return new Response(JSON.stringify({
                error: 'Unauthorized',
                details: authError,
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const { report_id, analysis_id, success_url, failure_url } = await req.json();

        if (!report_id && !analysis_id) {
            return new Response(JSON.stringify({ error: 'report_id or analysis_id is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        let paymentTargetId = report_id;
        let itemTitle = 'Analisis Estrategico - Mi Negocio';
        let itemDescription = 'Informe estrategico completo con buyer personas, canales de adquisicion, analisis competitivo y plan de accion.';
        let isAlreadyPaid = false;
        let isDeepDive = false;

        if (analysis_id) {
            // DEEP DIVE PAYMENT FLOW
            isDeepDive = true;
            const { data: analysis, error: analysisError } = await adminClient
                .from('product_analyses')
                .select('id, business_report_id, user_id, is_paid, business_reports(user_id, business_name)')
                .eq('id', analysis_id)
                .single();

            if (analysisError || !analysis) {
                return new Response(JSON.stringify({ error: 'Deep Dive Analysis not found' }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            // @ts-ignore
            const analysisUserId = analysis.user_id || analysis.business_reports?.user_id;
            if (analysisUserId !== user.id) {
                return new Response(JSON.stringify({ error: 'Unauthorized for this analysis' }), {
                    status: 403,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            isAlreadyPaid = analysis.is_paid;
            // @ts-ignore
            const bName = analysis.business_reports?.business_name || 'Producto';
            itemTitle = `Product Deep Dive - ${bName}`;
            itemDescription = 'Analisis tactico profundo de producto, mapa conductual, pitch de ventas y matriz de objeciones.';
            paymentTargetId = analysis_id;
        } else {
            // STANDARD BUSINESS REPORT PAYMENT FLOW
            const { data: report, error: reportError } = await adminClient
                .from('business_reports')
                .select('id, business_name, user_id, is_paid, is_voluntary_payment')
                .eq('id', report_id)
                .eq('user_id', user.id)
                .single();

            if (reportError || !report) {
                return new Response(JSON.stringify({ error: 'Report not found' }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            isAlreadyPaid = report.is_paid && !report.is_voluntary_payment;
            itemTitle = `Analisis Estrategico - ${report.business_name || 'Mi Negocio'}`;
            paymentTargetId = report_id;
        }

        if (isAlreadyPaid) {
            return new Response(JSON.stringify({ error: 'Already paid' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Fetch dynamic prices from system settings
        const { data: settings, error: settingsError } = await adminClient
            .from('system_settings')
            .select('report_price_ars, deep_dive_price_ars')
            .eq('id', 1)
            .single();

        if (settingsError || !settings) {
            return new Response(JSON.stringify({ error: 'System settings missing' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Use the correct price based on product type
        const unitPrice = isDeepDive
            ? (settings.deep_dive_price_ars || 12500)
            : (settings.report_price_ars || 25000);

        const isLocalDevelopment = SUPABASE_URL.includes('localhost') || SUPABASE_URL.includes('127.0.0.1');

        const preference: Record<string, unknown> = {
            items: [
                {
                    id: String(paymentTargetId),
                    title: itemTitle,
                    description: itemDescription,
                    quantity: 1,
                    currency_id: 'ARS',
                    unit_price: Number(unitPrice),
                },
            ],
            payer: {
                email: user.email,
            },
            external_reference: String(paymentTargetId),
            metadata: {
                report_id: report_id ? String(report_id) : undefined,
                analysis_id: analysis_id ? String(analysis_id) : undefined,
                user_id: String(user.id),
                is_deep_dive: isDeepDive,
            },
        };

        if (!isLocalDevelopment) {
            preference.notification_url = `${SUPABASE_URL}/functions/v1/mp-webhook`;
        }

        if (success_url && !success_url.includes('localhost') && !success_url.includes('127.0.0.1')) {
            preference.back_urls = {
                success: String(success_url),
                failure: failure_url ? String(failure_url) : String(success_url),
                pending: String(success_url),
            };
            preference.auto_return = 'approved';
        }

        const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
            },
            body: JSON.stringify(preference),
        });

        const mpData = await mpResponse.json();

        if (!mpResponse.ok) {
            console.error('MercadoPago error:', JSON.stringify(mpData));
            return new Response(JSON.stringify({ error: 'Failed to create payment', details: mpData }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Save payment record
        const paymentRecord: Record<string, unknown> = {
            user_id: user.id,
            amount: unitPrice,
            currency: 'ARS',
            status: 'pending',
            payment_provider: 'mercadopago',
            external_payment_id: String(mpData.id),
        };

        // Link to the correct table
        if (isDeepDive) {
            paymentRecord.business_report_id = null; // Deep dives don't link to business_reports directly
        } else {
            paymentRecord.business_report_id = report_id;
        }

        await adminClient.from('payments').insert(paymentRecord);

        return new Response(JSON.stringify({
            init_point: mpData.init_point,
            sandbox_init_point: mpData.sandbox_init_point,
            preference_id: mpData.id,
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error', details: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
