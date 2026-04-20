const fs = require('fs');
let content = fs.readFileSync('supabase/functions/prospector-engine/index.ts', 'utf8');
const lines = content.split('\n');

if (lines[358].includes('riching')) {
    lines.splice(358, 18);
    lines.splice(358, 0, '        console.log(`[Step 3C] Synthesized ${enrichedSerpLeads.length} profiles from SERP directly.`);');
    fs.writeFileSync('supabase/functions/prospector-engine/index.ts', lines.join('\n'), 'utf8');
    console.log("Fixed lines!");
} else {
    console.log("Line 358 is: ", lines[358]);
}
