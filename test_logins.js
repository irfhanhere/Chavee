import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dtokistffdnycrzbmxcr.supabase.co';
const SUPABASE_ANON = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';

const client = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });

const ACCOUNTS = [
  { email: 'student@chavee.in', password: 'chavee123' },
  { email: 'priya@gmail.com', password: 'chavee123' },
  { email: 'priya@gmail.com', password: 'Password123' },
  { email: 'priya@gmail.com', password: 'priya123' },
  { email: 'aarav@gmail.com', password: 'chavee123' },
  { email: 'aarav@gmail.com', password: 'Password123' },
  { email: 'aarav@gmail.com', password: 'aarav123' }
];

async function run() {
  console.log('Testing existing accounts...');
  for (const acc of ACCOUNTS) {
    const { data, error } = await client.auth.signInWithPassword({
      email: acc.email,
      password: acc.password
    });
    if (error) {
      console.log(`❌ Failed: ${acc.email} / ${acc.password} - ${error.message}`);
    } else {
      console.log(`✅ SUCCESS! ${acc.email} / ${acc.password} - User ID: ${data.user.id}`);
    }
  }
}

run();
