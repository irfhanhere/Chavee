import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function test(table, dummy) {
  const { data, error } = await supabase.from(table).insert(dummy).select('*');
  if (error) {
    console.log(`❌ Table ${table} insert failed:`, error.message);
  } else {
    console.log(`✅ Table ${table} insert worked!`, data);
    const { error: delErr } = await supabase.from(table).delete().eq('id', data[0].id);
    console.log(`Cleanup ${table}:`, delErr ? delErr.message : 'none');
  }
}

async function run() {
  const email = 'admin-1783971259005@chavee.com';
  const password = 'AdminPassword123!';
  
  console.log(`Signing in as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.log('❌ Auth signin failed:', authError.message);
    return;
  }
  
  console.log('✅ Auth signin successful! Testing inserts...');
  await test('events', { title: 'Test Event', host_name: 'Test Host', status: 'Coming Soon' });
  await test('jobs', { title: 'Test Job', company: 'Test Company', status: 'Closed' });
  await test('courses', { title: 'Test Course', type: 'Skill', level: 'Beginner', instructor_name: 'Test Instructor', status: 'Draft' });
  await test('scholarships', { name: 'Test Scholarship', description: 'Test Description' });
  await test('communities', { name: 'Test Community', category: 'General' });
}
run();
