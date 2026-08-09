import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== READING INSERTED GIGS ===');
  // Select all rows from gigs table
  const { data, error } = await supabase
    .from('gigs')
    .select('*');

  if (error) {
    console.error('❌ Error reading gigs:', error.message);
  } else {
    console.log(`✅ Retrieved ${data?.length || 0} gigs:`, JSON.stringify(data, null, 2));
  }
}
run();
