import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== LOGGING IN WITH EXISTING TEST STUDENT ===');
  
  // We don't know the exact timestamp, but let's try to list some possible emails
  // wait, let's look at the created_at in profiles if we can read it?
  // We can't read profiles anonymously.
  // But wait! Can we sign in anonymously? No, disabled.
  // Can we sign up? Let's try to sign up again using a random email, maybe the rate limit is reset now!
  const email = `test_student_fresh_${Date.now()}@chavee.com`;
  const password = 'TemporaryPassword123!';
  
  console.log(`Signing up ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });

  if (signUpError) {
    console.error('❌ Sign up failed:', signUpError.message);
    return;
  }

  console.log('✅ Sign up succeeded! User ID:', signUpData.user?.id);
  console.log('Session returned:', signUpData.session);
}

run();
