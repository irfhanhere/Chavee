import pg from 'pg';
import dns from 'dns';
const { Client } = pg;

const REGIONS = [
  'ap-south-1',     // Mumbai
  'ap-northeast-2', // Seoul
  'ap-southeast-1', // Singapore
  'ap-southeast-2', // Sydney
  'ap-northeast-1', // Tokyo
  'us-east-1',       // N. Virginia
  'us-east-2',       // Ohio
  'us-west-1',       // N. California
  'us-west-2',       // Oregon
  'eu-west-1',       // Ireland
  'eu-west-2',       // London
  'eu-west-3',       // Paris
  'eu-central-1',    // Frankfurt
  'sa-east-1'        // Sao Paulo
];

function resolveIpNative(hostname) {
  return new Promise((resolve) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err) {
        resolve(null);
      } else {
        resolve(address);
      }
    });
  });
}

async function tryRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const ip = await resolveIpNative(host);
  if (!ip) {
    console.log(`⚠️  Could not resolve IPv4 for ${region}`);
    return false;
  }
  
  console.log(`Trying region ${region} (${host} -> ${ip})...`);
  const client = new Client({
    host: ip,
    port: 6543,
    user: 'postgres.dtokistffdnycrzbmxcr',
    password: 'Apirfhan12@',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false,
      servername: 'db.dtokistffdnycrzbmxcr.supabase.co'
    },
    connectionTimeoutMillis: 3000
  });

  try {
    await client.connect();
    console.log(`\n🎉 SUCCESS! Database connected in region: ${region}`);
    const res = await client.query('SELECT version();');
    console.log('Version:', res.rows[0].version);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ Failed in ${region}: ${err.message.split('\n')[0]}`);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  for (const region of REGIONS) {
    const success = await tryRegion(region);
    if (success) {
      console.log(`\n🎉 Found it! Correct region is ${region}`);
      return;
    }
  }
  console.log('\n❌ Could not connect to any pooler region.');
}

run();
