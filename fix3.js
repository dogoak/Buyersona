const fs = require('fs');
let content = fs.readFileSync('supabase/functions/prospector-engine/index.ts', 'utf8');

content = content.replace(
    /\/\/ STEP 3: Multi-Source Lead Search\n.*?let serpProfiles/s,
    `// STEP 3: Multi-Source Lead Search
        // ═══════════════════════════════════════════
        console.log('[Step 3] Searching leads across Apollo + SERP...');
        let apolloPeople = [];

        // 3A: Apollo.io (Primary source - verified data)
        if (apolloKey) {
            try {
                const filters = icpDefinition.apollo_filters || {};
                apolloPeople = await searchApollo(apolloKey, filters, Math.min(maxLeads + 5, 25));
                console.log(\`[Step 3A] Apollo returned \${apolloPeople.length} people\`);
            } catch (e) {
                console.error(\`[Step 3A] Apollo search failed: \${e.message}\`);
            }
        } else {
            console.warn('[Step 3A] No APOLLO_API_KEY configured, skipping Apollo');
        }

        // 3B: Google SERP (Supplementary source for LinkedIn discovery)
        let serpProfiles`
);

fs.writeFileSync('supabase/functions/prospector-engine/index.ts', content, 'utf8');
console.log("Fixed apollo block!");
