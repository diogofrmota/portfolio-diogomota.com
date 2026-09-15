const workoutDays = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);

export function normalizeFithubState(data) {
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const cleanText = (value, maxLength) => String(value || '').trim().slice(0, maxLength);
  const cleanDate = (value) => {
    const date = cleanText(value, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
    const parsed = new Date(`${date}T12:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : '';
  };
  const uniqueBy = (items, getKey) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = getKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const goals = uniqueBy(Array.isArray(source.goals) ? source.goals.slice(0, 100).map((goal) => ({
    id: cleanText(goal?.id, 80), label: cleanText(goal?.label, 80), detail: cleanText(goal?.detail, 120), icon: 'check',
  })).filter((goal) => goal.id && goal.label) : [], (goal) => goal.id);
  const goalIds = new Set(goals.map((goal) => goal.id));
  const activity = uniqueBy(Array.isArray(source.activity) ? source.activity.slice(-371).reverse().map((day) => ({
    date: cleanDate(day?.date), level: Math.max(0, Math.min(4, Number(day?.level) || 0)),
  })).filter((day) => day.date) : [], (day) => day.date).reverse();
  const workouts = uniqueBy(Array.isArray(source.workouts) ? source.workouts.slice(0, 100).map((workout) => ({
    id: cleanText(workout?.id, 80), day: cleanText(workout?.day, 20), title: cleanText(workout?.title, 80),
    exercises: Array.isArray(workout?.exercises) ? workout.exercises.slice(0, 30).map((item) => cleanText(item, 120)).filter(Boolean) : [],
    tone: ['lime', 'mint', 'forest'].includes(workout?.tone) ? workout.tone : 'lime',
  })).filter((workout) => workout.id && workoutDays.has(workout.day) && workout.title && workout.exercises.length) : [], (workout) => workout.id);
  // Keep historical IDs even when a goal is retired. Existing single-day data
  // migrates once; the explicit history format is authoritative thereafter.
  const historySource = Array.isArray(source.goalHistory) ? source.goalHistory :
    source.completedDate ? [{ date: source.completedDate, completed: source.completed }] : [];
  const goalHistory = uniqueBy(historySource.slice(-3660).reverse().map((day) => ({
    date: cleanDate(day?.date),
    completed: [...new Set(Array.isArray(day?.completed) ? day.completed.map((id) => cleanText(id, 80)).filter(Boolean).slice(0, 100) : [])],
  })).filter((day) => day.date), (day) => day.date).reverse();
  return {
    goalHistory,
    goals,
    completed: uniqueBy(Array.isArray(source.completed) ? source.completed.filter((id) => goalIds.has(id)).slice(0, 100) : [], (id) => id),
    completedDate: cleanDate(source.completedDate),
    activity,
    workouts,
  };
}

