async function run() {
  try {
    const res = await fetch('https://dtokistffdnycrzbmxcr.supabase.co/rest/v1/');
    console.log('Headers:');
    for (const [key, value] of res.headers.entries()) {
      console.log(` - ${key}: ${value}`);
    }
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

run();
