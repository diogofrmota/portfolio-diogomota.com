import Link from 'next/link';

const apps = [
  { href: '/tvsync', name: 'TVSync', description: 'movie and tv show tracker' },
  {
    href: '/couple-planner',
    name: 'Couple Planner',
    description: 'shared agenda for couples',
  },
  { href: '/fithub', name: 'Fithub', description: 'track fitness like GitHub' },
];

export default function AppsClient() {
  return (
    <>
      {apps.map((app) => (
        <p key={app.href}>
          <Link href={{ pathname: '/login', query: { callbackUrl: app.href } }}>
            [{app.name}]
          </Link>
          <br />
          {app.description}
        </p>
      ))}
      <Link href="/">[back to home]</Link>
    </>
  );
}
