import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Award, Sparkles } from "lucide-react";

interface GamificationData {
  xp: number;
  level: number;
  badges: string[];
  next_level_xp: number;
  progress_to_next_level: number;
}

interface Badge {
  id: number;
  badge_key: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface XPEvent {
  id: number;
  xp_amount: number;
  reason: string;
  created_at: string;
}

export default function GamificationPanel() {
  const [data, setData] = useState<GamificationData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [recentXP, setRecentXP] = useState<XPEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();

    // Listen for XP update events
    const handleXPUpdate = () => {
      loadGamificationData();
    };

    window.addEventListener('xp-updated', handleXPUpdate);

    return () => {
      window.removeEventListener('xp-updated', handleXPUpdate);
    };
  }, []);

  const loadGamificationData = async () => {
    try {
      const [dataRes, badgesRes, xpRes] = await Promise.all([
        fetch("/api/gamification"),
        fetch("/api/gamification/badges"),
        fetch("/api/gamification/recent-xp?limit=5"),
      ]);

      if (dataRes.ok) {
        const gamData = await dataRes.json();
        setData(gamData);
      }

      if (badgesRes.ok) {
        const badgeData = await badgesRes.json();
        setBadges(badgeData.badges || []);
      }

      if (xpRes.ok) {
        const xpData = await xpRes.json();
        setRecentXP(xpData.events || []);
      }
    } catch (error) {
      console.error("Error loading gamification data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-purple-200 rounded w-1/3"></div>
          <div className="h-24 bg-purple-200 rounded"></div>
          <div className="h-16 bg-purple-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const unlockedBadges = badges.filter((b) => b.unlocked);

  const formatReason = (reason: string): string => {
    const reasonMap: Record<string, string> = {
      daily_action_completed: "Daily Action",
      all_daily_actions_completed: "All Actions Done!",
      streak_maintained: "Streak Bonus",
      weekly_report_viewed: "Weekly Report",
      advisor_question: "AI Advisor",
    };
    return reasonMap[reason] || reason;
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 mb-4 border border-purple-100">
      {/* Compact Header with Progress */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-bold text-gray-900">Progress</h2>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full">
            <span className="text-xs font-bold">Lvl {data.level}</span>
          </div>
        </div>
        <span className="text-xs font-semibold text-purple-600">{data.progress_to_next_level}% to next</span>
      </div>

      {/* Compact XP Progress Bar */}
      <div className="mb-3">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
            style={{ width: `${data.progress_to_next_level}%` }}
          />
        </div>
      </div>

      {/* Horizontal Layout for Badges and Activity */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Badges Section - Compact */}
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <Award className="w-3 h-3 text-purple-600" />
            Badges ({unlockedBadges.length})
          </h3>
          <div className="flex gap-2">
            {badges.slice(0, 3).map((badge) => (
              <div
                key={badge.id}
                className={`relative ${
                  badge.unlocked
                    ? "bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300"
                    : "bg-gray-100 border-gray-300"
                } border rounded-lg p-2 flex flex-col items-center justify-center transition-all hover:scale-105`}
                title={`${badge.title}: ${badge.description}`}
              >
                <div
                  className={`text-xl ${badge.unlocked ? "grayscale-0" : "grayscale opacity-30"}`}
                >
                  {badge.icon}
                </div>
                {badge.unlocked && (
                  <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5">
                    <Sparkles className="w-2 h-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity - Compact */}
        {recentXP.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-purple-600" />
              Recent Activity
            </h3>
            <div className="space-y-1">
              {recentXP.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between bg-white rounded-lg px-2 py-1 border border-purple-100"
                >
                  <span className="text-xs text-gray-700">{formatReason(event.reason)}</span>
                  <span className="text-xs font-bold text-purple-600">+{event.xp_amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
