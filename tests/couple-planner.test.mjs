import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCouplePlannerData as normalize, mergePlannerData as merge, plannerChanges, isValidDate } from '../lib/couple-planner-model.mjs';
const item = (id, title = id) => ({ id, title, detail: '', done: false });
const data = tasks => normalize({ tasks });
test('validates dates, duplicate IDs, and untrusted data', () => {
  assert.equal(isValidDate('2026-02-30'), false);
  assert.equal(isValidDate('2028-02-29'), true);
  const result = normalize({ tasks: [null, {}, item('a'), item('a'), { id: 'b', title: '  ', done: true }, { ...item('c'), done: 'false', date: 'bad' }] });
  assert.equal(result.tasks.length, 2);
  assert.equal(result.tasks[1].done, false);
  assert.equal(result.tasks[1].date, undefined);
});
test('concurrent additions from both partners survive', () => {
  assert.deepEqual(merge(data([]), data([item('mine')]), data([item('theirs')])).tasks.map(x => x.id), ['theirs', 'mine']);
});
test('editing one item preserves partner edits to another', () => {
  const base = data([item('a'), item('b')]);
  const result = merge(base, data([item('a', 'My edit'), item('b')]), data([item('a'), item('b', 'Partner edit')]));
  assert.deepEqual(result.tasks.map(x => x.title), ['My edit', 'Partner edit']);
});
test('conflicting edits and edit/delete conflicts never overwrite', () => {
  const base = data([item('a')]);
  assert.throws(() => merge(base, data([item('a', 'mine')]), data([item('a', 'theirs')])), /partner changed/);
  assert.throws(() => merge(base, data([]), data([item('a', 'theirs')])), /partner changed/);
  assert.throws(() => merge(base, data([item('a', 'mine')]), data([])), /partner changed/);
});
test('retry after an uncertain save is idempotent', () => {
  const base = data([item('a')]), next = data([item('a', 'edited')]);
  assert.deepEqual(merge(base, next, next), next);
  assert.deepEqual(merge(base, data([]), data([])), data([]));
});
test('partner deletions stay deleted when saving unrelated work', () => {
  assert.deepEqual(merge(data([item('a')]), data([item('a'), item('b')]), data([])).tasks, [item('b')]);
});
test('recipe notes preserve ingredients and line breaks', () => {
  const detail = 'Ingredients\n' + 'a'.repeat(1000);
  assert.equal(normalize({ recipes: [{ id: 'r', title: 'Dinner', detail }] }).recipes[0].detail, detail);
});

test('small change payloads still merge correctly with a large remote collection', () => {
  const base = data(Array.from({length: 200}, (_, i) => item(String(i))));
  const next = structuredClone(base); next.tasks[0].done = true;
  const delta = plannerChanges(base, next);
  assert.equal(delta.base.tasks.length, 1);
  assert.equal(delta.next.tasks.length, 1);
  const remote = structuredClone(base); remote.tasks[1].title = 'Partner edit';
  const result = merge(delta.base, delta.next, remote);
  assert.equal(result.tasks.length, 200);
  assert.equal(result.tasks[0].done, true);
  assert.equal(result.tasks[1].title, 'Partner edit');
});
test('section capacity is explicit rather than silently dropping an added item', () => {
  const base = data(Array.from({length: 1000}, (_, i) => item(String(i))));
  assert.throws(() => plannerChanges(base, {...base, tasks:[...base.tasks, item('overflow')]}), /section is full/);
});
