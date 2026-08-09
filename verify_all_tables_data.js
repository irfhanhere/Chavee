import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== VERIFYING COMMUNITIES ===');
  const { data: comms } = await supabase.from('communities').select('id, name, status');
  console.log(comms);

  console.log('=== VERIFYING JOBS ===');
  const { data: jobs } = await supabase.from('jobs').select('id, title, status');
  console.log(jobs);

  console.log('=== VERIFYING SCHOLARSHIPS ===');
  const { data: schol } = await supabase.from('scholarships').select('id, name, status');
  console.log(schol);
}

run();
