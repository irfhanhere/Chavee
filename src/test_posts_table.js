import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const cols = ['id', 'content', 'created_at', 'is_featured', 'user_id', 'community_id', 'image_url', 'feeling'];
    console.log('Testing posts columns individually:');
    for (const col of cols) {
        const { error } = await supabase.from('posts').select(col).limit(1);
        if (error) {
            console.log(`❌ Column ${col} failed:`, error.message);
        } else {
            console.log(`✅ Column ${col} is OK`);
        }
    }
}

run();
