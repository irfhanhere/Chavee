import pg from 'pg';
const { Client } = pg;

// Password comes from the environment, never hardcoded. Set it in your own
// shell before running this script, e.g.:
//   SUPABASE_DB_PASSWORD='...' node print_schema.js
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
    console.log('Connected to PostgreSQL database.');

    const tables = [
      'profiles',
      'admins',
      'user_gamification',
      'communities',
      'community_members',
      'posts',
      'post_likes',
      'post_comments',
      'job_applications',
      'gigs',
      'gig_applications',
      'conversations',
      'conversation_participants',
      'messages',
      'notifications'
    ];

    for (const table of tables) {
      console.log(`\n================ SCHEMA FOR TABLE: ${table} ================`);
      const res = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);

      if (res.rows.length === 0) {
        console.log(`❌ Table '${table}' not found in public schema.`);
      } else {
        res.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (Nullable: ${col.is_nullable}, Default: ${col.column_default || 'none'})`);
        });
      }
    }
  } catch (err) {
    console.error('Error querying schema:', err);
  } finally {
    await client.end();
  }
}

run();
