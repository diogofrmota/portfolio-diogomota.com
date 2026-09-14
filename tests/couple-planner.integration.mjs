// Opt-in database regression: node --experimental-default-type=module tests/couple-planner.integration.mjs
// Creates isolated temporary accounts and removes only those accounts in finally.
import assert from 'node:assert/strict';
import nextEnv from '@next/env';
import { randomUUID } from 'node:crypto';
import { getDatabase } from '../lib/database.js';
import { getCouplePlannerWorkspace as workspace, createCoupleWorkspaceInvite as invite, joinCoupleWorkspace as join, saveCoupleWorkspaceData as save, readCoupleWorkspaceData as read } from '../lib/couple-planner.js';
import { normalizeCouplePlannerData as normalize } from '../lib/couple-planner-model.mjs';
nextEnv.loadEnvConfig(process.cwd());
const run = randomUUID();
const users = Array.from({length: 5}, (_, i) => ({id: `planner-integration:${run}:${i}`, name: 'Planner regression test', email: `planner-${run}-${i}@example.invalid`}));
const sql = getDatabase();
try {
  const spaces = await Promise.all(users.map(workspace));
  const repeated = await Promise.all([workspace(users[0]), workspace(users[0])]);
  assert.equal(repeated[0].id, spaces[0].id); assert.equal(repeated[1].id, spaces[0].id);
  await assert.rejects(() => read(users[1], spaces[0].id), /no longer have access/);
  await assert.rejects(() => save(users[1], spaces[0].id, normalize({}), normalize({})), /no longer have access/);
  const first = await invite(users[0]);
  const replacement = await invite(users[0]);
  await assert.rejects(() => join(users[1], first.code), /invalid or expired/);
  const results = await Promise.allSettled([join(users[1], replacement.code), join(users[2], replacement.code)]);
  assert.equal(results.filter(x => x.status === 'fulfilled').length, 1);
  const partner = results[0].status === 'fulfilled' ? users[1] : users[2];
  const outsider = results[0].status === 'fulfilled' ? users[2] : users[1];
  assert.equal((await workspace(users[0])).memberCount, 2);
  await assert.rejects(() => invite(partner), /Only the workspace owner/);
  await assert.rejects(() => invite(users[0]), /already has two members/);
  await assert.rejects(() => join(outsider, replacement.code), /invalid or expired/);
  const base = normalize({});
  const left = normalize({tasks:[{id:'left', title:'Buy groceries'}]});
  const right = normalize({tasks:[{id:'right', title:'Book dinner'}]});
  await Promise.all([save(users[0], spaces[0].id, left, base), save(partner, spaces[0].id, right, base)]);
  const both = normalize(await read(partner, spaces[0].id));
  assert.equal(both.tasks.length, 2);
  const changed = structuredClone(both); changed.tasks[0].title = 'Changed by owner';
  await save(users[0], spaces[0].id, changed, both);
  const conflict = structuredClone(both); conflict.tasks[0].title = 'Changed by partner';
  await assert.rejects(() => save(partner, spaces[0].id, conflict, both), /partner changed/);
  assert.equal((await read(partner, spaces[0].id)).tasks[0].title, 'Changed by owner');
  const otherInvite = await invite(users[3]);
  await assert.rejects(() => join(partner, otherInvite.code), /already connected/);
  const lastInvite = await invite(users[4]);
  const doubleJoin = await Promise.allSettled([join(outsider, otherInvite.code), join(outsider, lastInvite.code)]);
  assert.equal(doubleJoin.filter(x => x.status === 'fulfilled').length, 1);
  const memberships = await sql`select count(*)::integer as count from couple_planner_members where user_id = ${outsider.id}`;
  assert.equal(memberships[0].count, 1);
  console.log('PASS: ownership, access isolation, invite replacement/single-use, concurrent joins, member limit, concurrent saves, conflict protection.');
} finally {
  for (const user of users) await sql`delete from app_users where user_id = ${user.id}`;
  console.log('Temporary database test accounts removed.');
}
