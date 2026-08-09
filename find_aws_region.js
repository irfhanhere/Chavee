async function run() {
  try {
    const res = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json');
    const json = await res.json();
    console.log('Total IPv6 prefixes:', json.ipv6_prefixes.length);
    
    // Find prefixes matching 2406:da12
    const matches = json.ipv6_prefixes.filter(p => p.ipv6_prefix.includes('2406:da12'));
    console.log('Matches:', JSON.stringify(matches, null, 2));
  } catch (err) {
    console.error('Failed:', err);
  }
}

run();
