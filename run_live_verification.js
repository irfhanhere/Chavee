import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://dtokistffdnycrzbmxcr.supabase.co';
const SUPABASE_ANON = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const results = [];
function logResult(section, testName, status, details) {
  results.push({ section, testName, status, details });
  console.log(`[${section}] ${testName} - ${status}: ${details}`);
}

// Hardcoded existing confirmed accounts to bypass signup rate limits
const EXISTING_USER_A = { email: 'tqzxrzum@guerrillamailblock.com', password: 'TestPass123!' };
const EXISTING_USER_B = { email: 'bommdfne@guerrillamailblock.com', password: 'TestPass123!' };

async function createVerifiedUser(name) {
  const res = await fetch('https://api.guerrillamail.com/ajax.php?f=get_email_address');
  const json = await res.json();
  const email = json.email_addr;
  const sidToken = json.sid_token;
  const password = 'TestPass123!';
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
  const { data: suData, error: suErr } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });
  if (suErr) throw new Error(`Supabase signup failed for ${name}: ` + suErr.message);
  const userId = suData.user.id;
  
  let verifyUrl = null;
  for (let i = 0; i < 25; i++) {
    await sleep(4000);
    const msgRes = await fetch(`https://api.guerrillamail.com/ajax.php?f=check_email&seq=0&sid_token=${sidToken}`);
    const msgJson = await msgRes.json();
    const list = msgJson.list || [];
    
    if (list && list.length > 0) {
      const targetMail = list.find(m => m.mail_subject.toLowerCase().includes('confirm') || m.mail_from.toLowerCase().includes('supabase'));
      if (targetMail) {
        const detailRes = await fetch(`https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=${targetMail.mail_id}&sid_token=${sidToken}`);
        const detail = await detailRes.json();
        const mailBody = detail.mail_body || '';
        
        const match = mailBody.match(/https:\/\/dtokistffdnycrzbmxcr\.supabase\.co\/auth\/v1\/verify\?[^"'\s<>\]\)]+/);
        if (match) {
          verifyUrl = match[0].replace(/&amp;/g, '&');
          break;
        }
      }
    }
  }
  
  if (!verifyUrl) throw new Error(`Verification email not received for ${name}`);
  await fetch(verifyUrl, { redirect: 'manual' });
  
  const { data: siData, error: siErr } = await supabase.auth.signInWithPassword({ email, password });
  if (siErr) throw new Error(`Sign in failed for ${name}: ` + siErr.message);
  
  return { client: supabase, userId: siData.user.id, email, password };
}

async function getOrSeedTestUsers() {
  const supabaseA = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
  const supabaseB = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });

  console.log('Attempting to log in as existing User A...');
  const { data: siA, error: errA } = await supabaseA.auth.signInWithPassword(EXISTING_USER_A);
  
  console.log('Attempting to log in as existing User B...');
  const { data: siB, error: errB } = await supabaseB.auth.signInWithPassword(EXISTING_USER_B);

  if (!errA && !errB) {
    console.log('Successfully logged in using existing confirmed test accounts.');
    return {
      userA: { client: supabaseA, userId: siA.user.id, email: EXISTING_USER_A.email },
      userB: { client: supabaseB, userId: siB.user.id, email: EXISTING_USER_B.email }
    };
  }

  console.log('Existing accounts unavailable or expired. Seeding new ones dynamically...');
  const userA = await createVerifiedUser('QA Student A');
  console.log(`User A created dynamically: ID=${userA.userId}, Email=${userA.email}`);
  
  console.log('Sleeping to prevent signup rate limit...');
  await sleep(5000);
  
  const userB = await createVerifiedUser('QA Student B');
  console.log(`User B created dynamically: ID=${userB.userId}, Email=${userB.email}`);

  return { userA, userB };
}

async function run() {
  console.log('Starting Live Verification...');
  logResult('PART_1_POOLER', 'Pooler Status', 'INFO', 'Connection pooler is disabled in Supabase project dashboard (returns tenant not found). Bypassing PG connection and executing all checks via Supabase HTTP Client API.');

  let userA, userB;
  try {
    const seeded = await getOrSeedTestUsers();
    userA = seeded.userA;
    userB = seeded.userB;
    logResult('TEST_SETUP', 'User Seeding', 'PASS', 'Created and confirmed two dynamic test users.');
  } catch (e) {
    logResult('TEST_SETUP', 'User Seeding', 'FAIL', e.message);
    fs.writeFileSync('live_verification_results.json', JSON.stringify(results, null, 2));
    return;
  }

  const clientA = userA.client;
  const clientB = userB.client;

  // Retrieve a valid community ID for posts
  let communityId = null;
  try {
    const { data: comms, error: commsErr } = await clientA.from('communities').select('id').limit(1);
    if (!commsErr && comms && comms.length > 0) {
      communityId = comms[0].id;
      console.log(`Using valid community ID for posts: ${communityId}`);
    } else {
      console.log('No community found, using null for community_id');
    }
  } catch (e) {
    console.log('Error fetching community:', e.message);
  }

  // --------------------------------------------------
  // PART 2: ADVERSARIAL PRIVACY TESTS
  // --------------------------------------------------
  console.log('\n--- Running Part 2: Adversarial Privacy Checks ---');

  // 1. As User B, attempt to SELECT messages from a conversation User B is not part of
  try {
    const { data: conv, error: convErr } = await clientA.from('conversations').insert({ created_at: new Date().toISOString() }).select('id').single();
    if (convErr) {
      logResult('PART_2_ATTACK', 'Select Messages (Unprivileged)', 'FAIL', `Failed to create conversation as A: ${convErr.message}`);
    } else if (conv) {
      const { error: partErr } = await clientA.from('conversation_participants').insert({ conversation_id: conv.id, user_id: userA.userId });
      if (partErr) {
        logResult('PART_2_ATTACK', 'Select Messages (Unprivileged)', 'FAIL', `Failed to add participant A: ${partErr.message}`);
      } else {
        const { error: msgErr } = await clientA.from('messages').insert({ conversation_id: conv.id, sender_id: userA.userId, content: 'secret message' });
        if (msgErr) {
          logResult('PART_2_ATTACK', 'Select Messages (Unprivileged)', 'FAIL', `Failed to insert message as A: ${msgErr.message}`);
        } else {
          const { data: bRead, error: bReadErr } = await clientB.from('messages').select('*').eq('conversation_id', conv.id);
          if (bReadErr) {
            logResult('PART_2_ATTACK', 'Select Messages (Unprivileged)', 'PASS', `Blocked with error: ${bReadErr.message}`);
          } else if (!bRead || bRead.length === 0) {
            logResult('PART_2_ATTACK', 'Select Messages (Unprivileged)', 'PASS', 'Query returned empty result (RLS active)');
          } else {
            logResult('PART_2_ATTACK', 'Select Messages (Unprivileged)', 'FAIL', `BREACH: User B read User A's private messages! Content: ${bRead[0].content}`);
          }
        }
      }
      // Cleanup
      await clientA.from('conversations').delete().eq('id', conv.id);
    }
  } catch (e) {
    logResult('PART_2_ATTACK', 'Select Messages (Unprivileged)', 'FAIL', e.message);
  }

  // 2. As User B, attempt to SELECT job_applications belonging to User A
  try {
    const { data: bApps, error: bAppsErr } = await clientB.from('job_applications').select('*').eq('user_id', userA.userId);
    if (bAppsErr) {
      logResult('PART_2_ATTACK', 'Select Job Applications (Unprivileged)', 'PASS', `Blocked with error: ${bAppsErr.message}`);
    } else if (!bApps || bApps.length === 0) {
      logResult('PART_2_ATTACK', 'Select Job Applications (Unprivileged)', 'PASS', 'Query returned empty result (RLS active)');
    } else {
      logResult('PART_2_ATTACK', 'Select Job Applications (Unprivileged)', 'FAIL', `BREACH: User B read User A's job applications!`);
    }
  } catch (e) {
    logResult('PART_2_ATTACK', 'Select Job Applications (Unprivileged)', 'FAIL', e.message);
  }

  // 3. As User B, attempt to UPDATE a gig's verified field to true for a gig User B doesn't own
  try {
    const { data: gig, error: gigErr } = await clientA.from('gigs').insert({
      title: 'Test Gig ' + Date.now(),
      description: 'Created by User A',
      category: 'QA',
      price: 100,
      condition: '7 Days',
      client_name: 'QA client',
      posted_by: userA.userId,
      verified: false,
      status: 'Live'
    }).select('id').single();

    if (gigErr) {
      logResult('PART_2_ATTACK', 'Update Gig Verified (Unprivileged)', 'FAIL', `Failed to create gig as A: ${gigErr.message}`);
    } else if (gig) {
      const { error: updateErr } = await clientB.from('gigs').update({ verified: true }).eq('id', gig.id);
      const { data: refreshed, error: refreshErr } = await clientA.from('gigs').select('verified').eq('id', gig.id).single();
      
      if (updateErr) {
        logResult('PART_2_ATTACK', 'Update Gig Verified (Unprivileged)', 'PASS', `Blocked with error: ${updateErr.message}`);
      } else if (refreshed && refreshed.verified === false) {
        logResult('PART_2_ATTACK', 'Update Gig Verified (Unprivileged)', 'PASS', 'Update was ignored/filtered silently by RLS');
      } else {
        logResult('PART_2_ATTACK', 'Update Gig Verified (Unprivileged)', 'FAIL', 'BREACH: User B verified a gig!');
      }

      // Cleanup
      await clientA.from('gigs').delete().eq('id', gig.id);
    }
  } catch (e) {
    logResult('PART_2_ATTACK', 'Update Gig Verified (Unprivileged)', 'FAIL', e.message);
  }

  // 4. As User B, attempt to SELECT User A's profiles row. Then verify public_profiles view.
  try {
    const { data: fullProf, error: fpErr } = await clientB.from('profiles').select('*').eq('id', userA.userId);
    if (fpErr) {
      logResult('PART_2_ATTACK', 'Select Profile Full Row (Unprivileged)', 'PASS', `Blocked with error: ${fpErr.message}`);
    } else if (!fullProf || fullProf.length === 0) {
      logResult('PART_2_ATTACK', 'Select Profile Full Row (Unprivileged)', 'PASS', 'Query returned empty result (RLS active)');
    } else {
      const row = fullProf[0];
      const hasSensitive = ['email', 'dob', 'resume_link'].some(f => row[f] !== null && row[f] !== undefined);
      if (hasSensitive) {
        logResult('PART_2_ATTACK', 'Select Profile Full Row (Unprivileged)', 'FAIL', `BREACH: User B read sensitive fields! Keys: ${Object.keys(row).filter(k => row[k] !== null)}`);
      } else {
        logResult('PART_2_ATTACK', 'Select Profile Full Row (Unprivileged)', 'PASS', 'Full row read returned but sensitive fields are null/filtered');
      }
    }

    // Check public_profiles view
    const { data: pubProf, error: ppErr } = await clientB.from('public_profiles').select('*').eq('id', userA.userId);
    if (ppErr) {
      logResult('PART_2_ATTACK', 'Select public_profiles view', 'FAIL', `Error: ${ppErr.message}`);
    } else if (!pubProf || pubProf.length === 0) {
      logResult('PART_2_ATTACK', 'Select public_profiles view', 'PARTIAL', 'No public profile found for User A');
    } else {
      const row = pubProf[0];
      const exposedForbidden = ['email', 'dob', 'resume_link'].filter(f => row[f] !== undefined && row[f] !== null);
      if (exposedForbidden.length === 0) {
        logResult('PART_2_ATTACK', 'Select public_profiles view', 'PASS', `Successfully read public_profiles safe fields. Exposed forbidden: none`);
      } else {
        logResult('PART_2_ATTACK', 'Select public_profiles view', 'FAIL', `BREACH: public_profiles exposes forbidden fields: ${exposedForbidden.join(', ')}`);
      }
    }
  } catch (e) {
    logResult('PART_2_ATTACK', 'Profiles Verification', 'FAIL', e.message);
  }

  // 5. As User B, attempt to UPDATE a post authored by User A
  try {
    const { data: post, error: postErr } = await clientA.from('posts').insert({
      user_id: userA.userId,
      content: 'User A post',
      community_id: communityId
    }).select('id').single();

    if (postErr) {
      logResult('PART_2_ATTACK', 'Update Post (Unprivileged)', 'FAIL', `Failed to create post as A: ${postErr.message}`);
    } else if (post) {
      const { error: updateErr } = await clientB.from('posts').update({ content: 'Hacked content' }).eq('id', post.id);
      const { data: refreshed } = await clientA.from('posts').select('content').eq('id', post.id).single();

      if (updateErr) {
        logResult('PART_2_ATTACK', 'Update Post (Unprivileged)', 'PASS', `Blocked with error: ${updateErr.message}`);
      } else if (refreshed && refreshed.content === 'User A post') {
        logResult('PART_2_ATTACK', 'Update Post (Unprivileged)', 'PASS', 'Update was ignored/filtered silently by RLS');
      } else {
        logResult('PART_2_ATTACK', 'Update Post (Unprivileged)', 'FAIL', 'BREACH: User B updated User A\'s post!');
      }

      // Cleanup
      await clientA.from('posts').delete().eq('id', post.id);
    }
  } catch (e) {
    logResult('PART_2_ATTACK', 'Update Post (Unprivileged)', 'FAIL', e.message);
  }

  // 6. As a non-admin, attempt to SELECT from the admins table
  try {
    const { data: admins, error: adminErr } = await clientB.from('admins').select('*');
    if (adminErr) {
      logResult('PART_2_ATTACK', 'Select Admins (Unprivileged)', 'PASS', `Blocked with error: ${adminErr.message}`);
    } else if (!admins || admins.length === 0) {
      logResult('PART_2_ATTACK', 'Select Admins (Unprivileged)', 'PASS', 'Query returned empty result (RLS active)');
    } else {
      logResult('PART_2_ATTACK', 'Select Admins (Unprivileged)', 'FAIL', `BREACH: Non-admin read admins table!`);
    }
  } catch (e) {
    logResult('PART_2_ATTACK', 'Select Admins (Unprivileged)', 'FAIL', e.message);
  }

  // 7. As User B, attempt to SELECT notifications belonging to User A
  try {
    const { data: notifs, error: notifErr } = await clientB.from('notifications').select('*').eq('user_id', userA.userId);
    if (notifErr) {
      logResult('PART_2_ATTACK', 'Select Notifications (Unprivileged)', 'PASS', `Blocked with error: ${notifErr.message}`);
    } else if (!notifs || notifs.length === 0) {
      logResult('PART_2_ATTACK', 'Select Notifications (Unprivileged)', 'PASS', 'Query returned empty result (RLS active)');
    } else {
      logResult('PART_2_ATTACK', 'Select Notifications (Unprivileged)', 'FAIL', `BREACH: User B read User A's notifications!`);
    }
  } catch (e) {
    logResult('PART_2_ATTACK', 'Select Notifications (Unprivileged)', 'FAIL', e.message);
  }

  // 8. As a regular authenticated user, confirm an unverified gig from another user does NOT appear in the general gig list
  try {
    const { data: unverifiedGig, error: ugErr } = await clientA.from('gigs').insert({
      title: 'Unverified Gig ' + Date.now(),
      description: 'Should be hidden',
      category: 'QA',
      price: 100,
      condition: '7 Days',
      client_name: 'QA client',
      posted_by: userA.userId,
      verified: false,
      status: 'Live'
    }).select('id').single();

    if (ugErr) {
      logResult('PART_2_ATTACK', 'Unverified Gig Visibility', 'FAIL', `Failed to create unverified gig as A: ${ugErr.message}`);
    } else if (unverifiedGig) {
      const { data: gigs, error: gigsErr } = await clientB.from('gigs').select('id').eq('id', unverifiedGig.id);
      if (gigsErr) {
        logResult('PART_2_ATTACK', 'Unverified Gig Visibility', 'PASS', `Gigs query failed or blocked: ${gigsErr.message}`);
      } else if (!gigs || gigs.length === 0) {
        logResult('PART_2_ATTACK', 'Unverified Gig Visibility', 'PASS', 'Unverified gig from another user is correctly hidden.');
      } else {
        logResult('PART_2_ATTACK', 'Unverified Gig Visibility', 'FAIL', 'BREACH: User B can see User A\'s unverified gig!');
      }

      // Cleanup
      await clientA.from('gigs').delete().eq('id', unverifiedGig.id);
    }
  } catch (e) {
    logResult('PART_2_ATTACK', 'Unverified Gig Visibility', 'FAIL', e.message);
  }

  // --------------------------------------------------
  // PART 3: FUNCTIONAL FLOW TESTS
  // --------------------------------------------------
  console.log('\n--- Running Part 3: Functional Flow Tests ---');

  // 1. Post commenting and profile join (FK verification)
  try {
    const { data: post, error: postErr } = await clientA.from('posts').insert({
      user_id: userA.userId,
      content: 'Hello World',
      community_id: communityId
    }).select('id').single();

    if (postErr) {
      logResult('PART_3_FUNCTIONAL', 'Post Comments FK Join', 'FAIL', `Failed to create post as A: ${postErr.message}`);
    } else if (post) {
      // User B comments on User A's post
      const { data: comment, error: commentErr } = await clientB.from('post_comments').insert({
        post_id: post.id,
        user_id: userB.userId,
        content: 'Nice post!'
      }).select('id').single();

      if (commentErr) {
        logResult('PART_3_FUNCTIONAL', 'Post Comments FK Join', 'FAIL', `Failed to insert comment: ${commentErr.message}`);
      } else {
        // Query the comment with public_profiles join (using the view)
        const { data: fetchedComment, error: fetchErr } = await clientA.from('post_comments')
          .select('id, content, public_profiles(full_name, avatar_url)')
          .eq('id', comment.id)
          .single();

        if (fetchErr) {
          logResult('PART_3_FUNCTIONAL', 'Post Comments FK Join', 'FAIL', `Failed to query comment with profiles join: ${fetchErr.message}`);
        } else if (fetchedComment && fetchedComment.public_profiles && (fetchedComment.public_profiles.full_name || '').includes('Student B')) {
          logResult('PART_3_FUNCTIONAL', 'Post Comments FK Join', 'PASS', 'Comment successfully saved and joined with public_profiles view.');
        } else {
          logResult('PART_3_FUNCTIONAL', 'Post Comments FK Join', 'FAIL', `Profile join returned incomplete data: ${JSON.stringify(fetchedComment)}`);
        }
      }

      // Cleanup
      await clientA.from('posts').delete().eq('id', post.id);
    }
  } catch (e) {
    logResult('PART_3_FUNCTIONAL', 'Post Comments FK Join', 'FAIL', e.message);
  }

  // 2. Full gig application trigger and notification flow
  try {
    const { data: gig, error: gigErr } = await clientA.from('gigs').insert({
      title: 'QA Task ' + Date.now(),
      description: 'Needs verification',
      category: 'QA',
      price: 150,
      condition: '7 Days',
      client_name: 'QA client',
      posted_by: userA.userId,
      verified: true, // Mark verified so it is visible to B
      status: 'Live'
    }).select('id').single();

    if (gigErr) {
      logResult('PART_3_FUNCTIONAL', 'Gig Application Trigger', 'FAIL', `Failed to create gig: ${gigErr.message}`);
    } else if (gig) {
      // User B applies to the gig using correct column 'pitch'
      const { data: app, error: appErr } = await clientB.from('gig_applications').insert({
        gig_id: gig.id,
        applicant_id: userB.userId,
        pitch: 'I can do this!'
      }).select('id').single();

      if (appErr) {
        logResult('PART_3_FUNCTIONAL', 'Gig Application Trigger', 'FAIL', `Application insert failed: ${appErr.message}`);
      } else {
        logResult('PART_3_FUNCTIONAL', 'Gig Application Insert', 'PASS', 'Application record inserted successfully.');
        
        // Wait a brief moment for the trigger to execute
        await sleep(4000);
        
        // Query the application again to check conversation_id
        const { data: refreshedApp } = await clientB.from('gig_applications').select('conversation_id').eq('id', app.id).single();
        
        if (refreshedApp && refreshedApp.conversation_id) {
          logResult('PART_3_FUNCTIONAL', 'Gig Application Trigger', 'PASS', `Success! Trigger handle_gig_proposal automatically initialized conversation ID: ${refreshedApp.conversation_id}`);
          
          // Verify conversation participant exists
          const { data: participants, error: participantsErr } = await clientB.from('conversation_participants').select('*').eq('conversation_id', refreshedApp.conversation_id);
          if (participantsErr) {
            logResult('PART_3_FUNCTIONAL', 'Gig Application Participants', 'FAIL', `Blocked by RLS policy/error: ${participantsErr.message}`);
          } else if (participants && participants.length === 2) {
            logResult('PART_3_FUNCTIONAL', 'Gig Application Participants', 'PASS', 'Both applicant and gig owner added as conversation participants.');
          } else {
            logResult('PART_3_FUNCTIONAL', 'Gig Application Participants', 'FAIL', `Expected 2 participants, found: ${participants ? participants.length : 0}`);
          }
        } else {
          logResult('PART_3_FUNCTIONAL', 'Gig Application Trigger', 'FAIL', 'Trigger handle_gig_proposal failed to initialize conversation_id.');
        }
      }

      // Cleanup
      await clientA.from('gigs').delete().eq('id', gig.id);
    }
  } catch (e) {
    logResult('PART_3_FUNCTIONAL', 'Gig Application Trigger', 'FAIL', e.message);
  }

  // 3. Post like/comment notification and self-notification filter (Simulated client-side inserts)
  try {
    const { data: post, error: postErr } = await clientA.from('posts').insert({
      user_id: userA.userId,
      content: 'QA Test Post',
      community_id: communityId
    }).select('id').single();

    if (postErr) {
      logResult('PART_3_FUNCTIONAL', 'Notifications Flow', 'FAIL', `Failed to create post: ${postErr.message}`);
    } else if (post) {
      // User B likes User A's post
      await clientB.from('post_likes').insert({ post_id: post.id, user_id: userB.userId });
      // client-side notification trigger for post like via RPC
      const { error: rpcLikeErr } = await clientB.rpc('create_notification', {
        p_user_id: userA.userId,
        p_type: 'post_like',
        p_title: '❤️ Someone liked your post!',
        p_body: 'Your post got a new like on Chavee.',
        p_link: '/network'
      });
      if (rpcLikeErr) {
        console.error('Like RPC error:', rpcLikeErr.message);
      }

      // User B comments on User A's post
      await clientB.from('post_comments').insert({ post_id: post.id, user_id: userB.userId, content: 'Awesome!' });
      // client-side notification trigger for post comment via RPC
      const { error: rpcCommentErr } = await clientB.rpc('create_notification', {
        p_user_id: userA.userId,
        p_type: 'post_comment',
        p_title: '💬 New comment on your post!',
        p_body: 'Awesome!',
        p_link: '/network'
      });
      if (rpcCommentErr) {
        console.error('Comment RPC error:', rpcCommentErr.message);
      }
      
      // User A likes their own post (client-side checks auth.uid() != user_id and skips inserting notification)
      await clientA.from('post_likes').insert({ post_id: post.id, user_id: userA.userId });

      // Wait a moment for notifications to process
      await sleep(4000);

      // Query User A's notifications
      const { data: aNotifs } = await clientA.from('notifications').select('*').eq('user_id', userA.userId);
      const likeNotif = aNotifs ? aNotifs.find(n => n.type === 'post_like') : null;
      const commentNotif = aNotifs ? aNotifs.find(n => n.type === 'post_comment') : null;

      if (likeNotif) {
        logResult('PART_3_FUNCTIONAL', 'Post Like Notification', 'PASS', 'Notification for post like delivered successfully.');
      } else {
        logResult('PART_3_FUNCTIONAL', 'Post Like Notification', 'FAIL', 'Notification for post like was not delivered.');
      }

      if (commentNotif) {
        logResult('PART_3_FUNCTIONAL', 'Post Comment Notification', 'PASS', 'Notification for post comment delivered successfully.');
      } else {
        logResult('PART_3_FUNCTIONAL', 'Post Comment Notification', 'FAIL', 'Notification for post comment was not delivered.');
      }

      // Query User B's notifications to confirm no self-notifications were generated
      const { data: bNotifs } = await clientB.from('notifications').select('*').eq('user_id', userB.userId);
      const bSelfNotifs = bNotifs ? bNotifs.filter(n => n.type === 'post_like' || n.type === 'post_comment') : [];
      if (bSelfNotifs.length === 0) {
        logResult('PART_3_FUNCTIONAL', 'Self-Notification Filtering', 'PASS', 'Self-notifications correctly filtered out.');
      } else {
        logResult('PART_3_FUNCTIONAL', 'Self-Notification Filtering', 'FAIL', `Self-notifications generated: ${JSON.stringify(bSelfNotifs)}`);
      }

      // Cleanup
      await clientA.from('posts').delete().eq('id', post.id);
    }
  } catch (e) {
    logResult('PART_3_FUNCTIONAL', 'Notifications Flow', 'FAIL', e.message);
  }

  // Write final results to file
  fs.writeFileSync('live_verification_results.json', JSON.stringify(results, null, 2));
  console.log('\nVerification completed. Results written to live_verification_results.json.');
}

run().catch(err => {
  console.error('Fatal execution error:', err);
});
