import pg from 'pg';
const { Client } = pg;

// Connect directly to the IPv6 address of the database
const client = new Client({
  host: '2406:da12:1f1:f802:426b:12e4:76ee:5739',
  port: 5432,
  user: 'postgres',
  password: 'Apirfhan12@',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected directly to DB IPv6 successfully!');
    const res = await client.query('SELECT version();');
    console.log('Version:', res.rows[0].version);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await client.end();
  }
}

run();
