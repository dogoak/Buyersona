import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('get_schema_info', { table_name: 'business_reports' });
  if (error) {
     console.log("RPC might not exist, trying fallback approach...");
     const { data: cols } = await supabase.from('business_reports').select('api_cost_usd').limit(1);
     console.log('Sample column structure:', cols);
  } else {
     console.log(data);
  }
}

check();
