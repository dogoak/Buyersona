const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || 'https://ieadzvrdvduebbukfqls.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'fake';
const supabase = createClient(supabaseUrl, supabaseKey);
supabase.auth.getUser('invalid').then(console.log).catch(console.error);
