/**
 * cleanup.js — Run this ONCE to remove all dev/test files from the project.
 * Usage: node cleanup.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

const ROOT_FILES_TO_DELETE = [
  'check_admins.js','check_all_tables_count.js','check_earn_file.js','check_gamification.js',
  'check_posted_by.js','create_admin_user.js','create_temp_user_and_gig.js','diagnose_post_insert.js',
  'find_kt_supabase.js','find_student_email.js','get_all_columns_db.js','get_gigs_openapi.js',
  'get_profile_by_id.js','get_profiles.js','get_schema.js','inspect_db.js','inspect_messaging.js',
  'probe_empty_cols.js','read_data.js','read_inserted_gigs.js','run_migrations.js',
  'test_admin_inserts.js','test_admin_login.js','test_anonymous_login_insert.js',
  'test_applications_join.js','test_auth_insert.js','test_community_conv.js','test_create_bucket.js',
  'test_cv_upload_flow.js','test_db_columns.js','test_events_columns.js',
  'test_events_insert_and_select.js','test_gig_insert.js','test_insert_with_posted_by.js',
  'test_login_existing.js','test_messages_join.js','test_phone_signup.js','test_post_creation.js',
  'test_student_login.js','test_student_real_login.js','test_upload_cv.js',
  'test_upload_cv_logged_in.js','verify_all_tables_data.js','verify_cv_permissions_test.mjs',
  'verify_events.js','verify_events_by_status.js','verify_events_with_auth.js',
  'verify_final_events.js','verify_new_columns.js','walkthrough.md','metadata.json',
  'build.gradle.kts','settings.gradle.kts','gradle.properties',
  // this script itself — uncomment if you want to self-delete after running:
  // 'cleanup.js',
];

const SRC_FILES_TO_DELETE = [
  'src/check_buckets.js','src/fetch_gigs_schema.js','src/probe_db.js',
  'src/probe_posts_columns.js','src/test_applications_columns.js','src/test_gigs_columns.js',
  'src/test_interactions.js','src/test_jobs_application_columns.js','src/test_posts_table.js',
  'src/test_storage.js','src/test_upload.js','src/task.md',
];

const DIRS_TO_DELETE = [
  'gradle',
  'src/scratch',
];

let deletedFiles = 0;
let skipped = 0;

// Delete root files
for (const f of ROOT_FILES_TO_DELETE) {
  const full = path.join(ROOT, f);
  try {
    if (fs.existsSync(full)) { fs.unlinkSync(full); deletedFiles++; console.log('  ✓ Deleted:', f); }
    else { skipped++; console.log('  - Not found:', f); }
  } catch (e) { console.log('  ✗ Error deleting', f, ':', e.message); }
}

// Delete src files
for (const f of SRC_FILES_TO_DELETE) {
  const full = path.join(ROOT, f);
  try {
    if (fs.existsSync(full)) { fs.unlinkSync(full); deletedFiles++; console.log('  ✓ Deleted:', f); }
    else { skipped++; console.log('  - Not found:', f); }
  } catch (e) { console.log('  ✗ Error deleting', f, ':', e.message); }
}

// Delete directories
function deleteDirRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) return false;
  fs.rmSync(dirPath, { recursive: true, force: true });
  return true;
}

for (const d of DIRS_TO_DELETE) {
  const full = path.join(ROOT, d);
  if (deleteDirRecursive(full)) {
    console.log('  ✓ Deleted dir:', d);
  } else {
    console.log('  - Dir not found:', d);
  }
}

console.log('\n✅ Cleanup complete!');
console.log('   Files deleted:', deletedFiles);
console.log('   Not found (OK):', skipped);
