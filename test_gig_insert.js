import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== INSERTING TEST GIG IN SUPABASE ===');

  const { data, error } = await supabase
    .from('gigs')
    .insert({
      title: 'Build Shopify Website for Local Bakery',
      category: 'Shopify, Web Dev',
      price: 8000,
      condition: '10 Days',
      description: "Client: Baker's Delight. Need a student to setup a clean Shopify store for our bakery. Includes product listings, payments integration, and basic SEO.",
      status: 'Live',
      verified: true,
      client_name: "Baker's Delight",
      location: 'Remote'
    })
    .select('*');

  if (error) {
    console.error('❌ Insert failed:', error.message);
  } else {
    console.log('✅ Insert succeeded! Data returned:', data);
  }
}

run();
