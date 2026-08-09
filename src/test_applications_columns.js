import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const cols = ['id', 'job_id', 'user_id', 'cv_url', 'availability', 'answers', 'status', 'created_at', 'applicant_id'];
    console.log('Testing job_applications columns individually:');
    for (const col of cols) {
        const { error } = await supabase.from('job_applications').select(col).limit(1);
        if (error) {
            console.log(`❌ Column ${col} failed:`, error.message);
        } else {
            console.log(`✅ Column ${col} is OK`);
        }
    }
}

run();
