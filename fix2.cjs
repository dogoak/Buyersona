const fs = require('fs');
let content = fs.readFileSync('supabase/functions/prospector-engine/index.ts', 'utf8');
const lines = content.split('\n');
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes('Synthesized ') && lines[i].includes('profiles from SERP directly')) {
        lines.splice(i+1, 0, '        }');
        break;
    }
}
fs.writeFileSync('supabase/functions/prospector-engine/index.ts', lines.join('\n'), 'utf8');
console.log("Fixed brace!");
