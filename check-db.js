import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: payments } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("LAST 5 PAYMENTS:");
  console.log(JSON.stringify(payments, null, 2));

  const { data: reports } = await supabase.from('business_reports').select('id, business_name, api_cost_usd, is_paid, status').order('created_at', { ascending: false }).limit(5);
  console.log("\nLAST 5 REPORTS:");
  console.log(JSON.stringify(reports, null, 2));
}

check();
