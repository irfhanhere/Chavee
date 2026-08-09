import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

async function runWithConnectionString(connStr, name) {
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log(`Connecting via ${name}...`);
    await client.connect();
    console.log(`✅ Connected successfully via ${name}!`);
    
    const sqlPath = './final_rls_fix.sql';
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Executing final RLS hotfix SQL...');
    await client.query(sql);
    console.log('🎉 RLS hotfix SQL executed successfully!');
    
    await client.end();
    return true;
  } catch (err) {
    console.error(`❌ Failed via ${name}:`, err.message);
    try { await client.end(); } catch (e) {}
    return false;
  }
}

async function run() {
  const password = 'Apirfhan12%40'; // URL-encoded @
  const tenant = 'dtokistffdnycrzbmxcr';
  
  // Try ap-northeast-2 (Seoul) poolers
  const seoul5432 = `postgresql://postgres.${tenant}:${password}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`;
  const seoul6543 = `postgresql://postgres.${tenant}:${password}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;
  
  // Try ap-south-1 (Mumbai) poolers
  const mumbai5432 = `postgresql://postgres.${tenant}:${password}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`;
  const mumbai6543 = `postgresql://postgres.${tenant}:${password}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;

  console.log('Starting pooler connection tests...');
  
  if (await runWithConnectionString(seoul5432, 'Seoul Port 5432 (Transaction Mode)')) return;
  if (await runWithConnectionString(seoul6543, 'Seoul Port 6543 (Session Mode)')) return;
  if (await runWithConnectionString(mumbai5432, 'Mumbai Port 5432 (Transaction Mode)')) return;
  if (await runWithConnectionString(mumbai6543, 'Mumbai Port 6543 (Session Mode)')) return;
  
  console.log('All connection strings failed.');
}

run();
