const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('business_reports')
    .select('*')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error(error);
  } else if (data && data.length > 0) {
    const fs = require('fs');
    fs.writeFileSync('latest_report_debug.json', JSON.stringify(data[0].analysis_result, null, 2));
    console.log("Wrote AI JSON to latest_report_debug.json");
  } else {
    console.log("No completed reports found.");
  }
}

check();
