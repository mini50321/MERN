import { useEffect, useState } from "react";
import { TrendingUp, Target, Sparkles, Calendar, X } from "lucide-react";

interface WeeklyReport {
  id: number;
  week_start: string;
  week_end: string;
  completed_actions_count: number;
  new_skills_added: number;
  streak_start: number;
  streak_end: number;
  engagement_score: number;
  ai_summary: string;
  ai_recommendations: string;
  ai_predictions: string;
}

export default function WeeklyInsightsPanel() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewReport, setHasNewReport] = useState(false);

  useEffect(() => {
    checkForNewReport();
  }, []);

  const checkForNewReport = async () => {
    try {
      const response = await fetch("/api/weekly-report");
      if (response.ok) {
        const data = await response.json();
        setReport(data);
        
        // Check if this is a new report (created in last 24 hours)
        const reportAge = Date.now() - new Date(data.created_at).getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        setHasNewReport(reportAge < oneDayMs);

        // Trigger gamification update event (XP awarded on backend)
        window.dispatchEvent(new CustomEvent('xp-updated'));
      }
    } catch (error) {
      console.error("Error fetching weekly report:", error);
    } finally {
      setLoading(false);
    }
  };

  const parseRecommendations = (text: string): string[] => {
    if (!text) return [];
    try {
      return JSON.parse(text);
    } catch {
      return text.split('\n').filter(line => line.trim());
    }
  };

  const parsePredictions = (text: string): string[] => {
    if (!text) return [];
    try {
      return JSON.parse(text);
    } catch {
      return text.split('\n').filter(line => line.trim());
    }
  };

  if (loading) {
    return null;
  }

  // Notification badge
  if (!isOpen && report && hasNewReport) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-4 lg:right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 z-40"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-medium">New Weekly Report</span>
      </button>
    );
  }

  if (!isOpen || !report) {
    return null;
  }

  const recommendations = parseRecommendations(report.ai_recommendations);
  const predictions = parsePredictions(report.ai_predictions);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Weekly Insights</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-purple-100">
            <Calendar className="w-4 h-4" />
            <p className="text-sm">
              {formatDate(report.week_start)} - {formatDate(report.week_end)}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* AI Summary */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Week Summary
            </h3>
            <p className="text-gray-700 leading-relaxed">{report.ai_summary}</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {report.completed_actions_count}
              </div>
              <div className="text-sm text-gray-600">Actions Completed</div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {report.streak_end}
              </div>
              <div className="text-sm text-gray-600">
                Streak Progress
                {report.streak_start !== report.streak_end && (
                  <span className="text-xs ml-1">
                    ({report.streak_start} → {report.streak_end})
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {report.new_skills_added}
              </div>
              <div className="text-sm text-gray-600">Skills Added</div>
            </div>
            
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {report.engagement_score}
              </div>
              <div className="text-sm text-gray-600">Engagement Score</div>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Recommendations for Next Week
              </h3>
              <ul className="space-y-2">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-indigo-600 font-semibold mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Predictions */}
          {predictions.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Predictions & Trends
              </h3>
              <ul className="space-y-2">
                {predictions.map((pred, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-indigo-600 font-semibold mt-1">→</span>
                    <span>{pred}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
