# EvoQuest Security Specification (Phase 0 TDD)

## 1. Data Invariants & Master Source of Truth

1. **Master Source of Truth (`/users/{userId}`)**:
   - Every user profile document at `/users/{userId}` is strictly owned by `request.auth.uid == userId`.
   - Zero PII (no emails, phone numbers, or physical addresses) is stored in `/users/{userId}`.
   - `uid` and `createdAt` are immutable after creation.
   - All numeric companion vitals (`petHealth`, `petHappiness`, `petEnergy`) are bounded within `[0, 100]`.
   - `petXp`, `gold`, `streakDays`, `cheatCount`, and `totalTasksCompleted` are non-negative numbers bounded within `[0, 1000000]`.
   - `unlockedSpecies` is a strictly bounded array (`size() >= 1 && size() <= 5`) where `unlockedSpecies[0] is string && unlockedSpecies[0].size() <= 32`.

2. **Relational Subcollection Sync (`/users/{userId}/tasks/{taskId}`)**:
   - A task cannot exist or be accessed unless the parent `/users/{userId}` document exists and its `uid` matches `request.auth.uid` (The "Master Gate").
   - `ownerId` inside every task document must equal `request.auth.uid` and `userId`.
   - **Terminal State Locking**: Once a task's `status` transitions from `'pending'` to `'completed'` or `'penalized'`, no further updates are permitted on that task document.
   - **Secure List Queries**: `allow list` on `/users/{userId}/tasks/{taskId}` explicitly checks `resource.data.ownerId == request.auth.uid` without calling `get()` or `isValidId(taskId)`.

3. **Temporal & Identity Integrity**:
   - Every write requires `request.auth != null && request.auth.token.email_verified == true`.
   - On `create`: `incoming().createdAt == request.time && incoming().updatedAt == request.time`.
   - On `update`: `incoming().createdAt == existing().createdAt && incoming().updatedAt == request.time`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Identity Spoofing on User Create)**: Authenticated user `user_A` attempts to create `/users/user_A` with `uid: "user_B"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Unverified Email Spoof)**: User with `email_verified: false` attempts to create `/users/user_A`. -> `PERMISSION_DENIED`
3. **Payload 3 (Shadow Field Injection on User Update)**: `user_A` updates `/users/user_A` with an undeclared field `isAdmin: true`. -> `PERMISSION_DENIED`
4. **Payload 4 (Value Poisoning on Companion Vitals)**: `user_A` attempts to set `petHealth: 99999` or `gold: -500` on `/users/user_A`. -> `PERMISSION_DENIED`
5. **Payload 5 (Unbounded Array Exhaustion)**: `user_A` attempts to write `unlockedSpecies` with 20 elements to `/users/user_A`. -> `PERMISSION_DENIED`
6. **Payload 6 (Immortal Field Mutation)**: `user_A` attempts to modify `createdAt` or `uid` during an update to `/users/user_A`. -> `PERMISSION_DENIED`
7. **Payload 7 (Orphaned Task Write / Master Gate Bypass)**: `user_B` attempts to create `/users/user_B/tasks/task_1` when `/users/user_B` does not exist. -> `PERMISSION_DENIED`
8. **Payload 8 (Cross-Tenant Task Read)**: `user_A` attempts to `get` or `list` `/users/user_B/tasks/task_1`. -> `PERMISSION_DENIED`
9. **Payload 9 (Terminal State Lock Bypass)**: `user_A` attempts to update a task whose existing `status` is already `'completed'` or `'penalized'`. -> `PERMISSION_DENIED`
10. **Payload 10 (Task Action Key Leakage)**: `user_A` transitions task `status` to `'completed'` while simultaneously mutating `xpReward: 999999`. -> `PERMISSION_DENIED`
11. **Payload 11 (Path ID Poisoning)**: `user_A` attempts to create a task with a 300-character or special-character document ID `task$#@!`. -> `PERMISSION_DENIED`
12. **Payload 12 (Forged Client Timestamp)**: `user_A` sends a past or future timestamp in `updatedAt` instead of `request.time`. -> `PERMISSION_DENIED`
