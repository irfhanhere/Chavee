import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  const email = 'admin-test-verify@chavee.com';
  const password = 'AdminPassword123!';
  
  console.log(`Signing up test admin user: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Chavee Verify Admin',
        username: 'chaveeverifyadmin'
      }
    }
  });

  if (signUpError) {
    if (signUpError.message && signUpError.message.includes('already registered')) {
      console.log('✅ User already registered, proceeding to signIn testing...');
    } else {
      console.log('❌ Signup failed:', signUpError.message);
      return;
    }
  } else {
    console.log(`✅ Signup successful! User ID: ${signUpData.user?.id}`);
  }

  // Double check sign-in works
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (signInError) {
    console.log('❌ Sign in failed:', signInError.message);
    return;
  }
  console.log('✅ Sign in successful! User ID:', signInData.user?.id);
}
run();
