import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  const email = `admin-${Date.now()}@chavee.com`;
  const password = 'AdminPassword123!';
  
  console.log(`Signing up test user: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Chavee Admin',
        username: 'chaveeadmin'
      }
    }
  });

  if (signUpError) {
    console.log('❌ Signup failed:', signUpError.message);
    return;
  }

  const userId = signUpData.user?.id;
  console.log(`✅ Signup successful! User ID: ${userId}`);

  // Now, try to insert this user into `admins`
  console.log(`Trying to insert user into admins table...`);
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .insert({ user_id: userId })
    .select('*');

  if (adminError) {
    console.log('❌ Admins insert failed:', adminError.message);
  } else {
    console.log('✅ Success! Admins insert worked:', adminData);
  }

  // Also check if is_admin RPC returns true
  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
  console.log(`RPC is_admin returned:`, rpcError ? rpcError.message : isAdmin);
}
run();
