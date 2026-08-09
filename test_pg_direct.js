import pg from 'pg';
const { Client } = pg;

async function resolveIpHttp(hostname) {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
    const json = await res.json();
    if (json.Answer && json.Answer.length > 0) {
      const aRecord = json.Answer.find(r => r.type === 1);
      if (aRecord) return aRecord.data;
    }
  } catch (e) {
    console.error('HTTP DNS resolve failed for', hostname, ':', e.message);
  }
  return null;
}

async function run() {
  try {
    const host = 'aws-0-ap-south-1.pooler.supabase.com';
    console.log(`Resolving pooler IP for ${host} via Google HTTP DNS...`);
    const ip = await resolveIpHttp(host);
    if (!ip) {
      console.error('Could not resolve IP for', host);
      return;
    }
    console.log(`Resolved ${host} to IP: ${ip}`);

    const client = new Client({
      host: ip,
      port: 6543,
      user: 'postgres.dtokistffdnycrzbmxcr',
      password: 'Apirfhan12@',
      database: 'postgres',
      ssl: {
        rejectUnauthorized: false,
        servername: 'db.dtokistffdnycrzbmxcr.supabase.co'
      }
    });

    console.log(`Connecting to ${ip}:6543 (ap-south-1)...`);
    await client.connect();
    console.log('Connected via Postgres client successfully!');

    // Let's query information about triggers on gig_applications
    console.log('\n--- Auditing Triggers on gig_applications ---');
    const trgRes = await client.query(`
      SELECT trigger_name, event_manipulation, action_statement, action_timing
      FROM information_schema.triggers
      WHERE event_object_table = 'gig_applications';
    `);
    console.log(JSON.stringify(trgRes.rows, null, 2));

    // Let's query the source code of handle_new_gig_application trigger function
    console.log('\n--- Auditing trigger function source ---');
    const funcRes = await client.query(`
      SELECT proname, prosrc
      FROM pg_proc
      WHERE proname IN ('handle_gig_proposal', 'handle_new_gig_application', 'handle_gig_application_completed');
    `);
    funcRes.rows.forEach(r => {
      console.log(`\nFunction Name: ${r.proname}`);
      console.log(`Source Code:\n${r.prosrc}`);
    });

    await client.end();
  } catch (err) {
    console.error('Connection/Query failed:', err);
  }
}

run();
