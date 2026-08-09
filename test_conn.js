import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Apirfhan12%40@db.dtokistffdnycrzbmxcr.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to PG!');
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
    console.log('Tables:');
    res.rows.forEach(r => console.log(' - ' + r.table_name));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
