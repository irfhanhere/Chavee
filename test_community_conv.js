import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing communities columns...');
  const { data, error } = await supabase
    .from('communities')
    .select('id, name, conversation_id')
    .limit(1);

  if (error) {
    console.log('❌ Query failed:', error.message);
  } else {
    console.log('✅ Query succeeded! Data:', data);
  }
}

run();
