import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== SIGNING UP TEMP USER TO TEST GIG INSERT ===');

  const email = `test_student_${Date.now()}@chavee.com`;
  const password = 'TemporaryPassword123!';

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });

  if (signUpError) {
    console.error('❌ Sign up failed:', signUpError.message);
    return;
  }

  console.log('✅ Sign up succeeded! User ID:', signUpData.user?.id);

  // Perform insert
  const { data: gigData, error: gigError } = await supabase
    .from('gigs')
    .insert({
      title: 'Setup Social Media Ads for Boutique',
      category: 'Meta Ads, Instagram',
      price: 5000,
      condition: '14 Days',
      description: 'Client: ZARA Boutique. Setup targeted Instagram and Facebook campaigns to boost sales for our festive apparel collection. Creative assets provided.',
      status: 'Live',
      verified: false, // starts unverified
      client_name: 'ZARA Boutique',
      location: 'Remote'
    })
    .select('*');

  if (gigError) {
    console.error('❌ Gig insertion failed:', gigError.message);
  } else {
    console.log('✅ Gig insertion succeeded! Inserted Row:', gigData);
  }

  // Clean up user? We don't have admin credentials to delete users, but we can leave it.
}

run();
