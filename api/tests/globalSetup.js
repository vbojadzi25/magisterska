/**
 * Jest globalSetup — runs once before all test suites, in its own process.
 *
 * Responsibilities:
 *  1. Create the denar_test database if it doesn't exist
 *  2. Sync Sequelize models → creates all tables (force: true)
 *  3. Seed the Banks table (tests need at least one bank to add accounts)
 *  4. Start the mock bank server (port 3001, SCA_MODE=auto)
 */

'use strict';

process.env.NODE_ENV = 'test';
process.env.PAYMENT_MODE = 'tpp';
process.env.TPP_BASE_URL = 'http://localhost:3001';

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { Client } = require('pg');

module.exports = async function globalSetup() {
  // ── 1. Create test database ──────────────────────────────────────────────
  const pgClient = new Client({
    user: process.env.DB_USER || 'denar_user',
    password: process.env.DB_PASSWORD || 'denar_password_2024',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'postgres',
  });

  await pgClient.connect();
  const exists = await pgClient.query(`SELECT 1 FROM pg_database WHERE datname = 'denar_test'`);
  if (exists.rowCount === 0) {
    await pgClient.query('CREATE DATABASE denar_test');
    console.log('  ✓ Created denar_test database');
  }
  await pgClient.end();

  // ── 2. Sync models (create all tables) ──────────────────────────────────
  const { sequelize, Bank } = require('../src/models');
  await sequelize.sync({ force: true });
  console.log('  ✓ Synced Sequelize models to denar_test');

  // ── 3. Seed Banks (tests need at least one bank record) ──────────────────
  await Bank.bulkCreate([
    {
      name: 'Sparkasse Bank AD Skopje',
      code: '200',
      swiftCode: 'KESKMK22',
      country: 'MK',
      isActive: true,
      supportsPSD2: true,
    },
    {
      name: 'Komercijalna Banka AD Skopje',
      code: '300',
      swiftCode: 'KOBSMK2X',
      country: 'MK',
      isActive: true,
      supportsPSD2: true,
    },
  ], { ignoreDuplicates: true });
  console.log('  ✓ Seeded 2 banks');

  await sequelize.close();

  // ── 4. Start mock bank server ────────────────────────────────────────────
  const mockBankEntry = path.resolve(__dirname, '../../mock-bank/index.js');
  const mockBank = spawn('node', [mockBankEntry], {
    env: {
      ...process.env,
      PORT: '3001',
      SCA_MODE: 'auto',
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Persist PID for globalTeardown
  const pidFile = path.join(__dirname, '.mock-bank.pid');
  fs.writeFileSync(pidFile, String(mockBank.pid));

  mockBank.stderr.on('data', d => {
    const msg = d.toString().trim();
    if (msg) process.stderr.write(`  [mock-bank] ${msg}\n`);
  });

  // Wait until health endpoint responds
  await waitForUrl('http://localhost:3001/health', 10000);
  console.log('  ✓ Mock bank running on :3001 (SCA_MODE=auto)\n');
};

function waitForUrl(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const attempt = () => {
      const req = http.get(url, res => {
        res.resume();
        if (res.statusCode === 200) return resolve();
        if (Date.now() < deadline) return setTimeout(attempt, 250);
        reject(new Error(`${url} not ready (last status ${res.statusCode})`));
      });
      req.setTimeout(500, () => req.destroy());
      req.on('error', () => {
        if (Date.now() < deadline) setTimeout(attempt, 250);
        else reject(new Error(`${url} not reachable after ${timeoutMs}ms`));
      });
    };
    attempt();
  });
}
