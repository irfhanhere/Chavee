import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== TESTING PHONE SIGNUP ===');
  const { data, error } = await supabase.auth.signUp({
    phone: '+15550199',
    password: 'TemporaryPassword123!'
  });

  if (error) {
    console.error('❌ Phone signup failed:', error.message);
  } else {
    console.log('✅ Phone signup worked!', data);
  }
}
run();
