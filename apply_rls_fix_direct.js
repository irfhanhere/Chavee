import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

async function run() {
  const client = new Client({
    host: '2406:da12:1f1:f802:426b:12e4:76ee:5739',
    port: 5432,
    user: 'postgres',
    password: 'Apirfhan12@',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('Connecting directly to IPv6 on port 5432...');
    await client.connect();
    console.log('Connected directly successfully!');
    
    const sqlPath = './fix_rls_policies.sql';
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Executing RLS hotfix SQL...');
    await client.query(sql);
    console.log('✅ RLS hotfix SQL executed successfully!');
    
    await client.end();
  } catch (err) {
    console.error('Direct connection failed:', err);
  }
}

run();
