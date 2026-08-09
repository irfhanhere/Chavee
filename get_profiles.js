import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== GETTING PROFILES ===');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(3);

  if (error) {
    console.error('❌ Failed:', error.message);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
