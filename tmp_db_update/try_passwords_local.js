import pg from 'pg';
import dns from 'dns';
const { Client } = pg;

function resolveIpNative(hostname) {
  return new Promise((resolve) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err) {
        console.error('Native DNS lookup failed:', err.message);
        resolve(null);
      } else {
        resolve(address);
      }
    });
  });
}

const PASSWORDS = [
  'Apirfhan12@',
  'Apirfhan12',
  'Apirfhan123',
  'Apirfhan123@',
  'Apirfhan12!',
  'Apirfhan123!',
  'apirfhan12@',
  'Apirfhan@12',
  'Password123',
  'Password123!',
  'chavee123',
  'chavee123!',
  'admin123',
  'postgres'
];

async function tryPassword(ip, pass) {
  const client = new Client({
    host: ip,
    port: 5432,
    user: 'postgres',
    password: pass,
    database: 'postgres',
    ssl: { 
      rejectUnauthorized: false,
      servername: 'db.dtokistffdnycrzbmxcr.supabase.co'
    }
  });
  
  try {
    await client.connect();
    console.log(`🎉 SUCCESS WITH PASSWORD: "${pass}"`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ Failed with password "${pass}": ${err.message}`);
    return false;
  }
}

async function run() {
  const host = 'db.dtokistffdnycrzbmxcr.supabase.co';
  console.log(`Resolving IPv4 natively for ${host}...`);
  const ip = await resolveIpNative(host);
  if (!ip) {
    console.error('Could not resolve host natively');
    return;
  }
  console.log(`Resolved natively to ${ip}. Trying passwords...`);
  
  for (const pass of PASSWORDS) {
    const ok = await tryPassword(ip, pass);
    if (ok) return;
  }
  console.log('All passwords failed.');
}

run();
