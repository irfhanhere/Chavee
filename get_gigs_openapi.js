import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('Fetching OpenAPI schema details...');
  const res = await fetch('https://dtokistffdnycrzbmxcr.supabase.co/rest/v1/', {
    headers: {
      apikey: 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
    }
  });
  const schema = await res.json();
  console.log('Returned schema error:', schema);
}

run();
