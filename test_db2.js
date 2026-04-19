import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function getColumns() {
  const { data, error } = await supabase.from('product_analyses').select('*').limit(1);
  console.log(data);
  console.log(error);
}
getColumns();
