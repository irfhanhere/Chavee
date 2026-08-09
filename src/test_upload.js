import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Testing upload to event-images without logging in:');
    const { data: d1, error: e1 } = await supabase.storage
        .from('event-images')
        .upload(`test_${Date.now()}.txt`, Buffer.from('test'), { contentType: 'text/plain' });
    console.log('event-images:', { d1, e1 });

    console.log('Testing upload to post-images without logging in:');
    const { data: d2, error: e2 } = await supabase.storage
        .from('post-images')
        .upload(`test_${Date.now()}.txt`, Buffer.from('test'), { contentType: 'text/plain' });
    console.log('post-images:', { d2, e2 });
}

run();
