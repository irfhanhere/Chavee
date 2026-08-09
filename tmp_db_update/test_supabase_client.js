import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('Querying events table via Supabase client...');
  const { data, error } = await supabase
    .from('events')
    .select('id, title, status');

  if (error) {
    console.error('❌ Supabase Client Error:', error.message);
  } else {
    console.log(`✅ Success! Found ${data.length} event rows.`);
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
