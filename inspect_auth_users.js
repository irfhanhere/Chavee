import pg from 'pg';
const { Client } = pg;

// Password comes from the environment, never hardcoded. Set it in your own
// shell before running this script, e.g.:
//   SUPABASE_DB_PASSWORD='...' node inspect_auth_users.js
if (!process.env.SUPABASE_DB_PASSWORD) {
  console.error('Missing SUPABASE_DB_PASSWORD env var. Set it in your shell before running this script (do not hardcode it here).');
  process.exit(1);
}
const client = new Client({
  connectionString: `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.dtokistffdnycrzbmxcr.supabase.co:5432/postgres`
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
