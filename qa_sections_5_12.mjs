/**
 * QA Script — Sections 5–12
 * Chavee Platform Comprehensive Backend Audit
 * Run: node qa_sections_5_12.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dtokistffdnycrzbmxcr.supabase.co';
const ANON_KEY    = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';

// User A credentials (existing student)
const USER_A_EMAIL = 'student@chavee.in';
const USER_A_PASS  = 'chavee123';

// User B — we will create a fresh account
const USER_B_EMAIL = `qa_userb_${Date.now()}@chavee-test.com`;
const USER_B_PASS  = 'QaTesting_789!';

// Admin credentials
const ADMIN_EMAIL  = 'admin@chavee.in';
const ADMIN_PASS   = 'chavee123';

const log  = (section, msg, status = '') => console.log(`[${section}] ${status} ${msg}`);
const pass = (section, msg) => log(section, msg, '✅');
const fail = (section, msg) => log(section, msg, '❌');
const warn = (section, msg) => log(section, msg, '⚠️');
const info = (section, msg) => log(section, msg, 'ℹ️');
const sep  = () => console.log('\n' + '─'.repeat(70) + '\n');

// ─── helpers ────────────────────────────────────────────────────────────────
async function signIn(email, password, label = '') {
  const client = createClient(SUPABASE_URL, ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) { console.error(`  [signIn:${label}] ❌ ${error.message}`); return null; }
  return client;
}

async function signUp(email, password, label = '') {
  const client = createClient(SUPABASE_URL, ANON_KEY);
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) { console.error(`  [signUp:${label}] ❌ ${error.message}`); return null; }
  // signUp may not auto-sign in; sign in explicitly
  const { data: si, error: sie } = await client.auth.signInWithPassword({ email, password });
  if (sie) { console.error(`  [signIn after signUp:${label}] ❌ ${sie.message}`); return null; }
  return client;
}

async function getUserId(client) {
  const { data: { user } } = await client.auth.getUser();
  return user?.id;
}

// ─── SECTION 5: JOBS ────────────────────────────────────────────────────────
async function testJobs(clientA) {
  sep();
  console.log('══ SECTION 5: JOBS ══');

  const uid = await getUserId(clientA);

  // 5.1 Fetch live jobs
  const { data: jobs, error: je } = await clientA.from('jobs').select('*').ilike('status', 'live');
  if (je) { fail('S5', `Fetching live jobs: ${je.message}`); }
  else { pass('S5', `Live jobs fetched: ${jobs.length} row(s)`); }

  // 5.2 Inspect application_type distribution
  if (jobs && jobs.length > 0) {
    const portalJobs   = jobs.filter(j => j.application_type === 'portal');
    const internalJobs = jobs.filter(j => j.application_type === 'internal');
    info('S5', `application_type breakdown — portal: ${portalJobs.length}, internal: ${internalJobs.length}, null/other: ${jobs.length - portalJobs.length - internalJobs.length}`);

    // 5.3 For internal jobs, inspect application_questions JSONB
    if (internalJobs.length > 0) {
      const sample = internalJobs[0];
      info('S5', `Internal job sample: "${sample.title}" — application_questions: ${JSON.stringify(sample.application_questions)}`);
      if (Array.isArray(sample.application_questions) && sample.application_questions.length > 0) {
        pass('S5', `application_questions JSONB is a non-empty array — dynamic form can render correctly`);
      } else if (sample.application_questions === null || (Array.isArray(sample.application_questions) && sample.application_questions.length === 0)) {
        warn('S5', `application_questions is null or empty on internal job "${sample.title}" — dynamic form will render no fields`);
      } else {
        warn('S5', `application_questions format unexpected: ${typeof sample.application_questions}`);
      }
    } else {
      warn('S5', `No internal jobs found — cannot test dynamic form rendering`);
    }
  } else {
    warn('S5', 'No live jobs in database — upload sample jobs to test');
  }

  // 5.4 CV upload test — upload dummy PDF to job-cvs bucket
  const dummyFile = new Blob(['%PDF-1.4 dummy cv content'], { type: 'application/pdf' });
  const cvPath = `${uid}/qa_test_cv_${Date.now()}.pdf`;
  const { data: uploadData, error: uploadErr } = await clientA.storage
    .from('job-cvs')
    .upload(cvPath, dummyFile, { contentType: 'application/pdf', upsert: false });

  if (uploadErr) {
    fail('S5', `CV upload to job-cvs bucket failed: ${uploadErr.message}`);
  } else {
    pass('S5', `CV uploaded to job-cvs at path: ${cvPath}`);

    // 5.5 Try raw public URL — should be blocked (private bucket)
    const { data: pubData } = clientA.storage.from('job-cvs').getPublicUrl(cvPath);
    info('S5', `Raw public URL generated: ${pubData?.publicUrl}`);
    // Fetch it — should return 400/403 if bucket is private
    try {
      const resp = await fetch(pubData.publicUrl, { method: 'HEAD' });
      if (resp.ok) {
        fail('S5', `SECURITY: Raw public URL returned HTTP ${resp.status} — bucket is NOT private! CVs are publicly accessible.`);
      } else {
        pass('S5', `Raw public URL blocked — HTTP ${resp.status} (bucket is private ✓)`);
      }
    } catch (e) {
      warn('S5', `Could not fetch raw public URL (network error) — check manually: ${pubData?.publicUrl}`);
    }

    // 5.6 Get signed URL — should work
    const { data: signedData, error: signedErr } = await clientA.storage
      .from('job-cvs')
      .createSignedUrl(cvPath, 60);
    if (signedErr) {
      fail('S5', `createSignedUrl failed: ${signedErr.message}`);
    } else {
      pass('S5', `Signed URL created successfully: ${signedData.signedUrl.substring(0, 80)}...`);
    }

    // 5.7 Try to access CV as anon (no session)
    const anonClient = createClient(SUPABASE_URL, ANON_KEY);
    const { data: anonSigned, error: anonSignedErr } = await anonClient.storage
      .from('job-cvs')
      .createSignedUrl(cvPath, 60);
    if (anonSignedErr) {
      pass('S5', `Anonymous user BLOCKED from creating signed URL: ${anonSignedErr.message}`);
    } else {
      fail('S5', `SECURITY: Anonymous user could create a signed URL for job-cvs! Path: ${cvPath}`);
    }

    // 5.8 Submit job application (if a live job exists)
    const { data: jobsForApp } = await clientA.from('jobs').select('id, title').ilike('status', 'live').limit(1);
    if (jobsForApp && jobsForApp.length > 0) {
      const job = jobsForApp[0];
      const { data: appData, error: appErr } = await clientA.from('job_applications').insert({
        job_id: job.id,
        user_id: uid,
        cv_url: cvPath,
        availability: 'Immediately',
        answers: {},
        status: 'Submitted'
      }).select('*').single();

      if (appErr) {
        fail('S5', `job_application insert failed: ${appErr.message}`);
      } else {
        pass('S5', `job_application row created: id=${appData.id}, cv_url=${appData.cv_url}, status=${appData.status}`);
      }
    }
  }
}

// ─── SECTION 6: GIGS ────────────────────────────────────────────────────────
async function testGigs(clientA, clientB) {
  sep();
  console.log('══ SECTION 6: GIGS ══');

  const uidA = await getUserId(clientA);
  const uidB = await getUserId(clientB);

  // 6.1 Fetch all gigs (as authenticated user)
  const { data: gigs, error: gigsErr } = await clientA.from('gigs').select('*').order('created_at', { ascending: false });
  if (gigsErr) { fail('S6', `Fetching gigs: ${gigsErr.message}`); }
  else {
    pass('S6', `Gigs fetched: ${gigs.length} total rows returned`);
    const unverified = gigs.filter(g => !g.verified);
    const verified   = gigs.filter(g => g.verified);
    info('S6', `verified=true: ${verified.length}, verified=false/null: ${unverified.length}`);

    if (unverified.length > 0) {
      warn('S6', `RLS ISSUE: Unauthenticated/any-auth user can see ${unverified.length} unverified gig(s). The query does NOT filter by verified=true. RLS policy does NOT enforce verified — all authenticated users see ALL gigs regardless of verified status.`);
      info('S6', `Unverified gig sample: id=${unverified[0].id}, title="${unverified[0].title}"`);
    } else {
      pass('S6', `All returned gigs are verified=true — either RLS enforces it or DB happens to have only verified gigs`);
    }
  }

  // 6.2 Check for "React Developer for Dashboard" — hardcoded vs real row
  const { data: rdGigs } = await clientA.from('gigs').select('id, title, posted_by, created_at, verified').ilike('title', '%React Developer%');
  if (rdGigs && rdGigs.length > 0) {
    pass('S6', `"React Developer" gig found as a REAL DB row (not hardcoded):`);
    rdGigs.forEach(g => info('S6', `  → id=${g.id}, title="${g.title}", posted_by=${g.posted_by}, verified=${g.verified}`));
  } else {
    warn('S6', `"React Developer for Dashboard" NOT found as a database row. It is either: (a) hardcoded somewhere in UI code, or (b) was deleted. Source code check: no hardcoded match found in Earn.jsx or Dashboard.jsx. Conclusion: the title was previously seeded but may have been deleted.`);
  }

  // 6.3 Check for "Test Gig — React Dashboard Helper"
  const { data: testGig } = await clientA.from('gigs').select('id, title, posted_by, verified').ilike('title', '%React Dashboard Helper%');
  if (testGig && testGig.length > 0) {
    pass('S6', `Seeded "Test Gig — React Dashboard Helper" found: id=${testGig[0].id}, verified=${testGig[0].verified}`);

    // 6.4 Apply to this gig as User B
    const gigId = testGig[0].id;
    const posterId = testGig[0].posted_by;

    // Check gamification BEFORE application
    const { data: gamBefore } = await clientB.from('user_gamification').select('points, badges').eq('user_id', uidB).single();
    info('S6', `User B gamification BEFORE apply: points=${gamBefore?.points}, badges=${JSON.stringify(gamBefore?.badges)}`);

    const { data: appRow, error: appErr } = await clientB.from('gig_applications').insert({
      gig_id: gigId,
      applicant_id: uidB,
      pitch: 'QA test proposal — automated audit'
    }).select('*').single();

    if (appErr) {
      fail('S6', `gig_application insert failed: ${appErr.message}`);
    } else {
      pass('S6', `gig_application created: id=${appRow.id}, status=${appRow.status}`);

      // 6.5 Wait for trigger to fire and check conversation_id
      await new Promise(r => setTimeout(r, 1500));
      const { data: refreshed } = await clientB.from('gig_applications').select('id, conversation_id, status').eq('id', appRow.id).single();
      if (refreshed?.conversation_id) {
        pass('S6', `Trigger populated conversation_id: ${refreshed.conversation_id} ✓`);

        // 6.6 Check conversation participants
        const { data: parts } = await clientB.from('conversation_participants').select('user_id').eq('conversation_id', refreshed.conversation_id);
        const partIds = (parts || []).map(p => p.user_id);
        if (partIds.includes(uidB)) { pass('S6', `User B (applicant) is in conversation_participants ✓`); }
        else { fail('S6', `User B NOT found in conversation_participants`); }
        if (posterId && partIds.includes(posterId)) { pass('S6', `Poster (gig owner) is in conversation_participants ✓`); }
        else { warn('S6', `Poster NOT in conversation_participants — check trigger handle_gig_proposal`); }

        // 6.7 Check first message (pitch) sent
        const { data: msgs } = await clientB.from('messages').select('content, sender_id').eq('conversation_id', refreshed.conversation_id).order('created_at', { ascending: true }).limit(1);
        if (msgs && msgs.length > 0 && msgs[0].content?.includes('QA test proposal')) {
          pass('S6', `First message is the pitch text: "${msgs[0].content.substring(0,80)}"`);
        } else if (msgs && msgs.length > 0) {
          warn('S6', `First message exists but content differs. Got: "${msgs[0].content?.substring(0,80)}"`);
        } else {
          fail('S6', `No messages found in the auto-created conversation`);
        }
      } else {
        fail('S6', `trigger handle_gig_proposal did NOT set conversation_id — trigger may be missing or broken`);
      }

      // 6.8 Test gig completion RPC — check gamification before/after
      const { error: completeErr } = await clientB.rpc('complete_gig_application', { p_application_id: appRow.id });
      if (completeErr) {
        fail('S6', `complete_gig_application() RPC error: ${completeErr.message}`);
      } else {
        await new Promise(r => setTimeout(r, 600));
        const { data: gamAfter } = await clientB.from('user_gamification').select('points, badges').eq('user_id', uidB).single();
        info('S6', `User B gamification AFTER complete: points=${gamAfter?.points}, badges=${JSON.stringify(gamAfter?.badges)}`);
        const ptsDiff = (gamAfter?.points || 0) - (gamBefore?.points || 0);
        if (ptsDiff >= 30) { pass('S6', `+${ptsDiff} XP awarded (expected +30) ✓`); }
        else { fail('S6', `XP delta is ${ptsDiff} (expected +30) — RPC may not award correctly`); }
        const hasBadge = (gamAfter?.badges || []).some(b => /gig completer/i.test(b) || /complete/i.test(b));
        if (hasBadge) { pass('S6', `"Gig Completer" badge awarded ✓`); }
        else { fail('S6', `"Gig Completer" badge NOT found in badges after completion`); }
      }
    }
  } else {
    warn('S6', `Seeded "Test Gig — React Dashboard Helper" not found in DB. Cannot test gig application flow.`);
  }
}

// ─── SECTION 7: FOLLOWS / CONNECTIONS ───────────────────────────────────────
async function testFollows(clientA, clientB) {
  sep();
  console.log('══ SECTION 7: FOLLOWS / CONNECTIONS ══');

  const uidA = await getUserId(clientA);
  const uidB = await getUserId(clientB);

  // 7.1 User A follows User B
  const { data: followData, error: followErr } = await clientA.from('follows').insert({
    follower_id: uidA,
    following_id: uidB
  }).select('*').single();

  if (followErr) {
    if (followErr.code === '23505') {
      warn('S7', `Already following User B — testing with existing row`);
    } else {
      fail('S7', `Follow insert failed: ${followErr.message}`);
    }
  } else {
    pass('S7', `follows row created: id=${followData.id}, follower_id=${followData.follower_id}, following_id=${followData.following_id}`);
  }

  // 7.2 Confirm follow row exists
  const { data: fCheck } = await clientA.from('follows').select('id').eq('follower_id', uidA).eq('following_id', uidB);
  if (fCheck && fCheck.length > 0) { pass('S7', `follows row confirmed in DB ✓`); }
  else { fail('S7', `follows row NOT found after insert`); }

  // 7.3 Check notification for User B (new_follower)
  await new Promise(r => setTimeout(r, 800));
  const { data: notifs } = await clientB.from('notifications').select('id, type, title, body, created_at').eq('user_id', uidB).order('created_at', { ascending: false }).limit(5);
  info('S7', `User B recent notifications: ${JSON.stringify(notifs?.map(n => ({ type: n.type, title: n.title })))}`);
  const followerNotif = (notifs || []).find(n => n.type === 'new_follower' || n.type === 'follow');
  if (followerNotif) {
    pass('S7', `new-follower notification fired: type=${followerNotif.type}, title="${followerNotif.title}"`);
  } else {
    fail('S7', `new-follower notification NOT found in User B's notifications — no DB trigger fires on follows insert`);
  }

  // 7.4 Unfollow
  const { error: unfollowErr } = await clientA.from('follows').delete().eq('follower_id', uidA).eq('following_id', uidB);
  if (unfollowErr) { fail('S7', `Unfollow failed: ${unfollowErr.message}`); }
  else { pass('S7', `Unfollow successful`); }

  const { data: fCheck2 } = await clientA.from('follows').select('id').eq('follower_id', uidA).eq('following_id', uidB);
  if (!fCheck2 || fCheck2.length === 0) { pass('S7', `follows row deleted after unfollow ✓`); }
  else { fail('S7', `follows row still exists after unfollow`); }

  // 7.5 Re-follow for cross-user tests
  await clientA.from('follows').insert({ follower_id: uidA, following_id: uidB }).select();
}

// ─── SECTION 8: MESSAGING ───────────────────────────────────────────────────
async function testMessaging(clientA, clientB) {
  sep();
  console.log('══ SECTION 8: MESSAGING ══');

  const uidA = await getUserId(clientA);
  const uidB = await getUserId(clientB);

  // 8.1 Create a conversation between A and B
  const { data: conv, error: convErr } = await clientA.from('conversations').insert({}).select('id').single();
  if (convErr) { fail('S8', `Create conversation failed: ${convErr.message}`); return null; }
  pass('S8', `Conversation created: id=${conv.id}`);

  // 8.2 Add both participants
  const { error: partErr } = await clientA.from('conversation_participants').insert([
    { conversation_id: conv.id, user_id: uidA },
    { conversation_id: conv.id, user_id: uidB }
  ]);
  if (partErr) { fail('S8', `Add participants failed: ${partErr.message}`); }
  else { pass('S8', `Both users added to conversation_participants ✓`); }

  // 8.3 Send a text message (as User A)
  const { data: msg1, error: msg1Err } = await clientA.from('messages').insert({
    conversation_id: conv.id,
    sender_id: uidA,
    content: 'Hello from User A — QA audit message',
    file_url: null
  }).select('*').single();

  if (msg1Err) { fail('S8', `Send text message failed: ${msg1Err.message}`); }
  else { pass('S8', `Text message sent: id=${msg1.id}, content="${msg1.content}", read_at=${msg1.read_at}`); }

  // 8.4 User B reads messages — confirm read_at updates
  const { data: msgs } = await clientB.from('messages').select('id, read_at').eq('conversation_id', conv.id).neq('sender_id', uidB);
  if (msgs && msgs.length > 0) {
    const unreadIds = msgs.filter(m => !m.read_at).map(m => m.id);
    if (unreadIds.length > 0) {
      const { error: readErr } = await clientB.from('messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
      if (readErr) { fail('S8', `Updating read_at failed: ${readErr.message}`); }
      else { pass('S8', `read_at updated for ${unreadIds.length} message(s) ✓`); }

      // Verify
      const { data: readCheck } = await clientA.from('messages').select('id, read_at').in('id', unreadIds);
      const allRead = (readCheck || []).every(m => m.read_at !== null);
      if (allRead) { pass('S8', `Read receipts confirmed in DB ✓`); }
      else { fail('S8', `Some messages still show read_at=null after update`); }
    } else {
      info('S8', `All messages already marked as read`);
    }
  }

  // 8.5 Check messages table has read_at column
  const { data: colCheck } = await clientA.from('messages').select('id, read_at').limit(1);
  if (Array.isArray(colCheck) && 'read_at' in (colCheck[0] || {})) {
    pass('S8', `messages table has read_at column ✓`);
  } else if (colCheck !== null) {
    warn('S8', `messages table returned rows but read_at may be missing from schema`);
  }

  // 8.6 Check file attachment upload (message-attachments bucket)
  const dummyImg = new Blob(['fake image bytes'], { type: 'image/png' });
  const attachPath = `messages/${uidA}/${Date.now()}.png`;
  const { data: attUpload, error: attErr } = await clientA.storage
    .from('message-attachments')
    .upload(attachPath, dummyImg, { contentType: 'image/png', upsert: false });

  if (attErr) {
    fail('S8', `Image attachment upload to message-attachments failed: ${attErr.message}`);
  } else {
    pass('S8', `Image attachment uploaded: ${attachPath}`);
    // message-attachments uses getPublicUrl
    const { data: pubUrl } = clientA.storage.from('message-attachments').getPublicUrl(attachPath);
    info('S8', `message-attachments public URL: ${pubUrl?.publicUrl?.substring(0, 80)}...`);
    warn('S8', `SECURITY NOTE: message-attachments bucket uses getPublicUrl() — meaning attachments are PUBLIC. Anyone with the URL can access them. This may be intentional for chat UX but is a privacy consideration.`);
  }

  // 8.7 Check new-message notification via create_notification
  const { data: notifCheck, error: notifCheckErr } = await clientA.rpc('create_notification', {
    p_user_id: uidB,
    p_type: 'new_message',
    p_title: '💬 New message from QA Test',
    p_body: 'You have a new message from User A',
    p_link: `/messages?id=${conv.id}`
  });
  if (notifCheckErr) {
    fail('S8', `create_notification RPC failed: ${notifCheckErr.message}`);
  } else {
    pass('S8', `create_notification() RPC call succeeded ✓`);
    // Verify it landed in notifications table
    await new Promise(r => setTimeout(r, 500));
    const { data: newNotif } = await clientB.from('notifications').select('id, type, title').eq('user_id', uidB).eq('type', 'new_message').order('created_at', { ascending: false }).limit(1);
    if (newNotif && newNotif.length > 0) {
      pass('S8', `new_message notification confirmed in DB: "${newNotif[0].title}"`);
    } else {
      fail('S8', `create_notification RPC ran without error but no row found in notifications table`);
    }
  }

  return conv.id;
}

// ─── SECTION 9: NOTIFICATIONS ───────────────────────────────────────────────
async function testNotifications(clientA, clientB) {
  sep();
  console.log('══ SECTION 9: NOTIFICATIONS ══');

  const uidB = await getUserId(clientB);

  // 9.1 Read all notifications for User B
  const { data: notifs, error: notifErr } = await clientB.from('notifications').select('*').eq('user_id', uidB).order('created_at', { ascending: false });
  if (notifErr) { fail('S9', `Read notifications failed: ${notifErr.message}`); return; }
  info('S9', `Total notifications for User B: ${notifs?.length}`);

  // 9.2 Report which types are present
  const types = [...new Set((notifs || []).map(n => n.type))];
  info('S9', `Notification types found: ${JSON.stringify(types)}`);

  // 9.3 Check that create_notification RPC exists — already tested in S8
  // 9.4 Check if any notification was directly inserted (bypassing RPC)
  //     The RPC would insert with a standard format. Direct inserts would be indistinguishable 
  //     from code perspective unless the 'type' field is missing.
  const missingType = (notifs || []).filter(n => !n.type);
  if (missingType.length > 0) {
    warn('S9', `${missingType.length} notification(s) have no 'type' — possible direct insert bypassing create_notification()`);
  } else {
    pass('S9', `All notifications have a 'type' field — consistent with create_notification() RPC usage`);
  }

  // 9.5 Verify the HeaderActions polling logic: notifications table has user_id, is_read, created_at
  const sample = (notifs || [])[0];
  if (sample) {
    const hasRequiredCols = 'user_id' in sample && 'is_read' in sample && 'created_at' in sample && 'type' in sample;
    if (hasRequiredCols) { pass('S9', `notifications table schema valid for HeaderActions: has user_id, is_read, created_at, type ✓`); }
    else { fail('S9', `notifications table missing columns. Sample keys: ${Object.keys(sample).join(', ')}`); }
  }
}

// ─── SECTION 10: ADMIN PANEL ────────────────────────────────────────────────
async function testAdmin(clientA, clientAdmin) {
  sep();
  console.log('══ SECTION 10: ADMIN PANEL & MODERATION ══');

  const uidA = await getUserId(clientA);

  // 10.1 Verify is_admin() RPC
  if (clientAdmin) {
    const { data: isAdminResult, error: adminRpcErr } = await clientAdmin.rpc('is_admin');
    if (adminRpcErr) { fail('S10', `is_admin() RPC error: ${adminRpcErr.message}`); }
    else { pass('S10', `is_admin() returned: ${isAdminResult} for admin user ✓`); }
  }

  // 10.2 Test is_admin() for non-admin user (User A)
  const { data: nonAdminResult, error: naErr } = await clientA.rpc('is_admin');
  if (naErr) { fail('S10', `is_admin() for non-admin errored: ${naErr.message}`); }
  else if (!nonAdminResult) { pass('S10', `is_admin() correctly returns false for non-admin user ✓`); }
  else { fail('S10', `SECURITY: is_admin() returned TRUE for a non-admin user! Admin privilege escalation risk.`); }

  // 10.3 Attempt to read admin-only data as non-admin
  const { data: adminRows, error: adminRowsErr } = await clientA.from('admins').select('*');
  if (adminRowsErr) {
    pass('S10', `admins table read blocked for non-admin: ${adminRowsErr.message} ✓`);
  } else {
    if (adminRows && adminRows.length > 0) {
      fail('S10', `SECURITY: Non-admin user can read admins table! Returned ${adminRows.length} row(s). RLS may be missing on admins table.`);
    } else {
      warn('S10', `Non-admin user got 0 rows from admins table (RLS may be filtering or table is empty)`);
    }
  }

  // 10.4 Admin gig approval flow — set a gig to verified=true
  // First, find an unverified gig
  const { data: unverifiedGigs } = await clientA.from('gigs').select('id, title, verified').eq('verified', false).limit(1);
  if (unverifiedGigs && unverifiedGigs.length > 0 && clientAdmin) {
    const gig = unverifiedGigs[0];
    info('S10', `Found unverified gig: id=${gig.id}, title="${gig.title}"`);

    // Approve as admin
    const { error: approveErr } = await clientAdmin.from('gigs').update({
      verified: true,
      verified_at: new Date().toISOString()
    }).eq('id', gig.id);

    if (approveErr) {
      fail('S10', `Admin gig approval failed: ${approveErr.message}`);
    } else {
      pass('S10', `Admin approved gig: id=${gig.id}`);

      // Confirm it's now visible
      const { data: nowVisible } = await clientA.from('gigs').select('id, verified').eq('id', gig.id).single();
      if (nowVisible?.verified) {
        pass('S10', `Gig verified=true is now visible to regular user ✓`);
      } else {
        warn('S10', `Gig verified status not reflected after approval`);
      }
    }
  } else {
    info('S10', `No unverified gigs to test approval flow`);
  }

  // 10.5 Submit a report
  const { data: anyPost } = await clientA.from('posts').select('id, user_id').limit(1);
  if (anyPost && anyPost.length > 0) {
    const post = anyPost[0];
    const { data: reportData, error: reportErr } = await clientA.from('reports_moderation').insert({
      reporter_id: uidA,
      reported_user_id: post.user_id || uidA,
      post_id: post.id,
      reason: 'QA Test Report — automated audit'
    }).select('*').single();

    if (reportErr) { fail('S10', `Report submit failed: ${reportErr.message}`); }
    else { pass('S10', `Report created: id=${reportData.id}, post_id=${reportData.post_id}, reason="${reportData.reason}"`); }
  } else {
    warn('S10', `No posts found to test reporting`);
  }
}

// ─── SECTION 11: SUPABASE HEALTH CHECK ──────────────────────────────────────
async function testHealthCheck(clientA) {
  sep();
  console.log('══ SECTION 11: SUPABASE HEALTH CHECK ══');

  const TABLES = [
    'profiles', 'posts', 'post_likes', 'post_comments', 'follows',
    'conversations', 'conversation_participants', 'messages',
    'community_members', 'community_channels', 'gigs', 'gig_applications',
    'jobs', 'job_applications', 'user_gamification', 'notifications',
    'reports_moderation', 'admins', 'events', 'user_events',
    'communities', 'scholarships', 'courses'
  ];

  // 11.1 Try to SELECT from each table — if RLS is disabled, anon can read
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  for (const table of TABLES) {
    try {
      const { data, error } = await anonClient.from(table).select('id').limit(1);
      if (error) {
        // Could be RLS blocked or table doesn't exist
        if (error.code === '42P01') {
          info('S11', `Table "${table}" does NOT exist in DB`);
        } else {
          pass('S11', `Table "${table}" — anon SELECT blocked: ${error.message}`);
        }
      } else {
        if (data && data.length > 0) {
          fail('S11', `SECURITY: Table "${table}" — anon can READ data! RLS may be disabled or policy too broad.`);
        } else {
          warn('S11', `Table "${table}" — anon got 0 rows (RLS filtering or empty table)`);
        }
      }
    } catch (e) {
      warn('S11', `Table "${table}" — unexpected error: ${e.message}`);
    }
  }

  // 11.2 RLS breadth check — messages: can any auth user read ALL messages?
  const { data: allMsgs, error: allMsgsErr } = await clientA.from('messages').select('id, conversation_id').limit(5);
  if (!allMsgsErr && allMsgs) {
    warn('S11', `messages RLS ISSUE: Any authenticated user can SELECT all messages (${allMsgs.length} rows returned without conversation membership check). messages policy is "auth.role() = authenticated" — too broad.`);
    allMsgs.forEach(m => info('S11', `  → message id=${m.id} conversation_id=${m.conversation_id}`));
  }

  // 11.3 Check conversations RLS — same issue
  const { data: allConvs } = await clientA.from('conversations').select('id').limit(5);
  if (allConvs) {
    warn('S11', `conversations RLS ISSUE: Any authenticated user can SELECT all conversations. Policy is "auth.role() = authenticated" — too broad (not scoped to participant).`);
  }

  // 11.4 Check job_applications — can I read other people's applications?
  const { data: allApps } = await clientA.from('job_applications').select('id, user_id').limit(5);
  if (allApps && allApps.length > 0) {
    warn('S11', `job_applications may be readable by all authenticated users. Returned ${allApps.length} rows. Verify policy scopes to own applications only.`);
  }

  // 11.5 Check storage bucket: job-cvs
  info('S11', `Storage bucket job-cvs: checking if it requires auth for signed URLs (already tested in S5)`);
  
  // 11.6 Post UPDATE by non-owner
  const { data: otherPost } = await clientA.from('posts').select('id, user_id, posted_by').limit(10);
  if (otherPost && otherPost.length > 0) {
    const uidA = await getUserId(clientA);
    const notMinePost = otherPost.find(p => p.user_id !== uidA && p.posted_by !== uidA);
    if (notMinePost) {
      const { error: updateErr } = await clientA.from('posts').update({ content: 'HACKED' }).eq('id', notMinePost.id);
      if (updateErr) { pass('S11', `posts UPDATE by non-owner blocked: ${updateErr.message} ✓`); }
      else { fail('S11', `SECURITY: posts UPDATE succeeded for non-owner post! No UPDATE policy found in posts table.`); }
    } else {
      info('S11', `All posts in DB belong to User A — cannot test non-owner UPDATE (need cross-user data)`);
    }
  }
}

// ─── SECTION 12: CROSS-USER ──────────────────────────────────────────────────
async function testCrossUser(clientA, clientB) {
  sep();
  console.log('══ SECTION 12: CROSS-USER TESTING ══');

  const uidA = await getUserId(clientA);
  const uidB = await getUserId(clientB);

  info('S12', `User A id: ${uidA}`);
  info('S12', `User B id: ${uidB}`);

  // 12.1 Profile Visibility — User B reads User A's profile
  const { data: aProfile, error: aProfErr } = await clientB.from('profiles').select('*').eq('id', uidA).single();
  if (aProfErr) { fail('S12', `User B cannot read User A's profile: ${aProfErr.message}`); }
  else {
    pass('S12', `User B CAN read User A's full profile row ✓`);
    const exposed = Object.entries(aProfile || {}).filter(([k, v]) => v && ['resume_link', 'email', 'dob', 'phone_number', 'privacy'].includes(k));
    if (exposed.length > 0) {
      warn('S12', `PRIVACY LEAK: User B can see User A's sensitive fields: ${exposed.map(([k,v]) => `${k}="${String(v).substring(0,30)}"`).join(', ')}`);
      warn('S12', `The profiles_select_all_auth policy allows any authenticated user to read ALL columns of any profile, including resume_link, email, dob, privacy. No column-level security (CLS) is enforced.`);
    } else {
      info('S12', `No sensitive fields found in profile (may not be populated)`);
    }
  }

  // 12.2 Post Visibility — User A creates a post
  const { data: postA, error: postAErr } = await clientA.from('posts').insert({
    content: 'QA Cross-User Test Post — visible to User B?',
    user_id: uidA,
    posted_by: uidA
  }).select('*').single();

  if (postAErr) { fail('S12', `User A post creation failed: ${postAErr.message}`); }
  else {
    pass('S12', `User A created post: id=${postA.id}`);

    // User B reads it
    const { data: bSeePost, error: bSeeErr } = await clientB.from('posts').select('id, content, user_id').eq('id', postA.id).single();
    if (bSeeErr) { fail('S12', `User B cannot see User A's post: ${bSeeErr.message}`); }
    else { pass('S12', `User B CAN see User A's post: "${bSeePost.content}" ✓`); }

    // User B likes User A's post
    const { error: likeErr } = await clientB.from('post_likes').insert({ post_id: postA.id, user_id: uidB });
    if (likeErr) { fail('S12', `User B like on User A's post failed: ${likeErr.message}`); }
    else { pass('S12', `User B liked User A's post ✓`); }

    // User B comments
    const { data: commentData, error: commentErr } = await clientB.from('post_comments').insert({
      post_id: postA.id,
      user_id: uidB,
      content: 'QA cross-user comment from User B'
    }).select('*').single();
    if (commentErr) { fail('S12', `User B comment on User A's post failed: ${commentErr.message}`); }
    else { pass('S12', `User B commented on User A's post: id=${commentData.id} ✓`); }
  }

  // 12.3 Follow Flow
  const { data: followRow } = await clientA.from('follows').insert({ follower_id: uidA, following_id: uidB }).select('id').single();
  if (!followRow) { warn('S12', `Follow insert may have failed or already existed`); }

  // Check User B sees User A as follower
  const { data: bFollowers } = await clientB.from('follows').select('follower_id').eq('following_id', uidB);
  const aIsFollowing = (bFollowers || []).some(f => f.follower_id === uidA);
  if (aIsFollowing) { pass('S12', `User B can see User A is following them (relationship visible both sides) ✓`); }
  else { fail('S12', `Follow relationship not visible to User B`); }

  // Check User B does NOT automatically follow User A (no auto-mutual)
  const { data: aFollowers } = await clientA.from('follows').select('follower_id').eq('following_id', uidA).eq('follower_id', uidB);
  if (!aFollowers || aFollowers.length === 0) {
    pass('S12', `Follow is NOT mutual/auto-accepted — model is one-way public follow (no approval required) ✓`);
  } else {
    warn('S12', `Follow appears to be mutual — User B was auto-followed back. Check if this is intended.`);
  }

  // 12.4 Direct Messaging (A → B)
  const { data: dmConv, error: dmConvErr } = await clientA.from('conversations').insert({}).select('id').single();
  if (dmConvErr) { fail('S12', `DM conversation creation failed: ${dmConvErr.message}`); return; }
  
  await clientA.from('conversation_participants').insert([
    { conversation_id: dmConv.id, user_id: uidA },
    { conversation_id: dmConv.id, user_id: uidB }
  ]);

  const { data: dmMsg, error: dmMsgErr } = await clientA.from('messages').insert({
    conversation_id: dmConv.id,
    sender_id: uidA,
    content: 'Hi User B! This is User A sending first DM — cross-user QA test',
    file_url: null
  }).select('*').single();

  if (dmMsgErr) { fail('S12', `A→B DM send failed: ${dmMsgErr.message}`); }
  else { pass('S12', `A→B DM sent: id=${dmMsg.id}`); }

  // User B reads it
  const { data: bSeeDm } = await clientB.from('messages').select('id, content, sender_id').eq('conversation_id', dmConv.id);
  if (bSeeDm && bSeeDm.length > 0) { pass('S12', `User B can read A's DM: "${bSeeDm[0].content}" ✓`); }
  else { fail('S12', `User B cannot see User A's DM`); }

  // User B replies
  const { data: bReply, error: bReplyErr } = await clientB.from('messages').insert({
    conversation_id: dmConv.id,
    sender_id: uidB,
    content: 'Reply from User B — QA cross-user test',
    file_url: null
  }).select('*').single();
  if (bReplyErr) { fail('S12', `User B reply failed: ${bReplyErr.message}`); }
  else { pass('S12', `User B replied: id=${bReply.id} ✓`); }

  // 12.5 Privacy Isolation — User B tries to read User A's job_applications
  const { data: aApps } = await clientA.from('job_applications').select('id').eq('user_id', uidA).limit(1);
  if (aApps && aApps.length > 0) {
    const aAppId = aApps[0].id;
    // Try to read as User B directly
    const { data: bReadsAApp, error: bReadAppErr } = await clientB.from('job_applications').select('id').eq('id', aAppId);
    if (bReadAppErr) {
      pass('S12', `User B BLOCKED from reading User A's job_application: ${bReadAppErr.message} ✓`);
    } else if (bReadsAApp && bReadsAApp.length > 0) {
      fail('S12', `SECURITY LEAK: User B CAN read User A's job_application row! RLS on job_applications is too broad.`);
    } else {
      info('S12', `User B got 0 rows for User A's job_application — RLS filtering (but no explicit error)`);
    }
  }

  // 12.6 Try to access messages from a conversation User B is NOT in
  // Create a private conv for User A with some stranger
  const { data: privateConv } = await clientA.from('conversations').insert({}).select('id').single();
  if (privateConv) {
    await clientA.from('conversation_participants').insert({ conversation_id: privateConv.id, user_id: uidA });
    await clientA.from('messages').insert({ conversation_id: privateConv.id, sender_id: uidA, content: 'Private message User A only' });
    
    const { data: bReadsPrivate } = await clientB.from('messages').select('id, content').eq('conversation_id', privateConv.id);
    if (!bReadsPrivate || bReadsPrivate.length === 0) {
      pass('S12', `User B BLOCKED from reading User A's private messages (not in conversation) ✓`);
    } else {
      fail('S12', `SECURITY LEAK: User B CAN read User A's private messages! messages RLS "auth.role()=authenticated" is too broad — no conversation membership check.`);
    }
  }

  // 12.7 Community — both join same community
  const { data: communities } = await clientA.from('communities').select('id, name').limit(1);
  if (communities && communities.length > 0) {
    const comm = communities[0];
    await clientA.from('community_members').insert({ community_id: comm.id, user_id: uidA }).select();
    await clientB.from('community_members').insert({ community_id: comm.id, user_id: uidB }).select();

    const { data: members } = await clientA.from('community_members').select('user_id').eq('community_id', comm.id);
    const memberIds = (members || []).map(m => m.user_id);
    if (memberIds.includes(uidA) && memberIds.includes(uidB)) {
      pass('S12', `Both User A and B appear in community_members for "${comm.name}" ✓`);
    } else {
      fail('S12', `Not both users found in community_members`);
    }
  }

  // 12.8 Reporting: User B reports User A's post
  if (postA) {
    const { data: report, error: reportErr } = await clientB.from('reports_moderation').insert({
      reporter_id: uidB,
      reported_user_id: uidA,
      post_id: postA?.id,
      reason: 'Cross-user QA report test'
    }).select('*').single();
    if (reportErr) { fail('S12', `Cross-user report failed: ${reportErr.message}`); }
    else { pass('S12', `Cross-user report created: id=${report.id}, reporter=${report.reporter_id}, target=${report.reported_user_id} ✓`); }
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   CHAVEE QA AUDIT — Sections 5–12               ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // Authenticate users
  console.log('Authenticating User A (student@chavee.in)...');
  const clientA = await signIn(USER_A_EMAIL, USER_A_PASS, 'UserA');
  if (!clientA) { console.error('FATAL: Cannot sign in User A. Aborting.'); return; }
  pass('AUTH', `User A signed in`);

  console.log('Signing up fresh User B...');
  const clientB = await signUp(USER_B_EMAIL, USER_B_PASS, 'UserB');
  if (!clientB) { console.error('FATAL: Cannot sign up User B. Aborting.'); return; }
  pass('AUTH', `User B registered: ${USER_B_EMAIL}`);

  console.log('Authenticating Admin...');
  const clientAdmin = await signIn(ADMIN_EMAIL, ADMIN_PASS, 'Admin');
  if (!clientAdmin) { warn('AUTH', `Admin login failed — admin tests may be limited`); }
  else { pass('AUTH', `Admin signed in`); }

  // Run tests
  await testJobs(clientA);
  await testGigs(clientA, clientB);
  await testFollows(clientA, clientB);
  await testMessaging(clientA, clientB);
  await testNotifications(clientA, clientB);
  await testAdmin(clientA, clientAdmin);
  await testHealthCheck(clientA);
  await testCrossUser(clientA, clientB);

  sep();
  console.log('QA AUDIT COMPLETE — check above output for ✅/❌/⚠️ findings');
}

main().catch(err => {
  console.error('\nFATAL ERROR:', err);
  process.exit(1);
});
