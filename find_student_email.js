import fs from 'fs';
import readline from 'readline';

async function run() {
  const filePath = 'C:/Users/Lenovo/.gemini/antigravity-ide/brain/cc05c767-d3af-4444-9293-126734a73b11/.system_generated/logs/transcript.jsonl';
  console.log('Searching in:', filePath);
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('e4f84d9b-35d8-464e-ba69-103fd20b513a')) {
      console.log('Found:', line);
    }
  }
}

run();
