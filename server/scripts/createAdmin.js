#!/usr/bin/env node
/**
 * Creates a single administrator account. Intended to be run ONCE, manually,
 * from a trusted terminal (your own machine or a deployment shell) — never
 * exposed as an HTTP endpoint, since self-registration as admin is
 * deliberately disallowed everywhere else in this system.
 *
 * Usage (interactive):
 *   node scripts/createAdmin.js
 *
 * Usage (non-interactive, e.g. scripted/CI setup):
 *   printf "Full Name\nemail@example.com\nPassword123!\n" | node scripts/createAdmin.js
 *
 * You will be prompted for a name, email, and password. The password is
 * validated against the same strong-password rule used for every other
 * account (min 8 chars, at least one letter, one number, one symbol).
 *
 * Note on input handling: this reads all three answers as a stream of lines
 * (via readline's async iterator) rather than issuing three separate
 * rl.question() calls. Chaining multiple sequential question() calls is
 * unreliable when stdin is piped rather than a real interactive terminal —
 * the second and later calls can hang indefinitely waiting on input that has
 * already been buffered. Reading line-by-line works correctly in both piped
 * and interactive contexts.
 */
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { passwordSchema } = require('../src/validators/authValidators');
const config = require('../src/config/env');
const { query, initDatabase } = require('../src/config/database');

async function collectAnswers() {
  const isInteractive = !!process.stdin.isTTY;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

  const prompts = ['Full name: ', 'Email: ', 'Password (min 8 chars, 1 letter, 1 number, 1 symbol): '];
  const answers = [];
  let i = 0;

  if (isInteractive) process.stdout.write(prompts[0]);

  for await (const line of rl) {
    answers.push(line.trim());
    i++;
    if (i >= prompts.length) break;
    if (isInteractive) process.stdout.write(prompts[i]);
  }
  rl.close();

  return { name: answers[0] || '', email: answers[1] || '', password: answers[2] || '' };
}

async function main() {
  await initDatabase();

  console.log('--- Create administrator account ---\n');
  const { name, email: emailRaw, password } = await collectAnswers();
  const email = emailRaw.toLowerCase();

  if (!name || name.length < 2) {
    console.error('\nError: name must be at least 2 characters.');
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('\nError: that does not look like a valid email address.');
    process.exit(1);
  }
  const passwordCheck = passwordSchema.safeParse(password);
  if (!passwordCheck.success) {
    console.error('\nError: ' + passwordCheck.error.issues.map((issue) => issue.message).join('; '));
    process.exit(1);
  }

  const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.length > 0) {
    console.error(`\nError: an account with email ${email} already exists.`);
    process.exit(1);
  }

  const passwordHash = bcrypt.hashSync(password, config.bcryptRounds);
  const { rows } = await query(
    'INSERT INTO users (name, email, password, role, phone) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [name, email, passwordHash, 'admin', null]
  );

  console.log(`\nAdministrator account created (id ${rows[0].id}). You can now log in with:`);
  console.log(`  Email: ${email}`);
  console.log('  Password: (as entered)');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nFailed to create administrator account:', err.message);
  process.exit(1);
});
