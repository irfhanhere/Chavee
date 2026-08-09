import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function runQueries() {
  console.log('=== READ-ONLY DATABASE QUERIES ===');

  // 1. Communities
  const { data: comms, error: commErr } = await supabase
    .from('communities')
    .select('id, name, status, emoji')
    .limit(3);
  if (commErr) {
    console.log('❌ Error querying communities:', commErr.message);
  } else {
    console.log('\n--- Communities (Limit 3) ---');
    console.log(JSON.stringify(comms, null, 2));
  }

  // 2. Jobs
  const { data: jobs, error: jobErr } = await supabase
    .from('jobs')
    .select('id, title, company, location, compensation, duration, skills, logo, status')
    .limit(3);
  if (jobErr) {
    console.log('❌ Error querying jobs:', jobErr.message);
  } else {
    console.log('\n--- Jobs (Limit 3) ---');
    console.log(JSON.stringify(jobs, null, 2));
  }

  // 3. Gigs
  const { data: gigs, error: gigErr } = await supabase
    .from('gigs')
    .select('id, title, client_name, location, price, category, status, verified')
    .limit(3);
  if (gigErr) {
    console.log('❌ Error querying gigs:', gigErr.message);
  } else {
    console.log('\n--- Gigs (Limit 3) ---');
    console.log(JSON.stringify(gigs, null, 2));
  }
}

runQueries();
