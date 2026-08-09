import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dtokistffdnycrzbmxcr.supabase.co';
const SUPABASE_ANON = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
  
  // Sign in as User A
  const userAEmail = 'tqzxrzum@guerrillamailblock.com';
  const { data, error } = await supabase.auth.signInWithPassword({
    email: userAEmail,
    password: 'TestPass123!'
  });
  
  if (error) {
    console.error('Sign in failed:', error.message);
    return;
  }
  
  // Attempt to select post_comments joining with public_profiles
  const res = await supabase.from('post_comments')
    .select(`
      id, content,
      public_profiles:profiles(full_name, avatar_url)
    `)
    .limit(5);
    
  console.log('Result with profiles:', JSON.stringify(res, null, 2));

  const res2 = await supabase.from('post_comments')
    .select(`
      id, content,
      public_profiles(full_name, avatar_url)
    `)
    .limit(5);

  console.log('Result with public_profiles view:', JSON.stringify(res2, null, 2));
}

run();
