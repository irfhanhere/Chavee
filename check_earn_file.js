import fs from 'fs';

const content = fs.readFileSync('src/pages/Earn.jsx', 'utf8');
const lines = content.split('\n');

console.log('=== SEARCHING FOR SUBMIT HANDLER AND INSERT IN Earn.jsx ===');
lines.forEach((line, index) => {
  if (line.includes('handlePostGigSubmit') || line.includes('insert') || line.includes('gigs')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
