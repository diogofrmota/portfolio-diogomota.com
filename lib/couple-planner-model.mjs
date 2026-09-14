export const plannerSections = ['calendar', 'tasks', 'dates', 'trips', 'recipes', 'entertainment'];

export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function normalizeCouplePlannerData(data) {
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  return Object.fromEntries(plannerSections.map((section) => {
    const seenIds = new Set();
    const items = Array.isArray(source[section]) ? source[section].slice(0, 1000).flatMap((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
      const id = text(item.id, 100);
      const title = text(item.title, 80);
      if (!id || !title || seenIds.has(id)) return [];
      seenIds.add(id);
      return [{
        id,
        title,
        detail: text(item.detail, 6000),
        ...(isValidDate(item.date) ? { date: item.date } : {}),
        ...(text(item.tag, 30) ? { tag: text(item.tag, 30) } : {}),
        ...(section === 'calendar' ? { color: /^#[0-9a-f]{6}$/i.test(item.color) ? item.color : '#e63b2e' } : {}),
        ...(section === 'tasks' ? { done: item.done === true } : {}),
      }];
    }) : [];
    return [section, items];
  }));
}

// Send only changed items, so a large recipe collection does not enlarge every save.
export function plannerChanges(base, next) {
  const before = normalizeCouplePlannerData(base);
  const after = normalizeCouplePlannerData(next);
  const changes = { base: {}, next: {} };
  for (const section of plannerSections) {
    if (next[section]?.length > 1000) throw new Error('This section is full. Remove an item before adding another.');
    const old = new Map(before[section].map(item => [item.id, item]));
    const current = new Map(after[section].map(item => [item.id, item]));
    const changed = new Set([...old.keys(), ...current.keys()].filter(id => JSON.stringify(old.get(id)) !== JSON.stringify(current.get(id))));
    changes.base[section] = before[section].filter(item => changed.has(item.id));
    changes.next[section] = after[section].filter(item => changed.has(item.id));
  }
  return changes;
}

// Merge only locally changed items. Never replace a partner's unrelated work.
export function mergePlannerData(base, next, remote) {
  const result = normalizeCouplePlannerData(remote);
  for (const section of plannerSections) {
    const before = new Map(base[section].map(item => [item.id, item]));
    const after = new Map(next[section].map(item => [item.id, item]));
    const current = new Map(result[section].map(item => [item.id, item]));
    for (const id of new Set([...before.keys(), ...after.keys()])) {
      const old = before.get(id), change = after.get(id), latest = current.get(id);
      const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      if (equal(old, change)) continue;
      if (!equal(old, latest) && !equal(change, latest)) {
        throw new Error('Your partner changed the same item. Download your changes, then load the latest plans and try again.');
      }
      if (change) current.set(id, change);
      else current.delete(id);
    }
    if (current.size > 1000) throw new Error('This section is full. Remove an item before adding another.');
    result[section] = [...current.values()];
  }
  return result;
}
