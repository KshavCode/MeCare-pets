/**
 * Firestore Security Rules Test Specification (Dirty Dozen Verification)
 * Verifies that all 12 adversarial payloads defined in security_spec.md are rejected.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  existingData?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on User Create',
    operation: 'create',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: true },
    payload: { uid: 'user_B', username: 'spoofed' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Spoof',
    operation: 'create',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: false },
    payload: { uid: 'user_A', username: 'unverified' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on User Update',
    operation: 'update',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: true },
    payload: { uid: 'user_A', isAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Value Poisoning on Companion Vitals',
    operation: 'update',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: true },
    payload: { petHealth: 99999, gold: -500 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Unbounded Array Exhaustion',
    operation: 'update',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: true },
    payload: { unlockedSpecies: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Immortal Field Mutation',
    operation: 'update',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: true },
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Orphaned Task Write / Master Gate Bypass',
    operation: 'create',
    path: '/users/user_B/tasks/task_1',
    auth: { uid: 'user_B', email_verified: true },
    payload: { ownerId: 'user_B', title: 'Orphan task' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Cross-Tenant Task Read',
    operation: 'get',
    path: '/users/user_B/tasks/task_1',
    auth: { uid: 'user_A', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Terminal State Lock Bypass',
    operation: 'update',
    path: '/users/user_A/tasks/task_1',
    auth: { uid: 'user_A', email_verified: true },
    existingData: { status: 'completed' },
    payload: { status: 'pending' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Task Action Key Leakage',
    operation: 'update',
    path: '/users/user_A/tasks/task_1',
    auth: { uid: 'user_A', email_verified: true },
    existingData: { status: 'pending', xpReward: 25 },
    payload: { status: 'completed', xpReward: 999999 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Path ID Poisoning',
    operation: 'create',
    path: '/users/user_A/tasks/invalid$id!',
    auth: { uid: 'user_A', email_verified: true },
    payload: { ownerId: 'user_A', title: 'Invalid ID' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Forged Client Timestamp',
    operation: 'update',
    path: '/users/user_A/tasks/task_1',
    auth: { uid: 'user_A', email_verified: true },
    payload: { status: 'completed', updatedAt: '2099-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
];
