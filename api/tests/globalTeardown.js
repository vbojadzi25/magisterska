'use strict';

const fs = require('fs');
const path = require('path');

module.exports = async function globalTeardown() {
  const pidFile = path.join(__dirname, '.mock-bank.pid');
  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));
    try {
      process.kill(pid, 'SIGTERM');
      console.log(`  ✓ Mock bank (pid ${pid}) stopped`);
    } catch {
      // Process may have already exited
    }
    fs.unlinkSync(pidFile);
  }
};
