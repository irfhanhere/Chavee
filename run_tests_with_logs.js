import { spawn } from 'child_process';
import fs from 'fs';

console.log('Spawning run_live_verification.js in real time...');
const outStream = fs.createWriteStream('verification_stdout.txt');
const errStream = fs.createWriteStream('verification_stderr.txt');

const child = spawn('node', ['run_live_verification.js']);

child.stdout.on('data', (data) => {
  process.stdout.write(data);
  outStream.write(data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
  errStream.write(data);
});

child.on('close', (code) => {
  console.log(`run_live_verification.js process exited with code ${code}`);
  outStream.end();
  errStream.end();
});
