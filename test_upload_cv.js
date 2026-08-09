import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing upload to job-cvs...');
  const fileData = 'test content';
  const { data, error } = await supabase.storage
    .from('job-cvs')
    .upload('test.txt', fileData, {
      contentType: 'text/plain',
      upsert: true
    });

  if (error) {
    console.log('❌ Upload failed:', error.message);
  } else {
    console.log('✅ Upload success! Path:', data.path);
  }
}

run();
