import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const cols = ['id', 'title', 'client', 'location', 'budget', 'deadline', 'skills', 'desc', 'verified', 'verified_by', 'verified_at', 'created_at', 'status', 'user_id', 'created_by', 'posted_by'];
    console.log('Testing gigs columns individually:');
    for (const col of cols) {
        const { error } = await supabase.from('gigs').select(col).limit(1);
        if (error) {
            console.log(`❌ Column ${col} failed:`, error.message);
        } else {
            console.log(`✅ Column ${col} is OK`);
        }
    }
}

run();
