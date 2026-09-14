'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPartnerInvite, joinPartnerSpace, saveCouplePlannerData, refreshCouplePlannerData } from './actions';
import { plannerChanges } from '../../../lib/couple-planner-model.mjs';
import styles from './couple-planner.module.css';

const sections = [
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'tasks', label: 'Tasks', icon: 'check' },
  { id: 'dates', label: 'Dates', icon: 'pin' },
  { id: 'trips', label: 'Trips', icon: 'plane' },
  { id: 'recipes', label: 'Recipes', icon: 'chef' },
  { id: 'entertainment', label: 'Entertainment', icon: 'play' },
];

const sectionMeta = {
  calendar: { title: 'Calendar', copy: 'Everything you are looking forward to, in one place.', action: 'Add activity', item: 'activity' },
  tasks: { title: 'Tasks', copy: 'Keep the little things moving, together.', action: 'Add task', item: 'task' },
  dates: { title: 'Date ideas', copy: 'Save the places and plans you want to experience.', action: 'Add date idea', item: 'date idea' },
  trips: { title: 'Trips', copy: 'Plan the next escape from the first idea to takeoff.', action: 'Add trip', item: 'trip' },
  recipes: { title: 'Recipes', copy: 'A shared cookbook for weeknights and slow Sundays.', action: 'Add recipe', item: 'recipe' },
  entertainment: { title: 'Entertainment', copy: 'Keep your next watch, read, and listen close.', action: 'Add a pick', item: 'pick' },
};

function Icon({ name, size = 20 }) {
  const paths = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    check: <><rect x="3" y="3" width="18" height="18" rx="4" /><path d="m8 12 2.5 2.5L16 9" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    plane: <><path d="m3 11 18-7-7 18-3-8-8-3Z" /><path d="m11 14 4-4" /></>,
    chef: <><path d="M6 13a4 4 0 0 1 1-7.87A5 5 0 0 1 17 6a4 4 0 0 1 1 7" /><path d="M6 13v7h12v-7M9 16v4M15 16v4" /></>,
    play: <><rect x="3" y="5" width="18" height="15" rx="3" /><path d="m10 9 5 3.5-5 3.5V9ZM8 2l4 3 4-3" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    left: <path d="m15 18-6-6 6-6" />,
    right: <path d="m9 18 6-6-6-6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-4 2.7-6 6-6s6 2 6 6M16 5.5a3 3 0 0 1 0 5.8M17 14c2.5.4 4 2.2 4 5" /></>,
  };

  return (
    <svg className={styles.icon} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const emptyData = () => Object.fromEntries(sections.map(({ id }) => [id, []]));

function formatDate(iso, options = {}) {
  if (!iso) return '';
  const date = new Date(`${iso}T12:00:00Z`);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return [
    options.weekday && (options.weekday === 'short' ? weekdays[date.getUTCDay()].slice(0, 3) : weekdays[date.getUTCDay()]),
    options.day && (options.day === '2-digit' ? String(date.getUTCDate()).padStart(2, '0') : date.getUTCDate()),
    options.month && (options.month === 'short' ? months[date.getUTCMonth()].slice(0, 3) : months[date.getUTCMonth()]),
    options.year && date.getUTCFullYear(),
  ].filter(Boolean).join(' ');
}

function useDialogAccessibility(dialogRef, initialFocusRef, onClose, busy = false) {
  const busyRef = useRef(busy);
  busyRef.current = busy;
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = dialogRef.current?.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled])');
    (initialFocusRef.current || focusable?.[0])?.focus();
    const background = [];
    for (let node = dialogRef.current?.parentElement; node && node !== document.body; node = node.parentElement) {
      for (const sibling of node.parentElement?.children || []) {
        if (sibling !== node && sibling instanceof HTMLElement) {
          background.push([sibling, sibling.inert]);
          sibling.inert = true;
        }
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busyRef.current) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = dialogRef.current?.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled])');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      for (const [element, inert] of background) element.inert = inert;
      if (previousFocus?.isConnected) previousFocus.focus?.();
      else document.querySelector('[data-add-plan]')?.focus();
    };
  }, [dialogRef, initialFocusRef, onClose]);
}

function Calendar({ items, cursor, setCursor, today, onEdit, onAdd, onDelete }) {
  const [selected, setSelected] = useState(today);
  const selectedItems = items.filter(item => item.date === selected);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousDays = new Date(year, month, 0).getDate();
  const eventsByDate = useMemo(() => items.reduce((groups, item) => {
    groups[item.date] = [...(groups[item.date] || []), item];
    return groups;
  }, {}), [items]);
  const upcoming = useMemo(
    () => [...items].filter((item) => item.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4),
    [items, today],
  );
  const cells = Array.from({ length: 42 }, (_, index) => {
    const raw = index - mondayOffset + 1;
    if (raw < 1) return { day: previousDays + raw, muted: true, monthOffset: -1 };
    if (raw > daysInMonth) return { day: raw - daysInMonth, muted: true, monthOffset: 1 };
    return { day: raw, muted: false, monthOffset: 0 };
  });
  const dateFor = (cell) => {
    const value = new Date(year, month + cell.monthOffset, cell.day, 12);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className={styles.calendarLayout}>
      <section className={styles.calendarCard} aria-label="Monthly calendar">
        <div className={styles.calendarToolbar}>
          <h2 aria-live="polite">{new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(cursor)}</h2>
          <div className={styles.calendarControls}>
            <button type="button" onClick={() => setCursor(new Date())}>Today</button>
            <button type="button" aria-label="Previous month" onClick={() => setCursor(new Date(year, month - 1, 1))}><Icon name="left" /></button>
            <button type="button" aria-label="Next month" onClick={() => setCursor(new Date(year, month + 1, 1))}><Icon name="right" /></button>
          </div>
        </div>
        <div className={styles.weekdays} aria-hidden="true">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className={styles.monthGrid} role="group" aria-label={new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(cursor)}>
          {cells.map((cell, index) => {
            const iso = dateFor(cell);
            const dayItems = eventsByDate[iso] || [];
            return (
              <div className={`${styles.day} ${cell.muted ? styles.mutedDay : ''} ${iso === today ? styles.today : ''}`} role="group" aria-label={formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long' })} key={`${iso}-${index}`}>
                <button type="button" className={`${styles.dayNumber} ${selected === iso ? styles.selectedDay : ''}`} onClick={() => setSelected(iso)} aria-label={`${formatDate(iso, { day: 'numeric', month: 'long' })}, ${dayItems.length} plans`} aria-pressed={selected === iso} aria-current={iso === today ? 'date' : undefined}>{cell.day}</button>
                {dayItems.slice(0, 2).map((item) => (
                  <button className={styles.calendarEvent} style={{ '--event-color': item.color || '#e63b2e' }} type="button" onClick={() => onEdit(item)} title={`Edit ${item.title}`} key={item.id}>{item.title}</button>
                ))}
                {dayItems.length > 2 && <button type="button" className={styles.moreEvents} onClick={() => setSelected(iso)}>+{dayItems.length - 2} more</button>}
              </div>
            );
          })}
        </div>
      </section>
      <aside className={styles.upNext}>
        <span className={styles.eyebrow}>Day agenda</span>
        <h3>{formatDate(selected, { weekday: 'short', day: 'numeric', month: 'short' })}</h3>
        <div className={styles.selectedPlans}>
          {selectedItems.map(item => <article key={item.id}><h4>{item.title}</h4><p>{item.detail || 'All day'}</p><ItemActions item={item} onEdit={onEdit} onDelete={onDelete} /></article>)}
          {!selectedItems.length && <p>No plans for this day. Make room for something nice.</p>}
          <button type="button" className={styles.secondaryButton} onClick={() => onAdd(selected)}>Add a plan for this day</button>
        </div>
        <span className={styles.eyebrow}>Up next</span>
        <h3>Your plans</h3>
        {upcoming.length ? (
          <div className={styles.agendaList}>
            {upcoming.map((item) => (
              <article key={item.id}>
                <time dateTime={item.date}><strong>{formatDate(item.date, { day: '2-digit' })}</strong><span>{formatDate(item.date, { month: 'short' })}</span></time>
                <div><button type="button" className={styles.agendaLink} onClick={() => onEdit(item)}>{item.title}</button><p>{item.detail || 'All day'}</p></div>
              </article>
            ))}
          </div>
        ) : <p className={styles.agendaEmpty}>Nothing scheduled yet. Add an activity to start your shared calendar.</p>}
      </aside>
    </div>
  );
}

function ItemActions({ item, onEdit, onDelete }) {
  return (
    <div className={styles.itemActions}>
      <button type="button" onClick={() => onEdit(item)} aria-label={`Edit ${item.title}`}><Icon name="edit" size={17} /></button>
      <button type="button" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.title}`}><Icon name="trash" size={17} /></button>
    </div>
  );
}

function TaskList({ items, onToggle, onEdit, onDelete }) {
  const active = items.filter((item) => !item.done);
  const completed = items.filter((item) => item.done);
  return (
    <div className={styles.taskColumns}>
      <section className={styles.listSection}>
        <div className={styles.listTitle}><h2>To do</h2><span>{active.length}</span></div>
        <div className={styles.taskList}>
          {active.map((item) => <Task key={item.id} item={item} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />)}
          {!active.length && <EmptyState title="Everything is done" copy="A clear list feels good. Add something when you are ready." />}
        </div>
      </section>
      <section className={styles.listSection}>
        <div className={styles.listTitle}><h2>Completed</h2><span>{completed.length}</span></div>
        <div className={styles.taskList}>
          {completed.map((item) => <Task key={item.id} item={item} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />)}
          {!completed.length && <EmptyState title="Nothing checked off yet" copy="Completed tasks will collect here." />}
        </div>
      </section>
    </div>
  );
}

function Task({ item, onToggle, onEdit, onDelete }) {
  return (
    <article className={`${styles.task} ${item.done ? styles.taskDone : ''}`}>
      <button className={styles.checkbox} type="button" onClick={() => onToggle(item.id)} aria-label={`${item.done ? 'Reopen' : 'Complete'} ${item.title}`} aria-pressed={item.done}>
        {item.done && <Icon name="check" size={15} />}
      </button>
      <div>
        <h3>{item.title}</h3>
        {item.detail && <p>{item.detail}</p>}
        {item.date && <time dateTime={item.date}>Due {formatDate(item.date, { day: 'numeric', month: 'short' })}</time>}
      </div>
      <ItemActions item={item} onEdit={onEdit} onDelete={onDelete} />
    </article>
  );
}

function Collection({ items, section, onEdit, onDelete }) {
  if (!items.length) return <EmptyState title={`No ${sectionMeta[section].title.toLowerCase()} yet`} copy="Add the first one to your shared space." />;
  return (
    <div className={styles.collectionGrid}>
      {items.map((item, index) => (
        <article className={`${styles.collectionCard} ${styles[`tone${index % 4}`]}`} key={item.id}>
          <div className={styles.cardTop}>
            <span>{item.tag || sectionMeta[section].title}</span>
            <ItemActions item={item} onEdit={onEdit} onDelete={onDelete} />
          </div>
          <div className={styles.cardIcon}><Icon name={sections.find((entry) => entry.id === section)?.icon || 'heart'} size={24} /></div>
          <h2>{item.title}</h2>
          <p>{item.detail || 'Shared with your partner'}</p>
          {item.date && <time dateTime={item.date}>{formatDate(item.date, { day: 'numeric', month: 'long', year: 'numeric' })}</time>}
        </article>
      ))}
    </div>
  );
}

function EmptyState({ title, copy }) {
  return <div className={styles.emptyState}><span><Icon name="heart" /></span><h3>{title}</h3><p>{copy}</p></div>;
}

function AddDialog({ section, item, defaultDate, onClose, onSubmit, onDelete }) {
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const meta = sectionMeta[section];
  useDialogAccessibility(dialogRef, inputRef, onClose);

  function submit(event) {
    event.preventDefault();
    const title = event.currentTarget.elements.title;
    if (!title.value.trim()) { title.setCustomValidity('Give your plan a title.'); title.reportValidity(); return; }
    const form = new FormData(event.currentTarget);
    onSubmit({
      title: String(form.get('title') || '').trim(),
      detail: String(form.get('detail') || '').trim(),
      date: String(form.get('date') || '') || undefined,
      tag: String(form.get('tag') || '').trim() || undefined,
    });
  }

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="add-dialog-title">
        <button className={styles.dialogClose} type="button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button>
        <span className={styles.eyebrow}>Shared space</span>
        <h2 id="add-dialog-title">{item ? `Edit ${meta.item}` : meta.action}</h2>
        <p>{item ? 'Update the details for everyone in this shared space.' : 'Add the details now. You can always refine the plan together later.'}</p>
        <form onSubmit={submit}>
          <label>Title<input ref={inputRef} name="title" onInput={event => event.currentTarget.setCustomValidity('')} required maxLength="80" defaultValue={item?.title || ''} placeholder={section === 'tasks' ? 'What needs doing?' : `Name your ${section === 'calendar' ? 'activity' : 'idea'}`} /></label>
          <label>Details<textarea name="detail" rows="3" maxLength="6000" defaultValue={item?.detail || ''} placeholder={section === 'recipes' ? 'Ingredients, steps, and the little details that make it yours' : 'Notes, places, links, or anything you want to remember (optional)'} /></label>
          {!['recipes', 'entertainment'].includes(section) && <label>{section === 'tasks' ? 'Due date (optional)' : section === 'calendar' ? 'Date' : 'Date (optional)'}<input name="date" type="date" required={section === 'calendar'} defaultValue={item?.date || defaultDate || ''} min="1900-01-01" max="9999-12-31" /></label>}
          {section !== 'calendar' && section !== 'tasks' && <label>Status or category<input name="tag" maxLength="30" defaultValue={item?.tag || ''} placeholder="e.g. Favourite, Planning" /></label>}
          {item && <button className={styles.deleteButton} type="button" onClick={() => { onDelete(item.id); onClose(); }}>Delete {meta.item}</button>}
          <div className={styles.formActions}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">{item ? 'Save changes' : 'Save to our space'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ShareDialog({ workspace, hasPlans, inviteCode, beforeJoin, onInviteCreated, onClose }) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const [invite, setInvite] = useState(workspace.invite && new Date(workspace.invite.expiresAt) > new Date() ? workspace.invite : null);
  const [pending, setPending] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  useDialogAccessibility(dialogRef, inputRef, onClose, Boolean(pending));

  async function createInvite() {
    setPending('invite');
    setMessage({ type: '', text: '' });
    try {
      const result = await createPartnerInvite();
      if (result.ok) {
        setInvite(result.invite);
        onInviteCreated(result.invite);
        setMessage({ type: 'success', text: 'Invite ready to share.' });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not create an invite. Please try again.' });
    }
    setPending('');
  }

  async function copyInvite(link = false) {
    try {
      await navigator.clipboard.writeText(link ? `${window.location.origin}/couple-planner?invite=${invite.code}` : invite.code);
      setMessage({ type: 'success', text: link ? 'Invite link copied. Send it to your partner.' : 'Invite code copied.' });
    } catch {
      setMessage({ type: 'error', text: 'Copy failed. Select the code and copy it manually.' });
    }
  }

  async function join(event) {
    event.preventDefault();
    if (hasPlans && !window.confirm('Joining your partner will permanently replace your current solo space and its plans. Continue?')) return;
    const code = new FormData(event.currentTarget).get('code');
    setPending('join');
    setMessage({ type: '', text: '' });
    try {
      if (!(await beforeJoin())) { setMessage({ type: 'error', text: 'Save your latest changes before joining a different space.' }); setPending(''); return; }
      const result = await joinPartnerSpace(code);
      if (result.ok) {
        window.location.replace('/couple-planner');
        return;
      }
      setMessage({ type: 'error', text: result.error });
    } catch {
      setMessage({ type: 'error', text: 'Could not join that shared space. Please try again.' });
    }
    setPending('');
  }

  const expiry = invite?.expiresAt ? formatDate(invite.expiresAt.slice(0, 10), { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
      <section ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="share-dialog-title" aria-describedby="share-dialog-copy">
        <button className={styles.dialogClose} type="button" onClick={onClose} disabled={Boolean(pending)} aria-label="Close dialog"><Icon name="close" /></button>
        <span className={styles.eyebrow}>Private shared space</span>
        <h2 id="share-dialog-title">Plan as a couple</h2>
        <p id="share-dialog-copy">{workspace.memberCount > 1 ? 'Your partner is connected. Every change is saved to the same shared space.' : 'Invite your partner with a private code, or enter the code they sent you.'}</p>
        {workspace.memberCount < 2 && workspace.role === 'owner' && (
          <div className={styles.invitePanel}>
            {invite ? <><span>Your invite code</span><strong>{invite.code}</strong><button type="button" onClick={() => copyInvite()}>Copy code</button><button type="button" onClick={() => copyInvite(true)}>Copy invite link</button><button type="button" disabled={Boolean(pending)} onClick={createInvite}>Replace invite code</button><small>Single-use code{expiry ? `, valid until ${expiry}` : ', valid for 7 days'}.</small></> : <button type="button" disabled={Boolean(pending)} onClick={createInvite}>{pending === 'invite' ? 'Creating…' : 'Create invite code'}</button>}
          </div>
        )}
        {workspace.memberCount < 2 && (
          <form className={styles.joinForm} onSubmit={join}>
            <label>Join your partner<input ref={inputRef} name="code" defaultValue={inviteCode} minLength="6" maxLength="6" pattern="[A-Za-z0-9]{6}" autoCapitalize="characters" autoComplete="off" spellCheck="false" placeholder="ABC123" required /></label>
            <button type="submit" disabled={Boolean(pending)}>{pending === 'join' ? 'Joining…' : 'Join space'}</button>
            {hasPlans && <small className={styles.joinWarning}>Joining replaces your current solo space and its plans.</small>}
          </form>
        )}
        <p className={message.type === 'error' ? styles.dialogError : styles.dialogMessage} role="status" aria-live="polite">{message.text}</p>
      </section>
    </div>
  );
}

export default function CouplePlannerDashboard({ userName, today, initialData = {}, workspace: initialWorkspace, inviteCode = '' }) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [active, setActive] = useState('calendar');
  const [data, setData] = useState(() => ({ ...emptyData(), ...initialData }));
  const [currentDate, setCurrentDate] = useState(today);
  const [cursor, setCursor] = useState(() => new Date(`${today}T12:00:00`));
  const [dialogOpen, setDialogOpen] = useState(false);
  const editorOpen = useRef(false);
  editorOpen.current = dialogOpen;
  const [editingItem, setEditingItem] = useState(null);
  const [shareOpen, setShareOpen] = useState(Boolean(inviteCode) && initialWorkspace.memberCount < 2);
  const [defaultDate, setDefaultDate] = useState('');
  const [syncError, setSyncError] = useState('');
  const [refreshError, setRefreshError] = useState('');
  const baseData = useRef(initialData);
  const syncRef = useRef('saved');
  const refreshInFlight = useRef(false);
  const [syncState, setSyncState] = useState('saved');
  const [lastDeleted, setLastDeleted] = useState(null);
  const initialState = useRef(data);
  const saveTimer = useRef(null);
  const saveQueue = useRef(Promise.resolve());
  const revision = useRef(0);
  const dataRef = useRef(data);
  const mounted = useRef(true);

  const closeAddDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingItem(null);
  }, []);
  const closeShareDialog = useCallback(() => setShareOpen(false), []);

  useEffect(() => {
    mounted.current = true;
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (localDate !== today) {
      setCurrentDate(localDate);
      setCursor(new Date(`${localDate}T12:00:00`));
    }
    return () => { mounted.current = false; };
  }, [today]);

  const acceptRemote = useCallback((remote) => {
    baseData.current = remote;
    initialState.current = remote;
    dataRef.current = remote;
    setData(remote);
  }, []);

  const enqueueSave = useCallback((snapshot, saveRevision) => {
    const request = saveQueue.current.catch(() => null).then(async () => {
      const changes = plannerChanges(baseData.current, snapshot);
      const result = await saveCouplePlannerData(workspace.id, changes.next, changes.base);
      if (result?.ok) {
        baseData.current = snapshot;
        if (mounted.current && saveRevision === revision.current) {
          if (!editorOpen.current) acceptRemote(result.data);
          syncRef.current = 'saved';
          setSyncState('saved');
          setSyncError('');
        }
      } else if (mounted.current && saveRevision === revision.current) {
        syncRef.current = 'error';
        setSyncState('error');
        setSyncError(result?.error || 'Your changes could not be saved. Please retry.');
      }
      return Boolean(result?.ok);
    }).catch(() => {
      if (mounted.current && saveRevision === revision.current) {
        syncRef.current = 'error';
        setSyncState('error');
        setSyncError('Your changes are still on this page. Check your connection, then retry.');
      }
      return false;
    });
    saveQueue.current = request;
    return request;
  }, [workspace.id, acceptRemote]);

  useEffect(() => {
    dataRef.current = data;
    if (data === initialState.current) return;
    const saveRevision = ++revision.current;
    syncRef.current = 'saving';
    setSyncState('saving');
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => enqueueSave(data, saveRevision), 350);
    return () => window.clearTimeout(saveTimer.current);
  }, [data, enqueueSave]);

  useEffect(() => {
    async function refresh() {
      if (document.hidden || editorOpen.current || syncRef.current !== 'saved' || refreshInFlight.current) return;
      refreshInFlight.current = true;
      const startedAt = revision.current;
      try {
        const result = await refreshCouplePlannerData(workspace.id);
        if (mounted.current && startedAt === revision.current && !editorOpen.current && syncRef.current === 'saved') {
          if (result.ok) { acceptRemote(result.data); setWorkspace(current => ({ ...current, role: result.role, memberCount: result.memberCount })); setRefreshError(''); }
          else setRefreshError(result.error);
        }
      } catch {
        if (mounted.current) setRefreshError('Live updates are unavailable. Check your connection.');
      } finally { refreshInFlight.current = false; }
    }
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [workspace.id, acceptRemote]);

  useEffect(() => {
    const warn = event => {
      if (syncRef.current !== 'saved') { event.preventDefault(); event.returnValue = ''; }
    };
    const guardNavigation = event => {
      const link = event.target.closest('a[href]');
      const signOut = event.target.closest('form') && !event.target.closest('[data-planner]');
      if ((link || signOut) && syncRef.current !== 'saved' && !window.confirm('Your latest changes have not saved yet. Leave this page anyway?')) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', guardNavigation, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', guardNavigation, true); };
  }, []);

  useEffect(() => {
    if (!lastDeleted) return undefined;
    const timeout = window.setTimeout(() => setLastDeleted(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [lastDeleted]);

  const saveNow = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    const saveRevision = ++revision.current;
    syncRef.current = 'saving';
    setSyncState('saving');
    return enqueueSave(dataRef.current, saveRevision);
  }, [enqueueSave]);

  const upcomingCount = useMemo(() => data.calendar.filter((item) => item.date >= currentDate).length, [data.calendar, currentDate]);
  const pendingCount = useMemo(() => data.tasks.filter((item) => !item.done).length, [data.tasks]);
  const hasPlans = useMemo(() => Object.values(data).some((items) => items.length > 0), [data]);
  const meta = sectionMeta[active];

  function openAddDialog(date = '') {
    setDefaultDate(typeof date === 'string' ? date : '');
    setEditingItem(null);
    setDialogOpen(true);
  }

  function openEditDialog(item) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  function saveItem(values) {
    if (!editingItem && data[active].length >= 1000) {
      setSyncError('This section is full. Remove an item before adding another.');
      closeAddDialog();
      return;
    }
    syncRef.current = 'saving';
    setData((current) => {
      if (editingItem) return { ...current, [active]: current[active].map((item) => item.id === editingItem.id ? { ...item, ...values } : item) };
      const id = globalThis.crypto?.randomUUID?.() || `${active}-${Date.now()}`;
      const item = { ...values, id, ...(active === 'calendar' ? { color: '#e63b2e' } : {}), ...(active === 'tasks' ? { done: false } : {}) };
      return { ...current, [active]: [...current[active], item] };
    });
    closeAddDialog();
  }

  function deleteItem(id) {
    const index = data[active].findIndex((item) => item.id === id);
    if (index < 0) return;
    syncRef.current = 'saving';
    setLastDeleted({ section: active, index, item: data[active][index] });
    setData((current) => ({ ...current, [active]: current[active].filter((item) => item.id !== id) }));
  }

  function undoDelete() {
    if (!lastDeleted) return;
    syncRef.current = 'saving';
    setData((current) => {
      const items = [...current[lastDeleted.section]];
      items.splice(Math.min(lastDeleted.index, items.length), 0, lastDeleted.item);
      return { ...current, [lastDeleted.section]: items };
    });
    setLastDeleted(null);
  }

  function toggleTask(id) {
    syncRef.current = 'saving';
    setData((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task) }));
  }

  function downloadPlans() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(dataRef.current, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `our-plans-${currentDate}.json`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const renderNavButton = (section, mobile = false) => (
    <button className={active === section.id ? (mobile ? styles.activeMobileNav : styles.activeNav) : ''} type="button" aria-label={section.label} key={section.id} onClick={() => setActive(section.id)} aria-current={active === section.id ? 'page' : undefined}>
      <Icon name={section.icon} size={mobile ? 19 : 20} />
      <span>{mobile && section.label === 'Entertainment' ? 'Media' : section.label}</span>
      {!mobile && section.id === 'tasks' && pendingCount > 0 && <small>{pendingCount}</small>}
    </button>
  );

  return (
    <div className={styles.app} data-planner>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span><Icon name="heart" size={18} /></span><div><strong>Couple Planner</strong><small>Our shared space</small></div></div>
        <nav aria-label="Couple Planner sections">{sections.map((section) => renderNavButton(section))}</nav>
        <button className={styles.sidebarFooter} type="button" onClick={() => setShareOpen(true)}>
          <div className={styles.avatars} aria-hidden="true"><span>{userName.charAt(0).toUpperCase()}</span><span>{workspace.memberCount > 1 ? '✓' : '+'}</span></div>
          <div><strong>{userName}</strong><small>{workspace.memberCount > 1 ? 'Partner connected' : 'Invite your partner'}</small></div>
        </button>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.mobileHeader}>
          <div className={styles.brand}><span><Icon name="heart" size={17} /></span><div><strong>Couple Planner</strong><small>Our shared space</small></div></div>
          <button className={styles.avatars} type="button" onClick={() => setShareOpen(true)} aria-label="Manage shared space"><span>{userName.charAt(0).toUpperCase()}</span></button>
        </header>
        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <span className={styles.eyebrow}><Icon name="users" size={14} /> Made for two · {syncState === 'error' ? <button className={styles.syncRetry} type="button" onClick={saveNow}>Sync failed — retry</button> : <span aria-live="polite">{syncState === 'saving' ? 'Saving…' : 'Saved to cloud'}</span>}</span>
              <h1>{meta.title}</h1>
              <p>{meta.copy}</p>
            </div>
            <button className={styles.primaryButton} data-add-plan type="button" onClick={openAddDialog}><Icon name="plus" size={18} />{meta.action}</button>
          </div>
          {syncError && <div className={styles.errorBanner} role="alert"><p>{syncError}</p><button type="button" onClick={saveNow} disabled={syncState === 'saving'}>Retry save</button><button type="button" onClick={downloadPlans}>Download my plans</button><button type="button" onClick={() => { if (window.confirm('Load the saved plans? Unsaved changes on this page will be discarded. Download them first if you want to keep them.')) { syncRef.current = 'saved'; window.location.reload(); } }}>Load latest plans</button></div>}
          {refreshError && <p className={styles.errorBanner} role="status">{refreshError} Updates retry automatically.</p>}
          {workspace.memberCount < 2 && <div className={styles.welcome}><div><strong>A little space for the two of you.</strong><p>Start with a plan, then invite your partner to make it yours together.</p></div><button type="button" onClick={() => setShareOpen(true)}>Invite your partner</button></div>}
          <div className={styles.summary} aria-label="Planner summary">
            <span><strong>{upcomingCount}</strong> upcoming plans</span><span aria-hidden="true">•</span>
            <span><strong>{pendingCount}</strong> open tasks</span><span aria-hidden="true">•</span>
            <span><strong>{data.dates.length + data.trips.length}</strong> saved adventures</span>
          </div>
          {active === 'calendar' && <Calendar items={data.calendar} cursor={cursor} setCursor={setCursor} today={currentDate} onEdit={openEditDialog} onAdd={openAddDialog} onDelete={deleteItem} />}
          {active === 'tasks' && <TaskList items={data.tasks} onToggle={toggleTask} onEdit={openEditDialog} onDelete={deleteItem} />}
          {!['calendar', 'tasks'].includes(active) && <Collection items={data[active]} section={active} onEdit={openEditDialog} onDelete={deleteItem} />}
          <div className={styles.dataFooter}><span>Private to your shared space. Updates every 15 seconds.</span><button type="button" onClick={downloadPlans}>Download our plans</button></div>
        </div>
        <nav className={styles.mobileNav} aria-label="Couple Planner sections">{sections.map((section) => renderNavButton(section, true))}</nav>
      </div>
      {dialogOpen && <AddDialog section={active} item={editingItem} defaultDate={defaultDate} onDelete={deleteItem} onClose={closeAddDialog} onSubmit={saveItem} />}
      {shareOpen && <ShareDialog onInviteCreated={invite => setWorkspace(current => ({ ...current, invite }))} beforeJoin={() => syncRef.current === 'saved' ? Promise.resolve(true) : saveNow()} workspace={workspace} inviteCode={inviteCode} hasPlans={hasPlans} onClose={closeShareDialog} />}
      {lastDeleted && <div className={styles.undoToast} role="status"><span>“{lastDeleted.item.title}” deleted</span><button type="button" onClick={undoDelete}>Undo</button></div>}
    </div>
  );
}
