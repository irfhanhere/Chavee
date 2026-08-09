import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envPath = new URL('../.env', import.meta.url);
const envStr = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(envStr.split(/\r?\n/).filter(Boolean).map(line => line.split('=')).map(([k, ...v]) => [k.trim(), v.join('=').trim()]));
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { console.error('Missing .env values'); process.exit(1); }

function client() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}

async function signUpAndSignIn(email, password) {
  const c = client();
  console.log('Signing up', email);
  const { data: signUpData, error: signUpErr } = await c.auth.signUp({ email, password });
  if (signUpErr && !/already exists/i.test(signUpErr.message || '')) {
    throw signUpErr;
  }
  // sign in
  const { data: signInData, error: signInErr } = await c.auth.signInWithPassword({ email, password });
  if (signInErr) throw signInErr;
  const user = signInData.user;
  if (!user) throw new Error('No user after signIn');
  console.log('Signed in', user.id);
  return { client: c, user };
}

(async () => {
  try {
    // 1. Create owner
    const ownerEmail = `owner_test_${Date.now()}@example.com`;
    const ownerPass = 'Testpass123!';
    const { client: ownerClient, user: owner } = await signUpAndSignIn(ownerEmail, ownerPass);

    // 2. Owner inserts a gig (verified + active)
    console.log('Owner creating gig...');
    const gigPayload = {
      title: 'Automated Test Gig ' + Date.now(),
      description: 'Test gig description',
      price: 1234,
      category: 'Test',
      posted_by: owner.id,
      verified: true,
      status: 'active'
    };
    const { data: gigData, error: gigErr } = await ownerClient.from('gigs').insert(gigPayload).select('*').single();
    if (gigErr) throw gigErr;
    console.log('Created gig:', gigData.id);

    // 3. Create applicant
    const appEmail = `applicant_test_${Date.now()}@example.com`;
    const appPass = 'Testpass123!';
    const { client: appClient, user: applicant } = await signUpAndSignIn(appEmail, appPass);

    // 4. Applicant fetch gigs
    console.log('Applicant fetching gigs...');
    const { data: gigsList } = await appClient.from('gigs').select('*').order('created_at', { ascending: false }).limit(20);
    console.log('Applicant sees gigs count:', (gigsList || []).length);
    const found = (gigsList || []).find(g => g.id === gigData.id);
    console.log('Gig present for applicant?', Boolean(found));

    // 5. Applicant applies
    console.log('Applicant applying to gig...');
    const { data: appInsert, error: appInsertErr } = await appClient.from('gig_applications').insert({ gig_id: gigData.id, applicant_id: applicant.id, pitch: 'Hello from automated test' }).select('*').single();
    if (appInsertErr) {
      console.error('Application error:', appInsertErr);
    } else {
      console.log('Application inserted id:', appInsert.id);
    }

    // 6. Check gig_applications as owner
    const { data: ownerApps } = await ownerClient.from('gig_applications').select('*').eq('gig_id', gigData.id);
    console.log('Owner sees applications count:', (ownerApps || []).length);

    // 7. Owner marks gig filled
    console.log('Owner marking gig as filled...');
    const { error: markErr } = await ownerClient.from('gigs').update({ status: 'filled' }).eq('id', gigData.id);
    if (markErr) {
      console.error('Mark filled error:', markErr);
    } else {
      console.log('Gig marked filled');
    }

    // 8. Create third account and confirm gig hidden
    const thirdEmail = `third_test_${Date.now()}@example.com`;
    const thirdPass = 'Testpass123!';
    const { client: thirdClient, user: third } = await signUpAndSignIn(thirdEmail, thirdPass);
    const { data: gigsAfter } = await thirdClient.from('gigs').select('*').eq('id', gigData.id);
    console.log('Third account sees gig by id query length:', (gigsAfter || []).length);

    // 9. Third tries to apply
    const { data: thirdApply, error: thirdApplyErr } = await thirdClient.from('gig_applications').insert({ gig_id: gigData.id, applicant_id: third.id, pitch: 'Third apply' }).select('*');
    if (thirdApplyErr) {
      console.log('Third apply error (expected):', thirdApplyErr.message || thirdApplyErr);
    } else {
      console.log('Third apply inserted unexpectedly:', thirdApply);
    }

    // 10. Applicant completes application (if we have appInsert id)
    if (appInsert && appInsert.id) {
      console.log('Applicant calling complete_gig_application RPC...');
      const { data: rpcData, error: rpcErr } = await appClient.rpc('complete_gig_application', { p_application_id: appInsert.id });
      if (rpcErr) {
        console.error('RPC error:', rpcErr);
      } else {
        console.log('RPC success:', rpcData);
      }
    }

    console.log('Test flow complete.');

  } catch (err) {
    console.error('Test flow failed:', err);
  }
})();
