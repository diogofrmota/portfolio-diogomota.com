export const apps = [
  {
    href: '/tvsync',
    name: 'TVSync',
    description: 'Your next great watch.',
    category: 'Watch',
    icon: 'tv',
    color: 'violet',
  },
  {
    href: '/couple-planner',
    name: 'Couple Planner',
    description: 'Make time for each other.',
    category: 'Plan',
    icon: 'calendar',
    color: 'peach',
  },
  {
    href: '/fithub',
    name: 'Fithub',
    description: 'Build a stronger routine.',
    category: 'Move',
    icon: 'fitness',
    color: 'green',
  },
];

export function safeAppPath(value) {
  if (typeof value !== 'string') return null;
  const pathname = value.split(/[?#]/, 1)[0];
  return /^\/(?:fithub|couple-planner|tvsync(?:\/(?:movie|tv)\/\d+(?:\/season\/\d+)?)?)$/.test(
    pathname
  )
    ? value
    : null;
}

export function appSelectionUrl(value) {
  const path = safeAppPath(value);
  return path
    ? `/apps?callbackUrl=${encodeURIComponent(path)}`
    : '/apps';
}
