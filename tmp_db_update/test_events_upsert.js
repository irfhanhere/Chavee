import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  const email = 'admin_chavee_1785433605299@web-library.net';
  const password = 'AdminPassword123!';

  console.log(`Logging in as: ${email}...`);
  const { data, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (loginError) {
    console.error('❌ Login failed:', loginError.message);
    return;
  }

  console.log('✅ Logged in successfully. Try inserting/upserting an event...');
  const testEvent = {
    title: 'Developer Workation Goa',
    description: 'A 3-day workation for devs in Goa beach house.',
    host_name: 'Chavee Tech',
    location: 'Goa, India',
    event_date: '2026-08-15',
    price: 4999,
    seats_total: 50,
    seats_filled: 12,
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    status: 'live',
    featured_on_landing: true
  };

  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .insert([testEvent])
    .select('*');

  if (eventError) {
    console.error('❌ Event insert failed:', eventError.message);
  } else {
    console.log('✅ Event insert succeeded! Row:', eventData);
  }
}

run();
