async function run() {
  try {
    const res = await fetch('https://dtokistffdnycrzbmxcr.supabase.co/rest/v1/gigs?limit=1', {
      headers: {
        'apikey': 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
      }
    });
    console.log('Fetch Status:', res.status);
    const text = await res.text();
    console.log('Response Body:', text);
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

run();
