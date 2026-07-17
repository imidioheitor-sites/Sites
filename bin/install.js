#!/usr/bin/env node
/**
 * Installer for the bundled Claude Code skills.
 *
 * Copies every skill under `.claude/skills/` (shipped with this package) into a
 * Claude Code skills directory so the skills become available to Claude Code.
 *
 * Usage:
 *   npx @heitorimidio/sites-skills              install into the user dir (~/.claude/skills)
 *   npx @heitorimidio/sites-skills --project    install into ./.claude/skills (current repo)
 *   npx @heitorimidio/sites-skills --list       list the bundled skills and exit
 *   npx @heitorimidio/sites-skills --force       overwrite skills that already exist
 *   npx @heitorimidio/sites-skills --help        show this help
 *
 * The user skills directory honors the CLAUDE_CONFIG_DIR env var, falling back
 * to ~/.claude. No external dependencies; Node >= 16.7 (uses fs.cpSync).
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const args = process.argv.slice(2);
const has = (...flags) => flags.some((f) => args.includes(f));

if (has('-h', '--help')) {
  process.stdout.write(
    [
      'Install the bundled Claude Code skills.',
      '',
      'Usage:',
      '  npx @heitorimidio/sites-skills [options]',
      '',
      'Options:',
      '  --project    Install into ./.claude/skills (the current project)',
      '  --user       Install into ~/.claude/skills (default)',
      '  --list       List the bundled skills and exit',
      '  --force      Overwrite skills that already exist at the target',
      '  --help       Show this help',
      '',
    ].join('\n')
  );
  process.exit(0);
}

// Skills bundled with this package live at <packageRoot>/.claude/skills.
const packageRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(packageRoot, '.claude', 'skills');

if (!fs.existsSync(sourceDir)) {
  console.error('No bundled skills found at ' + sourceDir);
  process.exit(1);
}

const skills = fs
  .readdirSync(sourceDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(sourceDir, d.name, 'SKILL.md')))
  .map((d) => d.name)
  .sort();

if (has('--list')) {
  console.log('Bundled skills (' + skills.length + '):');
  for (const s of skills) console.log('  - ' + s);
  process.exit(0);
}

function userSkillsDir() {
  const cfg = process.env.CLAUDE_CONFIG_DIR;
  const base = cfg && cfg.trim() ? cfg : path.join(os.homedir(), '.claude');
  return path.join(base, 'skills');
}

const targetDir = has('--project')
  ? path.join(process.cwd(), '.claude', 'skills')
  : userSkillsDir();

const force = has('--force');

fs.mkdirSync(targetDir, { recursive: true });

let installed = 0;
let skipped = 0;

for (const name of skills) {
  const src = path.join(sourceDir, name);
  const dest = path.join(targetDir, name);
  if (fs.existsSync(dest) && !force) {
    console.log('  skip   ' + name + '  (already exists; use --force to overwrite)');
    skipped++;
    continue;
  }
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log('  install ' + name);
  installed++;
}

console.log('');
console.log(
  'Done. ' + installed + ' installed, ' + skipped + ' skipped -> ' + targetDir
);
if (installed > 0) {
  console.log('Restart Claude Code (or start a new session) to pick up the new skills.');
}
