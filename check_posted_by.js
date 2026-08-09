import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  const columns = ['desc', 'description'];
  for (const col of columns) {
    const { error } = await supabase.from('gigs').select(col).limit(1);
    if (error) {
      console.log(`❌ Column ${col} failed:`, error.message);
    } else {
      console.log(`✅ Column ${col} OK`);
    }
  }
}
run();
