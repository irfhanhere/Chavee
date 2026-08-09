import pg from 'pg';
const { Client } = pg;

async function run() {
  try {
    const client = new Client({
      host: '15.164.120.176',
      port: 5432,
      user: 'postgres.dtokistffdnycrzbmxcr',
      password: 'Apirfhan12@',
      database: 'postgres',
      ssl: {
        rejectUnauthorized: false,
        servername: 'db.dtokistffdnycrzbmxcr.supabase.co'
      }
    });

    console.log('Connecting to Seoul pooler via hardcoded IP on port 5432...');
    await client.connect();
    console.log('Connected to PostgreSQL successfully!');

    // Confirm emails in auth.users
    const confirmRes = await client.query(`
      UPDATE auth.users 
      SET email_confirmed_at = NOW(), confirmed_at = NOW(), updated_at = NOW()
      WHERE email IN ('admin@chavee.in', 'admin-test-verify@chavee.com')
      RETURNING id, email, email_confirmed_at;
    `);
    console.log('Email Confirmation Results:', confirmRes.rows);

    // Insert into public.admins
    for (const row of confirmRes.rows) {
      console.log(`Ensuring ${row.email} is in the public.admins table...`);
      const adminRes = await client.query(`
        INSERT INTO public.admins (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
        RETURNING *;
      `, [row.id]);
      console.log(`Admins entry check for ${row.email}:`, adminRes.rows);
    }

    await client.end();
  } catch (err) {
    console.error('Error during database update:', err);
  }
}

run();
