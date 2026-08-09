import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dtokistffdnycrzbmxcr.supabase.co',
  'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge'
);

const queries = {
  events: 'id, title, description, host_name, location, event_date, price, seats_total, status, image_url',
  courses: 'id, title, type, level, instructor_name, schedule, price, status',
  scholarships: 'id, name, description, eligibility, apply_url, featured_month',
  communities: 'id, name, category, description, guidelines, is_paid, price',
  jobs: 'id, title, company, job_type, description, apply_url, status',
  gigs: 'id, title, client_name, location, budget, deadline, skills, description, verified, verified_by, verified_at, status'
};

async function run() {
  console.log('Testing column select statements on all tables...');
  for (const [table, query] of Object.entries(queries)) {
    const { error, data } = await supabase.from(table).select(query).limit(1);
    if (error) {
      console.log(`❌ Table ${table} select failed:`, error.message);
      // Let's print individual columns that fail by testing one-by-one
      const cols = query.split(',').map(s => s.trim());
      for (const col of cols) {
        const { error: colErr } = await supabase.from(table).select(col).limit(1);
        if (colErr) {
          console.log(`  - Column ${col} failed:`, colErr.message);
        } else {
          console.log(`  - Column ${col} OK`);
        }
      }
    } else {
      console.log(`✅ Table ${table} select succeeded! Columns in query are all valid.`);
    }
  }
}
run();
