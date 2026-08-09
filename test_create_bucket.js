import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Attempting to create bucket: job-cvs');
  const { data, error } = await supabase.storage.createBucket('job-cvs', {
    public: true
  });

  if (error) {
    console.log('❌ Failed to create bucket:', error.message);
  } else {
    console.log('✅ Bucket created successfully:', data);
  }
}

run();
