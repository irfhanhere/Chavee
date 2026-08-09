import { supabase } from './src/supabaseClient.js';

async function run() {
  const { data, error } = await supabase.from('events').select('*').limit(1);
  if (error) console.error(error);
  else console.log(JSON.stringify(data[0] || {}, null, 2));
}

run();
