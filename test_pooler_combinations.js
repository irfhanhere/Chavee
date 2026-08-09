import pg from 'pg';
const { Client } = pg;

const HOST = '15.165.245.138'; // aws-0-ap-northeast-2.pooler.supabase.com IP
const PASSWORD = 'Apirfhan12@';

const USERS = ['postgres', 'postgres.dtokistffdnycrzbmxcr'];
const DBNAMES = ['postgres', 'postgres.dtokistffdnycrzbmxcr'];
const PORTS = [5432, 6543];

async function tryConnect(user, database, port) {
  const client = new Client({
    host: HOST,
    port: port,
    user: user,
    password: PASSWORD,
    database: database,
    ssl: {
      rejectUnauthorized: false,
      servername: 'db.dtokistffdnycrzbmxcr.supabase.co'
    },
    connectionTimeoutMillis: 2000
  });

  try {
    await client.connect();
    console.log(`✅ SUCCESS! user=${user}, db=${database}, port=${port}`);
    const res = await client.query('SELECT version();');
    console.log('Version:', res.rows[0].version);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ Failed: user=${user}, db=${database}, port=${port} -> ${err.message.split('\n')[0]}`);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  console.log('Testing pooler combinations on host', HOST);
  for (const user of USERS) {
    for (const db of DBNAMES) {
      for (const port of PORTS) {
        const ok = await tryConnect(user, db, port);
        if (ok) return;
      }
    }
  }
}

run();
