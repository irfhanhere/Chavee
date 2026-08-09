import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  const { data, error } = await supabase.from('admins').select('*');
  if (error) {
    console.log('Error reading admins:', error.message);
  } else {
    console.log('Admins list:', data);
  }
}
run();
