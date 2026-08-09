import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dtokistffdnycrzbmxcr.supabase.co';
const SUPABASE_ANON = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
  
  // Sign up and verify a test user
  const email = `qa_test_insert_${Date.now()}@web-library.net`;
  const password = 'TestPass123!';
  
  await supabase.auth.signUp({ email, password });
  // Confirm email using SQL is not possible, so let's use guerrilla mail or sign in to an existing unconfirmed account?
  // Wait, can we sign in to the user we just created in the previous run?
  // Yes! The previous run created User A: giownfvk@guerrillamailblock.com / TestPass123!
  // Let's use User A's credentials to test!
  const userAEmail = 'tqzxrzum@guerrillamailblock.com'; // from stdout in step 582
  console.log('Signing in as:', userAEmail);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: userAEmail,
    password: 'TestPass123!'
  });
  
  if (error) {
    console.error('Sign in failed:', error.message);
    return;
  }
  
  console.log('Sign in success. User ID:', data.user.id);
  
  console.log('Attempting to insert conversation...');
  const res = await supabase.from('conversations').insert({ created_at: new Date().toISOString() }).select('id').single();
  console.log('Conversations insert result:', JSON.stringify(res, null, 2));
}

run();
