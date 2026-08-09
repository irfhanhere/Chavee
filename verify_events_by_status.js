import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== SELECTING ALL EVENTS ===');
  const { data: allData, error: allErr } = await supabase
    .from('events')
    .select('*');
  console.log('No filters:', allData, allErr);

  console.log('=== SELECTING STATUS = live ===');
  const { data: liveData, error: liveErr } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'live');
  console.log('status=live:', liveData, liveErr);

  console.log('=== SELECTING STATUS = Live (uppercase) ===');
  const { data: liveData2, error: liveErr2 } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'Live');
  console.log('status=Live:', liveData2, liveErr2);

  console.log('=== SELECTING STATUS = coming_soon ===');
  const { data: csData, error: csErr } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'coming_soon');
  console.log('status=coming_soon:', csData, csErr);
}

run();
