import { execSync } from 'child_process';

// Simple subnet matcher for IPv6
function ip6ToBigInt(ip) {
  const parts = ip.split('::');
  let left = parts[0] ? parts[0].split(':') : [];
  let right = parts[1] ? parts[1].split(':') : [];
  
  while (left.length + right.length < 8) {
    left.push('0');
  }
  
  const hexGroups = [...left, ...right].map(g => g.padStart(4, '0'));
  return BigInt('0x' + hexGroups.join(''));
}

function matchIp6(ip, cidr) {
  const [prefix, maskStr] = cidr.split('/');
  const mask = parseInt(maskStr, 10);
  
  const ipVal = ip6ToBigInt(ip);
  const prefixVal = ip6ToBigInt(prefix);
  
  const shift = 128n - BigInt(mask);
  return (ipVal >> shift) === (prefixVal >> shift);
}

async function run() {
  try {
    const res = await fetch('https://ip-ranges.amazonaws.com/ip-ranges.json');
    const json = await res.json();
    
    const dbIp = '2406:da12:1f1:f802:426b:12e4:76ee:5739';
    const match = json.ipv6_prefixes.find(p => matchIp6(dbIp, p.ipv6_prefix));
    
    console.log('Exact Match:', JSON.stringify(match, null, 2));
  } catch (err) {
    console.error('Failed:', err);
  }
}

run();
