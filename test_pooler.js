import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'aws-0-ap-south-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.dtokistffdnycrzbmxcr',
  password: 'Apirfhan12@',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Pooler successfully!');
    const res = await client.query('SELECT version();');
    console.log('Version:', res.rows[0].version);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await client.end();
  }
}

run();
