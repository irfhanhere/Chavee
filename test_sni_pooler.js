import pg from 'pg';
const { Client } = pg;

async function resolveIpHttp(hostname) {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
    const json = await res.json();
    if (json.Answer && json.Answer.length > 0) {
      const aRecord = json.Answer.find(r => r.type === 1);
      if (aRecord) return aRecord.data;
    }
  } catch (e) {
    console.error('HTTP DNS resolve failed for', hostname, ':', e.message);
  }
  return null;
}

const REGIONS = [
  'ap-northeast-2', // Seoul
  'ap-south-1',     // Mumbai
  'ap-southeast-1', // Singapore
  'us-east-1'       // N. Virginia
];

async function run() {
  try {
    let poolerIp = null;
    let selectedRegion = null;
    
    for (const region of REGIONS) {
      const host = `aws-0-${region}.pooler.supabase.com`;
      console.log(`Resolving pooler IP for ${host} via Google HTTP DNS...`);
      const ip = await resolveIpHttp(host);
      if (ip) {
        console.log(`Resolved ${host} to IP: ${ip}`);
        poolerIp = ip;
        selectedRegion = region;
        break;
      }
    }
    
    if (!poolerIp) {
      console.error('Could not resolve pooler IP for any region.');
      return;
    }

    // Connect to port 6543
    const client = new Client({
      host: poolerIp,
      port: 6543,
      user: 'postgres.dtokistffdnycrzbmxcr',
      password: 'Apirfhan12@',
      database: 'postgres',
      ssl: {
        rejectUnauthorized: false,
        servername: 'db.dtokistffdnycrzbmxcr.supabase.co'
      }
    });

    console.log(`Connecting to ${poolerIp}:6543 in ${selectedRegion} with SNI db.dtokistffdnycrzbmxcr.supabase.co...`);
    await client.connect();
    console.log('Connected via SNI successfully on port 6543!');
    const res = await client.query('SELECT version();');
    console.log('Version:', res.rows[0].version);
    await client.end();
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

run();
