import { supabase } from './src/supabaseClient.js';
import fs from 'fs';

async function run() {
  const { data, error } = await supabase.from('events').select('*').limit(1);
  if (error) {
    fs.writeFileSync('schema_out.json', JSON.stringify({error: error.message}));
  } else {
    fs.writeFileSync('schema_out.json', JSON.stringify(data[0] || {}, null, 2));
  }
}

run();
