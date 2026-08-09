import dns from 'dns';

const hosts = [
  'google.com',
  'dtokistffdnycrzbmxcr.supabase.co',
  'db.dtokistffdnycrzbmxcr.supabase.co',
  'api.guerrillamail.com'
];

for (const host of hosts) {
  dns.lookup(host, (err, address, family) => {
    if (err) {
      console.log(`❌ ${host}: failed to resolve - ${err.message}`);
    } else {
      console.log(`✅ ${host}: resolved to ${address} (${family})`);
    }
  });
}
