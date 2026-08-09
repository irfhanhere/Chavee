import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  const tables = ['conversations', 'conversation_participants', 'messages'];
  for (const table of tables) {
    console.log(`\n--- Inspecting ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Select failed for ${table}:`, error.message);
    } else {
      console.log(`✅ Success! Table ${table} has rows:`, data);
      if (data.length > 0) {
        console.log(`Columns:`, Object.keys(data[0]));
      } else {
        // Probe columns via select('*') select or mock insert
        console.log(`No rows in ${table}. let's try to query id and common columns...`);
      }
    }
  }
}
run();
