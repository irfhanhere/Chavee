import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== ATTEMPTING TO SIGN IN WITH PREVIOUSLY CREATED STUDENT ===');
  
  // Wait, let's look at the exact timestamp!
  // In task-119.log, the email was: test_student_1784025130000@chavee.com
  // Let's try it!
  const email = 'test_student_1784025130000@chavee.com';
  const password = 'TemporaryPassword123!';

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('❌ Sign in failed:', error.message);
  } else {
    console.log('✅ Sign in succeeded! User ID:', data.user?.id);
    console.log('Session token:', data.session?.access_token ? 'Exists' : 'None');

    // Try to insert a gig
    const { data: gigData, error: gigError } = await supabase
      .from('gigs')
      .insert({
        title: 'Social Media Banner Design',
        category: 'Design, Figma',
        price: 3000,
        condition: '5 Days',
        description: 'Need a student to design banner assets.',
        status: 'Live',
        verified: false,
        client_name: 'ZARA Boutique',
        location: 'Remote',
        posted_by: data.user.id
      })
      .select('*');

    if (gigError) {
      console.error('❌ Gig insert failed:', gigError.message);
    } else {
      console.log('✅ Gig insert succeeded! Inserted row:', gigData);
    }
  }
}

run();
