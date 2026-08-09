import pg from 'pg';
import dns from 'dns';
const { Client } = pg;

// Fetch the pooler IP for ap-northeast-2
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

async function run() {
  try {
    const poolerHost = 'aws-0-ap-northeast-2.pooler.supabase.com';
    const poolerIp = await resolveIpHttp(poolerHost);
    if (!poolerIp) {
      console.error('Could not resolve pooler IP.');
      return;
    }
    console.log(`Resolved pooler IP: ${poolerIp}`);

    const client = new Client({
      host: 'db.dtokistffdnycrzbmxcr.supabase.co',
      port: 5432,
      user: 'postgres',
      password: 'Apirfhan12@',
      database: 'postgres',
      ssl: {
        rejectUnauthorized: false
      },
      // Override DNS lookup
      lookup: (hostname, options, callback) => {
        if (hostname === 'db.dtokistffdnycrzbmxcr.supabase.co') {
          console.log(`DNS lookup override: routing ${hostname} -> ${poolerIp}`);
          callback(null, poolerIp, 4);
        } else {
          dns.lookup(hostname, options, callback);
        }
      }
    });

    console.log('Connecting via custom DNS lookup...');
    await client.connect();
    console.log('✅ Connected via direct port 5432 successfully!');
    const res = await client.query('SELECT version();');
    console.log('Version:', res.rows[0].version);
    await client.end();
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

run();
