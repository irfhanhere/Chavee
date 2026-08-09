import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Apirfhan12%40@db.dtokistffdnycrzbmxcr.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to PG!');
    
    // Get column names and types for the events table
    const res = await client.query(
      `SELECT column_name, data_type, column_default, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'events' AND table_schema = 'public'
       ORDER BY ordinal_position;`
    );
    
    console.log('Columns in events table:');
    res.rows.forEach(r => {
      console.log(` - ${r.column_name} (${r.data_type}) [Default: ${r.column_default}, Nullable: ${r.is_nullable}]`);
    });

    const dataRes = await client.query("SELECT * FROM public.events LIMIT 2;");
    console.log('\nSample Rows:');
    console.log(JSON.stringify(dataRes.rows, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
