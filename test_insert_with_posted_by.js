import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== TESTING GIG INSERT WITH posted_by COLUMN ===');

  const email = `test_student_posted_by_${Date.now()}@chavee.com`;
  const password = 'TemporaryPassword123!';

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });

  if (signUpError) {
    console.error('❌ Sign up failed:', signUpError.message);
    return;
  }

  const userId = signUpData.user?.id;
  console.log('✅ Sign up succeeded! User ID:', userId);

  // In Supabase, if a user signs up, a trigger usually inserts their profile.
  // Wait a small bit for profile creation triggers to run if any.
  await new Promise(r => setTimeout(r, 2000));

  // Perform insert with posted_by set
  const { data: gigData, error: gigError } = await supabase
    .from('gigs')
    .insert({
      title: 'Setup Social Media Ads for Boutique',
      category: 'Meta Ads, Instagram',
      price: 5000,
      condition: '14 Days',
      description: 'Client: ZARA Boutique. Setup targeted Instagram and Facebook campaigns to boost sales for our festive apparel collection. Creative assets provided.',
      status: 'Live',
      verified: false,
      client_name: 'ZARA Boutique',
      location: 'Remote',
      posted_by: userId // explicitly pass posted_by
    })
    .select('*');

  if (gigError) {
    console.error('❌ Gig insertion failed:', gigError.message);
  } else {
    console.log('✅ Gig insertion succeeded! Inserted Row:', gigData);
  }
}

run();
