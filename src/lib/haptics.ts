import * as Haptics from 'expo-haptics';

let enabled = true;
export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

const safe = (fn: () => Promise<unknown>) => {
  if (!enabled) return;
  void fn().catch(() => {
    /* haptics are decoration; never let them throw into a game */
  });
};

export const haptics = {
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  press: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  thud: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warn: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  /**
   * Deliberately identical for crew and ringer. A distinct buzz per role is
   * tempting and leaks the role to anyone watching hands at the table.
   */
  reveal: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
};
