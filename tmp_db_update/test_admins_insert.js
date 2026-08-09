import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  const email = 'admin_chavee_1785433605299@web-library.net';
  const password = 'AdminPassword123!';
  const userId = '8299d9fc-a482-433a-84e7-736b6d5849a3';

  console.log(`Logging in as: ${email}...`);
  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (loginError) {
    console.error('❌ Login failed:', loginError.message);
    return;
  }

  console.log('✅ Logged in successfully. Try inserting own ID into admins table...');
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .insert({ user_id: userId })
    .select('*');

  if (adminError) {
    console.error('❌ Insertion into admins failed:', adminError.message);
  } else {
    console.log('🎉 SUCCESS! Dynamic admin row created:', adminData);
  }
}

run();
