import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

const tables = {
  courses: ['id', 'title', 'lang', 'flag', 'level', 'tutor', 'badge', 'status', 'created_at', 'category'],
  scholarships: ['id', 'name', 'desc', 'eligibility', 'incomeLimit', 'income_limit', 'applyUrl', 'apply_url', 'status', 'created_at'],
  jobs: ['id', 'title', 'company', 'location', 'type', 'compensation', 'duration', 'skills', 'logo', 'desc', 'status', 'created_at'],
  gigs: ['id', 'title', 'client', 'location', 'budget', 'deadline', 'skills', 'desc', 'verified', 'verified_by', 'verified_at', 'created_at', 'status'],
  communities: ['id', 'name', 'category', 'description', 'guidelines', 'is_paid', 'price', 'status', 'created_at'],
  events: ['id', 'title', 'type', 'price', 'date', 'emoji', 'location', 'speaker', 'desc', 'seats', 'registered', 'status', 'created_at', 'speaker_bio', 'highlights', 'schedule']
};

async function inspectAll() {
  console.log('=== Database Schema Audit ===');
  for (const [table, columns] of Object.entries(tables)) {
    console.log(`\n--- Inspecting Table: ${table} ---`);
    
    // Check if table exists
    const { error: countErr, count } = await supabase.from(table).select('id', { count: 'exact', head: true });
    if (countErr) {
      console.log(`❌ Table '${table}' does not exist or failed: ${countErr.message}`);
      continue;
    }
    console.log(`✅ Table '${table}' exists! Row count: ${count}`);

    for (const col of columns) {
      const { error } = await supabase.from(table).select(col).limit(1);
      if (error) {
        console.log(`  ❌ Column '${col}': failed - ${error.message}`);
      } else {
        console.log(`  ✅ Column '${col}': exists`);
      }
    }
  }
}

inspectAll();
