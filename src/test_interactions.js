import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const email = 'student_verifier_final@chavee.com';
    const password = 'TemporaryPassword123!';

    console.log('--- Step 1: Trying to Sign Up user ---');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Verifier Student',
                username: 'verifier_stu'
            }
        }
    });

    if (signUpError) {
        console.log('Signup error (could be rate limit or already exists):', signUpError.message);
    } else {
        console.log('Signup succeeded. User ID:', signUpData.user?.id);
    }

    console.log('--- Step 2: Logging in ---');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (authError) {
        console.error('Auth error:', authError);
        return;
    }

    const userId = authData.user.id;
    console.log('Logged in successfully. User ID:', userId);

    console.log('--- Step 3: Checking Profiles table ---');
    const { data: profile, error: pError } = await supabase.from('profiles').select('*').eq('id', userId).single();
    console.log('My Profile:', { profile, pError });

    console.log('--- Step 4: Testing Community Join insert ---');
    const communityId = '097e5827-da10-46bf-bc6c-35b97ef28011'; // Kerala Tech Hub
    const { data: joinData, error: joinError } = await supabase
        .from('community_members')
        .insert({
            community_id: communityId,
            user_id: userId
        })
        .select('*');

    console.log('Join Result:', { joinData, joinError });

    console.log('--- Step 5: Testing Follow insert ---');
    // Let's create another student if we can or check if we can insert a follow to ourself (or let's see if we can insert follow to a dummy profile. Since following_id has foreign key constraint, we can try to follow ourself to see if it allows it and satisfies constraint!)
    const { data: followData, error: followError } = await supabase
        .from('follows')
        .insert({
            follower_id: userId,
            following_id: userId // Follow ourself to guarantee following_id exists in profiles!
        })
        .select('*');

    console.log('Follow Result:', { followData, followError });

    console.log('--- Step 6: Verifying data in database ---');
    const { data: finalMembers } = await supabase.from('community_members').select('*').eq('user_id', userId);
    console.log('Active Community Memberships for user:', finalMembers);

    const { data: finalFollows } = await supabase.from('follows').select('*').eq('follower_id', userId);
    console.log('Active Follows for user:', finalFollows);
}

run();
