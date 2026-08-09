import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== SIGNING UP NEW USER TO QUERY EVENTS ===');

  const email = `test_query_events_${Date.now()}@chavee.com`;
  const password = 'TemporaryPassword123!';

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });

  if (signUpError) {
    console.error('❌ Sign up failed:', signUpError.message);
    
    // If signup failed, let's try reading anonymously just in case
    console.log('Trying anonymous select...');
    const { data, count, error } = await supabase.from('events').select('*', { count: 'exact' });
    console.log('Anon select data:', data, 'count:', count, 'error:', error);
    return;
  }

  console.log('✅ Sign up succeeded! User ID:', signUpData.user?.id);

  // Query events with this user session
  const { data, count, error } = await supabase
    .from('events')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('❌ Query failed:', error.message);
  } else {
    console.log(`✅ Success! Total events found (data.length): ${data?.length}`);
    console.log(`✅ Total events count (count): ${count}`);
    console.log('Returned rows:', data);
  }
}

run();
