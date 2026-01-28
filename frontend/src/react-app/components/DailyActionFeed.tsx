import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { CheckCircle2, Circle, Flame, Loader2, Sparkles } from "lucide-react";

interface Action {
  id: number;
  title: string;
  description: string;
  action_type: string;
  is_completed: boolean;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
}

export default function DailyActionFeed() {
  const { user } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [streak, setStreak] = useState<StreakData>({ current_streak: 0, longest_streak: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [completingId, setCompletingId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadDailyActions();
    }
  }, [user]);

  const loadDailyActions = async () => {
    setIsLoading(true);
    try {
      const [actionsRes, streakRes] = await Promise.all([
        fetch("/api/daily-actions"),
        fetch("/api/daily-actions/streak"),
      ]);

      if (actionsRes.ok) {
        const data = await actionsRes.json();
        setActions(data.actions || []);
      }

      if (streakRes.ok) {
        const data = await streakRes.json();
        setStreak(data);
      }
    } catch (error) {
      console.error("Error loading daily actions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteAction = async (actionId: number) => {
    setCompletingId(actionId);
    try {
      const response = await fetch(`/api/daily-actions/${actionId}/complete`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update action completion status
        setActions(actions.map(action => 
          action.id === actionId 
            ? { ...action, is_completed: true }
            : action
        ));

        // Update streak
        if (data.streak) {
          setStreak(data.streak);
        }

        // Trigger gamification update event
        window.dispatchEvent(new CustomEvent('xp-updated'));
      }
    } catch (error) {
      console.error("Error completing action:", error);
    } finally {
      setCompletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading your daily actions...</span>
        </div>
      </div>
    );
  }

  if (actions.length === 0) {
    return null;
  }

  const completedCount = actions.filter(a => a.is_completed).length;
  const progressPercent = (completedCount / actions.length) * 100;

  // Sort actions: incomplete first, completed last
  const sortedActions = [...actions].sort((a, b) => {
    if (a.is_completed === b.is_completed) return 0;
    return a.is_completed ? 1 : -1;
  });

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-6 mb-4 border border-blue-100">
      {/* Header with Streak */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Today's Actions</h2>
        </div>
        
        {streak.current_streak > 0 && (
          <div className="flex items-center gap-2 bg-orange-100 px-3 py-1.5 rounded-full">
            <Flame className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-bold text-orange-600">
              {streak.current_streak} day streak
            </span>
          </div>
        )}
      </div>

      {/* Actions Grid */}
      <div className="space-y-2 mb-4">
        {sortedActions.map((action) => (
          <button
            key={action.id}
            onClick={() => !action.is_completed && handleCompleteAction(action.id)}
            disabled={action.is_completed || completingId === action.id}
            className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all ${
              action.is_completed
                ? "bg-green-50 border-green-200"
                : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md"
            } ${completingId === action.id ? "opacity-50" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {completingId === action.id ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                ) : action.is_completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-sm sm:text-base mb-1 ${
                  action.is_completed ? "text-green-700 line-through" : "text-gray-900"
                }`}>
                  {action.title}
                </h3>
                <p className={`text-xs sm:text-sm ${
                  action.is_completed ? "text-green-600" : "text-gray-600"
                }`}>
                  {action.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Progress Bar at Bottom */}
      <div className="pt-2 border-t border-blue-200">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>{completedCount} of {actions.length} completed</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Encouragement */}
      {completedCount === actions.length && (
        <div className="mt-4 p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white text-center">
          <p className="font-semibold">🎉 Amazing! You completed all today's actions!</p>
          <p className="text-sm text-green-100 mt-1">Come back tomorrow for new challenges</p>
        </div>
      )}
    </div>
  );
}
