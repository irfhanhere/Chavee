import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  const scholCols = ['id', 'name', 'description', 'eligibility', 'apply_url', 'featured_month', 'status', 'coming_soon', 'is_live'];
  console.log('--- Probing scholarships columns ---');
  for (const col of scholCols) {
    const { error } = await supabase.from('scholarships').select(col).limit(1);
    if (error) {
      console.log(`❌ scholarships does NOT have column: ${col} (${error.message})`);
    } else {
      console.log(`✅ scholarships HAS column: ${col}`);
    }
  }

  const commCols = ['id', 'name', 'category', 'description', 'guidelines', 'is_paid', 'price', 'status', 'coming_soon', 'is_live'];
  console.log('--- Probing communities columns ---');
  for (const col of commCols) {
    const { error } = await supabase.from('communities').select(col).limit(1);
    if (error) {
      console.log(`❌ communities does NOT have column: ${col} (${error.message})`);
    } else {
      console.log(`✅ communities HAS column: ${col}`);
    }
  }
}
run();
