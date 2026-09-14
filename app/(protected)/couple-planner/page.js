import { redirect } from 'next/navigation';
import { auth } from '../../../auth';
import { getCouplePlannerWorkspace } from '../../../lib/couple-planner';
import CouplePlannerDashboard from './couple-planner-dashboard';

export const metadata = {
  title: 'Couple Planner',
  description: 'One shared place for plans, tasks, dates, trips, recipes, and entertainment.',
};

export default async function CouplePlanner({ searchParams }) {
  const query = await searchParams;
  const inviteCode = typeof query.invite === 'string' && /^[A-Z0-9]{6}$/i.test(query.invite) ? query.invite.toUpperCase() : '';
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/couple-planner');
  const workspace = await getCouplePlannerWorkspace(session.user);

  return (
    <CouplePlannerDashboard
      key={workspace.id}
      inviteCode={inviteCode}
      userName={session?.user?.name || session?.user?.email?.split('@')[0] || 'You'}
      today={new Date().toISOString().slice(0, 10)}
      initialData={workspace.data}
      workspace={{ id: workspace.id, role: workspace.role, memberCount: workspace.memberCount, invite: workspace.invite }}
    />
  );
}
