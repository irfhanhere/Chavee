async function run() {
  try {
    const res = await fetch('https://www.1secmail.com/api/v1/?action=getDomainList');
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text.substring(0, 500));
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

run();
