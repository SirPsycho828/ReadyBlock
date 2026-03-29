import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import localDb from '@/lib/db';
import { useAuthStore } from '@/stores/authStore';

export const SKILL_CATEGORIES = [
  'medical',
  'mechanical',
  'construction',
  'communications',
  'electrical',
  'plumbing',
  'cooking',
  'childcare',
  'animalCare',
  'language',
  'counseling',
  'search_rescue',
  'firefighting',
  'other',
];

export const SKILL_LEVELS = ['basic', 'trained', 'certified'];

/**
 * Get all skills for a neighborhood.
 */
export async function getNeighborhoodSkills(neighborhoodId) {
  try {
    const snap = await getDocs(
      query(collection(db, 'skills'), where('neighborhoodId', '==', neighborhoodId)),
    );
    const skills = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    for (const s of skills) {
      await localDb.skills.put(s);
    }
    return { success: true, data: skills };
  } catch {
    const cached = await localDb.skills.where('neighborhoodId').equals(neighborhoodId).toArray();
    return { success: true, data: cached };
  }
}

/**
 * Get skills for a specific user.
 */
export async function getUserSkills(uid) {
  try {
    const snap = await getDocs(
      query(collection(db, 'skills'), where('uid', '==', uid)),
    );
    return { success: true, data: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
  } catch {
    const cached = await localDb.skills.where('uid').equals(uid).toArray();
    return { success: true, data: cached };
  }
}

/**
 * Add a skill.
 */
export async function addSkill(skill) {
  const uid = useAuthStore.getState().user?.uid;
  const data = {
    ...skill,
    uid,
    householdId: uid,
    withdrawnAt: null,
    createdAt: serverTimestamp(),
  };

  try {
    const ref = await addDoc(collection(db, 'skills'), data);
    const localData = { id: ref.id, ...skill, uid, householdId: uid, createdAt: new Date().toISOString() };
    await localDb.skills.put(localData);
    return { success: true, data: localData };
  } catch {
    return { success: false, error: 'unknown' };
  }
}

/**
 * Update a skill.
 */
export async function updateSkill(skillId, updates) {
  try {
    await updateDoc(doc(db, 'skills', skillId), updates);
    const cached = await localDb.skills.get(skillId);
    if (cached) {
      await localDb.skills.put({ ...cached, ...updates });
    }
    return { success: true };
  } catch {
    return { success: false, error: 'unknown' };
  }
}

/**
 * Withdraw a skill (soft delete).
 */
export async function withdrawSkill(skillId) {
  return updateSkill(skillId, { withdrawnAt: new Date().toISOString() });
}
