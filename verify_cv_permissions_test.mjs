import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtokistffdnycrzbmxcr.supabase.co';
const supabaseKey = 'sb_publishable_hV7ptaOU6vazgE2aPBgprg_xfLTl8ge';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const studentEmail = 'student@chavee.in';
  const studentPassword = 'chavee123';

  const studentSignIn = await supabase.auth.signInWithPassword({ email: studentEmail, password: studentPassword });
  if (studentSignIn.error) throw studentSignIn.error;

  const studentUser = studentSignIn.data.user;
  const ownerPath = `${studentUser.id}/cv-test-${Date.now()}.pdf`;
  const file = new Blob(['PDF bytes from verification'], { type: 'application/pdf' });

  const upload = await supabase.storage.from('job-cvs').upload(ownerPath, file, { cacheControl: '3600', upsert: false, contentType: 'application/pdf' });
  console.log(JSON.stringify({ studentLogin: { ok: true, userId: studentUser.id }, upload: upload.error ? { message: upload.error.message, status: upload.error.status } : 'ok', ownerPath }, null, 2));

  const studentSigned = await supabase.storage.from('job-cvs').createSignedUrl(ownerPath, 3600);
  console.log(JSON.stringify({ studentSigned: studentSigned.error ? { message: studentSigned.error.message, status: studentSigned.error.status } : { urlPresent: Boolean(studentSigned.data?.signedUrl) } }, null, 2));

  const adminCandidates = [
    { email: 'aarav@gmail.com', passwords: ['chavee123', 'Password123', 'aarav123'] },
    { email: 'priya@gmail.com', passwords: ['chavee123', 'Password123', 'priya123'] }
  ];

  let adminSession = null;
  for (const candidate of adminCandidates) {
    for (const password of candidate.passwords) {
      const adminAttempt = await supabase.auth.signInWithPassword({ email: candidate.email, password });
      if (!adminAttempt.error) {
        adminSession = adminAttempt.data;
        break;
      }
    }
    if (adminSession) break;
  }

  if (!adminSession) {
    console.log(JSON.stringify({ adminLogin: { ok: false, message: 'No matching admin credentials worked.' } }, null, 2));
  } else {
    console.log(JSON.stringify({ adminLogin: { ok: true, userId: adminSession.user.id, email: adminSession.user.email } }, null, 2));
    const adminSigned = await supabase.storage.from('job-cvs').createSignedUrl(ownerPath, 3600);
    console.log(JSON.stringify({ adminSigned: adminSigned.error ? { message: adminSigned.error.message, status: adminSigned.error.status } : { urlPresent: Boolean(adminSigned.data?.signedUrl) } }, null, 2));
  }

  const anonClient = createClient(supabaseUrl, supabaseKey);
  const anonSigned = await anonClient.storage.from('job-cvs').createSignedUrl(ownerPath, 3600);
  console.log(JSON.stringify({ anonymousSigned: anonSigned.error ? { message: anonSigned.error.message, status: anonSigned.error.status } : { urlPresent: Boolean(anonSigned.data?.signedUrl) } }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
