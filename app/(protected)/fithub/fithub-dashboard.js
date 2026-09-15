'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { saveFithubState } from './actions';
import { normalizeFithubState } from '../../../lib/fithub-model.mjs';
import styles from './fithub.module.css';

const dayNames = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const workoutDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function Icon({ name, size = 20 }) {
  const paths = {
    dumbbell: <><path d="M6 7v10M3.5 9v6M18 7v10M20.5 9v6M6 12h12" /><path d="M2 10v4M22 10v4" /></>,
    run: <><circle cx="14.5" cy="4.5" r="2" /><path d="m12 9 3-1 2.5 2.5M8 21l3-5 2-4 4 3 1 4M6 13l3-4 3 1" /></>,
    water: <path d="M12 3S6.5 9.2 6.5 14a5.5 5.5 0 0 0 11 0C17.5 9.2 12 3 12 3Z" />,
    supplement: <><path d="M8.5 5.5a4.24 4.24 0 0 1 6 6l-4 4a4.24 4.24 0 0 1-6-6l4-4Z" /><path d="m8 12 4 4" /></>,
    flame: <path d="M12 22c4.4 0 7-3.1 7-7.1 0-3.3-2-6.1-5.2-9.4.1 2.5-1.5 4.2-2.7 4.9.1-3.6-1.8-6-3.1-7.4.1 3.7-3 5.9-3 10.8C5 18.5 7.8 22 12 22Z" />,
    check: <path d="m5 12 4.3 4.3L19 6.7" />,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };

  return (
    <svg className={styles.icon} aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function buildActivity(today) {
  const end = new Date(`${today}T12:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - 364 - ((end.getUTCDay() + 6) % 7));

  return Array.from({ length: 371 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const dateKey = date.toISOString().slice(0, 10);
    return { date: dateKey, level: 0 };
  });
}

function mergeActivity(savedActivity, today) {
  const levels = new Map(Array.isArray(savedActivity) ? savedActivity.map((day) => [day.date, day.level]) : []);
  return buildActivity(today).map((day) => ({ ...day, level: Math.max(0, Math.min(4, Number(levels.get(day.date)) || 0)) }));
}

function calculateStreaks(activity, today) {
  const visits = new Set(activity.filter((day) => day.level > 0).map((day) => day.date));
  const ordered = [...visits].sort();
  let best = 0;
  let run = 0;
  let previous = null;
  for (const date of ordered) {
    const current = new Date(`${date}T12:00:00Z`);
    const consecutive = previous && (current - previous) / 86400000 === 1;
    run = consecutive ? run + 1 : 1;
    best = Math.max(best, run);
    previous = current;
  }
  const cursor = new Date(`${today}T12:00:00Z`);
  let current = 0;
  if (!visits.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (visits.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return { current, best };
}

function getNextWorkout(workouts, today) {
  const todayIndex = new Date(`${today}T12:00:00Z`).getUTCDay();
  const next = workouts
    .map((workout, index) => {
      const dayIndex = workoutDays.indexOf(workout.day);
      return { workout, index, distance: dayIndex < 0 ? 8 : (dayIndex - todayIndex + 7) % 7 };
    })
    .sort((a, b) => a.distance - b.distance || a.index - b.index)[0];

  if (!next || next.distance > 7) return null;
  const timing = next.distance === 0 ? 'Today' : next.distance === 1 ? 'Tomorrow' : next.workout.day;
  return { ...next.workout, timing };
}

function ActivityGrid({ activity, today, visitCount }) {
  const weeks = useMemo(() => {
    const grouped = [];
    for (let index = 0; index < activity.length; index += 7) grouped.push(activity.slice(index, index + 7));
    return grouped;
  }, [activity]);

  const months = useMemo(() => {
    const labels = [];
    let previous = -1;
    weeks.forEach((week, index) => {
      const month = new Date(`${week[0].date}T12:00:00Z`).getUTCMonth();
      if (month !== previous && index < weeks.length - 2) {
        labels.push({ index, label: new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(`${week[0].date}T12:00:00Z`)) });
        previous = month;
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className={styles.chartScroll} tabIndex={0} role="region" aria-label={`${visitCount} gym ${visitCount === 1 ? 'visit' : 'visits'} logged over the last year`}>
      <div className={styles.chart}>
        <div className={styles.months} aria-hidden="true">
          {months.map((month) => <span key={`${month.label}-${month.index}`} style={{ gridColumnStart: month.index + 1 }}>{month.label}</span>)}
        </div>
        <div className={styles.chartBody}>
          <div className={styles.dayLabels} aria-hidden="true">
            {dayNames.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
          </div>
          <div className={styles.weeks}>
            {weeks.map((week) => (
              <div className={styles.week} key={week[0].date}>
                {week.map((day) => (
                  <span
                    className={`${styles.activityDay} ${styles[`level${day.level}`]} ${day.date === today ? styles.today : ''}`}
                    key={day.date}
                    role="img" aria-label={`${day.date}: ${day.level ? 'gym visit logged' : 'no gym visit'}`} title={`${day.date}: ${day.level ? 'gym visit logged' : 'no gym visit'}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HabitGrid({ today, history, selectedDate, onSelect }) {
  const days = useMemo(() => buildActivity(today).filter((day) => day.date <= today), [today]);
  const scroll = useRef(null);
  useEffect(() => { if (scroll.current) scroll.current.scrollLeft = scroll.current.scrollWidth; }, []);
  const counts = new Map(history.map((day) => [day.date, day.completed.length]));
  return <><div className={styles.habitRange}><span>{days[0].date}</span><span>{today}</span></div><div ref={scroll} className={styles.habitScroll} tabIndex={0} role="region" aria-label="Daily goal completion calendar, scroll horizontally for more dates">
    <div className={styles.habitGrid}>{days.map(({ date }) => {
      const count = counts.get(date) ?? 0;
      return <button key={date} data-date={date} tabIndex={date === (days.some(day => day.date === selectedDate) ? selectedDate : today) ? 0 : -1} onKeyDown={(event) => {
        const offset = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }[event.key];
        if (!offset) return;
        event.preventDefault();
        const index = days.findIndex(day => day.date === date);
        const target = days[Math.max(0, Math.min(days.length - 1, index + offset))];
        scroll.current?.querySelector(`[data-date="${target.date}"]`)?.focus();
      }} type="button" className={`${styles.habitDay} ${styles[`level${Math.min(4, count)}`]}`} aria-label={`${date}: ${count} completed ${count === 1 ? 'goal' : 'goals'}. Review this day`} aria-pressed={date === selectedDate} title={`${date}: ${count} completed goals`} onClick={() => onSelect(date)}>{count || '·'}</button>;
    })}</div>
  </div></>;
}

export default function FithubDashboard({ today, initialState = {} }) {
  const [goals, setGoals] = useState(() => initialState.goals ?? []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [goalHistory, setGoalHistory] = useState(() => normalizeFithubState(initialState).goalHistory);
  const completed = goalHistory.find((day) => day.date === selectedDate)?.completed ?? [];
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalError, setGoalError] = useState('');
  const [activity, setActivity] = useState(() => mergeActivity(initialState.activity, today));
  const [workouts, setWorkouts] = useState(() => initialState.workouts ?? []);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [syncState, setSyncState] = useState('saved');
  const [saveAttempt, setSaveAttempt] = useState(0);
  const [deletedItem, setDeletedItem] = useState(null);
  const lastQueuedState = useRef(null);
  const dirty = useRef(false);
  const saveQueue = useRef(Promise.resolve());
  const saveRevision = useRef(0);
  const goalInputRef = useRef(null);
  const workoutTitleRef = useRef(null);

  useEffect(() => {
    const nextState = { goals, goalHistory, activity, workouts };
    const serialized = JSON.stringify(nextState);
    if (lastQueuedState.current === null) { lastQueuedState.current = serialized; return; }
    if (lastQueuedState.current === serialized && !saveAttempt) return;
    lastQueuedState.current = serialized;
    const revision = ++saveRevision.current;
    dirty.current = true;
    setSyncState('saving');
    const request = saveQueue.current.catch(() => undefined).then(() => saveFithubState(nextState));
    saveQueue.current = request;
    request.then(() => {
      if (revision === saveRevision.current) { dirty.current = false; setSyncState('saved'); setGoalError((message) => message.startsWith('Your changes are not saved') ? '' : message); }
    }).catch(() => {
      if (revision === saveRevision.current) setSyncState('error');
    });
  }, [activity, goalHistory, goals, saveAttempt, workouts]);

  useEffect(() => {
    const beforeUnload = (event) => { if (dirty.current) { event.preventDefault(); event.returnValue = ''; } };
    const beforeNavigate = (event) => {
      const link = event.target.closest?.('a[href]');
      if (dirty.current && link && new URL(link.href).pathname !== window.location.pathname) {
        event.preventDefault();
        event.stopPropagation();
        setGoalError('Your changes are not saved yet. Wait for saving to finish, or retry the failed save before leaving.');
      }
    };
    const beforeSignOut = (event) => {
      if (dirty.current && event.target.matches('[data-account-signout]')) {
        event.preventDefault(); event.stopPropagation();
        setGoalError('Your changes are not saved yet. Retry the save before signing out.');
      }
    };
    document.addEventListener('submit', beforeSignOut, true);
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', beforeNavigate, true);
    return () => { document.removeEventListener('submit', beforeSignOut, true); window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', beforeNavigate, true); };
  }, []);

  useEffect(() => {
    if (showGoalForm) goalInputRef.current?.focus();
  }, [showGoalForm, editingGoal]);

  useEffect(() => {
    if (showWorkoutForm) workoutTitleRef.current?.focus();
  }, [showWorkoutForm]);

  useEffect(() => {
    if (!deletedItem) return undefined;
    const timeout = window.setTimeout(() => setDeletedItem(null), 10000);
    return () => window.clearTimeout(timeout);
  }, [deletedItem]);

  const gymLogged = activity.some((day) => day.date === today && day.level > 0);
  const completedGoalCount = goals.filter((goal) => completed.includes(goal.id)).length;
  const completion = goals.length ? Math.round((completedGoalCount / goals.length) * 100) : 0;
  const visitCount = activity.filter((day) => day.level > 0).length;
  const streaks = calculateStreaks(activity, today);
  const orderedWorkouts = useMemo(() => [...workouts].sort((a, b) => workoutDays.indexOf(a.day) - workoutDays.indexOf(b.day)), [workouts]);
  const nextWorkout = useMemo(() => getNextWorkout(workouts, today), [today, workouts]);

  function toggleGoal(goalId) {
    dirty.current = true;
    setGoalHistory((history) => {
      const current = history.find((day) => day.date === selectedDate)?.completed ?? [];
      const completed = current.includes(goalId) ? current.filter((id) => id !== goalId) : [...current, goalId];
      return [...history.filter((day) => day.date !== selectedDate), { date: selectedDate, completed }].sort((a, b) => a.date.localeCompare(b.date));
    });
  }

  function toggleGymVisit() {
    setActivity((current) => current.map((day) => day.date === today ? { ...day, level: day.level ? 0 : 4 } : day));
  }

  function addGoal(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const goal = { id: editingGoal?.id ?? crypto.randomUUID(), label: String(form.get('label') || '').trim(), detail: String(form.get('detail') || '').trim(), icon: 'check' };
    if (!goal.label) { setGoalError('Enter a goal name, such as Drink 4 L of water.'); return; }
    if (!editingGoal && goals.length >= 100) { setGoalError('You can keep up to 100 daily goals. Remove a goal before adding another.'); return; }
    dirty.current = true;
    setGoals((current) => editingGoal ? current.map((item) => item.id === goal.id ? goal : item) : [...current, goal]);
    setEditingGoal(null);
    setGoalError('');
    setShowGoalForm(false);
    event.currentTarget.reset();
  }

  function deleteGoal(goalId) {
    const index = goals.findIndex((goal) => goal.id === goalId);
    const item = goals[index];
    if (!item) return;
    setDeletedItem({ kind: 'goal', item, index, date: selectedDate });
    setGoals((current) => current.filter((goal) => goal.id !== goalId));
    dirty.current = true;
  }

  function addWorkout(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const exercises = String(data.get('exercises') || '').split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 30);
    const workout = {
      id: crypto.randomUUID(),
      day: String(data.get('day') || ''),
      title: String(data.get('title') || '').trim(),
      exercises,
      tone: ['lime', 'mint', 'forest'][workouts.length % 3],
    };
    if (!workout.title || !workout.day || !workout.exercises.length) return;
    setWorkouts((current) => [...current, workout]);
    setShowWorkoutForm(false);
    event.currentTarget.reset();
  }

  function deleteWorkout(workoutId) {
    const index = workouts.findIndex((workout) => workout.id === workoutId);
    const item = workouts[index];
    if (!item) return;
    setDeletedItem({ kind: 'workout', item, index });
    setWorkouts((current) => current.filter((workout) => workout.id !== workoutId));
  }

  function undoDelete() {
    if (!deletedItem) return;
    if (deletedItem.kind === 'goal') {
      setGoals((current) => {
        if (current.some((goal) => goal.id === deletedItem.item.id)) return current;
        const next = [...current];
        next.splice(Math.min(deletedItem.index, next.length), 0, deletedItem.item);
        return next;
      });

    } else {
      setWorkouts((current) => {
        if (current.some((workout) => workout.id === deletedItem.item.id)) return current;
        const next = [...current];
        next.splice(Math.min(deletedItem.index, next.length), 0, deletedItem.item);
        return next;
      });
    }
    setDeletedItem(null);
  }

  function showWorkoutPlan() {
    if (!nextWorkout) setShowWorkoutForm(true);
    document.getElementById('workout-plan')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>
              <span className={styles.pulse} />
              Fithub dashboard ·
              <span className={syncState === 'error' ? styles.syncError : ''} aria-live="polite">
                {syncState === 'saving' ? 'Saving…' : syncState === 'error' ? 'Sync failed' : 'Up to date'}
              </span>
              {syncState === 'error' && <button className={styles.retryButton} type="button" onClick={() => setSaveAttempt((attempt) => attempt + 1)}>Retry</button>}
            </div>
            <h1>Build your streak.<br /><span>Own your progress.</span></h1>
            <p>Small actions, repeated daily. Keep your training, habits, and plan together.</p>
          </div>
          <button className={`${styles.logButton} ${gymLogged ? styles.logged : ''}`} type="button" onClick={toggleGymVisit}>
            <Icon name={gymLogged ? 'check' : 'plus'} />
            {gymLogged ? 'Gym visit logged' : 'Log today’s gym visit'}
          </button>
        </section>

        <section className={styles.activityCard} id="activity" aria-labelledby="activity-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.kicker}>Consistency</span>
              <h2 id="activity-title">Gym activity</h2>
            </div>
            <div className={styles.statRow}>
              <div><strong>{visitCount}</strong><span>gym days</span></div>
              <div><strong>{streaks.current}</strong><span>day streak</span></div>
              <div className={styles.streak}><Icon name="flame" /><strong>{streaks.best}</strong><span>best streak</span></div>
            </div>
          </div>
          <ActivityGrid activity={activity} today={today} visitCount={visitCount} />
          <div className={styles.legend} aria-hidden="true">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => <i className={`${styles.activityDay} ${styles[`level${level}`]}`} key={level} />)}
            <span>More</span>
          </div>
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.goalsCard} id="daily-goals" aria-labelledby="goals-title">
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.kicker}>{selectedDate === today ? 'Today' : selectedDate}</span>
                <h2 id="goals-title">Daily goals</h2>
              </div>
              <button className={styles.smallAddButton} type="button" onClick={() => { setEditingGoal(null); setGoalError(''); setShowGoalForm((current) => !current); }} aria-expanded={showGoalForm} aria-controls="goal-form"><Icon name={showGoalForm ? 'close' : 'plus'} size={15} /> {showGoalForm ? 'Cancel' : 'Add goal'}</button>
            </div>
            <label className={styles.dateField}>Goal date<input type="date" value={selectedDate} max={today} required onChange={(event) => { const date = event.target.value; if (date && date <= today) setSelectedDate(date); }} /></label>
            {goalError && <p className={styles.syncError} role="alert">{goalError}</p>}
            <div className={styles.progressTrack} role="progressbar" aria-label={`Goal progress for ${selectedDate}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion}>
              <span style={{ width: `${completion}%` }} />
            </div>
            {showGoalForm && <form className={styles.goalForm} id="goal-form" key={editingGoal?.id ?? 'new'} onSubmit={addGoal}><label>Goal<input ref={goalInputRef} defaultValue={editingGoal?.label ?? ''} name="label" maxLength="80" placeholder="e.g. Stretch for 10 minutes" required /></label><label>Note (optional)<input name="detail" defaultValue={editingGoal?.detail ?? ''} maxLength="120" placeholder="Add a useful cue" /></label><button type="submit" disabled={syncState === 'saving'}>{syncState === 'saving' ? 'Saving...' : editingGoal ? 'Save changes' : 'Save goal'}</button></form>}
            <div className={styles.goalList}>
              {goals.map((goal) => {
                const isDone = completed.includes(goal.id);
                return (
                  <div className={`${styles.goalRow} ${isDone ? styles.goalDone : ''}`} key={goal.id}>
                    <button className={styles.goal} type="button" onClick={() => toggleGoal(goal.id)} aria-pressed={isDone}>
                      <span className={styles.goalIcon}><Icon name={goal.icon || 'check'} /></span>
                      <span className={styles.goalCopy}><strong>{goal.label}</strong>{goal.detail && <small>{goal.detail}</small>}</span>
                      <span className={styles.checkbox}>{isDone && <Icon name="check" size={15} />}</span>
                    </button>
                    <button className={styles.goalEdit} type="button" onClick={() => { setEditingGoal(goal); setShowGoalForm(true); setGoalError(''); goalInputRef.current?.focus(); }} aria-label={`Edit ${goal.label}`}>Edit</button>
                    <button className={styles.goalDelete} type="button" onClick={() => deleteGoal(goal.id)} aria-label={`Delete ${goal.label}`}><Icon name="trash" size={16} /></button>
                  </div>
                );
              })}
              {!goals.length && <div className={styles.emptyGoals}><h3>No daily goals yet</h3><p>Add goals that fit your own routine.</p></div>}
            </div>
            <div className={styles.goalFooter}>
              <span>{completedGoalCount}/{goals.length} complete</span>
              <span>{goals.length > 0 && completion === 100 ? `All done for ${selectedDate === today ? 'today' : selectedDate}.` : 'Build a routine that works for you.'}</span>
            </div>
          </section>

          <aside className={styles.todayCard}>
            <span className={styles.kicker}>Next workout</span>
            <div className={styles.todayIcon}><Icon name="calendar" size={24} /></div>
            <p className={styles.todayDay}>{nextWorkout ? `${nextWorkout.timing} · ${nextWorkout.day}` : 'No session planned'}</p>
            <h2>{nextWorkout?.title ?? 'Build your plan'}</h2>
            <p>{nextWorkout ? `${nextWorkout.exercises.length} ${nextWorkout.exercises.length === 1 ? 'exercise' : 'exercises'} in your plan` : 'Add a workout to shape your week.'}</p>
            <button type="button" onClick={showWorkoutPlan}>
              {nextWorkout ? 'View workout' : 'Add first workout'} <Icon name="arrow" size={17} />
            </button>
          </aside>
        </div>

        <section className={styles.activityCard} id="habits" aria-labelledby="habits-title">
          <div className={styles.sectionHeading}><div><span className={styles.kicker}>Daily habits</span><h2 id="habits-title">Your habits over time</h2><p>Choose a square to review that day. Numbers show completed goals, including goals later removed. Use arrow keys to move between days.</p></div></div>
          <HabitGrid today={today} history={goalHistory} selectedDate={selectedDate} onSelect={(date) => { setSelectedDate(date); document.getElementById('daily-goals')?.scrollIntoView(); }} />
          {!goalHistory.some((day) => day.completed.length) && <p className={styles.habitEmpty}>Complete your first daily goal to start your habit history.</p>}
        </section>

        <section className={styles.planSection} id="workout-plan" aria-labelledby="plan-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.kicker}>Weekly split</span>
              <h2 id="plan-title">Workout plan</h2>
              <p>Structure your week and show up knowing exactly what to do.</p>
            </div>
            <button className={styles.addButton} type="button" onClick={() => setShowWorkoutForm((current) => !current)} aria-expanded={showWorkoutForm} aria-controls="workout-form">
              <Icon name={showWorkoutForm ? 'close' : 'plus'} size={18} /> {showWorkoutForm ? 'Cancel' : 'Add workout'}
            </button>
          </div>

          {showWorkoutForm && (
            <form className={styles.workoutForm} id="workout-form" onSubmit={addWorkout}>
              <label>
                Day
                <select name="day" defaultValue="Tuesday">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => <option key={day}>{day}</option>)}
                </select>
              </label>
              <label>
                Workout name
                <input ref={workoutTitleRef} name="title" maxLength="80" placeholder="e.g. Upper body" required />
              </label>
              <label className={styles.exerciseField}>
                Exercises <span>One per line</span>
                <textarea name="exercises" maxLength="3600" placeholder={'Incline press · 4 × 8\nLat pulldown · 3 × 10'} rows="3" required />
              </label>
              <button type="submit">Save workout</button>
            </form>
          )}

          <div className={styles.workoutGrid}>
            {orderedWorkouts.map((workout, index) => (
              <article className={`${styles.workoutCard} ${styles[workout.tone]} ${nextWorkout?.id === workout.id ? styles.nextWorkoutCard : ''}`} key={workout.id}>
                <div className={styles.workoutTop}>
                  <div><span>{String(index + 1).padStart(2, '0')}</span>{nextWorkout?.id === workout.id && <span className={styles.nextLabel}>Up next</span>}</div>
                  <button type="button" onClick={() => deleteWorkout(workout.id)} aria-label={`Delete ${workout.title}`} title="Delete workout">
                    <Icon name="trash" size={17} />
                  </button>
                </div>
                <p>{workout.day}</p>
                <h3>{workout.title}</h3>
                <ul>
                  {workout.exercises.map((exercise, exerciseIndex) => <li key={`${exercise}-${exerciseIndex}`}>{exercise}</li>)}
                </ul>
              </article>
            ))}
            {workouts.length === 0 && (
              <div className={styles.emptyPlan}>
                <Icon name="dumbbell" size={26} />
                <h3>Your week is wide open</h3>
                <p>Add your first workout to start building a routine.</p>
              </div>
            )}
          </div>
        </section>
      </div>
      {deletedItem && (
        <div className={styles.undoNotice} aria-live="polite">
          <span>{deletedItem.kind === 'goal' ? 'Goal' : 'Workout'} deleted.</span>
          <button type="button" onClick={undoDelete}>Undo</button>
        </div>
      )}
    </div>
  );
}
