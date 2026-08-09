import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== ATTEMPTING TO SIGN IN WITH STUDENT DEMO ACCOUNT ===');
  
  const email = 'student@chavee.in';
  const password = 'chavee123';

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('❌ Sign in failed:', error.message);
  } else {
    console.log('✅ Sign in succeeded! User ID:', data.user?.id);

    // Try to insert a gig
    const { data: gigData, error: gigError } = await supabase
      .from('gigs')
      .insert({
        title: 'Figma Landing Page Design',
        category: 'UI/UX, Figma',
        price: 4500,
        condition: '3 Days',
        description: 'Need a landing page designed in Figma for our college tech fest.',
        status: 'Live',
        verified: false,
        client_name: 'Tech Fest MEC',
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
