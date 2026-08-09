import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== GETTING PROFILE BY ID ===');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', 'e4f84d9b-35d8-464e-ba69-103fd20b513a');

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Profile:', data);
  }
}
run();
