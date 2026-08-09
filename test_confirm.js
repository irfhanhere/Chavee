import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://dtokistffdnycrzbmxcr.supabase.co';
const SUPABASE_ANON = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const result = { success: false, log: [] };
  function log(msg) {
    console.log(msg);
    result.log.push(msg);
  }

  try {
    // 1. Get domains from mail.tm
    const domainsRes = await fetch('https://api.mail.tm/domains');
    const domains = await domainsRes.json();
    const domain = domains['hydra:member'][0].domain;
    
    // 2. Create account
    const email = `qa_confirm_${Date.now()}@${domain}`;
    const password = 'TestPass123!';
    log('Temporary Email: ' + email);
    
    const createRes = await fetch('https://api.mail.tm/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: email, password })
    });
    if (createRes.status !== 201) throw new Error('Failed to create mail.tm account');
    
    // 3. Get mail.tm token
    const tokenRes = await fetch('https://api.mail.tm/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: email, password })
    });
    const tokenJson = await tokenRes.json();
    const mailToken = tokenJson.token;
    
    // 4. Sign up in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
    log('Signing up in Supabase...');
    const { data: suData, error: suErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: 'QA Confirm User' } }
    });
    if (suErr) throw new Error('Supabase signup failed: ' + suErr.message);
    log('Signed up! User ID: ' + suData.user.id);
    
    // 5. Poll for confirmation email
    log('Waiting for confirmation email (polling mail.tm)...');
    let verifyUrl = null;
    for (let i = 0; i < 20; i++) {
      await sleep(5000);
      log(`Checking inbox... (attempt ${i+1})`);
      const msgRes = await fetch('https://api.mail.tm/messages', {
        headers: { 'Authorization': `Bearer ${mailToken}` }
      });
      const msgJson = await msgRes.json();
      const messages = msgJson['hydra:member'];
      
      if (messages && messages.length > 0) {
        log(`Found ${messages.length} email(s). Fetching body...`);
        const detailRes = await fetch(`https://api.mail.tm/messages/${messages[0].id}`, {
          headers: { 'Authorization': `Bearer ${mailToken}` }
        });
        const detailJson = await detailRes.json();
        
        const textContent = String(detailJson.text || '');
        const htmlContent = Array.isArray(detailJson.html) ? detailJson.html.join(' ') : String(detailJson.html || '');
        const fullBody = textContent + ' ' + htmlContent;
        
        // Exclude trailing ] and )
        const match = fullBody.match(/https:\/\/dtokistffdnycrzbmxcr\.supabase\.co\/auth\/v1\/verify\?[^"'\s<>\]\)]+/);
        if (match) {
          verifyUrl = match[0];
          verifyUrl = verifyUrl.replace(/&amp;/g, '&');
          log('Verification URL found: ' + verifyUrl);
          break;
        } else {
          log('Match failed on body content.');
        }
      }
    }
    
    if (!verifyUrl) throw new Error('Verification email not received or link not found.');
    
    // 6. Confirm the email using redirect: manual to prevent Node fetch from trying to follow the redirect
    log('Triggering verification URL...');
    const confirmRes = await fetch(verifyUrl, { redirect: 'manual' });
    log('Verification status: ' + confirmRes.status);
    
    // 7. Try signing in
    log('Attempting sign in to verify confirmation...');
    const { data: siData, error: siErr } = await supabase.auth.signInWithPassword({ email, password });
    if (siErr) {
      log('❌ Sign in failed: ' + siErr.message);
    } else {
      log('✅ Sign in SUCCESS! Authenticated user ID: ' + siData.user.id);
      result.success = true;
    }
  } catch (err) {
    log('Test failed: ' + err.message);
  }

  fs.writeFileSync('test_confirm_results.json', JSON.stringify(result, null, 2));
}

run();
