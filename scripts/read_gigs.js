import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env manually
const envPath = new URL('../.env', import.meta.url);
let envStr = '';
try { envStr = fs.readFileSync(envPath, 'utf8'); } catch (e) { console.error('.env not found', e.message); process.exit(1); }
const env = Object.fromEntries(envStr.split(/\r?\n/).filter(Boolean).map(line => line.split('=')).map(([k, ...v]) => [k.trim(), v.join('=').trim()]));

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { console.error('Missing SUPABASE_URL or ANON_KEY in .env'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
    try {
        const { data, error } = await supabase.from('gigs').select('*').order('created_at', { ascending: false }).limit(10);
        if (error) {
            console.error('Supabase error:', error);
            process.exit(1);
        }
        console.log('Gigs rows count:', (data || []).length);
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
})();
