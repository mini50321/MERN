import { useEffect, useState } from "react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Trophy, Award, Star, TrendingUp, Calendar, Sparkles } from "lucide-react";

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

export default function Gamification() {
  const [data, setData] = useState<GamificationData | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [recentXP, setRecentXP] = useState<XPEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      const [dataRes, badgesRes, xpRes] = await Promise.all([
        fetch("/api/gamification"),
        fetch("/api/gamification/badges"),
        fetch("/api/gamification/recent-xp?limit=20"),
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

  const formatReason = (reason: string): string => {
    const reasonMap: Record<string, string> = {
      daily_action_completed: "Completed Daily Action",
      all_daily_actions_completed: "Completed All Daily Actions",
      streak_maintained: "Maintained Daily Streak",
      weekly_report_viewed: "Viewed Weekly Report",
      advisor_question: "Asked AI Advisor",
    };
    return reasonMap[reason] || reason;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return null;
  }

  const unlockedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);
  const currentLevelXP = (data.level - 1) * 150;
  const xpInCurrentLevel = data.xp - currentLevelXP;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 pb-20 lg:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-purple-600" />
            Your Progress
          </h1>
          <p className="text-gray-600">Track your achievements and level up your career</p>
        </div>

        {/* Level & XP Card */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 mb-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-purple-100 mb-2">Current Level</p>
              <div className="text-6xl font-black">Level {data.level}</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
              <Star className="w-12 h-12 mx-auto mb-2" />
              <div className="text-3xl font-bold">{data.xp}</div>
              <p className="text-sm text-purple-100">Total XP</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span>{xpInCurrentLevel} / 150 XP</span>
              <span className="font-semibold">{data.progress_to_next_level}%</span>
            </div>
            <div className="h-4 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${data.progress_to_next_level}%` }}
              />
            </div>
            <p className="text-sm text-purple-100 mt-2">
              {data.next_level_xp - data.xp} XP until Level {data.level + 1}
            </p>
          </div>
        </div>

        {/* Badges Section */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-purple-600" />
              Badges
            </h2>
            <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold">
              {unlockedBadges.length} / {badges.length}
            </div>
          </div>

          {unlockedBadges.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Unlocked
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {unlockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 text-center hover:shadow-md transition-all"
                  >
                    <div className="text-5xl mb-2">{badge.icon}</div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{badge.title}</h4>
                    <p className="text-xs text-gray-600">{badge.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lockedBadges.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Locked</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {lockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-center opacity-60"
                  >
                    <div className="text-5xl mb-2 grayscale">{badge.icon}</div>
                    <h4 className="font-bold text-gray-600 text-sm mb-1">{badge.title}</h4>
                    <p className="text-xs text-gray-500">{badge.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* XP History */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            XP History
          </h2>

          {recentXP.length > 0 ? (
            <div className="space-y-3">
              {recentXP.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Star className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{formatReason(event.reason)}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(event.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-600">+{event.xp_amount}</p>
                    <p className="text-xs text-gray-500">XP</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No XP earned yet. Complete actions to start earning!</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
