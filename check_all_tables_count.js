import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== CHECKING ALL TABLES ROW COUNTS ===');
  const tables = ['events', 'communities', 'jobs', 'gigs', 'courses', 'scholarships'];
  for (const t of tables) {
    const { count, error } = await supabase
      .from(t)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ Table ${t} failed:`, error.message);
    } else {
      console.log(`✅ Table ${t}: ${count} rows`);
    }
  }
}

run();
