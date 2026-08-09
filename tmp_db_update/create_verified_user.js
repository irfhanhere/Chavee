import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  try {
    console.log('1. Fetching mail.tm domains...');
    const domainsRes = await fetch('https://api.mail.tm/domains');
    const domains = await domainsRes.json();
    const domain = domains['hydra:member'][0].domain;

    const email = `admin_chavee_${Date.now()}@${domain}`;
    const password = 'AdminPassword123!';
    console.log(`Email chosen: ${email}`);

    console.log('2. Creating mail.tm account...');
    const createAccountRes = await fetch('https://api.mail.tm/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: email, password })
    });
    if (!createAccountRes.ok) {
      throw new Error(`Failed to create mail.tm account: ${createAccountRes.statusText}`);
    }
    console.log('mail.tm account created successfully.');

    console.log('3. Getting mail.tm token...');
    const tokenRes = await fetch('https://api.mail.tm/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: email, password })
    });
    const tokenJson = await tokenRes.json();
    const mailToken = tokenJson.token;
    if (!mailToken) {
      throw new Error('Could not retrieve mail.tm token.');
    }
    console.log('Got mail.tm token.');

    console.log('4. Signing up to Supabase...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'Chavee Dynamic Admin',
          username: `admin_${Date.now()}`
        }
      }
    });

    if (signUpError) {
      throw new Error(`Supabase signup failed: ${signUpError.message}`);
    }
    console.log('Supabase signup request sent. User ID:', signUpData.user?.id);

    console.log('5. Polling mail.tm inbox for verification email...');
    let confirmationUrl = null;
    for (let attempt = 1; attempt <= 12; attempt++) {
      console.log(`Checking inbox (attempt ${attempt}/12)...`);
      const msgsRes = await fetch('https://api.mail.tm/messages', {
        headers: { 'Authorization': `Bearer ${mailToken}` }
      });
      const msgsJson = await msgsRes.json();
      const messages = msgsJson['hydra:member'] || [];

      if (messages.length > 0) {
        console.log(`Found ${messages.length} message(s). Fetching details...`);
        const msgId = messages[0].id;
        const msgDetailRes = await fetch(`https://api.mail.tm/messages/${msgId}`, {
          headers: { 'Authorization': `Bearer ${mailToken}` }
        });
        const msgDetail = await msgDetailRes.json();
        const htmlContent = msgDetail.html ? msgDetail.html[0] : '';
        const textContent = msgDetail.text || '';

        // Extract confirmation url
        const regex = /https?:\/\/[^\s"'<>]+/g;
        const urls = (htmlContent + ' ' + textContent).match(regex) || [];
        confirmationUrl = urls.find(u => u.includes('/auth/v1/verify') || u.includes('type=signup') || u.includes('token='));
        
        if (confirmationUrl) {
          console.log('Found verification URL:', confirmationUrl);
          break;
        }
      }
      await sleep(5000);
    }

    if (!confirmationUrl) {
      throw new Error('Verification email not received or link not found after 60 seconds.');
    }

    console.log('6. Confirming email by loading the verification link...');
    const cleanUrl = confirmationUrl.replace(/&amp;/g, '&');
    console.log(`Cleaned URL: ${cleanUrl}`);
    const verifyRes = await fetch(cleanUrl);
    console.log(`Verification request status: ${verifyRes.status}`);

    console.log('7. Testing sign-in token to confirm...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      throw new Error(`Sign in failed after verification: ${signInError.message}`);
    }

    console.log('🎉 SUCCESS! Admin account is fully verified!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`User ID: ${signInData.user?.id}`);

    // Check is_admin RPC
    const { data: isAdmin } = await supabase.rpc('is_admin');
    console.log('Database is_admin() check:', isAdmin);

    fs.writeFileSync('./verified_admin_creds.json', JSON.stringify({ email, password, userId: signInData.user?.id }, null, 2));
    console.log('Credentials saved to verified_admin_creds.json');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

run();
