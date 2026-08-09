import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== INSERTING DUMMY EVENT ===');
  const dummyEvent = {
    title: 'Test Event ' + Date.now(),
    description: 'This is a test event',
    host_name: 'Test Host',
    location: 'Online',
    event_date: new Date().toISOString(),
    price: 0,
    status: 'live'
  };

  const { data: insertData, error: insertError } = await supabase
    .from('events')
    .insert([dummyEvent])
    .select();

  if (insertError) {
    console.error('❌ Insert failed:', insertError.message);
  } else {
    console.log('✅ Insert succeeded! Data returned:', insertData);
  }

  console.log('=== SELECTING ALL EVENTS ===');
  const { data, count, error } = await supabase
    .from('events')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('❌ Select failed:', error.message);
  } else {
    console.log(`✅ Select succeeded! Rows: ${data.length}, Count: ${count}`);
    console.log(data);
  }
}

run();
