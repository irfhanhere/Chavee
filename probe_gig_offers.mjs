// Probe gig_offers schema via Supabase REST API
const url = 'https://dtokistffdnycrzbmxcr.supabase.co/rest/v1/gig_offers?limit=1&select=*';
const res = await fetch(url, {
  headers: {
    'apikey': 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge',
    'Authorization': 'Bearer sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
  }
});
const text = await res.text();
console.log('Status:', res.status);
console.log('Body:', text);

// Also check the OpenAPI spec for column details
const specRes = await fetch('https://dtokistffdnycrzbmxcr.supabase.co/rest/v1/?select=gig_offers', {
  headers: {
    'apikey': 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge',
    'Authorization': 'Bearer sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
  }
});
const specText = await specRes.text();
// Parse and extract gig_offers definition
try {
  const spec = JSON.parse(specText);
  const gigOffersSchema = spec?.definitions?.gig_offers;
  if (gigOffersSchema) {
    console.log('\ngig_offers schema:', JSON.stringify(gigOffersSchema, null, 2));
  } else {
    console.log('\nFull spec keys:', Object.keys(spec));
    if (spec.definitions) {
      console.log('Available definitions:', Object.keys(spec.definitions).filter(k => k.toLowerCase().includes('gig')));
    }
  }
} catch(e) {
  console.log('Spec parse error:', e.message, specText.slice(0, 500));
}
