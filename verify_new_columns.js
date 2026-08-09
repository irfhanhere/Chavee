import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function verify() {
  console.log('=== VERIFYING NEW DATABASE COLUMNS ===');
  
  // 1. Scholarships
  const { data: scholData, error: scholErr } = await supabase
    .from('scholarships')
    .select('id, name, status, income_limit')
    .limit(1);
  if (scholErr) {
    console.log('❌ Scholarships Verification Failed:', scholErr.message);
  } else {
    console.log('✅ Scholarships Verification Succeeded! Data:', scholData);
  }

  // 2. Communities
  const { data: commData, error: commErr } = await supabase
    .from('communities')
    .select('id, name, status, emoji')
    .limit(1);
  if (commErr) {
    console.log('❌ Communities Verification Failed:', commErr.message);
  } else {
    console.log('✅ Communities Verification Succeeded! Data:', commData);
  }

  // 3. Jobs
  const { data: jobsData, error: jobsErr } = await supabase
    .from('jobs')
    .select('id, title, location, compensation, duration, skills, logo')
    .limit(1);
  if (jobsErr) {
    console.log('❌ Jobs Verification Failed:', jobsErr.message);
  } else {
    console.log('✅ Jobs Verification Succeeded! Data:', jobsData);
  }

  // 4. Gigs
  const { data: gigsData, error: gigsErr } = await supabase
    .from('gigs')
    .select('id, title, client_name, location')
    .limit(1);
  if (gigsErr) {
    console.log('❌ Gigs Verification Failed:', gigsErr.message);
  } else {
    console.log('✅ Gigs Verification Succeeded! Data:', gigsData);
  }
}

verify();
