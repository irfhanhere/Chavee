import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

const columns = [
  'id', 'title', 'description', 'host_name', 'location', 
  'event_date', 'price', 'seats_total', 'seats_filled', 
  'image_url', 'status', 'created_at', 'featured_on_landing',
  'fee', 'ticket_price', 'cost', 'entry_fee'
];

async function run() {
  const results = {};
  console.log('Probing event columns...');
  for (const col of columns) {
    const { error } = await supabase.from('events').select(col).limit(1);
    if (error) {
      results[col] = { exists: false, error: error.message };
    } else {
      results[col] = { exists: true };
    }
  }

  // Also query a sample event row to see what values are populated
  const { data, error } = await supabase.from('events').select('*').limit(2);
  results.sample_data = data || [];
  results.sample_error = error ? error.message : null;

  fs.writeFileSync('tmp_inspect_events_output.json', JSON.stringify(results, null, 2));
  console.log('Inspection complete. Output written to tmp_inspect_events_output.json');
}

run();
