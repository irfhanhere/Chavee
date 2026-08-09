import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const email = `test_student_${Date.now()}@chavee.com`;
  const password = 'TestPassword123!';

  console.log(`1. Signing up test student: ${email}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });

  if (signUpError) {
    console.error('❌ Sign up failed:', signUpError.message);
    return;
  }
  
  const user = signUpData.user;
  console.log('✅ Sign up succeeded! User ID:', user?.id);

  // If signUp doesn't automatically sign in, we sign in explicitly
  let session = signUpData.session;
  if (!session) {
    console.log('2. Signing in explicitly...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return;
    }
    session = signInData.session;
  }
  
  console.log('✅ Signed in successfully!');

  console.log('3. Testing upload to job-cvs bucket...');
  const fileData = 'Dummy CV content for testing';
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('job-cvs')
    .upload(`cvs/test_${Date.now()}.txt`, fileData, {
      contentType: 'text/plain',
      upsert: true
    });

  if (uploadError) {
    console.log('❌ Upload failed:', uploadError.message);
  } else {
    console.log('✅ Upload success! Path:', uploadData.path);
    
    // Test public URL retrieval
    const { data: urlData } = supabase.storage
      .from('job-cvs')
      .getPublicUrl(uploadData.path);
    console.log('✅ Public URL:', urlData.publicUrl);
  }
}

run();
