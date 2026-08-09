import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== VERIFYING EVENTS (PLURAL) ===');
  const { data: plData, count: plCount, error: plErr } = await supabase
    .from('events')
    .select('*', { count: 'exact' });
  console.log('events:', plData, 'count:', plCount, 'error:', plErr);

  console.log('=== VERIFYING EVENT (SINGULAR) ===');
  const { data: sgData, count: sgCount, error: sgErr } = await supabase
    .from('event')
    .select('*', { count: 'exact' });
  console.log('event:', sgData, 'count:', sgCount, 'error:', sgErr);
}

run();
