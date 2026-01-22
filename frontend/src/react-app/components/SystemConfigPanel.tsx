import { useState, useEffect } from "react";
import { 
  Settings, 
  Save, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  Key,
  Database,
  Cloud,
  Mail,
  MessageSquare,
  Globe,
  Server,
  Lock,
  AlertCircle,
  RefreshCw,
  Info,
  Code,
  Layers,
  Cpu,
  HardDrive,
  Zap,
  CreditCard,
  Map
} from "lucide-react";

interface SystemConfig {
  id: number;
  config_key: string;
  config_value: string;
  config_category: string;
  is_sensitive: number;
  description: string;
  has_value: boolean;
}

const categoryIcons: Record<string, any> = {
  ai_services: Server,
  sms_service: MessageSquare,
  email_service: Mail,
  payment_service: CreditCard,
  maps_service: Map,
  database: Database,
  storage: Cloud,
  version_control: Globe,
  custom: Settings,
};

const categoryLabels: Record<string, string> = {
  ai_services: "AI Services",
  sms_service: "SMS Service",
  email_service: "Email Service",
  payment_service: "Payment Gateway",
  maps_service: "Maps & Location",
  database: "Database",
  storage: "Cloud Storage",
  version_control: "Version Control",
  custom: "Custom Services",
};

// Detailed function descriptions for each configuration
const configFunctions: Record<string, { 
  features: string[]; 
  setup?: string;
  critical?: boolean;
}> = {
  GEMINI_API_KEY: {
    features: [
      "AI Chatbot (Business Advisor / Career Advisor)",
      "Daily action items generation",
      "Weekly insights and reports generation",
      "Job posting AI auto-fill",
      "Content fetching (news and exhibitions)",
      "Smart recommendations"
    ],
    setup: "Get your API key from Google AI Studio (ai.google.dev). Free tier available with usage limits.",
    critical: true
  },
  OPENAI_API_KEY: {
    features: [
      "Alternative AI service for chatbot",
      "Advanced content generation",
      "GPT-4 powered features (if needed)"
    ],
    setup: "Optional. Get from platform.openai.com. Requires billing setup.",
    critical: false
  },
  MODEL_HOSTING_URL: {
    features: [
      "Custom AI model deployment endpoint",
      "Self-hosted model inference"
    ],
    setup: "Optional. URL of your custom model server if hosting your own AI models.",
    critical: false
  },
  FAST2SMS_API_KEY: {
    features: [
      "OTP verification during login",
      "Phone number verification",
      "SMS notifications to users"
    ],
    setup: "Get from fast2sms.com (India). Requires account creation and recharge for SMS credits.",
    critical: true
  },
  RESEND_API_KEY: {
    features: [
      "Transactional emails (job applications, notifications)",
      "Password reset emails",
      "Contact form submissions",
      "Welcome emails"
    ],
    setup: "Get from resend.com. Free tier: 100 emails/day. Verify your domain for production use.",
    critical: true
  },
  RAZORPAY_KEY_ID: {
    features: [
      "Subscription payments (Free/Pro/Premium tiers)",
      "One-time payments",
      "Fundraiser donations",
      "Course enrollments",
      "Service order payments",
      "Payment gateway integration"
    ],
    setup: "Get from razorpay.com (India). Sign up → Dashboard → Settings → API Keys. Generate Key ID and Secret. Supports UPI, Cards, Net Banking, Wallets.",
    critical: true
  },
  RAZORPAY_KEY_SECRET: {
    features: [
      "Backend payment authentication",
      "Secure payment verification",
      "Webhook signature validation"
    ],
    setup: "Secret key from Razorpay Dashboard. NEVER expose this to frontend. Keep highly secure.",
    critical: true
  },
  RAZORPAY_WEBHOOK_SECRET: {
    features: [
      "Payment webhook verification",
      "Real-time payment status updates",
      "Automatic subscription renewal handling"
    ],
    setup: "Generate from Razorpay Dashboard → Webhooks → Add New Webhook → Set URL to your /api/razorpay/webhook endpoint.",
    critical: true
  },
  GOOGLE_MAPS_API_KEY: {
    features: [
      "Interactive maps with advanced features",
      "Location picker with autocomplete",
      "Place search and geocoding",
      "Directions and route planning",
      "Street view integration",
      "Better performance and stability than Leaflet"
    ],
    setup: "Get from Google Cloud Console (console.cloud.google.com) → APIs & Services → Credentials → Create API Key → Enable Maps JavaScript API, Places API, and Geocoding API. Free tier: $200 credit/month.",
    critical: false
  },
  MAPS_PROVIDER: {
    features: [
      "Choose between Leaflet (free, OpenStreetMap) and Google Maps (premium, requires API key)",
      "Controls all map components across the app",
      "Affects patient booking, location pickers, service areas"
    ],
    setup: "Set to 'leaflet' (default, free) or 'google_maps' (requires Google Maps API Key). Leaflet uses OpenStreetMap data. Google Maps provides better data quality and features but requires paid API key.",
    critical: false
  },
  MONGODB_URI: {
    features: [
      "Alternative database connection (if migrating from D1)",
      "Data backup and sync"
    ],
    setup: "Optional. MongoDB Atlas connection string. Default app uses Cloudflare D1 (SQLite).",
    critical: false
  },
  MONGODB_DATABASE: {
    features: [
      "Database name for MongoDB connection"
    ],
    setup: "Optional. Specify database name if using MongoDB.",
    critical: false
  },
  R2_ACCESS_KEY_ID: {
    features: [
      "File uploads (profile pictures, resumes, documents)",
      "Course video storage",
      "Product images and catalogs",
      "KYC document storage"
    ],
    setup: "Cloudflare R2 access key. Get from Cloudflare Dashboard → R2 → Manage R2 API Tokens. Already configured via Mocha platform.",
    critical: true
  },
  R2_SECRET_ACCESS_KEY: {
    features: [
      "Authentication for R2 storage operations"
    ],
    setup: "Cloudflare R2 secret key. Keep this secure - treat like a password.",
    critical: true
  },
  R2_BUCKET_NAME: {
    features: [
      "Storage bucket for all uploaded files"
    ],
    setup: "Name of your R2 bucket. Default: configured automatically by Mocha.",
    critical: true
  },
  R2_REGION: {
    features: [
      "Geographic region for R2 storage"
    ],
    setup: "Usually 'auto' for R2. Determines data center location.",
    critical: false
  },
  S3_ACCESS_KEY_ID: {
    features: [
      "Alternative to R2 - AWS S3 file storage",
      "File uploads and document storage"
    ],
    setup: "Optional. AWS IAM access key if using S3 instead of R2. Get from AWS Console → IAM.",
    critical: false
  },
  S3_SECRET_ACCESS_KEY: {
    features: [
      "Authentication for S3 storage operations"
    ],
    setup: "Optional. AWS IAM secret key. Keep secure.",
    critical: false
  },
  S3_BUCKET_NAME: {
    features: [
      "S3 bucket name for file storage"
    ],
    setup: "Optional. Your S3 bucket name if using AWS instead of R2.",
    critical: false
  },
  S3_REGION: {
    features: [
      "AWS region for S3 bucket"
    ],
    setup: "Optional. e.g., 'us-east-1', 'ap-south-1'. Must match your bucket's region.",
    critical: false
  },
  GITHUB_REPO_URL: {
    features: [
      "Version control integration",
      "Code repository access",
      "Deployment automation"
    ],
    setup: "Optional. Your GitHub repository URL for version control tracking.",
    critical: false
  },
  GITHUB_ACCESS_TOKEN: {
    features: [
      "GitHub API authentication",
      "Repository operations"
    ],
    setup: "Optional. Personal access token from GitHub → Settings → Developer settings → Personal access tokens.",
    critical: false
  },
  CUSTOM_API_ENDPOINT: {
    features: [
      "Integration with custom third-party services",
      "External API connections"
    ],
    setup: "Optional. URL of any custom API you want to integrate.",
    critical: false
  },
  CUSTOM_API_KEY: {
    features: [
      "Authentication for custom API endpoint"
    ],
    setup: "Optional. Authentication key for your custom API.",
    critical: false
  }
};

export default function SystemConfigPanel() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingValues, setEditingValues] = useState<Record<number, string>>({});
  const [showValues, setShowValues] = useState<Record<number, boolean>>({});
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [testingIds, setTestingIds] = useState<Set<number>>(new Set());
  const [saveStatus, setSaveStatus] = useState<Record<number, 'success' | 'error' | null>>({});
  const [testResults, setTestResults] = useState<Record<number, { success: boolean; message: string } | null>>({});
  const [expandedConfigs, setExpandedConfigs] = useState<Set<number>>(new Set());
  const [isPushingToGit, setIsPushingToGit] = useState(false);
  const [gitPushResult, setGitPushResult] = useState<{ success: boolean; message: string; commitUrl?: string } | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/system-config");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      } else {
        console.error("Failed to load system config");
      }
    } catch (error) {
      console.error("Error loading system config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (configId: number) => {
    const value = editingValues[configId];
    if (value === undefined) return;

    setSavingIds(prev => new Set(prev).add(configId));
    setSaveStatus(prev => ({ ...prev, [configId]: null }));

    try {
      const res = await fetch(`/api/admin/system-config/${configId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config_value: value }),
      });

      if (res.ok) {
        setSaveStatus(prev => ({ ...prev, [configId]: 'success' }));
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [configId]: null }));
        }, 3000);
        loadConfigs();
      } else {
        setSaveStatus(prev => ({ ...prev, [configId]: 'error' }));
      }
    } catch (error) {
      console.error("Error saving config:", error);
      setSaveStatus(prev => ({ ...prev, [configId]: 'error' }));
    } finally {
      setSavingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(configId);
        return newSet;
      });
    }
  };

  const handleTest = async (configId: number, configKey: string) => {
    const value = editingValues[configId];
    if (!value) {
      setTestResults(prev => ({ 
        ...prev, 
        [configId]: { success: false, message: "Please enter a value first" } 
      }));
      return;
    }

    setTestingIds(prev => new Set(prev).add(configId));
    setTestResults(prev => ({ ...prev, [configId]: null }));

    try {
      const res = await fetch("/api/admin/system-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config_key: configKey, config_value: value }),
      });

      if (res.ok) {
        const result = await res.json();
        setTestResults(prev => ({ ...prev, [configId]: result }));
        setTimeout(() => {
          setTestResults(prev => ({ ...prev, [configId]: null }));
        }, 5000);
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          [configId]: { success: false, message: "Test request failed" } 
        }));
      }
    } catch (error) {
      console.error("Error testing config:", error);
      setTestResults(prev => ({ 
        ...prev, 
        [configId]: { success: false, message: "Network error during test" } 
      }));
    } finally {
      setTestingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(configId);
        return newSet;
      });
    }
  };

  const toggleShowValue = (configId: number) => {
    setShowValues(prev => ({ ...prev, [configId]: !prev[configId] }));
  };

  const toggleExpandConfig = (configId: number) => {
    setExpandedConfigs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(configId)) {
        newSet.delete(configId);
      } else {
        newSet.add(configId);
      }
      return newSet;
    });
  };

  const handleValueChange = (configId: number, value: string) => {
    setEditingValues(prev => ({ ...prev, [configId]: value }));
  };

  const handlePushToGitHub = async () => {
    setIsPushingToGit(true);
    setGitPushResult(null);

    try {
      const res = await fetch("/api/admin/system-config/github-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await res.json();
      setGitPushResult(result);

      setTimeout(() => {
        setGitPushResult(null);
      }, 10000);
    } catch (error) {
      console.error("Error pushing to GitHub:", error);
      setGitPushResult({
        success: false,
        message: "Network error while pushing to GitHub"
      });
    } finally {
      setIsPushingToGit(false);
    }
  };

  // Check if GitHub is configured
  const isGitHubConfigured = () => {
    const hasRepoUrl = configs.find(c => c.config_key === 'GITHUB_REPO_URL')?.has_value;
    const hasAccessToken = configs.find(c => c.config_key === 'GITHUB_ACCESS_TOKEN')?.has_value;
    return hasRepoUrl && hasAccessToken;
  };

  // Determine current tech stack from configurations
  const getCurrentStack = () => {
    const hasGemini = configs.find(c => c.config_key === 'GEMINI_API_KEY')?.has_value;
    const hasOpenAI = configs.find(c => c.config_key === 'OPENAI_API_KEY')?.has_value;
    const hasFast2SMS = configs.find(c => c.config_key === 'FAST2SMS_API_KEY')?.has_value;
    const hasResend = configs.find(c => c.config_key === 'RESEND_API_KEY')?.has_value;
    const hasRazorpay = configs.find(c => c.config_key === 'RAZORPAY_KEY_ID')?.has_value;
    const hasGoogleMaps = configs.find(c => c.config_key === 'GOOGLE_MAPS_API_KEY')?.has_value;
    const mapsProviderConfig = configs.find(c => c.config_key === 'MAPS_PROVIDER');
    const mapsProvider = mapsProviderConfig?.config_value || 'leaflet';
    const hasMongoDB = configs.find(c => c.config_key === 'MONGODB_URI')?.has_value;
    const hasR2 = configs.find(c => c.config_key === 'R2_ACCESS_KEY_ID')?.has_value;
    const hasS3 = configs.find(c => c.config_key === 'S3_ACCESS_KEY_ID')?.has_value;

    return {
      // Fixed stack (cannot be changed)
      language: {
        frontend: "TypeScript + React 18",
        backend: "TypeScript + Hono",
        styling: "Tailwind CSS"
      },
      hosting: {
        platform: "Cloudflare Workers (Serverless)",
        deployment: "Mocha Platform",
        cdn: "Cloudflare CDN"
      },
      database: {
        primary: "Cloudflare D1 (SQLite)",
        alternative: hasMongoDB ? "MongoDB Atlas (Configured)" : "MongoDB Atlas (Available)",
        orm: "Direct SQL with Prepared Statements"
      },
      
      // Dynamic stack (configurable)
      ai: {
        primary: hasGemini ? "Google Gemini 2.5 (Active ✓)" : "Google Gemini (Not Configured)",
        alternative: hasOpenAI ? "OpenAI GPT-4 (Active ✓)" : "OpenAI (Available)",
        status: hasGemini || hasOpenAI ? 'active' : 'inactive'
      },
      sms: {
        provider: hasFast2SMS ? "Fast2SMS (Active ✓)" : "Fast2SMS (Not Configured)",
        region: "India",
        status: hasFast2SMS ? 'active' : 'inactive'
      },
      email: {
        provider: hasResend ? "Resend (Active ✓)" : "Resend (Not Configured)",
        status: hasResend ? 'active' : 'inactive'
      },
      payment: {
        provider: hasRazorpay ? "Razorpay (Active ✓)" : "Razorpay (Not Configured)",
        region: "India",
        status: hasRazorpay ? 'active' : 'inactive'
      },
      maps: {
        provider: mapsProvider === 'google_maps' && hasGoogleMaps 
          ? "Google Maps (Active ✓)" 
          : mapsProvider === 'google_maps' 
            ? "Google Maps (Not Configured)" 
            : "Leaflet/OpenStreetMap (Active ✓)",
        selection: mapsProvider === 'google_maps' ? 'Google Maps' : 'Leaflet (Free)',
        status: mapsProvider === 'google_maps' ? (hasGoogleMaps ? 'active' : 'inactive') : 'active'
      },
      storage: {
        primary: hasR2 ? "Cloudflare R2 (Active ✓)" : "Cloudflare R2 (Default)",
        alternative: hasS3 ? "AWS S3 (Active ✓)" : "AWS S3 (Available)",
        status: hasR2 || hasS3 ? 'active' : 'default'
      }
    };
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading configuration...</p>
      </div>
    );
  }

  const techStack = getCurrentStack();

  // Group configs by category
  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.config_category]) {
      acc[config.config_category] = [];
    }
    acc[config.config_category].push(config);
    return acc;
  }, {} as Record<string, SystemConfig[]>);

  return (
    <div className="space-y-6">
      {/* Tech Stack Overview - Live Status */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Application Tech Stack</h2>
              <p className="text-blue-100 text-sm">Live configuration status - Updates automatically</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Frontend Stack */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Code className="w-5 h-5 text-cyan-200" />
                <h3 className="font-semibold text-white">Frontend</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Language:</span>
                  <span className="font-mono font-semibold text-white">{techStack.language.frontend}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Styling:</span>
                  <span className="font-mono font-semibold text-white">{techStack.language.styling}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Build Tool:</span>
                  <span className="font-mono font-semibold text-white">Vite 5</span>
                </div>
              </div>
            </div>

            {/* Backend Stack */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Server className="w-5 h-5 text-cyan-200" />
                <h3 className="font-semibold text-white">Backend</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Language:</span>
                  <span className="font-mono font-semibold text-white">{techStack.language.backend}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Framework:</span>
                  <span className="font-mono font-semibold text-white">Hono</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Runtime:</span>
                  <span className="font-mono font-semibold text-white">Cloudflare Workers</span>
                </div>
              </div>
            </div>

            {/* Hosting Platform */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-cyan-200" />
                <h3 className="font-semibold text-white">Hosting</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Platform:</span>
                  <span className="font-mono font-semibold text-white">{techStack.hosting.platform}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Deployment:</span>
                  <span className="font-mono font-semibold text-white">{techStack.hosting.deployment}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">CDN:</span>
                  <span className="font-mono font-semibold text-white">{techStack.hosting.cdn}</span>
                </div>
              </div>
            </div>

            {/* Database */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-cyan-200" />
                <h3 className="font-semibold text-white">Database</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Primary:</span>
                  <span className="font-mono font-semibold text-white">{techStack.database.primary}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Alternative:</span>
                  <span className="font-mono text-xs text-white">{techStack.database.alternative}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Type:</span>
                  <span className="font-mono font-semibold text-white">SQL (SQLite/D1)</span>
                </div>
              </div>
            </div>

            {/* AI Services */}
            <div className={`rounded-lg p-4 border ${
              techStack.ai.status === 'active' 
                ? 'bg-green-500/20 border-green-400/50' 
                : 'bg-red-500/20 border-red-400/50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">AI Services</h3>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${
                  techStack.ai.status === 'active' ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'
                }`}>
                  {techStack.ai.status === 'active' ? '● ACTIVE' : '○ INACTIVE'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Primary:</span>
                  <span className="font-mono text-xs text-white">{techStack.ai.primary}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Alternative:</span>
                  <span className="font-mono text-xs text-white">{techStack.ai.alternative}</span>
                </div>
              </div>
            </div>

            {/* SMS Service */}
            <div className={`rounded-lg p-4 border ${
              techStack.sms.status === 'active' 
                ? 'bg-green-500/20 border-green-400/50' 
                : 'bg-red-500/20 border-red-400/50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">SMS Service</h3>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${
                  techStack.sms.status === 'active' ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'
                }`}>
                  {techStack.sms.status === 'active' ? '● ACTIVE' : '○ INACTIVE'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Provider:</span>
                  <span className="font-mono text-xs text-white">{techStack.sms.provider}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Region:</span>
                  <span className="font-mono font-semibold text-white">{techStack.sms.region}</span>
                </div>
              </div>
            </div>

            {/* Email Service */}
            <div className={`rounded-lg p-4 border ${
              techStack.email.status === 'active' 
                ? 'bg-green-500/20 border-green-400/50' 
                : 'bg-red-500/20 border-red-400/50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">Email Service</h3>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${
                  techStack.email.status === 'active' ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'
                }`}>
                  {techStack.email.status === 'active' ? '● ACTIVE' : '○ INACTIVE'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Provider:</span>
                  <span className="font-mono text-xs text-white">{techStack.email.provider}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Use Case:</span>
                  <span className="font-mono text-xs text-white">Transactional</span>
                </div>
              </div>
            </div>

            {/* Payment Gateway */}
            <div className={`rounded-lg p-4 border ${
              techStack.payment.status === 'active' 
                ? 'bg-green-500/20 border-green-400/50' 
                : 'bg-red-500/20 border-red-400/50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">Payment Gateway</h3>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${
                  techStack.payment.status === 'active' ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'
                }`}>
                  {techStack.payment.status === 'active' ? '● ACTIVE' : '○ INACTIVE'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Provider:</span>
                  <span className="font-mono text-xs text-white">{techStack.payment.provider}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Region:</span>
                  <span className="font-mono font-semibold text-white">{techStack.payment.region}</span>
                </div>
              </div>
            </div>

            {/* Maps Service */}
            <div className={`rounded-lg p-4 border ${
              techStack.maps.status === 'active' 
                ? 'bg-green-500/20 border-green-400/50' 
                : 'bg-red-500/20 border-red-400/50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Map className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">Maps Provider</h3>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${
                  techStack.maps.status === 'active' ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'
                }`}>
                  {techStack.maps.status === 'active' ? '● ACTIVE' : '○ INACTIVE'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Provider:</span>
                  <span className="font-mono text-xs text-white">{techStack.maps.provider}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Selected:</span>
                  <span className="font-mono font-semibold text-white">{techStack.maps.selection}</span>
                </div>
              </div>
            </div>

            {/* Storage Service */}
            <div className={`rounded-lg p-4 border ${
              techStack.storage.status === 'active' 
                ? 'bg-green-500/20 border-green-400/50' 
                : 'bg-yellow-500/20 border-yellow-400/50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Cloud className="w-5 h-5 text-white" />
                <h3 className="font-semibold text-white">File Storage</h3>
                <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${
                  techStack.storage.status === 'active' ? 'bg-green-400 text-green-900' : 'bg-yellow-400 text-yellow-900'
                }`}>
                  {techStack.storage.status === 'active' ? '● ACTIVE' : '● DEFAULT'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Primary:</span>
                  <span className="font-mono text-xs text-white">{techStack.storage.primary}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Alternative:</span>
                  <span className="font-mono text-xs text-white">{techStack.storage.alternative}</span>
                </div>
              </div>
            </div>

            {/* Additional Libraries */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <HardDrive className="w-5 h-5 text-cyan-200" />
                <h3 className="font-semibold text-white">Key Libraries</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Routing:</span>
                  <span className="font-mono font-semibold text-white">React Router v6</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Validation:</span>
                  <span className="font-mono font-semibold text-white">Zod</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Maps:</span>
                  <span className="font-mono font-semibold text-white">Leaflet</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stack Architecture Summary */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">Architecture Overview</h4>
                <p className="text-sm text-blue-100 leading-relaxed">
                  This is a <strong>serverless full-stack application</strong> built on Cloudflare's edge network. 
                  Frontend (React) and Backend (Hono API) both deploy to Cloudflare Workers for global low-latency performance. 
                  The database (D1) is SQLite running at the edge, and file storage uses R2 (S3-compatible object storage). 
                  Maps use <strong>{techStack.maps.selection}</strong> for location features.
                  All components are optimized for <strong>instant global deployment</strong> with automatic scaling and zero server management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Push Section */}
      {isGitHubConfigured() && (
        <div className="bg-gradient-to-br from-slate-700 via-gray-800 to-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-600">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Push to GitHub</h3>
                  <p className="text-sm text-gray-300">Sync your app code to your GitHub repository</p>
                </div>
              </div>
              <button
                onClick={handlePushToGitHub}
                disabled={isPushingToGit}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-lg"
              >
                {isPushingToGit ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Pushing...
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5" />
                    Push to GitHub
                  </>
                )}
              </button>
            </div>

            {gitPushResult && (
              <div className={`mt-4 p-4 rounded-lg border-2 ${
                gitPushResult.success 
                  ? 'bg-green-500/20 border-green-400' 
                  : 'bg-red-500/20 border-red-400'
              }`}>
                <div className="flex items-start gap-3">
                  {gitPushResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold ${gitPushResult.success ? 'text-green-100' : 'text-red-100'}`}>
                      {gitPushResult.message}
                    </p>
                    {gitPushResult.commitUrl && (
                      <a
                        href={gitPushResult.commitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-300 hover:text-blue-200 underline mt-1 inline-block"
                      >
                        View commit on GitHub →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                How it Works
              </h4>
              <ul className="text-sm text-gray-300 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Creates README.md with complete tech stack documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Pushes to your configured GitHub repository (main branch)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Includes deployment information and sync timestamp</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Safe to run multiple times - creates new commits each time</span>
                </li>
              </ul>
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-white/10">
                <strong>Note:</strong> This syncs documentation and deployment info. Active development happens on Mocha platform.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning Banner */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-1">⚠️ Critical System Configuration</h3>
            <p className="text-sm text-yellow-800">
              These settings control core platform functionality. Incorrect values may cause service disruptions. 
              Always test configurations before saving. Keep API keys secure and never share them.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Sections */}
      {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => {
        const Icon = categoryIcons[category] || Settings;
        const label = categoryLabels[category] || category;

        return (
          <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{label}</h3>
                  <p className="text-xs text-gray-600">{categoryConfigs.length} configuration{categoryConfigs.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {categoryConfigs.map((config) => {
                const isEditing = editingValues[config.id] !== undefined;
                const currentValue = isEditing ? editingValues[config.id] : '';
                const isSaving = savingIds.has(config.id);
                const isTesting = testingIds.has(config.id);
                const status = saveStatus[config.id];
                const testResult = testResults[config.id];
                const showValue = showValues[config.id] || false;
                const canTest = config.config_key.includes('API_KEY') || config.config_key.includes('URL') || config.config_key.includes('ENDPOINT');
                const isExpanded = expandedConfigs.has(config.id);
                const functionInfo = configFunctions[config.config_key];

                return (
                  <div key={config.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors">
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mt-1">
                          {config.is_sensitive ? (
                            <Lock className="w-5 h-5 text-gray-600" />
                          ) : (
                            <Key className="w-5 h-5 text-gray-600" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">{config.config_key}</h4>
                                {config.has_value && !isEditing && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                    Configured
                                  </span>
                                )}
                                {functionInfo?.critical && (
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                    Critical
                                  </span>
                                )}
                                {config.is_sensitive && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Sensitive
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{config.description}</p>
                              
                              {/* Toggle for detailed info */}
                              {functionInfo && (
                                <button
                                  onClick={() => toggleExpandConfig(config.id)}
                                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                  {isExpanded ? 'Hide' : 'Show'} features & setup
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Function Details */}
                          {isExpanded && functionInfo && (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-3">
                              <div>
                                <h5 className="font-semibold text-gray-900 text-sm mb-2">📋 Features Powered by This Configuration:</h5>
                                <ul className="space-y-1">
                                  {functionInfo.features.map((feature, idx) => (
                                    <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                                      <span className="text-blue-600 mt-0.5">•</span>
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              {functionInfo.setup && (
                                <div>
                                  <h5 className="font-semibold text-gray-900 text-sm mb-1">🔧 Setup Instructions:</h5>
                                  <p className="text-xs text-gray-700 leading-relaxed">{functionInfo.setup}</p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <div className="flex-1 relative">
                                <input
                                  type={config.is_sensitive && !showValue ? "password" : "text"}
                                  value={currentValue}
                                  onChange={(e) => handleValueChange(config.id, e.target.value)}
                                  onFocus={() => {
                                    if (!isEditing) {
                                      handleValueChange(config.id, '');
                                    }
                                  }}
                                  placeholder={config.has_value ? "••••••••" : `Enter ${config.config_key.toLowerCase()}`}
                                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                />
                                {config.is_sensitive && (
                                  <button
                                    onClick={() => toggleShowValue(config.id)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                                    title={showValue ? "Hide" : "Show"}
                                  >
                                    {showValue ? (
                                      <EyeOff className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <Eye className="w-4 h-4 text-gray-500" />
                                    )}
                                  </button>
                                )}
                              </div>

                              <button
                                onClick={() => handleSave(config.id)}
                                disabled={isSaving || !currentValue}
                                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                              >
                                {isSaving ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4" />
                                    Save
                                  </>
                                )}
                              </button>

                              {canTest && (
                                <button
                                  onClick={() => handleTest(config.id, config.config_key)}
                                  disabled={isTesting || !currentValue}
                                  className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                                >
                                  {isTesting ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      Testing...
                                    </>
                                  ) : (
                                    <>
                                      <RefreshCw className="w-4 h-4" />
                                      Test
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Status Messages */}
                            {status === 'success' && (
                              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                                <CheckCircle className="w-4 h-4" />
                                Configuration saved successfully
                              </div>
                            )}

                            {status === 'error' && (
                              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                                <XCircle className="w-4 h-4" />
                                Failed to save configuration
                              </div>
                            )}

                            {testResult && (
                              <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                                testResult.success 
                                  ? 'text-green-700 bg-green-50' 
                                  : 'text-red-700 bg-red-50'
                              }`}>
                                {testResult.success ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                {testResult.message}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Developer Reference Guide */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Code className="w-6 h-6 text-slate-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-3 text-lg">👨‍💻 Developer Reference</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Frontend Stack:</h4>
                <ul className="text-slate-700 space-y-1">
                  <li>• React 18 (TypeScript)</li>
                  <li>• Vite 5 (Build Tool)</li>
                  <li>• React Router v6</li>
                  <li>• Tailwind CSS</li>
                  <li>• Zod (Validation)</li>
                  <li>• {techStack.maps.selection}</li>
                  <li>• Lucide Icons</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Backend Stack:</h4>
                <ul className="text-slate-700 space-y-1">
                  <li>• Hono (Web Framework)</li>
                  <li>• Cloudflare Workers</li>
                  <li>• Cloudflare D1 (SQLite)</li>
                  <li>• Cloudflare R2 (Storage)</li>
                  <li>• TypeScript</li>
                  <li>• Edge Runtime</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">External Services:</h4>
                <ul className="text-slate-700 space-y-1">
                  <li>• Google Gemini AI</li>
                  <li>• Fast2SMS (India SMS)</li>
                  <li>• Resend (Email)</li>
                  <li>• Razorpay (Payments)</li>
                  <li>• Maps: {techStack.maps.selection}</li>
                  <li>• Nominatim (Geocoding)</li>
                  <li>• Mocha Auth Service</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Note for Developers:</strong> This is a modern edge-first architecture. 
                All code runs on Cloudflare's global network (150+ data centers). 
                Changes to configurations above will affect the corresponding services. 
                Green "ACTIVE" status means the service is properly configured and operational.
                Test your changes in development before deploying to production.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
