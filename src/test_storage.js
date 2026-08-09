import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Listing storage buckets:');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    console.log('Buckets:', buckets, 'Error:', error);
}

run();
