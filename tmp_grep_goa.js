import fs from 'fs';

const content = fs.readFileSync('src/pages/admin/AdminDashboard.jsx', 'utf-8');
const lines = content.split('\n');

let out = 'Matches for Goa/Workshop/Workation/Hackathon/Staycation in AdminDashboard.jsx:\n';
lines.forEach((line, idx) => {
  if (line.includes('Goa') || line.includes('Workshop') || line.includes('Hackathon') || line.includes('Staycation')) {
    out += `${idx + 1}: ${line.trim()}\n`;
  }
});

fs.writeFileSync('tmp_grep_goa_matches.txt', out);
console.log('Matches written to tmp_grep_goa_matches.txt');
