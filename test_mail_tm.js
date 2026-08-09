async function run() {
  try {
    // 1. Get domains
    const domainsRes = await fetch('https://api.mail.tm/domains');
    const domains = await domainsRes.json();
    console.log('Available domains:', domains['hydra:member'].map(d => d.domain));
    const domain = domains['hydra:member'][0].domain;
    
    // 2. Generate random email and password
    const email = `qa_test_${Date.now()}@${domain}`;
    const password = 'TestPass123!';
    console.log('Using email:', email);
    
    // 3. Create account
    const createRes = await fetch('https://api.mail.tm/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: email, password })
    });
    console.log('Create account status:', createRes.status);
    
    // 4. Get token
    const tokenRes = await fetch('https://api.mail.tm/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: email, password })
    });
    console.log('Get token status:', tokenRes.status);
    const tokenJson = await tokenRes.json();
    console.log('Token:', tokenJson.token ? 'Success' : 'Failed');
  } catch (err) {
    console.error('Failed:', err);
  }
}

run();
