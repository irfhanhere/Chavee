import pg from 'pg';
import net from 'net';
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
      stream: (options) => {
        console.log(`Custom stream: connecting to ${poolerIp}:${options.port}`);
        return net.connect({
          port: options.port,
          host: poolerIp
        });
      },
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('Connecting via custom stream...');
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
