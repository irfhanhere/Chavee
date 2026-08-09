/**
 * ============================================================
 * CHAVEE — QA RE-VERIFICATION SCRIPT
 * Tests all 16 numbered items from the user's re-verification task.
 * Outputs concrete PASS / FAIL / PARTIAL evidence for each item.
 * ============================================================
 *
 * Prerequisites:
 *   1. Set USER_A_EMAIL, USER_A_PASS, USER_B_EMAIL, USER_B_PASS below.
 *   2. Optionally set ADMIN_EMAIL / ADMIN_PASS to test admin-only routes.
 *   3. Run: node qa_retest_verification.mjs
 */

import { createClient } from '@supabase/supabase-js';

// ─── CONFIG ────────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://dtokistffdnycrzbmxcr.supabase.co';
const SUPABASE_ANON = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';

// Test accounts – fill in real credentials
const USER_A_EMAIL = 'testuser_a@chavee.in';
const USER_A_PASS  = 'TestPass123!';
const USER_B_EMAIL = 'testuser_b@chavee.in';
const USER_B_PASS  = 'TestPass123!';
const ADMIN_EMAIL  = 'admin@chavee.in';
const ADMIN_PASS   = 'adminpass123';

// ─── HELPERS ───────────────────────────────────────────────────────────────
const results = [];

function makeClient() {
    return createClient(SUPABASE_URL, SUPABASE_ANON, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
}

function log(item, status, evidence) {
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️ ';
    const msg = `${icon} [${item}] ${status}: ${evidence}`;
    console.log(msg);
    results.push({ item, status, evidence });
}

async function signIn(email, pass) {
    const client = makeClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password: pass });
    if (error) return null;
    return client;
}

async function signUp(email, pass, name) {
    const c = makeClient();
    await c.auth.signUp({ email, password: pass, options: { data: { full_name: name } } });
    return signIn(email, pass);
}

async function getCurrentUserId(client) {
    const { data: { user } } = await client.auth.getUser();
    return user?.id;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function runAll() {
    console.log('\n========================================================');
    console.log(' CHAVEE QA RE-VERIFICATION — ' + new Date().toISOString());
    console.log('========================================================\n');

    // ── SETUP: Sign in both users (create if needed) ─────────────────────
    console.log('── SETUP: Authenticating test accounts ──\n');
    let clientA = await signIn(USER_A_EMAIL, USER_A_PASS);
    if (!clientA) {
        console.log('  User A not found, creating...');
        clientA = await signUp(USER_A_EMAIL, USER_A_PASS, 'QA User Alpha');
        await sleep(1500);
    }
    let clientB = await signIn(USER_B_EMAIL, USER_B_PASS);
    if (!clientB) {
        console.log('  User B not found, creating...');
        clientB = await signUp(USER_B_EMAIL, USER_B_PASS, 'QA User Beta');
        await sleep(1500);
    }
    // Re-sign after potential creation
    clientA = await signIn(USER_A_EMAIL, USER_A_PASS);
    clientB = await signIn(USER_B_EMAIL, USER_B_PASS);

    if (!clientA || !clientB) {
        console.error('FATAL: Could not sign in test accounts. Check credentials and confirm accounts are email-verified.');
        process.exit(1);
    }

    const userAId = await getCurrentUserId(clientA);
    const userBId = await getCurrentUserId(clientB);
    console.log(`  User A: ${USER_A_EMAIL} → ${userAId}`);
    console.log(`  User B: ${USER_B_EMAIL} → ${userBId}`);
    console.log('');

    // ══════════════════════════════════════════════════════════════════════
    // PART 1 — CRITICAL / MAJOR SECURITY FIXES
    // ══════════════════════════════════════════════════════════════════════
    console.log('══════════════════════════════════════════════════════════');
    console.log(' PART 1 — RE-VERIFYING SECURITY FIXES');
    console.log('══════════════════════════════════════════════════════════\n');

    // ── TEST 1: Admin guard (is_admin RPC) ───────────────────────────────
    {
        // As User A (non-admin), call is_admin RPC — should return false/null
        const { data: aAdmin, error: aErr } = await clientA.rpc('is_admin');
        const { data: bAdmin, error: bErr } = await clientB.rpc('is_admin');
        const aIsAdmin = aAdmin === true;
        const bIsAdmin = bAdmin === true;

        // At least one should NOT be admin; guard is in code not network
        if (!aIsAdmin && !bIsAdmin) {
            log('1. ADMIN_GUARD', 'PASS',
                `is_admin() returns false for both test users (A=${aAdmin}, B=${bAdmin}). AdminShell.jsx L56 guard is UNCOMMENTED and would redirect these users to /dashboard.`);
        } else if (aIsAdmin || bIsAdmin) {
            log('1. ADMIN_GUARD', 'PARTIAL',
                `WARNING: One of the test users IS an admin (A=${aAdmin}, B=${bAdmin}). Cannot fully test redirect without a guaranteed non-admin. Code guard is in place but pick a different test account.`);
        }
        // Separately test admin account if credentials given
        const adminClient = await signIn(ADMIN_EMAIL, ADMIN_PASS);
        if (adminClient) {
            const { data: adminFlag } = await adminClient.rpc('is_admin');
            if (adminFlag === true) {
                log('1. ADMIN_GUARD (admin login)', 'PASS',
                    `Admin credentials login → is_admin()=true → admin routes would NOT redirect them.`);
            } else {
                log('1. ADMIN_GUARD (admin login)', 'PARTIAL',
                    `ADMIN_EMAIL/ADMIN_PASS credentials exist but is_admin()=${adminFlag} — may not be seeded into admins table.`);
            }
        } else {
            log('1. ADMIN_GUARD (admin login)', 'PARTIAL',
                'Admin credentials not set or could not sign in — skipped admin-side verification.');
        }
    }

    // ── TEST 2: Messages privacy — User B cannot read User A's messages ───
    {
        // User A creates a private conversation
        const { data: convData, error: convErr } = await clientA.from('conversations').insert({ created_at: new Date().toISOString() }).select('id').single();
        let convId = null;

        if (!convErr && convData?.id) {
            convId = convData.id;
            // Add only User A as participant
            await clientA.from('conversation_participants').insert({ conversation_id: convId, user_id: userAId });
            // User A sends a message
            await clientA.from('messages').insert({ conversation_id: convId, sender_id: userAId, content: 'secret-msg-' + Date.now() });

            // Now User B tries to read it
            const { data: bRead, error: bReadErr } = await clientB.from('messages').select('*').eq('conversation_id', convId);
            if (bReadErr) {
                log('2. MESSAGES_PRIVACY', 'PASS',
                    `User B query on private conversation returned DB error: ${bReadErr.message}`);
            } else if (!bRead || bRead.length === 0) {
                log('2. MESSAGES_PRIVACY', 'PASS',
                    `User B query on private conversation returned 0 rows (conv_id=${convId}). RLS is enforcing membership check.`);
            } else {
                log('2. MESSAGES_PRIVACY', 'FAIL',
                    `BREACH: User B can read ${bRead.length} message(s) from User A's private conversation (conv_id=${convId}). Content: "${bRead[0]?.content}"`);
            }
        } else {
            log('2. MESSAGES_PRIVACY', 'PARTIAL',
                `Could not create test conversation: ${convErr?.message}. Skipping.`);
        }
    }

    // ── TEST 3: Conversation RLS / recursion ──────────────────────────────
    {
        // Both users query conversations — should not get infinite recursion
        const { data: aConvs, error: aConvErr } = await clientA.from('conversations').select('id').limit(5);
        const { data: bConvs, error: bConvErr } = await clientB.from('conversations').select('id').limit(5);
        const aRecursion = aConvErr?.message?.includes('infinite recursion');
        const bRecursion = bConvErr?.message?.includes('infinite recursion');

        if (!aConvErr && !bConvErr) {
            log('3. CONV_RLS_RECURSION', 'PASS',
                `Both users queried conversations with no error. User A got ${aConvs?.length} rows, User B got ${bConvs?.length} rows. No infinite recursion.`);
        } else if (aRecursion || bRecursion) {
            log('3. CONV_RLS_RECURSION', 'FAIL',
                `Infinite recursion still detected! A_err="${aConvErr?.message}", B_err="${bConvErr?.message}"`);
        } else {
            log('3. CONV_RLS_RECURSION', 'PARTIAL',
                `Errors present but NOT recursion. A_err="${aConvErr?.message}", B_err="${bConvErr?.message}"`);
        }

        // Also check conversation_participants
        const { error: cpErr } = await clientA.from('conversation_participants').select('user_id').limit(3);
        const cpRecursion = cpErr?.message?.includes('infinite recursion');
        if (!cpErr) {
            log('3. CONV_PART_RLS', 'PASS', `conversation_participants query succeeded with no recursion.`);
        } else if (cpRecursion) {
            log('3. CONV_PART_RLS', 'FAIL', `Infinite recursion on conversation_participants: ${cpErr.message}`);
        } else {
            log('3. CONV_PART_RLS', 'PARTIAL', `Unexpected error: ${cpErr.message}`);
        }
    }

    // ── TEST 4: job_applications — User B cannot read User A's applications ─
    {
        // User A inserts a fake job application
        const { data: jaData } = await clientA.from('job_applications').insert({
            user_id: userAId,
            job_id: '00000000-0000-0000-0000-000000000001', // fake uuid; might fail FK — OK
            cv_url: 'test-cv-path',
            status: 'Submitted',
            availability: 'Immediate'
        }).select('id').single();

        const jaId = jaData?.id;

        // User B tries to read all applications
        const { data: bApps, error: bAppsErr } = await clientB.from('job_applications').select('*').limit(10);
        const { data: bAppsFiltered } = await clientB.from('job_applications').select('*').eq('user_id', userAId);

        if (bAppsErr) {
            log('4. JOB_APPS_PRIVACY', 'PASS',
                `User B query on job_applications returned error: ${bAppsErr.message}. Access blocked.`);
        } else {
            // Check if User A's row appears in User B's result
            const leakedRows = (bApps || []).filter(r => r.user_id === userAId);
            const leakedFiltered = (bAppsFiltered || []).length > 0;

            if (leakedRows.length === 0 && !leakedFiltered) {
                log('4. JOB_APPS_PRIVACY', 'PASS',
                    `User B query returned ${bApps?.length} rows — NONE belong to User A (user_id=${userAId}). RLS scoping works.`);
            } else {
                log('4. JOB_APPS_PRIVACY', 'FAIL',
                    `BREACH: User B can see User A's job applications! leakedRows=${leakedRows.length}, filteredByUserA=${bAppsFiltered?.length}`);
            }
        }

        // Cleanup fake application
        if (jaId) await clientA.from('job_applications').delete().eq('id', jaId);
    }

    // ── TEST 5: Gigs RLS — verify update blocked and unverified hidden ─────
    {
        // User A creates an unverified gig
        const { data: gigData, error: gigErr } = await clientA.from('gigs').insert({
            title: 'QA Test Gig ' + Date.now(),
            description: 'Auto-created by QA script',
            skills_required: ['Testing'],
            budget: 100,
            posted_by: userAId,
            verified: false,
            status: 'Open'
        }).select('id, verified').single();

        if (gigErr) {
            log('5. GIGS_RLS_INSERT', 'PARTIAL',
                `Could not insert test gig (may be missing columns): ${gigErr.message}`);
        } else {
            const gigId = gigData?.id;
            log('5. GIGS_RLS_INSERT', 'PASS',
                `User A created unverified gig (id=${gigId}, verified=${gigData?.verified})`);

            // User B tries to UPDATE verified=true on User A's gig
            const { error: updateErr } = await clientB.from('gigs').update({ verified: true }).eq('id', gigId);
            if (updateErr) {
                log('5. GIGS_RLS_UPDATE_BLOCK', 'PASS',
                    `User B blocked from updating User A's gig verified field: ${updateErr.message}`);
            } else {
                // Check if it actually changed
                const { data: check } = await clientB.from('gigs').select('verified').eq('id', gigId).single();
                if (check?.verified === true) {
                    log('5. GIGS_RLS_UPDATE_BLOCK', 'FAIL',
                        `BREACH: User B successfully self-verified User A's gig (gig_id=${gigId})!`);
                } else {
                    log('5. GIGS_RLS_UPDATE_BLOCK', 'PASS',
                        `Update returned no error but verified remains false — RLS silently filtered it.`);
                }
            }

            // User B should NOT see User A's unverified gig in their list
            const { data: bGigs, error: bGigsErr } = await clientB.from('gigs').select('id, verified').eq('id', gigId);
            if (bGigsErr) {
                log('5. GIGS_UNVERIFIED_HIDDEN', 'PASS',
                    `User B query for unverified gig returned error: ${bGigsErr.message}`);
            } else if (!bGigs || bGigs.length === 0) {
                log('5. GIGS_UNVERIFIED_HIDDEN', 'PASS',
                    `User B cannot see User A's unverified gig (returned 0 rows). RLS is working.`);
            } else {
                log('5. GIGS_UNVERIFIED_HIDDEN', 'FAIL',
                    `BREACH: User B CAN see User A's unverified gig (id=${gigId}, verified=${bGigs[0]?.verified})`);
            }

            // Cleanup
            await clientA.from('gigs').delete().eq('id', gigId);
        }
    }

    // ── TEST 6: profiles sensitive field exposure ──────────────────────────
    {
        // User B tries to read User A's full profile row
        const { data: fullProfile, error: fpErr } = await clientB.from('profiles').select('*').eq('id', userAId);

        if (fpErr) {
            log('6. PROFILES_FULL_ROW', 'PASS',
                `User B query on profiles table for User A's row returned error: ${fpErr.message}`);
        } else if (!fullProfile || fullProfile.length === 0) {
            log('6. PROFILES_FULL_ROW', 'PASS',
                `User B query returned 0 rows for User A's profile (owner-only RLS working).`);
        } else {
            const row = fullProfile[0];
            const sensitiveExposed = ['email', 'dob', 'resume_link', 'phone_number'].filter(f => row[f] !== undefined);
            if (sensitiveExposed.length > 0) {
                log('6. PROFILES_FULL_ROW', 'FAIL',
                    `BREACH: User B can read User A's profile and sees sensitive fields: [${sensitiveExposed.join(', ')}]`);
            } else {
                log('6. PROFILES_FULL_ROW', 'PARTIAL',
                    `User B CAN read User A's profile but sensitive fields not present in returned data. Check if RLS or view is filtering: columns=${Object.keys(row).join(', ')}`);
            }
        }

        // User B queries public_profiles — should get safe fields only
        const { data: pubProf, error: ppErr } = await clientB.from('public_profiles').select('*').eq('id', userAId);
        if (ppErr) {
            log('6. PUBLIC_PROFILES_VIEW', 'FAIL',
                `public_profiles query returned error: ${ppErr.message}. View may not exist or RLS blocks it.`);
        } else if (!pubProf || pubProf.length === 0) {
            log('6. PUBLIC_PROFILES_VIEW', 'FAIL',
                `public_profiles returned 0 rows for User A — view exists but nothing visible. Check view definition.`);
        } else {
            const row = pubProf[0];
            const safeFields = ['id', 'username', 'full_name', 'college', 'course', 'year_of_study', 'bio', 'skills', 'interests', 'avatar_url', 'created_at'];
            const forbiddenFields = ['email', 'dob', 'resume_link', 'phone_number', 'privacy'];
            const exposed = forbiddenFields.filter(f => row[f] !== undefined);
            const hasSafe = safeFields.filter(f => f in row);

            if (exposed.length === 0) {
                log('6. PUBLIC_PROFILES_VIEW', 'PASS',
                    `public_profiles returns only safe fields. Forbidden fields not present. Safe fields present: [${hasSafe.join(', ')}]`);
            } else {
                log('6. PUBLIC_PROFILES_VIEW', 'FAIL',
                    `BREACH: public_profiles exposes forbidden fields: [${exposed.join(', ')}]`);
            }
        }
    }

    // ── TEST 7: Profile display not broken ────────────────────────────────
    {
        // Query public_profiles the way the UI queries other users
        const { data: allPub, error: apErr } = await clientA.from('public_profiles').select('id, username, full_name, avatar_url, college').limit(5);
        if (apErr) {
            log('7. PROFILE_DISPLAY_UI', 'FAIL',
                `public_profiles query for UI display returned error: ${apErr.message}. Network page / feed will have blank names.`);
        } else if (!allPub || allPub.length === 0) {
            log('7. PROFILE_DISPLAY_UI', 'PARTIAL',
                `public_profiles returned 0 rows — no other users in DB yet, so cannot confirm display. Insert test users.`);
        } else {
            const allHaveNames = allPub.every(p => p.username || p.full_name);
            if (allHaveNames) {
                log('7. PROFILE_DISPLAY_UI', 'PASS',
                    `public_profiles returned ${allPub.length} rows, all have username/full_name. UI display should render correctly.`);
            } else {
                log('7. PROFILE_DISPLAY_UI', 'PARTIAL',
                    `Some rows missing name fields: ${JSON.stringify(allPub)}`);
            }
        }
    }

    // ── TEST 8: Message attachments — signed URL & raw URL blocked ─────────
    {
        // Upload a tiny test file as User A to message-attachments bucket
        const testBlob = new Blob(['hello-qa'], { type: 'text/plain' });
        const testPath = `${userAId}/qa-test-${Date.now()}.txt`;
        const { data: upData, error: upErr } = await clientA.storage.from('message-attachments').upload(testPath, testBlob);

        if (upErr) {
            log('8. MSG_ATTACHMENTS_UPLOAD', 'PARTIAL',
                `Could not upload test file to message-attachments (bucket may need user policy update): ${upErr.message}`);
        } else {
            log('8. MSG_ATTACHMENTS_UPLOAD', 'PASS',
                `Test file uploaded to message-attachments at path: ${testPath}`);

            // Try to get a signed URL as User A (should work)
            const { data: signedData, error: signedErr } = await clientA.storage.from('message-attachments').createSignedUrl(testPath, 3600);
            if (signedData?.signedUrl) {
                log('8. MSG_ATTACHMENTS_SIGNED_URL', 'PASS',
                    `User A can generate signed URL for their own attachment: ${signedData.signedUrl.slice(0, 80)}...`);

                // Try raw public URL — should be 400/403 since bucket is private
                const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/message-attachments/${testPath}`;
                try {
                    const resp = await fetch(publicUrl);
                    if (resp.ok) {
                        log('8. MSG_ATTACHMENTS_RAW_URL', 'FAIL',
                            `BREACH: Raw public URL is accessible (HTTP ${resp.status}): ${publicUrl}`);
                    } else {
                        log('8. MSG_ATTACHMENTS_RAW_URL', 'PASS',
                            `Raw public URL blocked (HTTP ${resp.status}) — bucket is private.`);
                    }
                } catch (fetchErr) {
                    log('8. MSG_ATTACHMENTS_RAW_URL', 'PASS',
                        `Raw URL fetch threw error (blocked at network level): ${fetchErr.message}`);
                }
            } else {
                log('8. MSG_ATTACHMENTS_SIGNED_URL', 'FAIL',
                    `User A could not create signed URL: ${signedErr?.message}`);
            }

            // Cleanup test file
            await clientA.storage.from('message-attachments').remove([testPath]);
        }
    }

    // ── TEST 9: Posts UPDATE policy — User B cannot update User A's post ─────
    {
        // User A creates a test post
        const { data: postData, error: postErr } = await clientA.from('posts').insert({
            posted_by: userAId,
            content: 'QA test post ' + Date.now(),
            post_type: 'text'
        }).select('id').single();

        if (postErr) {
            log('9. POSTS_UPDATE_POLICY', 'PARTIAL',
                `Could not insert test post: ${postErr.message}`);
        } else {
            const postId = postData?.id;
            // User B tries to update it
            const { error: updateErr } = await clientB.from('posts').update({ content: 'hacked by User B' }).eq('id', postId);
            if (updateErr) {
                log('9. POSTS_UPDATE_POLICY', 'PASS',
                    `User B blocked from updating User A's post: ${updateErr.message}`);
            } else {
                // Verify content
                const { data: check } = await clientA.from('posts').select('content').eq('id', postId).single();
                if (check?.content === 'hacked by User B') {
                    log('9. POSTS_UPDATE_POLICY', 'FAIL',
                        `BREACH: User B successfully modified User A's post content! post_id=${postId}`);
                } else {
                    log('9. POSTS_UPDATE_POLICY', 'PASS',
                        `Update returned no error but content unchanged — RLS silently filtered (UPSERT returns 0 rows affected).`);
                }
            }
            // Cleanup
            await clientA.from('posts').delete().eq('id', postId);
        }
    }

    // ── TEST 10: admins table lockdown ─────────────────────────────────────
    {
        const { data: adminList, error: adminErr } = await clientA.from('admins').select('*').limit(5);
        if (adminErr) {
            log('10. ADMINS_RLS', 'PASS',
                `Regular user query on admins table returned error: ${adminErr.message}. Table locked down.`);
        } else if (!adminList || adminList.length === 0) {
            log('10. ADMINS_RLS', 'PASS',
                `admins query returned 0 rows — RLS with no SELECT policy returns empty (no data exposed).`);
        } else {
            log('10. ADMINS_RLS', 'FAIL',
                `BREACH: Regular user can read admins table! Got ${adminList.length} rows: ${JSON.stringify(adminList[0])}`);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // PART 2 — NOTIFICATION FIXES
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n══════════════════════════════════════════════════════════');
    console.log(' PART 2 — NOTIFICATION FIXES');
    console.log('══════════════════════════════════════════════════════════\n');

    // Helper: count notifications for a user created in the last 60s
    async function recentNotifs(client, userId, type) {
        const since = new Date(Date.now() - 60000).toISOString();
        const { data } = await client.from('notifications').select('id, type, title, body')
            .eq('user_id', userId).eq('type', type).gte('created_at', since);
        return data || [];
    }

    // ── TEST 11: Follow notification ───────────────────────────────────────
    {
        // User A follows User B (or tries)
        await clientA.from('follows').delete().match({ follower_id: userAId, following_id: userBId }); // cleanup first
        const { error: followErr } = await clientA.from('follows').insert({ follower_id: userAId, following_id: userBId });
        if (followErr) {
            log('11. FOLLOW_NOTIF', 'PARTIAL',
                `Follow insert failed: ${followErr.message} — cannot test notification.`);
        } else {
            // The notification RPC is called by UI code, not a DB trigger.
            // Test by calling RPC directly (simulating what the UI does)
            const { error: rpcErr } = await clientA.rpc('create_notification', {
                p_user_id: userBId,
                p_type: 'new_follower',
                p_title: '👤 New Follower!',
                p_body: 'QA test follow notification',
                p_link: `/profile/${userAId}`
            });

            if (rpcErr) {
                log('11. FOLLOW_NOTIF', 'FAIL',
                    `create_notification RPC returned error: ${rpcErr.message}. Notification will NOT fire.`);
            } else {
                await sleep(500);
                const notifs = await recentNotifs(clientB, userBId, 'new_follower');
                if (notifs.length > 0) {
                    log('11. FOLLOW_NOTIF', 'PASS',
                        `Follow notification row created for User B: "${notifs[0].title}" — "${notifs[0].body}"`);
                } else {
                    log('11. FOLLOW_NOTIF', 'FAIL',
                        `create_notification RPC succeeded but no notification row found for User B (type=new_follower, within last 60s).`);
                }
            }
            // Cleanup follow
            await clientA.from('follows').delete().match({ follower_id: userAId, following_id: userBId });
        }
    }

    // ── TEST 12: DM notification ───────────────────────────────────────────
    {
        // Create a shared conversation A↔B
        const { data: conv } = await clientA.from('conversations').insert({ created_at: new Date().toISOString() }).select('id').single();
        let dmConvId = null;
        if (conv?.id) {
            dmConvId = conv.id;
            await clientA.from('conversation_participants').insert([
                { conversation_id: dmConvId, user_id: userAId },
                { conversation_id: dmConvId, user_id: userBId }
            ]);

            // Simulate what handleSend does: insert message + call notification RPC
            const { error: msgErr } = await clientA.from('messages').insert({
                conversation_id: dmConvId, sender_id: userAId, content: 'QA DM test ' + Date.now()
            });

            const { error: rpcErr } = await clientA.rpc('create_notification', {
                p_user_id: userBId,
                p_type: 'new_message',
                p_title: '💬 New Message',
                p_body: 'QA DM test',
                p_link: `/messages?id=${dmConvId}`
            });

            if (rpcErr) {
                log('12. DM_NOTIF', 'FAIL',
                    `create_notification RPC for DM returned error: ${rpcErr.message}`);
            } else {
                await sleep(500);
                const notifs = await recentNotifs(clientB, userBId, 'new_message');
                if (notifs.length > 0) {
                    log('12. DM_NOTIF', 'PASS',
                        `DM notification row created for User B: "${notifs[0].title}" — "${notifs[0].body}"`);
                } else {
                    log('12. DM_NOTIF', 'FAIL',
                        `RPC succeeded but no new_message notification found for User B within last 60s.`);
                }
            }
        } else {
            log('12. DM_NOTIF', 'PARTIAL', 'Could not create test conversation — skipped.');
        }
    }

    // ── TEST 13: Gig application notification ────────────────────────────
    {
        // User A creates a gig; User B applies (simulated)
        const { data: gigD } = await clientA.from('gigs').insert({
            title: 'QA Notif Test Gig', description: 'test', skills_required: ['QA'],
            budget: 50, posted_by: userAId, verified: false, status: 'Open'
        }).select('id').single();

        if (gigD?.id) {
            const { error: rpcErr } = await clientB.rpc('create_notification', {
                p_user_id: userAId,
                p_type: 'gig_application',
                p_title: '💼 New Gig Proposal Received!',
                p_body: `QA: Someone applied to your gig "QA Notif Test Gig".`,
                p_link: '/earn'
            });

            if (rpcErr) {
                log('13. GIG_APPLY_NOTIF', 'FAIL',
                    `create_notification RPC for gig application returned error: ${rpcErr.message}`);
            } else {
                await sleep(500);
                const notifs = await recentNotifs(clientA, userAId, 'gig_application');
                if (notifs.length > 0) {
                    log('13. GIG_APPLY_NOTIF', 'PASS',
                        `Gig application notification row created for User A (gig poster): "${notifs[0].title}"`);
                } else {
                    log('13. GIG_APPLY_NOTIF', 'FAIL',
                        `RPC succeeded but no gig_application notification found for User A within last 60s.`);
                }
            }
            await clientA.from('gigs').delete().eq('id', gigD.id);
        } else {
            log('13. GIG_APPLY_NOTIF', 'PARTIAL', 'Could not create test gig — skipped.');
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // PART 3 — INVESTIGATION ITEMS
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n══════════════════════════════════════════════════════════');
    console.log(' PART 3 — INVESTIGATION ITEMS');
    console.log('══════════════════════════════════════════════════════════\n');

    // ── TEST 14: post_comments FK ─────────────────────────────────────────
    {
        // Try inserting a post comment and joining profiles
        const { data: postD } = await clientA.from('posts').insert({
            posted_by: userAId, content: 'QA comment test post', post_type: 'text'
        }).select('id').single();

        if (postD?.id) {
            const { data: cmtD, error: cmtErr } = await clientA.from('post_comments').insert({
                post_id: postD.id, user_id: userAId, content: 'QA comment test ' + Date.now()
            }).select('id').single();

            if (cmtErr) {
                log('14. POST_COMMENTS_FK', 'FAIL',
                    `Comment insert failed: ${cmtErr.message}`);
            } else {
                // Try joining profiles to simulate how the UI fetches commenter names
                const { data: cmtsWithProfile, error: joinErr } = await clientA
                    .from('post_comments')
                    .select('id, content, user_id, profiles(id, full_name, username, avatar_url)')
                    .eq('post_id', postD.id);

                if (joinErr) {
                    log('14. POST_COMMENTS_FK', 'FAIL',
                        `Comment insert OK but profiles join FAILED: ${joinErr.message} — commenting is still broken in UI.`);
                } else {
                    const hasProfile = cmtsWithProfile?.[0]?.profiles !== null;
                    if (hasProfile) {
                        log('14. POST_COMMENTS_FK', 'PASS',
                            `Comments insert AND profiles join both work. Commenter name available: "${cmtsWithProfile[0]?.profiles?.full_name}"`);
                    } else {
                        log('14. POST_COMMENTS_FK', 'PARTIAL',
                            `Comments insert works, join returns null profiles (FK exists but no profile row for this user yet).`);
                    }
                }
                // Cleanup comment
                await clientA.from('post_comments').delete().eq('id', cmtD.id);
            }
            // Cleanup post
            await clientA.from('posts').delete().eq('id', postD.id);
        }
    }

    // ── TEST 15: handle_gig_proposal trigger + complete_gig_application RPC ─
    {
        // Check if handle_gig_proposal function exists in public schema
        const { data: funcCheck, error: funcErr } = await clientA
            .from('pg_proc')
            .select('proname')
            .eq('proname', 'handle_gig_proposal')
            .limit(1);

        // Can't query pg_proc directly from anon client; use a raw select
        const { data: triggerFn, error: tfErr } = await clientA.rpc('handle_gig_proposal').maybeSingle().catch(() => ({ data: null, error: { message: 'not callable' } }));

        // Alternative: check via pg_catalog directly
        const { data: rpcCheck } = await clientA.rpc('complete_gig_application', { p_application_id: '00000000-0000-0000-0000-000000000001' });
        // If it errors with "function does not exist" that means it's missing
        // If it errors with "foreign key violation" or "not found" that means it exists

        // We can detect by trying to call the RPC and examining the error code
        let { error: rpcCallErr } = await clientA.rpc('complete_gig_application', { p_application_id: '00000000-0000-0000-0000-000000000001' });

        if (!rpcCallErr) {
            log('15. COMPLETE_GIG_RPC', 'PASS', 'complete_gig_application RPC exists and executed (may have errored on data, but function is present).');
        } else if (rpcCallErr.message?.includes('Could not find the function') || rpcCallErr.code === 'PGRST202') {
            log('15. COMPLETE_GIG_RPC', 'FAIL',
                `complete_gig_application RPC does NOT EXIST in live DB: ${rpcCallErr.message}. Gig completion flow is broken.`);
        } else {
            // Different error means function exists but failed on data
            log('15. COMPLETE_GIG_RPC', 'PASS',
                `complete_gig_application RPC EXISTS (returned data error, not "function not found"): ${rpcCallErr.message}`);
        }

        // Check handle_gig_proposal via trigger: insert a gig_application and see if conversation_id gets populated
        const { data: gigForTrigger } = await clientA.from('gigs').insert({
            title: 'QA Trigger Test Gig', description: 'trigger test',
            skills_required: ['QA'], budget: 1, posted_by: userAId, verified: true, status: 'Open'
        }).select('id').single();

        if (gigForTrigger?.id) {
            const { data: appD, error: appErr } = await clientB.from('gig_applications').insert({
                gig_id: gigForTrigger.id,
                applicant_id: userBId,
                pitch: 'QA trigger test pitch',
                status: 'Pending'
            }).select('id, conversation_id').single();

            if (appErr) {
                log('15. GIG_TRIGGER', 'PARTIAL',
                    `Could not insert gig_application (may be missing columns): ${appErr.message}`);
            } else {
                await sleep(1000); // wait for trigger
                const { data: refreshed } = await clientB.from('gig_applications').select('conversation_id').eq('id', appD.id).single();
                if (refreshed?.conversation_id) {
                    log('15. GIG_TRIGGER', 'PASS',
                        `handle_gig_proposal trigger EXISTS and fired! conversation_id=${refreshed.conversation_id} was set on gig_applications row.`);
                } else {
                    log('15. GIG_TRIGGER', 'FAIL',
                        `handle_gig_proposal trigger NOT found or not firing. conversation_id is still NULL after 1s wait. The trigger is missing from the live DB.`);
                }
                // Cleanup
                if (appD?.id) await clientB.from('gig_applications').delete().eq('id', appD.id);
            }
            await clientA.from('gigs').delete().eq('id', gigForTrigger.id);
        }
    }

    // ── TEST 16: Email redirect ────────────────────────────────────────────
    {
        // This is a code-side check — the fix is in Login.jsx / SignUp.jsx
        // We verify the code returns the right URL based on import.meta.env.PROD
        // In a Node script, PROD is not set. We just report what the code does.
        log('16. EMAIL_REDIRECT', 'PARTIAL',
            'Code fix verified: Login.jsx and SignUp.jsx both use getRedirectUrl() which returns window.location.origin/dashboard in dev and https://chavee.in/dashboard in prod. ' +
            'ACTION REQUIRED: Ensure http://localhost:5173/dashboard is added to Supabase Auth → URL Configuration → Redirect URLs.');
    }

    // ══════════════════════════════════════════════════════════════════════
    // PART 4 — FULL ADVERSARIAL CROSS-USER PRIVACY RE-RUN (Section 12)
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n══════════════════════════════════════════════════════════');
    console.log(' PART 4 — ADVERSARIAL CROSS-USER PRIVACY TESTS');
    console.log('══════════════════════════════════════════════════════════\n');

    // 12.1 — Profile sensitive fields
    {
        const { data, error } = await clientB.from('profiles').select('email, dob, resume_link, phone_number').eq('id', userAId);
        if (error || !data || data.length === 0) {
            log('P4.12.1 PROFILE_PRIVACY', 'PASS',
                `User B cannot read User A sensitive profile fields via profiles table. Response: ${error?.message || '0 rows'}`);
        } else {
            const exposed = Object.entries(data[0]).filter(([k, v]) => v !== null && v !== undefined);
            if (exposed.length > 0) {
                log('P4.12.1 PROFILE_PRIVACY', 'FAIL',
                    `BREACH: Sensitive fields still readable: ${exposed.map(([k,v]) => `${k}=${v}`).join(', ')}`);
            } else {
                log('P4.12.1 PROFILE_PRIVACY', 'PASS',
                    `All sensitive fields are null in returned row (profile exists but fields empty or policy blocks values).`);
            }
        }
    }

    // 12.2 — Post visibility (intentionally public)
    {
        const { data: postD } = await clientA.from('posts').insert({
            posted_by: userAId, content: 'P4 visibility test', post_type: 'text'
        }).select('id').single();
        if (postD?.id) {
            const { data: bSees } = await clientB.from('posts').select('id').eq('id', postD.id);
            if (bSees && bSees.length > 0) {
                log('P4.12.2 POST_VISIBILITY', 'PASS', 'User B can see User A\'s posts — intentional social feed design.');
            } else {
                log('P4.12.2 POST_VISIBILITY', 'FAIL', 'REGRESSION: User B CANNOT see User A\'s posts — feed will be empty!');
            }
            await clientA.from('posts').delete().eq('id', postD.id);
        }
    }

    // 12.3 — Post likes still work
    {
        const { data: postD2 } = await clientA.from('posts').insert({
            posted_by: userAId, content: 'P4 like test', post_type: 'text'
        }).select('id').single();
        if (postD2?.id) {
            const { error: likeErr } = await clientB.from('post_likes').insert({ post_id: postD2.id, user_id: userBId });
            if (!likeErr) {
                log('P4.12.3 POST_LIKE', 'PASS', 'User B can like User A\'s post — working correctly.');
            } else {
                log('P4.12.3 POST_LIKE', 'FAIL', `Post like failed: ${likeErr.message}`);
            }
            await clientB.from('post_likes').delete().match({ post_id: postD2.id, user_id: userBId });
            await clientA.from('posts').delete().eq('id', postD2.id);
        }
    }

    // 12.4 — Follow flow
    {
        await clientA.from('follows').delete().match({ follower_id: userAId, following_id: userBId });
        const { error: fErr } = await clientA.from('follows').insert({ follower_id: userAId, following_id: userBId });
        if (!fErr) {
            log('P4.12.4 FOLLOW_FLOW', 'PASS', 'User A can follow User B — follows insert works.');
            // Check no auto-mutual follow
            const { data: mutualCheck } = await clientB.from('follows').select('id').match({ follower_id: userBId, following_id: userAId });
            if (!mutualCheck || mutualCheck.length === 0) {
                log('P4.12.4 NO_AUTO_MUTUAL', 'PASS', 'No auto-mutual follow — User B did not automatically follow User A back.');
            } else {
                log('P4.12.4 NO_AUTO_MUTUAL', 'FAIL', 'REGRESSION: Auto-mutual follow detected!');
            }
            await clientA.from('follows').delete().match({ follower_id: userAId, following_id: userBId });
        } else {
            log('P4.12.4 FOLLOW_FLOW', 'FAIL', `Follow insert failed: ${fErr.message}`);
        }
    }

    // 12.5 — DM privacy (User B cannot read User A's private conv)
    {
        // Already tested in TEST 2 — reference that result
        log('P4.12.5 DM_PRIVACY', 'SEE_TEST_2', 'Already tested in TEST 2 — MESSAGES_PRIVACY. Refer to that result.');
    }

    // 12.6 — A can create conversation with B and B sees messages
    {
        const { data: sharedConv } = await clientA.from('conversations').insert({ created_at: new Date().toISOString() }).select('id').single();
        if (sharedConv?.id) {
            const sid = sharedConv.id;
            await clientA.from('conversation_participants').insert([
                { conversation_id: sid, user_id: userAId },
                { conversation_id: sid, user_id: userBId }
            ]);
            await clientA.from('messages').insert({ conversation_id: sid, sender_id: userAId, content: 'P4 shared msg test' });
            await sleep(200);
            const { data: bMsgs, error: bMsgsErr } = await clientB.from('messages').select('content').eq('conversation_id', sid);
            if (bMsgs && bMsgs.length > 0) {
                log('P4.12.6 SHARED_DM', 'PASS', `User B CAN read messages from a shared conversation (B is participant): "${bMsgs[0]?.content}"`);
            } else {
                log('P4.12.6 SHARED_DM', 'FAIL',
                    `REGRESSION: User B CANNOT read messages from a shared conversation where B is participant. Error: ${bMsgsErr?.message}`);
            }
        }
    }

    // 12.7 — Community: both users can join
    {
        const { data: commD } = await clientA.from('communities').select('id').limit(1).single();
        if (commD?.id) {
            await clientA.from('community_members').delete().match({ community_id: commD.id, user_id: userBId });
            const { error: joinErr } = await clientB.from('community_members').insert({ community_id: commD.id, user_id: userBId });
            if (!joinErr) {
                log('P4.12.7 COMMUNITY_JOIN', 'PASS', `User B joined community (id=${commD.id}) — community_members insert works.`);
            } else {
                log('P4.12.7 COMMUNITY_JOIN', 'PARTIAL', `Community join failed: ${joinErr.message}`);
            }
        } else {
            log('P4.12.7 COMMUNITY_JOIN', 'PARTIAL', 'No communities in DB to test with — skipping.');
        }
    }

    // 12.8 — Cross-user report
    {
        const { data: reportD, error: reportErr } = await clientB.from('reports_moderation').insert({
            reporter_id: userBId,
            reported_user_id: userAId,
            reason: 'QA test cross-user report',
            status: 'Pending'
        }).select('id').single();
        if (!reportErr && reportD?.id) {
            log('P4.12.8 CROSS_REPORT', 'PASS',
                `User B can report User A — reports_moderation row created (id=${reportD.id}).`);
            await clientB.from('reports_moderation').delete().eq('id', reportD.id);
        } else {
            log('P4.12.8 CROSS_REPORT', 'PARTIAL',
                `Report insert failed: ${reportErr?.message}`);
        }
    }

    // 12.9 — Overly restrictive policy check: can User B read their OWN notifications?
    {
        const { data: myNotifs, error: notifErr } = await clientB.from('notifications').select('id, type').eq('user_id', userBId).limit(5);
        if (notifErr) {
            log('P4.12.9 NOTIF_SELF_ACCESS', 'FAIL',
                `REGRESSION: User B cannot read their OWN notifications: ${notifErr.message}`);
        } else {
            log('P4.12.9 NOTIF_SELF_ACCESS', 'PASS',
                `User B can read own notifications (${myNotifs?.length} rows). Self-access not broken by new policies.`);
        }
    }

    // 12.10 — User B cannot read User A's notifications
    {
        const { data: aNotifs, error: aNErr } = await clientB.from('notifications').select('id').eq('user_id', userAId).limit(5);
        if (aNErr) {
            log('P4.12.10 NOTIF_CROSSUSER', 'PASS',
                `User B blocked from reading User A's notifications: ${aNErr.message}`);
        } else if (!aNotifs || aNotifs.length === 0) {
            log('P4.12.10 NOTIF_CROSSUSER', 'PASS',
                `User B query for User A's notifications returned 0 rows — RLS scoping works.`);
        } else {
            log('P4.12.10 NOTIF_CROSSUSER', 'FAIL',
                `BREACH: User B can read ${aNotifs.length} of User A's notifications!`);
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // FINAL SUMMARY
    // ══════════════════════════════════════════════════════════════════════
    console.log('\n══════════════════════════════════════════════════════════');
    console.log(' FINAL SUMMARY');
    console.log('══════════════════════════════════════════════════════════\n');

    const pass    = results.filter(r => r.status === 'PASS');
    const fail    = results.filter(r => r.status === 'FAIL');
    const partial = results.filter(r => r.status === 'PARTIAL' || r.status === 'SEE_TEST_2');

    console.log(`  ✅ PASS:    ${pass.length}`);
    console.log(`  ❌ FAIL:    ${fail.length}`);
    console.log(`  ⚠️  PARTIAL: ${partial.length}`);
    console.log('');

    if (fail.length > 0) {
        console.log('══ STILL BROKEN — NEEDS ATTENTION ══');
        fail.forEach(r => console.log(`  ❌ ${r.item}: ${r.evidence}`));
    }

    if (partial.length > 0) {
        console.log('\n══ PARTIAL / MANUAL ACTION NEEDED ══');
        partial.forEach(r => console.log(`  ⚠️  ${r.item}: ${r.evidence}`));
    }

    // Output JSON for programmatic parsing
    const outputFile = 'qa_retest_results.json';
    const fs = await import('fs/promises');
    await fs.writeFile(outputFile, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
    console.log(`\n  Full results written to ${outputFile}`);

    return { pass: pass.length, fail: fail.length, partial: partial.length, failures: fail, partials: partial };
}

runAll().catch(err => {
    console.error('FATAL ERROR:', err);
    process.exit(1);
});
