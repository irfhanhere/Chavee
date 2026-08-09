import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local to get supabase credentials
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        if (parts[0].trim() === 'VITE_SUPABASE_URL') supabaseUrl = parts.slice(1).join('=').trim();
        if (parts[0].trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = parts.slice(1).join('=').trim();
    }
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    let output = '';
    
    try {
        output += '--- feature_flags ---\n';
        const { data: ff } = await supabase.from('feature_flags').select('*').limit(1);
        output += JSON.stringify(ff, null, 2) + '\n';
    } catch(e) { output += 'Error feature_flags: ' + e.message + '\n'; }
    
    try {
        output += '--- admin_activity_logs ---\n';
        const { data: al } = await supabase.from('admin_activity_logs').select('*').limit(1);
        output += JSON.stringify(al, null, 2) + '\n';
    } catch(e) { output += 'Error admin_activity_logs: ' + e.message + '\n'; }
    
    try {
        output += '--- get_admin_dashboard_stats() ---\n';
        const { data: stats } = await supabase.rpc('get_admin_dashboard_stats');
        output += JSON.stringify(stats, null, 2) + '\n';
    } catch(e) { output += 'Error get_admin_dashboard_stats: ' + e.message + '\n'; }
    
    try {
        output += '--- admin_get_users() ---\n';
        const { data: users } = await supabase.rpc('admin_get_users');
        output += JSON.stringify(users?.[0] || 'No users returned or RPC missing', null, 2) + '\n';
    } catch(e) { output += 'Error admin_get_users: ' + e.message + '\n'; }
    
    try {
        output += '--- pending_community_requests ---\n';
        const { data: cr } = await supabase.from('community_requests').select('*').limit(1);
        output += JSON.stringify(cr, null, 2) + '\n';
    } catch(e) { output += 'Error community_requests: ' + e.message + '\n'; }

    fs.writeFileSync('schema_info.txt', output);
}

run();
