import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (file.endsWith('.kt') || file.endsWith('.java') || file.endsWith('.xml') || file.endsWith('.properties')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = walk('app');
console.log(`Found ${files.length} source files in app/`);
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('supabase') || content.includes('Chavee') || content.includes('akshay') || content.includes('@')) {
    console.log(`- ${f}`);
    const lines = content.split('\n');
    lines.forEach((l, idx) => {
      if (l.includes('email') || l.includes('password') || l.includes('supabase') || l.includes('key')) {
        console.log(`  ${idx+1}: ${l.trim()}`);
      }
    });
  }
});
