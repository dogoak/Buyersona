import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('business_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (error) console.error(error);
  else {
    fs.writeFileSync('latest_report_debug.json', JSON.stringify(data[0].analysis_result, null, 2));
    console.log("Wrote latest report to latest_report_debug.json");
  }
}
check();
