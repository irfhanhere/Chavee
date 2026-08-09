import { promises as dns } from 'dns';

async function run() {
  try {
    const addresses = await dns.resolve4('dtokistffdnycrzbmxcr.supabase.co');
    console.log('IP addresses:', addresses);
  } catch (err) {
    console.error('Resolution failed:', err);
  }
}

run();
