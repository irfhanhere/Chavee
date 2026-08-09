import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing joint query on job_applications and profiles...');
  const { data, error } = await supabase
    .from('job_applications')
    .select('*, profiles:user_id(id, full_name, username, college)')
    .limit(1);

  if (error) {
    console.log('❌ Joint query failed:', error.message);
  } else {
    console.log('✅ Joint query works! Output:', data);
  }
}

run();
