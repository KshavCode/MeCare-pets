import { useEffect, useRef } from 'react';
import { DailyHappinessPoint } from '../types/game';

/**
 * Triggers subtle native Android / mobile haptic vibration feedback
 * when interacting with the pet, completing quests, or claiming rewards.
 */
export function triggerHaptic(pattern: number | number[] = 12): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore on unsupported browsers/devices
  }
}

/**
 * Keeps the mobile / Android APK screen awake while a focus timer quest is actively running.
 */
export function useScreenWakeLock(active: boolean): void {
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function requestWakeLock() {
      if (!active) {
        if (wakeLockRef.current) {
          try {
            await wakeLockRef.current.release();
          } catch {
            // Ignore
          }
          wakeLockRef.current = null;
        }
        return;
      }

      try {
        const nav = navigator as Navigator & {
          wakeLock?: {
            request: (type: 'screen') => Promise<{ release: () => Promise<void> }>;
          };
        };
        if (nav.wakeLock) {
          const lock = await nav.wakeLock.request('screen');
          if (cancelled) {
            await lock.release();
          } else {
            wakeLockRef.current = lock;
          }
        }
      } catch {
        // WakeLock not permitted or unsupported in current frame
      }
    }

    requestWakeLock();

    return () => {
      cancelled = true;
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [active]);
}

/**
 * Registers Android hardware back-button support so pressing Back on an Android phone/APK
 * cleanly closes the currently open modal instead of exiting the app.
 */
export function useAndroidBackHandler(
  isAnyModalOpen: boolean,
  closeAllModals: () => void
): void {
  const pushedStateRef = useRef(false);

  useEffect(() => {
    if (isAnyModalOpen && !pushedStateRef.current) {
      try {
        window.history.pushState({ evoModalOpen: true }, '');
        pushedStateRef.current = true;
      } catch {
        // Ignore history restrictions in sandboxed iframes
      }
    } else if (!isAnyModalOpen && pushedStateRef.current) {
      pushedStateRef.current = false;
    }
  }, [isAnyModalOpen]);

  useEffect(() => {
    const handlePopState = () => {
      if (isAnyModalOpen) {
        pushedStateRef.current = false;
        closeAllModals();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAnyModalOpen, closeAllModals]);
}

const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Generates or normalizes a complete 7-day happiness trend array ending on today's 4:00 AM game day.
 * Guarantees 7 clean data points for the Recharts area chart.
 */
export function getLast7DaysHappinessSeries(
  history: DailyHappinessPoint[] | undefined,
  currentHappiness: number,
  nowMs: number = Date.now(),
  accountCreatedAtIso?: string
): DailyHappinessPoint[] {
  const shiftedNow = new Date(nowMs - 4 * 60 * 60 * 1000);
  const byKey = new Map<string, DailyHappinessPoint>();

  // Today's dateKey (4:00 AM reset shifted)
  const yyyy = shiftedNow.getFullYear();
  const mm = String(shiftedNow.getMonth() + 1).padStart(2, '0');
  const dd = String(shiftedNow.getDate()).padStart(2, '0');
  const todayKey = `${yyyy}-${mm}-${dd}`;

  // If user provided accountCreatedAtIso, compute their true registration dateKey
  let accountCreatedKey = todayKey;
  if (accountCreatedAtIso) {
    try {
      const createdMs = new Date(accountCreatedAtIso).getTime();
      if (!isNaN(createdMs)) {
        const shiftedCreated = new Date(createdMs - 4 * 60 * 60 * 1000);
        const cy = shiftedCreated.getFullYear();
        const cm = String(shiftedCreated.getMonth() + 1).padStart(2, '0');
        const cd = String(shiftedCreated.getDate()).padStart(2, '0');
        accountCreatedKey = `${cy}-${cm}-${cd}`;
      }
    } catch {
      // Fallback to todayKey
    }
  }

  // Filter history: discard any historical points before account creation or in the future
  if (history && history.length > 0) {
    for (const pt of history) {
      if (
        pt &&
        pt.dateKey &&
        pt.dateKey >= accountCreatedKey &&
        pt.dateKey <= todayKey
      ) {
        byKey.set(pt.dateKey, pt);
      }
    }
  }

  // If account was created today or history only has today or is empty, strictly return Today only
  const isNewAccountToday =
    (!history || history.length === 0 || (history.length === 1 && history[0].dateKey === todayKey)) &&
    accountCreatedKey >= todayKey;

  if (isNewAccountToday) {
    const todayExisting = byKey.get(todayKey);
    return [
      {
        dateKey: todayKey,
        dayLabel: 'Today',
        happiness: Math.max(0, Math.min(100, Math.round(currentHappiness))),
        interactions: todayExisting?.interactions ?? 0,
      },
    ];
  }

  const series: DailyHappinessPoint[] = [];

  // Up to 7 rolling days, but NEVER prior to the user's actual account creation date
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(shiftedNow);
    d.setDate(d.getDate() - offset);
    const curYyyy = d.getFullYear();
    const curMm = String(d.getMonth() + 1).padStart(2, '0');
    const curDd = String(d.getDate()).padStart(2, '0');
    const dateKey = `${curYyyy}-${curMm}-${curDd}`;

    // Skip any day before the user's actual account existence
    if (dateKey < accountCreatedKey) {
      continue;
    }

    const dayLabel = offset === 0 ? 'Today' : SHORT_DAY_NAMES[d.getDay()];
    const existing = byKey.get(dateKey);

    if (offset === 0) {
      series.push({
        dateKey,
        dayLabel,
        happiness: Math.max(0, Math.min(100, Math.round(currentHappiness))),
        interactions: existing?.interactions ?? 0,
      });
    } else if (existing) {
      series.push({
        ...existing,
        dayLabel,
      });
    } else if (byKey.size > 1 && series.length > 0) {
      // Days after account creation when user had no interactions
      const prevMood =
        series.length > 0 ? series[series.length - 1].happiness : currentHappiness;
      series.push({
        dateKey,
        dayLabel,
        happiness: prevMood,
        interactions: 0,
      });
    }
  }

  if (series.length === 0) {
    series.push({
      dateKey: todayKey,
      dayLabel: 'Today',
      happiness: Math.max(0, Math.min(100, Math.round(currentHappiness))),
      interactions: 0,
    });
  }

  return series;
}

/**
 * Updates the rolling 7-day happiness history when the user interacts with their pet or completes a task.
 */
export function getUpdated7DayHappinessHistory(
  history: DailyHappinessPoint[] | undefined,
  newHappiness: number,
  interactionDelta: number = 0,
  nowMs: number = Date.now(),
  accountCreatedAtIso?: string
): DailyHappinessPoint[] {
  const series = getLast7DaysHappinessSeries(
    history,
    newHappiness,
    nowMs,
    accountCreatedAtIso
  );
  const lastIdx = series.length - 1;
  if (lastIdx >= 0) {
    series[lastIdx] = {
      ...series[lastIdx],
      happiness: Math.max(0, Math.min(100, Math.round(newHappiness))),
      interactions:
        (series[lastIdx].interactions || 0) + Math.max(0, interactionDelta),
    };
  }
  return series;
}
