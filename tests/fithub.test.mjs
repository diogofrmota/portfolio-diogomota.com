import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFithubState as normalize } from '../lib/fithub-model.mjs';
const goals = [{ id: 'water', label: 'Drink 4 L of water' }, { id: 'steps', label: 'Walk 15,000 steps' }];
test('migrates legacy completion without dropping the original date', () => {
  const state = normalize({ goals, completedDate: '2026-09-14', completed: ['water'] });
  assert.deepEqual(state.goalHistory, [{ date: '2026-09-14', completed: ['water'] }]);
  assert.deepEqual(normalize(state), state);
});
test('completion and uncompletion remain independent across dates and JSON reloads', () => {
  const state = normalize({ goals, goalHistory: [{ date: '2026-09-14', completed: ['water', 'steps'] }, { date: '2026-09-15', completed: [] }] });
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(state))).goalHistory, state.goalHistory);
  assert.equal(state.goalHistory[0].completed.length, 2);
  assert.equal(state.goalHistory[1].completed.length, 0);
});
test('editing and removing a goal retain historical completions and gym/workout data', () => {
  const state = normalize({ goals, goalHistory: [{ date: '2026-09-14', completed: ['water'] }], activity: [{ date: '2026-09-14', level: 4 }], workouts: [{ id: 'gym', title: 'Leg day', day: 'Monday', exercises: ['Squats'] }] });
  state.goals[0].label = 'Drink water';
  assert.equal(normalize(state).goals[0].label, 'Drink water');
  state.goals = state.goals.filter(goal => goal.id !== 'water');
  const saved = normalize(state);
  assert.deepEqual(saved.goalHistory[0].completed, ['water']);
  assert.deepEqual(saved.activity, state.activity);
  assert.deepEqual(saved.workouts, state.workouts);
});
test('rejects impossible dates and deduplicates history, IDs, and invalid goals', () => {
  const state = normalize({ goals: [...goals, goals[0], { id: 'empty', label: '   ' }], goalHistory: [{ date: '2026-02-30', completed: ['water'] }, { date: '2026-09-15', completed: ['steps'] }, { date: '2026-09-15', completed: ['water', 'water', ''] }] });
  assert.equal(state.goals.length, 2);
  assert.deepEqual(state.goalHistory, [{ date: '2026-09-15', completed: ['water'] }]);
  assert.deepEqual(normalize(null).goalHistory, []);
});
test('explicit empty history is authoritative over legacy completion', () => {
  assert.deepEqual(normalize({ goals, completedDate: '2026-09-14', completed: ['water'], goalHistory: [] }).goalHistory, []);
});
