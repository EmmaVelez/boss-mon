#!/usr/bin/env node
/**
 * Verifies that the production Vite build bundle contains expected game strings.
 * Run after `npm run build`. Checks the JS bundle for key identifiers that prove
 * the card data, components, and message handling actually landed in the output.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const BUILD_DIR = join(process.cwd(), 'build');
const EXPECTED_STRINGS = [
  // UI text
  'Boss Monster',
  'Phase:',
  'Game Over',
  'Draw Card',
  'Bot Play',
  // WebSocket message types (client sends + receives)
  'CREATE_ROOM',
  'JOIN_ROOM',
  'PLAY',
  'SET_NAME',
  'DRAW_CARD',
  'STATE',
  'SET_ID',
  'DRAWN',
  // Card rendering
  'rarity',
  'monsterName',
  'souls',
  'wounds',
];

function findJsBundle() {
  const files = readdirSync(join(BUILD_DIR, 'assets')).filter(f => f.endsWith('.js'));
  if (files.length === 0) throw new Error('No JS bundle found in build/assets/');
  return join(BUILD_DIR, 'assets', files[0]);
}

function main() {
  try {
    const bundlePath = findJsBundle();
    const content = readFileSync(bundlePath, 'utf-8');
    const missing = EXPECTED_STRINGS.filter(s => !content.includes(s));
    const found = EXPECTED_STRINGS.filter(s => content.includes(s));

    console.log(`Bundle: ${bundlePath}`);
    console.log(`Size: ${(statSync(bundlePath).size / 1024).toFixed(1)} KB`);
    console.log(`Checks: ${found.length}/${EXPECTED_STRINGS.length} passed`);

    if (missing.length > 0) {
      console.log(`MISSING: ${missing.join(', ')}`);
    }

    if (missing.length === 0) {
      console.log('✓ verify_build PASSED — all expected strings found in bundle');
      process.exit(0);
    } else {
      console.log('✗ verify_build FAILED — bundle is stale or missing content');
      process.exit(1);
    }
  } catch (e) {
    console.error('✗ verify_build FAILED:', e.message);
    process.exit(1);
  }
}

main();
