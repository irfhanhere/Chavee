import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('community_channels')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Query failed:', error.message);
  } else {
    console.log('✅ Query succeeded! Data:', data);
  }
}

run();
