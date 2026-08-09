import fs from 'fs';
try {
  const content = fs.readFileSync('dev.log', 'utf-16le');
  fs.writeFileSync('dev_utf8.log', content, 'utf-8');
  console.log(content);
} catch (e) {
  console.error(e);
}
