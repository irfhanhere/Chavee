// No import needed for native fetch

async function run() {
    const res = await fetch('https://dtokistffdnycrzbmxcr.supabase.co/rest/v1/?apikey=sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge');
    const json = await res.json();
    console.log('JSON:', json);
}

run();
