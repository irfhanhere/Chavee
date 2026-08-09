import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env
const envPath = './\.env';
const envStr = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envStr.split(/\r?\n/).filter(Boolean).map(line => line.split('=')).map(([k, ...v]) => [k.trim(), v.join('=').trim()])
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing .env values');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

async function testPostCreation() {
  try {
    console.log('=== Testing Post Creation ===\n');

    // Use a dummy UUID for testing - Supabase allows inserts with non-existent user_ids
    const dummyUserId = '12345678-1234-1234-1234-123456789abc';
    console.log(`Using test user ID: ${dummyUserId}\n`);

    // Test 1: Insert without community_id (current code)
    console.log('1. Test 1: Creating post WITHOUT community_id (current code)...');
    const { data: post1, error: err1 } = await supabase
      .from('posts')
      .insert({
        content: 'Test post without community_id',
        user_id: dummyUserId,
        image_url: null,
        feeling: 'excited'
      })
      .select('*')
      .single();

    if (err1) {
      console.log('   ❌ ERROR:', err1.message);
      console.log('   CODE:', err1.code);
      console.log('   DETAILS:', err1.details || 'N/A');
      console.log('\n   Root cause analysis:');
      if (/community_id/i.test(err1.message)) {
        console.log('   → community_id is a REQUIRED field or has a constraint');
      }
      if (/row-level security/i.test(err1.message) || /policy/i.test(err1.message)) {
        console.log('   → RLS policy is blocking the insert');
      }
    } else {
      console.log('   ✅ SUCCESS! Post created:', post1.id);
    }

    // Test 2: Try with community_id = null explicitly
    console.log('\n2. Test 2: Creating post WITH community_id = null...');
    const { data: post2, error: err2 } = await supabase
      .from('posts')
      .insert({
        content: 'Test post with explicit null community_id',
        user_id: dummyUserId,
        community_id: null,
        image_url: null,
        feeling: 'excited'
      })
      .select('*')
      .single();

    if (err2) {
      console.log('   ❌ ERROR:', err2.message);
    } else {
      console.log('   ✅ SUCCESS! Post created:', post2.id);
    }

    // Test 3: Fetch communities and try with a real one
    console.log('\n3. Test 3: Fetching available communities...');
    const { data: communities, error: commErr } = await supabase.from('communities').select('id, name').limit(1);
    
    if (commErr) {
      console.log('   ⚠️  Could not fetch communities:', commErr.message);
    } else if (!communities || communities.length === 0) {
      console.log('   ⚠️  No communities found in database');
    } else {
      const community = communities[0];
      console.log(`   Found community: ${community.name} (${community.id})`);
      
      console.log('\n4. Test 4: Creating post WITH valid community_id...');
      const { data: post3, error: err3 } = await supabase
        .from('posts')
        .insert({
          content: 'Test post with valid community_id',
          user_id: dummyUserId,
          community_id: community.id,
          image_url: null,
          feeling: 'excited'
        })
        .select('*')
        .single();

      if (err3) {
        console.log('   ❌ ERROR:', err3.message);
      } else {
        console.log('   ✅ SUCCESS! Post created:', post3.id);
      }
    }

  } catch (err) {
    console.error('❌ Test failed with exception:', err);
  }
}

testPostCreation();
