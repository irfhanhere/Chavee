import pg from 'pg';
const { Client } = pg;

async function run() {
  try {
    const client = new Client({
      host: 'aws-0-ap-northeast-2.pooler.supabase.com',
      port: 5432,
      user: 'postgres.dtokistffdnycrzbmxcr',
      password: 'Apirfhan12@',
      database: 'postgres',
      ssl: {
        rejectUnauthorized: false,
        servername: 'db.dtokistffdnycrzbmxcr.supabase.co'
      }
    });

    console.log('Connecting to Seoul pooler 5432 with SNI...');
    await client.connect();
    console.log('✅ Connected successfully!');
    const res = await client.query('SELECT version();');
    console.log('Version:', res.rows[0].version);
    await client.end();
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

run();
