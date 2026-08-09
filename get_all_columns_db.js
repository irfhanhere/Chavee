import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('Fetching columns from information_schema...');
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name, data_type')
    .eq('table_schema', 'public');

  if (error) {
    console.log('❌ Failed to read from information_schema.columns:', error.message);
    
    // Let's try querying postgrest schema or checking via rpc if there's any
  } else {
    console.log('✅ Columns fetched successfully:');
    const grouped = {};
    data.forEach(row => {
      if (!grouped[row.table_name]) grouped[row.table_name] = [];
      grouped[row.table_name].push(`${row.column_name} (${row.data_type})`);
    });
    console.log(JSON.stringify(grouped, null, 2));
  }
}
run();
