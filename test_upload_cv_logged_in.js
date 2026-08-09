import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Logging in as student@chavee.in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'student@chavee.in',
    password: 'chavee123'
  });

  if (authError) {
    console.error('❌ Sign in failed:', authError.message);
    return;
  }
  console.log('✅ Sign in succeeded! User ID:', authData.user?.id);

  console.log('Testing upload to job-cvs...');
  const fileData = 'my cv test';
  const { data, error } = await supabase.storage
    .from('job-cvs')
    .upload(`cvs/test_${Date.now()}.txt`, fileData, {
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
