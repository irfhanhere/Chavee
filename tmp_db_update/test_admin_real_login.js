import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== ATTEMPTING TO SIGN IN WITH ADMIN ACCOUNT ===');
  
  const email = 'admin@chavee.in';
  const password = 'chavee123';

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('❌ Sign in failed:', error.message);
  } else {
    console.log('✅ Sign in succeeded! User ID:', data.user?.id);
    
    // Check if user is admin
    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
    if (rpcError) {
      console.error('❌ RPC is_admin check failed:', rpcError.message);
    } else {
      console.log('👑 is_admin RPC result:', isAdmin);
    }
  }
}

run();
