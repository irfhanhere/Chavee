import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // Attempt to insert a post with feeling and image_url to see if columns exist
    const dummyUser = '00000000-0000-0000-0000-000000000000';
    const { data, error } = await supabase.from('posts').insert({
        content: 'Testing columns',
        user_id: dummyUser,
        image_url: 'https://example.com/test.jpg',
        feeling: 'feeling excited 🎉'
    });

    console.log('Insert response:', { data, error });
}

run();
