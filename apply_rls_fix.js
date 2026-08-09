import pg from 'pg';
import fs from 'fs';
import path from 'path';
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

    // Read fix_rls_policies.sql
    const sqlPath = './fix_rls_policies.sql';
    console.log(`Reading SQL script from ${sqlPath}...`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing RLS hotfix SQL...');
    await client.query(sql);
    console.log('✅ RLS hotfix SQL executed successfully!');

    // Query auth.users to see who is registered
    console.log('\n--- Fetching auth.users ---');
    const usersRes = await client.query('SELECT id, email, raw_user_meta_data->>\'full_name\' as name, created_at FROM auth.users ORDER BY created_at DESC LIMIT 15;');
    console.log(JSON.stringify(usersRes.rows, null, 2));

    // Also let's double check active policies on conversation_participants
    console.log('\n--- Auditing Active Policies on conversation_participants ---');
    const policiesRes = await client.query(`
      SELECT policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'conversation_participants';
    `);
    console.log(JSON.stringify(policiesRes.rows, null, 2));

    await client.end();
  } catch (err) {
    console.error('Execution failed:', err);
  }
}

run();
