import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== FINAL EVENTS VERIFICATION ===');
  const { data, error } = await supabase
    .from('events')
    .select('id, title, status, description');

  if (error) {
    console.error('❌ Failed to select from events:', error.message);
  } else {
    console.log(`✅ Returned rows length: ${data.length}`);
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
