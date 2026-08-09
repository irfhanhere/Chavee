import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Apirfhan12%40@db.dtokistffdnycrzbmxcr.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log('=== AUTH USERS ===');
    const resUsers = await client.query('SELECT id, email, email_confirmed_at, encrypted_password FROM auth.users');
    console.log(resUsers.rows);

    console.log('\n=== ADMINS ===');
    const resAdmins = await client.query('SELECT * FROM public.admins');
    console.log(resAdmins.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}
run();
