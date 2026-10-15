import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Sanitizes and formats a username string to strict 8-bit trainer rules:
 * - Lowercase
 * - Only letters, numbers, underscores, and hyphens
 * - Between 3 and 24 characters
 */
export function sanitizeUsername(rawInput: string): string {
  return rawInput
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 24);
}

/**
 * Validates whether a candidate username conforms to formatting requirements.
 */
export function validateUsernameFormat(username: string): { valid: boolean; error?: string } {
  const clean = sanitizeUsername(username);
  if (clean.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters.' };
  }
  if (clean.length > 24) {
    return { valid: false, error: 'Username cannot exceed 24 characters.' };
  }
  if (!/^[a-z0-9_-]+$/.test(clean)) {
    return { valid: false, error: 'Username may only contain letters, numbers, underscores, and hyphens.' };
  }
  return { valid: true };
}

/**
 * Checks in Firestore if a username is globally available (not claimed by another player).
 */
export async function checkUsernameAvailable(
  rawName: string,
  currentUid?: string
): Promise<{ available: boolean; cleanName: string; error?: string }> {
  const clean = sanitizeUsername(rawName);
  const formatCheck = validateUsernameFormat(clean);
  if (!formatCheck.valid) {
    return { available: false, cleanName: clean, error: formatCheck.error };
  }

  try {
    const snap = await getDoc(doc(db, 'usernames', clean));
    if (!snap.exists()) {
      return { available: true, cleanName: clean };
    }

    const data = snap.data();
    // If the registered document belongs to the current user, it's their own handle
    if (currentUid && data?.uid === currentUid) {
      return { available: true, cleanName: clean };
    }

    return {
      available: false,
      cleanName: clean,
      error: `@${clean} is already taken by another player. Please choose a different handle.`,
    };
  } catch (err) {
    console.warn('Username availability check error:', err);
    // On offline or transient errors, return available so local operation is not blocked
    return { available: true, cleanName: clean };
  }
}

/**
 * Claims a unique username in Firestore and releases the old handle if changing usernames.
 */
export async function claimUsername(
  rawNewName: string,
  uid: string,
  oldRawName?: string
): Promise<{ success: boolean; cleanName: string; error?: string }> {
  const check = await checkUsernameAvailable(rawNewName, uid);
  if (!check.available) {
    return { success: false, cleanName: check.cleanName, error: check.error };
  }

  const newClean = check.cleanName;
  const oldClean = oldRawName ? sanitizeUsername(oldRawName) : null;

  try {
    // 1. Reserve the new username in the registry
    await setDoc(doc(db, 'usernames', newClean), {
      uid,
      username: newClean,
      updatedAt: serverTimestamp(),
    });

    // 2. Release previous username if it was different
    if (oldClean && oldClean !== newClean) {
      try {
        const oldSnap = await getDoc(doc(db, 'usernames', oldClean));
        if (oldSnap.exists() && oldSnap.data()?.uid === uid) {
          await deleteDoc(doc(db, 'usernames', oldClean));
        }
      } catch {
        // Non-fatal cleanup
      }
    }

    return { success: true, cleanName: newClean };
  } catch (err: unknown) {
    console.error('Failed to claim username:', err);
    return {
      success: false,
      cleanName: newClean,
      error: err instanceof Error ? err.message : 'Could not reserve username in database.',
    };
  }
}
