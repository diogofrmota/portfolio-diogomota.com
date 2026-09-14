'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '../../../auth';
import { createCoupleWorkspaceInvite, joinCoupleWorkspace, saveCoupleWorkspaceData, getCoupleWorkspaceSnapshot, normalizeCouplePlannerData } from '../../../lib/couple-planner';

const expectedPlannerErrors = new Set([
  'Your session has expired. Download any unsaved plans, then sign in again.',
  'Only the workspace owner can create an invite.',
  'This shared space already has two members.',
  'Enter a valid six-character invite code.',
  'That invite is invalid or expired.',
  'You are already connected to a partner. You cannot join another space.',
  'You no longer have access to this shared space.',
  'Your partner changed the same item. Download your changes, then load the latest plans and try again.',
  'Your space is busy. Please retry your save.',
  'This section is full. Remove an item before adding another.',
  'That invite was already used or the shared space is full.',
]);

function safePlannerError(error, fallback) {
  if (error instanceof Error && expectedPlannerErrors.has(error.message)) return error.message;
  console.error(fallback, error);
  return fallback;
}

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) throw new Error('Your session has expired. Download any unsaved plans, then sign in again.');
  return session.user;
}

export async function saveCouplePlannerData(workspaceId, data, baseData) {
  try {
    const user = await requireUser();
    if (!data || !baseData || typeof data !== 'object' || typeof baseData !== 'object' ||
        Array.isArray(data) || Array.isArray(baseData) || JSON.stringify([data, baseData]).length > 800000) {
      return { ok: false, error: 'Invalid planner data or too many changes in one save.' };
    }
    const saved = await saveCoupleWorkspaceData(user, workspaceId, data, baseData);
    return { ok: true, data: saved };
  } catch (error) {
    return { ok: false, error: safePlannerError(error, 'Could not save your latest changes. Check your connection and try again.') };
  }
}

export async function refreshCouplePlannerData(workspaceId) {
  try {
    const user = await requireUser();
    const snapshot = await getCoupleWorkspaceSnapshot(user, workspaceId);
    return { ok: true, ...snapshot, data: normalizeCouplePlannerData(snapshot.data) };
  } catch (error) {
    return { ok: false, error: safePlannerError(error, 'Could not refresh your shared plans. Check your connection.') };
  }
}

export async function createPartnerInvite() {
  try {
    const user = await requireUser();
    const invite = await createCoupleWorkspaceInvite(user);
    revalidatePath('/couple-planner');
    return { ok: true, invite };
  } catch (error) {
    return { ok: false, error: safePlannerError(error, 'Could not create an invite.') };
  }
}

export async function joinPartnerSpace(code) {
  try {
    const user = await requireUser();
    await joinCoupleWorkspace(user, code);
    revalidatePath('/couple-planner');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: safePlannerError(error, 'Could not join that shared space.') };
  }
}
