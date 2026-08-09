async function run() {
  try {
    const res = await fetch('https://dns.google/resolve?name=dtokistffdnycrzbmxcr.supabase.co&type=A');
    const json = await res.json();
    console.log('API A records:', JSON.stringify(json, null, 2));
    
    const resDb = await fetch('https://dns.google/resolve?name=db.dtokistffdnycrzbmxcr.supabase.co&type=AAAA');
    const jsonDb = await resDb.json();
    console.log('DB AAAA records:', JSON.stringify(jsonDb, null, 2));
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

run();
