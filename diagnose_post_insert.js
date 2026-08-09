import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env
const envStr = fs.readFileSync('./.env', 'utf8');
const env = Object.fromEntries(
  envStr.split(/\r?\n/).filter(l => l && !l.startsWith('#')).map(line => {
    const idx = line.indexOf('=');
    return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
  })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

async function run() {
  console.log('====================================================');
  console.log('  Post Insert Diagnostic — Dashboard handleCreatePost');
  console.log('====================================================\n');

  // Step 1: Sign in as real student
  console.log('Step 1: Signing in as student@chavee.in ...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'student@chavee.in',
    password: 'chavee123',
  });

  if (authErr) {
    console.error('LOGIN FAILED:', authErr.message);
    process.exit(1);
  }
  const user = authData.user;
  console.log('Logged in. User ID:', user.id, '\n');

  // Step 2: Verify profile row exists
  console.log('Step 2: Checking profiles row ...');
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .eq('id', user.id)
    .single();

  if (profileErr) {
    console.warn('Profile fetch warning:', profileErr.message);
  } else {
    console.log('Profile found:', profile.full_name || profile.username, '\n');
  }

  // Step 3: Replicate EXACT insert from handleCreatePost
  console.log('Step 3: Inserting post with EXACT payload from Dashboard.jsx handleCreatePost ...');
  console.log('  Payload: { content, user_id, image_url: null, feeling: null }\n');

  const { data: post, error: postErr } = await supabase
    .from('posts')
    .insert({
      content: '[Diagnostic test post — safe to delete]',
      user_id: user.id,
      image_url: null,
      feeling: null,
    })
    .select('id, content, created_at, is_featured, user_id, image_url, feeling, community_id')
    .single();

  if (postErr) {
    console.error('INSERT FAILED');
    console.error('  message :', postErr.message);
    console.error('  code    :', postErr.code);
    console.error('  details :', postErr.details || 'N/A');
    console.error('  hint    :', postErr.hint || 'N/A');

    console.log('\n── Root Cause Analysis ──');
    if (/row-level security|rls|policy/i.test(postErr.message)) {
      console.log('RLS policy is blocking the insert. The INSERT policy on `posts` must allow auth.uid() = user_id.');
    } else if (/not.null|null value/i.test(postErr.message)) {
      console.log('A NOT NULL column is missing from the payload.');
    } else if (/foreign key|violates/i.test(postErr.message)) {
      console.log('Foreign key violation — user_id or community_id references a missing row.');
    } else if (/column.*does not exist/i.test(postErr.message)) {
      console.log('A column in the payload does not exist on the posts table.');
    } else {
      console.log('Unknown error — see message/code/details above.');
    }
  } else {
    console.log('INSERT SUCCEEDED!');
    console.log('  Post ID    :', post.id);
    console.log('  community_id:', post.community_id);
    console.log('  user_id    :', post.user_id);

    // Clean up
    await supabase.from('posts').delete().eq('id', post.id);
    console.log('Test row cleaned up.');
  }
}

run().catch(err => {
  console.error('Script crashed:', err);
  process.exit(1);
});
