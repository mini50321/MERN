import { useState, useEffect } from "react";
import { 
  Scissors, 
  Save, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Type,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

interface RibbonSettings {
  ribbon_cutting_enabled: string;
  ribbon_heading: string;
  ribbon_subheading: string;
  ribbon_instruction: string;
  ribbon_button_text: string;
  ribbon_badge_text: string;
  ribbon_version: string;
}

export default function RibbonSettingsPanel() {
  const [settings, setSettings] = useState<RibbonSettings>({
    ribbon_cutting_enabled: "false",
    ribbon_heading: "Grand Opening",
    ribbon_subheading: "Welcome to the Future of Healthcare",
    ribbon_instruction: "Cut the ribbon to enter",
    ribbon_button_text: "CUT",
    ribbon_badge_text: "VIP Launch",
    ribbon_version: "1",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [resetStatus, setResetStatus] = useState<"idle" | "success" | "error">("idle");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ribbon-settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error loading ribbon settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const res = await fetch("/api/admin/ribbon-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving ribbon settings:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("This will show the ribbon cutting ceremony to ALL visitors again, even those who already cut it. Are you sure?")) {
      return;
    }

    setIsResetting(true);
    setResetStatus("idle");

    try {
      const res = await fetch("/api/admin/ribbon-settings/reset", {
        method: "POST",
      });

      if (res.ok) {
        setResetStatus("success");
        loadSettings(); // Reload to get new version
        setTimeout(() => setResetStatus("idle"), 3000);
      } else {
        setResetStatus("error");
      }
    } catch (error) {
      console.error("Error resetting ribbon:", error);
      setResetStatus("error");
    } finally {
      setIsResetting(false);
    }
  };

  const toggleEnabled = () => {
    setSettings(prev => ({
      ...prev,
      ribbon_cutting_enabled: prev.ribbon_cutting_enabled === "true" ? "false" : "true"
    }));
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading ribbon settings...</p>
      </div>
    );
  }

  const isEnabled = settings.ribbon_cutting_enabled === "true";

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Grand Opening Ribbon</h2>
              <p className="text-pink-100 text-sm">Control the VIP ribbon cutting experience for visitors</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${isEnabled ? 'bg-green-500/30' : 'bg-white/10'}`}>
              <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="font-semibold">{isEnabled ? "Ribbon Active" : "Ribbon Disabled"}</span>
            </div>
            <span className="text-pink-200 text-sm">Version: {settings.ribbon_version || "1"}</span>
          </div>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          {/* Enable/Disable Toggle */}
          <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Enable Ribbon Cutting</h3>
                <p className="text-sm text-gray-600">
                  When enabled, new visitors will see a grand opening ribbon on the homepage
                </p>
              </div>
              <button
                onClick={toggleEnabled}
                className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                  isEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  isEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}>
                  {isEnabled ? (
                    <ToggleRight className="w-4 h-4 text-green-500 absolute top-1 left-1" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 text-gray-400 absolute top-1 left-1" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Text Settings */}
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Type className="w-5 h-5 text-purple-600" />
              Customize Ribbon Text
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badge Text
                </label>
                <input
                  type="text"
                  value={settings.ribbon_badge_text}
                  onChange={(e) => setSettings(prev => ({ ...prev, ribbon_badge_text: e.target.value }))}
                  placeholder="VIP Launch"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Shown at the top in a badge</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  value={settings.ribbon_button_text}
                  onChange={(e) => setSettings(prev => ({ ...prev, ribbon_button_text: e.target.value }))}
                  placeholder="CUT"
                  maxLength={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Text on the cut button (max 10 chars)</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Heading
                </label>
                <input
                  type="text"
                  value={settings.ribbon_heading}
                  onChange={(e) => setSettings(prev => ({ ...prev, ribbon_heading: e.target.value }))}
                  placeholder="Grand Opening"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Large golden text displayed prominently</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subheading
                </label>
                <input
                  type="text"
                  value={settings.ribbon_subheading}
                  onChange={(e) => setSettings(prev => ({ ...prev, ribbon_subheading: e.target.value }))}
                  placeholder="Welcome to the Future of Healthcare"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Smaller text below the heading</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instruction Text
                </label>
                <input
                  type="text"
                  value={settings.ribbon_instruction}
                  onChange={(e) => setSettings(prev => ({ ...prev, ribbon_instruction: e.target.value }))}
                  placeholder="Cut the ribbon to enter"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Call-to-action text</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>

            {saveStatus === "success" && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Settings saved!</span>
              </div>
            )}

            {saveStatus === "error" && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>Failed to save</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <span className="text-white font-semibold">Preview</span>
            <span className="text-gray-400 text-sm">How visitors will see the ribbon</span>
          </div>
          <div className="relative h-96 flex items-center justify-center overflow-hidden">
            {/* Sparkle background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    opacity: Math.random() * 0.7 + 0.3
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm rounded-full border border-yellow-500/30 mb-4">
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span className="text-yellow-300 font-semibold tracking-wider uppercase text-sm">
                  {settings.ribbon_badge_text || "VIP Launch"}
                </span>
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
              </div>
              
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  {settings.ribbon_heading || "Grand Opening"}
                </span>
              </h1>
              <p className="text-lg text-blue-200 mb-1">{settings.ribbon_subheading || "Welcome to the Future of Healthcare"}</p>
              <p className="text-gray-400">{settings.ribbon_instruction || "Cut the ribbon to enter"}</p>

              <div className="mt-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-full flex items-center justify-center shadow-xl">
                  <div className="flex flex-col items-center">
                    <Scissors className="w-8 h-8 text-red-700" />
                    <span className="text-red-800 font-bold text-xs mt-0.5">{settings.ribbon_button_text || "CUT"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Section */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-2">Reset Ribbon for All Users</h3>
            <p className="text-sm text-amber-800 mb-4">
              Use this to show the ribbon cutting ceremony to everyone again, including visitors who have already seen and cut it. 
              This is useful for re-launching a special event or celebration.
            </p>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isResetting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Reset for All Users
                </>
              )}
            </button>

            {resetStatus === "success" && (
              <div className="mt-3 flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Ribbon reset! All visitors will see it again.</span>
              </div>
            )}

            {resetStatus === "error" && (
              <div className="mt-3 flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>Failed to reset ribbon</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
