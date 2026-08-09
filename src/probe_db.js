import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const randomUuid = '99999999-9999-9999-9999-999999999999';
    const { data, error } = await supabase.from('profiles').insert({
        id: randomUuid,
        full_name: 'Test Profile',
        username: 'test_profile'
    });
    console.log('Profile insert result:', { data, error });
}

run();
