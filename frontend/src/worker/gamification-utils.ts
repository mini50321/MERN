export interface GamificationData {
  user_id: string;
  xp: number;
  level: number;
  badges: string[];
  next_level_xp: number;
  progress_to_next_level: number;
}

export interface Badge {
  id: number;
  badge_key: string;
  title: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number | null;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface XPEvent {
  id: number;
  xp_amount: number;
  reason: string;
  created_at: string;
}

const XP_PER_LEVEL = 150;

export function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function calculateNextLevelXP(level: number): number {
  return level * XP_PER_LEVEL;
}

export async function getOrCreateGamification(db: any, userId: string): Promise<GamificationData> {
  let gamification = await db
    .prepare("SELECT * FROM user_gamification WHERE user_id = ?")
    .bind(userId)
    .first();

  if (!gamification) {
    await db
      .prepare("INSERT INTO user_gamification (user_id, xp, level, badges) VALUES (?, 0, 1, '[]')")
      .bind(userId)
      .run();

    gamification = await db
      .prepare("SELECT * FROM user_gamification WHERE user_id = ?")
      .bind(userId)
      .first();
  }

  const xp = Number(gamification?.xp || 0);
  const level = calculateLevel(xp);
  const badges = JSON.parse((gamification?.badges as string) || "[]");
  const nextLevelXP = calculateNextLevelXP(level);
  const progressToNextLevel = ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

  return {
    user_id: userId,
    xp,
    level,
    badges,
    next_level_xp: nextLevelXP,
    progress_to_next_level: Math.round(progressToNextLevel),
  };
}

export async function addXP(
  db: any,
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, any>
): Promise<{ success: true; new_xp: number; new_level: number; level_up: boolean; badges_unlocked: string[] }> {
  const currentData = await getOrCreateGamification(db, userId);
  const oldLevel = currentData.level;
  const newXP = currentData.xp + amount;
  const newLevel = calculateLevel(newXP);
  const levelUp = newLevel > oldLevel;

  // Update XP and level
  await db
    .prepare("UPDATE user_gamification SET xp = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?")
    .bind(newXP, newLevel, userId)
    .run();

  // Log XP event
  await db
    .prepare("INSERT INTO xp_events (user_id, xp_amount, reason, metadata) VALUES (?, ?, ?, ?)")
    .bind(userId, amount, reason, metadata ? JSON.stringify(metadata) : null)
    .run();

  // Check for badge unlocks
  const badgesUnlocked = await checkBadgeUnlocks(db, userId);

  return {
    success: true,
    new_xp: newXP,
    new_level: newLevel,
    level_up: levelUp,
    badges_unlocked: badgesUnlocked,
  };
}

async function checkBadgeUnlocks(db: any, userId: string): Promise<string[]> {
  const gamification = await getOrCreateGamification(db, userId);
  const currentBadges = new Set(gamification.badges);
  const newlyUnlocked: string[] = [];

  // Get all badges
  const { results: allBadges } = await db.prepare("SELECT * FROM badges ORDER BY display_order ASC").all();

  for (const badge of allBadges) {
    const badgeKey = badge.badge_key as string;
    
    if (currentBadges.has(badgeKey)) {
      continue; // Already unlocked
    }

    let shouldUnlock = false;

    switch (badge.condition_type) {
      case "first_action":
        const actionsCount = await db
          .prepare("SELECT COUNT(*) as count FROM completed_actions WHERE user_id = ?")
          .bind(userId)
          .first();
        shouldUnlock = Number(actionsCount?.count || 0) >= 1;
        break;

      case "streak":
        const streak = await db
          .prepare("SELECT current_streak FROM user_streaks WHERE user_id = ?")
          .bind(userId)
          .first();
        shouldUnlock = Number(streak?.current_streak || 0) >= Number(badge.condition_value || 0);
        break;

      case "level":
        shouldUnlock = gamification.level >= Number(badge.condition_value || 0);
        break;

      case "weekly_report":
        const reports = await db
          .prepare("SELECT COUNT(*) as count FROM weekly_reports WHERE user_id = ?")
          .bind(userId)
          .first();
        shouldUnlock = Number(reports?.count || 0) >= 1;
        break;

      case "advisor_questions":
        const questions = await db
          .prepare("SELECT COUNT(*) as count FROM xp_events WHERE user_id = ? AND reason = 'advisor_question'")
          .bind(userId)
          .first();
        shouldUnlock = Number(questions?.count || 0) >= Number(badge.condition_value || 0);
        break;
    }

    if (shouldUnlock) {
      currentBadges.add(badgeKey);
      newlyUnlocked.push(badgeKey);
    }
  }

  if (newlyUnlocked.length > 0) {
    const updatedBadges = Array.from(currentBadges);
    await db
      .prepare("UPDATE user_gamification SET badges = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?")
      .bind(JSON.stringify(updatedBadges), userId)
      .run();
  }

  return newlyUnlocked;
}

export async function getUserBadges(db: any, userId: string): Promise<Badge[]> {
  const gamification = await getOrCreateGamification(db, userId);
  const unlockedBadges = new Set(gamification.badges);

  const { results: allBadges } = await db.prepare("SELECT * FROM badges ORDER BY display_order ASC").all();

  return allBadges.map((badge: any) => ({
    id: badge.id,
    badge_key: badge.badge_key,
    title: badge.title,
    description: badge.description,
    icon: badge.icon,
    condition_type: badge.condition_type,
    condition_value: badge.condition_value,
    unlocked: unlockedBadges.has(badge.badge_key),
    unlocked_at: unlockedBadges.has(badge.badge_key) ? badge.created_at : undefined,
  }));
}

export async function getRecentXPEvents(db: any, userId: string, limit: number = 10): Promise<XPEvent[]> {
  const { results } = await db
    .prepare("SELECT id, xp_amount, reason, created_at FROM xp_events WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
    .bind(userId, limit)
    .all();

  return results.map((event: any) => ({
    id: event.id,
    xp_amount: event.xp_amount,
    reason: event.reason,
    created_at: event.created_at,
  }));
}
