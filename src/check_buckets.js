import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('❌ Failed to list buckets:', error.message);
    } else {
        console.log('✅ Buckets list:', data.map(b => b.name));
    }
}

run();
