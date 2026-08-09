import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== TESTING GIG INSERT WITH ANONYMOUS SIGN IN ===');

  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

  if (authError) {
    console.error('❌ Anonymous Sign in failed:', authError.message);
    return;
  }

  const userId = authData.user?.id;
  console.log('✅ Anonymous Sign in succeeded! User ID:', userId);

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
      posted_by: userId
    })
    .select('*');

  if (gigError) {
    console.error('❌ Gig insertion failed:', gigError.message);
  } else {
    console.log('✅ Gig insertion succeeded! Inserted Row:', gigData);
  }
}

run();
