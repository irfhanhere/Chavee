import pg from 'pg';
const { Client } = pg;

const PASSWORDS = [
  'Apirfhan12@',
  'Apirfhan12',
  'Apirfhan123',
  'Apirfhan123@',
  'Apirfhan12!',
  'Apirfhan123!',
  'apirfhan12@',
  'Apirfhan@12',
  'Password123',
  'Password123!',
  'chavee123',
  'chavee123!',
  'admin123',
  'postgres'
];

async function tryPassword(pass) {
  const client = new Client({
    host: '2406:da12:1f1:f802:426b:12e4:76ee:5739',
    port: 5432,
    user: 'postgres',
    password: pass,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log(`🎉 SUCCESS WITH PASSWORD: "${pass}"`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ Failed with password "${pass}": ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('Trying passwords...');
  for (const pass of PASSWORDS) {
    const ok = await tryPassword(pass);
    if (ok) return;
  }
  console.log('All passwords failed.');
}

run();
