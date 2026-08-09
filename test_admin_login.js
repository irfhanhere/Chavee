import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function run() {
  console.log('=== TESTING DEMO USERS LOGIN ===');
  const credentials = [
    { email: 'aarav@gmail.com', passwords: ['chavee123', 'Password123', 'aarav123'] },
    { email: 'priya@gmail.com', passwords: ['chavee123', 'Password123', 'priya123'] }
  ];

  for (const cred of credentials) {
    for (const password of cred.passwords) {
      console.log(`Trying ${cred.email} with password: ${password}...`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cred.email,
        password
      });

      if (error) {
        console.error(`❌ Failed: ${error.message}`);
      } else {
        console.log(`✅ Success! User ID: ${data.user?.id}`);
        
        // Try insert a gig
        const { data: gigData, error: gigError } = await supabase
          .from('gigs')
          .insert({
            title: 'Figma Landing Page Design',
            category: 'UI/UX, Figma',
            price: 4500,
            condition: '3 Days',
            description: 'Need a landing page designed in Figma for our college tech fest.',
            status: 'Live',
            verified: false,
            client_name: 'Tech Fest MEC',
            location: 'Remote',
            posted_by: data.user.id
          })
          .select('*');

        if (gigError) {
          console.error('❌ Gig insert failed:', gigError.message);
        } else {
          console.log('✅ Gig insert succeeded! Row:', gigData);
        }
        return;
      }
    }
  }
}
run();
