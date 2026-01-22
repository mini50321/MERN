import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import TransactionHistoryView from "@/react-app/components/patient/TransactionHistoryView";
import { getLocalizedPrice } from "@/shared/currency-utils";
import {
  Bell,
  Shield,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  Trash2,
  ChevronRight,
  Gift,
  X,
  Check,
  DollarSign,
  Send,
  Copy,
  Wallet,
  Share2,
  MessageCircle,
  Mail,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  IndianRupee,
} from "lucide-react";

type ModalType = "subscription" | "referrals" | "notifications" | "privacy" | "terms" | "refund" | "helpdesk" | "wallet" | null;

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const settingsSections = [
    {
      title: "Account",
      items: [
        {
          icon: <CreditCard className="w-5 h-5" />,
          label: "Subscription",
          description: "Manage your plan",
          action: () => setActiveModal("subscription"),
        },
        {
          icon: <Gift className="w-5 h-5" />,
          label: "Referrals",
          description: "Invite friends & earn rewards",
          action: () => setActiveModal("referrals"),
        },
        {
          icon: <Wallet className="w-5 h-5" />,
          label: "Wallet",
          description: "View balance & transactions",
          action: () => setActiveModal("wallet"),
        },
        {
          icon: <FileText className="w-5 h-5" />,
          label: "Transaction History",
          description: "View past payments",
          action: () => setShowTransactions(true),
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: <Bell className="w-5 h-5" />,
          label: "Notifications",
          description: "Push, email, SMS settings",
          action: () => setActiveModal("notifications"),
        },
      ],
    },
    {
      title: "Legal",
      items: [
        {
          icon: <Shield className="w-5 h-5" />,
          label: "Privacy Policy",
          description: "How we handle your data",
          action: () => setActiveModal("privacy"),
        },
        {
          icon: <FileText className="w-5 h-5" />,
          label: "Terms & Conditions",
          description: "Service agreement",
          action: () => setActiveModal("terms"),
        },
        {
          icon: <FileText className="w-5 h-5" />,
          label: "Refund Policy",
          description: "Payment terms",
          action: () => setActiveModal("refund"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: <HelpCircle className="w-5 h-5" />,
          label: "Help Desk",
          description: "Get assistance",
          action: () => setActiveModal("helpdesk"),
        },
      ],
    },
  ];

  const handleDeleteAccount = async () => {
    try {
      await fetch("/api/account", { method: "DELETE" });
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto mb-20 lg:mb-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {settingsSections.map((section) => (
            <div key={section.title} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {section.items.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-gray-600">{item.icon}</div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{item.label}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Account Actions</h2>
            </div>
            <div className="divide-y divide-gray-200">
              <button
                onClick={handleLogout}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-gray-600">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Log Out</div>
                    <div className="text-sm text-gray-500">Sign out of your account</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-red-600">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-red-600">Delete Account</div>
                    <div className="text-sm text-red-500">Permanently remove your data</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account?</h3>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showTransactions && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowTransactions(false)}
          >
            <div 
              className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <TransactionHistoryView onBack={() => setShowTransactions(false)} />
            </div>
          </div>
        )}
        {activeModal === "subscription" && <SubscriptionModal onClose={() => setActiveModal(null)} />}
        {activeModal === "referrals" && <ReferralsModal onClose={() => setActiveModal(null)} />}
        {activeModal === "wallet" && <WalletModal onClose={() => setActiveModal(null)} />}
        {activeModal === "notifications" && <NotificationsModal onClose={() => setActiveModal(null)} />}
        {activeModal === "privacy" && <PrivacyModal onClose={() => setActiveModal(null)} />}
        {activeModal === "terms" && <TermsModal onClose={() => setActiveModal(null)} />}
        {activeModal === "refund" && <RefundModal onClose={() => setActiveModal(null)} />}
        {activeModal === "helpdesk" && <HelpDeskModal onClose={() => setActiveModal(null)} />}
      </div>
    </DashboardLayout>
  );
}

function SubscriptionModal({ onClose }: { onClose: () => void }) {
  const [currentTier, setCurrentTier] = useState("mavy_lite");
  const [isLoading, setIsLoading] = useState(true);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [yearlyDiscountPercentage, setYearlyDiscountPercentage] = useState(17);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    fetchSubscription();
    fetchUserProfile();
    fetchDiscountSettings();
    fetchPlans();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscription");
      const data = await response.json();
      setCurrentTier(data.tier);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/subscription-plans");
      const data = await response.json();
      setPlans(data.filter((p: any) => p.is_active).sort((a: any, b: any) => a.display_order - b.display_order));
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/users/me");
      const data = await response.json();
      setUserCountry(data.profile?.country || null);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchDiscountSettings = async () => {
    try {
      const response = await fetch("/api/subscription-settings");
      const data = await response.json();
      setYearlyDiscountPercentage(data.yearly_discount_percentage || 17);
    } catch (error) {
      console.error("Error fetching discount settings:", error);
    }
  };

  const handleUpgrade = async (tier: string, amount: number) => {
    try {
      await fetch("/api/subscription", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, amount, payment_method: "card" }),
      });
      setCurrentTier(tier);
    } catch (error) {
      console.error("Error upgrading subscription:", error);
    }
  };

  const getTierDisplayName = (tierName: string) => {
    const nameMap: Record<string, string> = {
      'mavy_lite': 'Mavy Lite',
      'mavy_plus': 'Mavy Plus',
      'mavy_pro': 'Mavy Pro',
      'mavy_max': 'Mavy Max'
    };
    return nameMap[tierName] || tierName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const displayPlans = plans.map(plan => {
    const price = billingCycle === "monthly" ? plan.monthly_price : plan.yearly_price;
    const localizedPrice = getLocalizedPrice(price, plan.currency || "USD", userCountry);
    const features = plan.benefits ? JSON.parse(plan.benefits) : [];
    
    return {
      tier: plan.tier_name,
      name: getTierDisplayName(plan.tier_name),
      price,
      localizedPrice,
      features,
      currency: plan.currency || "USD",
    };
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Subscription Plans</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">Loading...</div>
        ) : (
          <>
            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all relative ${
                  billingCycle === "yearly"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Yearly
                {yearlyDiscountPercentage > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    Save {yearlyDiscountPercentage}%
                  </span>
                )}
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayPlans.map((plan) => (
                <div
                  key={plan.tier}
                  className={`border-2 rounded-2xl p-6 ${
                    currentTier === plan.tier ? "border-blue-600 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? "Free" : plan.localizedPrice.formatted}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600">
                        /{billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    )}
                  </div>
                  
                  {/* Show savings for yearly billing */}
                  {billingCycle === "yearly" && plan.price > 0 && yearlyDiscountPercentage > 0 && (
                    <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium text-center">
                        Save {yearlyDiscountPercentage}% vs monthly
                      </p>
                    </div>
                  )}

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {currentTier === plan.tier ? (
                    <button className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-medium" disabled>
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.tier, plan.price)}
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-md"
                    >
                      {plan.price === 0 ? "Downgrade" : "Upgrade"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReferralsModal({ onClose }: { onClose: () => void }) {
  const [referralData, setReferralData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'share' | 'history'>('share');

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const response = await fetch("/api/referrals/dashboard");
      const data = await response.json();
      setReferralData(data);
    } catch (error) {
      console.error("Error fetching referrals:", error);
    }
  };

  const copyCode = () => {
    if (referralData?.referral_code) {
      navigator.clipboard.writeText(referralData.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getReferralMessage = () => {
    const code = referralData?.referral_code || '';
    const reward = referralData?.config?.referred_reward || 50;
    return `Join Mavy and get ₹${reward} bonus on your first transaction! Use my referral code: ${code}\n\nDownload now: https://mavypartner.com`;
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(getReferralMessage())}`, '_blank');
  };

  const shareSMS = () => {
    window.open(`sms:?body=${encodeURIComponent(getReferralMessage())}`, '_blank');
  };

  const shareEmail = () => {
    const subject = "Join Mavy - Get ₹50 Bonus!";
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(getReferralMessage())}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(getReferralMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'completed': return <Check className="w-4 h-4 text-green-600" />;
      case 'verified': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'registered': return <Clock className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'completed': return 'Reward Credited';
      case 'verified': return 'Verified';
      case 'registered': return 'Registered';
      default: return stage;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Referral Program</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {referralData ? (
          <>
            {/* Referral Code Card */}
            <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5" />
                  <span className="text-sm font-medium opacity-90">Your Referral Code</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <code className="text-3xl font-mono font-bold tracking-wider">{referralData.referral_code}</code>
                  <button
                    onClick={copyCode}
                    className="px-4 py-2 bg-white/20 backdrop-blur rounded-lg font-medium hover:bg-white/30 flex items-center gap-2 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-sm opacity-80">
                  Earn ₹{referralData.config?.referrer_reward || 100} for each friend who joins and completes their first transaction!
                </p>
              </div>
            </div>

            {/* Wallet Summary */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-emerald-700">Wallet Balance</div>
                    <div className="text-2xl font-bold text-emerald-800 flex items-center">
                      <IndianRupee className="w-5 h-5" />
                      {(referralData.wallet?.balance || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-emerald-600">Total Earned: ₹{(referralData.wallet?.total_earned || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-blue-700">{referralData.stats?.total_referrals || 0}</div>
                <div className="text-xs text-blue-600">Total</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-green-700">{referralData.stats?.successful || 0}</div>
                <div className="text-xs text-green-600">Successful</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-orange-700">{referralData.stats?.pending || 0}</div>
                <div className="text-xs text-orange-600">Pending</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-purple-700">
                  ₹{((referralData.stats?.successful || 0) * (referralData.config?.referrer_reward || 100)).toFixed(0)}
                </div>
                <div className="text-xs text-purple-600">Earned</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('share')}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'share' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Share2 className="w-4 h-4 inline mr-2" />
                Share & Invite
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === 'history' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Referral History
              </button>
            </div>

            {activeTab === 'share' ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">Share your code with friends and earn rewards when they join!</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={shareWhatsApp}
                    className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </button>
                  <button
                    onClick={shareSMS}
                    className="flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                    SMS
                  </button>
                  <button
                    onClick={shareEmail}
                    className="flex items-center justify-center gap-2 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    Email
                  </button>
                  <button
                    onClick={copyLink}
                    className="flex items-center justify-center gap-2 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                    {copied ? "Copied!" : "Copy Message"}
                  </button>
                </div>
                
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">How it works</p>
                      <ol className="mt-2 text-amber-700 space-y-1 list-decimal list-inside">
                        <li>Share your code with friends</li>
                        <li>Friend signs up using your code</li>
                        <li>Friend completes first transaction</li>
                        <li>Both of you get wallet credits!</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {referralData.referrals?.length > 0 ? (
                  referralData.referrals.map((ref: any) => (
                    <div key={ref.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {(ref.referred_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{ref.referred_name || `User #${ref.id}`}</div>
                          <div className="text-xs text-gray-500">{new Date(ref.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          {getStageIcon(ref.referral_stage)}
                          <span className={`text-sm font-medium ${
                            ref.referral_stage === 'completed' ? 'text-green-600' : 
                            ref.referral_stage === 'verified' ? 'text-blue-600' : 'text-orange-600'
                          }`}>
                            {getStageLabel(ref.referral_stage)}
                          </span>
                        </div>
                        {ref.is_fraud_flagged && (
                          <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            Flagged
                          </div>
                        )}
                        {ref.referral_stage === 'completed' && (
                          <div className="text-sm font-semibold text-green-600 mt-1">
                            +₹{ref.referrer_reward_amount || ref.reward_amount || 0}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No referrals yet</p>
                    <p className="text-sm">Share your code to start earning!</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function WalletModal({ onClose }: { onClose: () => void }) {
  const [walletData, setWalletData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const response = await fetch("/api/wallet");
      const data = await response.json();
      setWalletData(data);
    } catch (error) {
      console.error("Error fetching wallet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'debit': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default: return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">My Wallet</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : walletData ? (
          <>
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5" />
                  <span className="text-sm font-medium opacity-90">Available Balance</span>
                </div>
                <div className="text-4xl font-bold mb-4 flex items-center">
                  <IndianRupee className="w-8 h-8" />
                  {(walletData.wallet?.balance || 0).toFixed(2)}
                </div>
                <div className="flex gap-6 text-sm opacity-80">
                  <div>
                    <span className="opacity-70">Total Earned:</span>{" "}
                    <span className="font-semibold">₹{(walletData.wallet?.total_earned || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="opacity-70">Redeemed:</span>{" "}
                    <span className="font-semibold">₹{(walletData.wallet?.total_redeemed || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Earn More Wallet Credits</p>
                  <p className="text-blue-600 mt-1">Refer friends to Mavy and earn wallet credits when they complete their first transaction!</p>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Transaction History</h4>
              {walletData.transactions?.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {walletData.transactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.transaction_type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {getTransactionIcon(tx.transaction_type)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{tx.description}</div>
                          <div className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          tx.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.transaction_type === 'credit' ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                        </div>
                        {tx.expires_at && (
                          <div className="text-xs text-gray-400">
                            Expires {new Date(tx.expires_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Wallet credits will appear here</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-red-500">Failed to load wallet</div>
        )}
      </div>
    </div>
  );
}



function NotificationsModal({ onClose }: { onClose: () => void }) {
  const [preferences, setPreferences] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/notifications/preferences");
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      onClose();
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreference = (key: string) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  if (!preferences) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Notification Settings</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {[
            { key: "email_notifications", label: "Email Notifications" },
            { key: "push_notifications", label: "Push Notifications" },
            { key: "sms_notifications", label: "SMS Notifications" },
            { key: "job_alerts", label: "Job Alerts" },
            { key: "news_updates", label: "News Updates" },
            { key: "community_messages", label: "Community Messages" },
          ].map((pref) => (
            <div key={pref.key} className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{pref.label}</span>
              <button
                onClick={() => togglePreference(pref.key)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences[pref.key] ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                    preferences[pref.key] ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-md"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}

function HelpDeskModal({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!subject || !message) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error submitting ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Help Desk</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {submitted ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Ticket Submitted</h4>
            <p className="text-gray-600">Our team will respond within 24 hours</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Describe your issue in detail..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !subject || !message}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PrivacyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-4xl w-full my-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">Privacy Policy – Mavy</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
          <p className="text-gray-600 mb-6"><strong>Effective Date:</strong> 01 July 2024</p>
          
          <p>
            This Privacy Policy explains how Mavy ("we," "us," or "our") collects, uses, discloses, and safeguards the personal information of individuals who use our mobile app, web platform, or related services ("the App"). We are committed to protecting your privacy, maintaining transparency, and handling your data responsibly. By accessing or using Mavy, you agree to the practices described in this Privacy Policy.
          </p>

          <h4 className="font-bold text-gray-900 mt-6 mb-3 text-lg">1. Information We Collect</h4>
          <p>We collect information in two primary ways: (a) information you voluntarily provide, and (b) information automatically gathered when you use the App.</p>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">1.1. Information You Provide</h5>
          <p>When you use Mavy, you may give us the following personal and professional information:</p>
          
          <p className="font-semibold mt-3">Account & Profile Information</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Your full name</li>
            <li>Email address</li>
            <li>Mobile number</li>
            <li>Password</li>
            <li>Profile photo (optional)</li>
            <li>Gender (optional)</li>
          </ul>

          <p className="font-semibold mt-3">Business Information (for Business users)</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Business name</li>
            <li>GST number and GST certificate</li>
            <li>Business address and PIN code</li>
            <li>Specialities and product categories</li>
            <li>Sales and service preferences for each product</li>
          </ul>

          <p className="font-semibold mt-3">Professional Information (for Individuals & Freelancers)</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Workplace details (Hospital / Company / R&D / Other)</li>
            <li>Area of specialization</li>
            <li>Product expertise</li>
            <li>Certifications, portfolio items, experience details</li>
          </ul>

          <p className="font-semibold mt-3">Additional Content</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Any content you upload such as documents, images, certifications, or service-related files</li>
            <li>Messages sent to customer support</li>
            <li>Feedback, reports, or complaints</li>
          </ul>

          <p>You choose how much information to provide; however, some features require certain information for proper functioning.</p>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">1.2. Information We Automatically Collect</h5>
          <p>When you use Mavy, certain information is collected automatically:</p>

          <p className="font-semibold mt-3">Device Information</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Device type</li>
            <li>Operating system</li>
            <li>Device model</li>
            <li>Network information</li>
          </ul>

          <p className="font-semibold mt-3">Log Data</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>IP address</li>
            <li>App version</li>
            <li>Date and time of access</li>
            <li>Error logs</li>
            <li>Session duration</li>
            <li>API usage logs</li>
          </ul>

          <p className="font-semibold mt-3">Usage Data</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Screens viewed</li>
            <li>Features accessed</li>
            <li>Click interactions</li>
            <li>Service requests</li>
            <li>Navigation patterns</li>
          </ul>

          <p className="font-semibold mt-3">Location Data (Optional)</p>
          <p>If you enable location permissions, we may collect:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Approximate or precise location</li>
            <li>City, state, region</li>
          </ul>
          <p>You may disable location access anytime through your device settings.</p>

          <h4 className="font-bold text-gray-900 mt-6 mb-3 text-lg">2. How We Use Your Information</h4>
          <p>We use personal information to operate, improve, and maintain Mavy. The key purposes include:</p>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">2.1. Providing and Improving Our Services</h5>
          <ul className="list-disc pl-6 space-y-1">
            <li>Creating and managing your account</li>
            <li>Displaying your profile based on your account type (Business, Individual, Freelancer)</li>
            <li>Showing dashboards, products, and services relevant to your role</li>
            <li>Supporting sales, service, and communication workflows</li>
            <li>Ensuring smooth functioning of all app features</li>
          </ul>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">2.2. Personalizing Your Experience</h5>
          <ul className="list-disc pl-6 space-y-1">
            <li>Displaying relevant specialities and product categories</li>
            <li>Tailoring recommendations based on your profile</li>
            <li>Showing role-specific dashboards</li>
          </ul>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">2.3. Communication</h5>
          <p>We may send:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Account updates</li>
            <li>Service notifications</li>
            <li>Reminders</li>
            <li>Verification messages</li>
            <li>Important alerts</li>
            <li>Optional marketing updates (only with consent)</li>
          </ul>
          <p>Push notifications may be used for reminders, updates, or critical alerts. You may manage them in your device settings.</p>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">2.4. Safety, Verification & Compliance</h5>
          <ul className="list-disc pl-6 space-y-1">
            <li>Verifying GST and business credentials</li>
            <li>Detecting fraud or misuse</li>
            <li>Ensuring compliance with legal requirements</li>
            <li>Maintaining platform integrity</li>
          </ul>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">2.5. Analytics & Performance</h5>
          <p>We analyze usage patterns to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Improve user experience</li>
            <li>Fix bugs and optimize performance</li>
            <li>Develop new features and enhancements</li>
          </ul>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">2.6. Legal Requirements</h5>
          <p>We may use your data to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Comply with court orders or government requests</li>
            <li>Protect our rights and enforce terms of service</li>
          </ul>

          <h4 className="font-bold text-gray-900 mt-6 mb-3 text-lg">3. Sharing of Your Information</h4>
          <p className="font-semibold">We do not sell, rent, or trade your personal data.</p>
          <p>We may share data only under the following conditions:</p>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">3.1. Service Providers</h5>
          <p>With trusted third-party vendors who help us with:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Cloud hosting</li>
            <li>Data storage</li>
            <li>App analytics</li>
            <li>Payment processing (if enabled)</li>
            <li>Customer support</li>
            <li>SMS/Email delivery</li>
          </ul>
          <p>They are required to protect your information and cannot misuse it.</p>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">3.2. Legal Compliance</h5>
          <p>We may disclose personal information if required to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Comply with law</li>
            <li>Respond to legal requests</li>
            <li>Prevent fraud or harm</li>
            <li>Protect our rights or safety, or user safety</li>
          </ul>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">3.3. Business Transfers</h5>
          <p>If Mavy undergoes a merger, acquisition, restructuring, or sale of assets, user information may be transferred as part of the transaction. Users will be notified as required by law.</p>

          <h4 className="font-bold text-gray-900 mt-6 mb-3 text-lg">4. Your Choices and Controls</h4>
          <p>You retain control over your personal information. You may:</p>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">4.1. Access & Update</h5>
          <ul className="list-disc pl-6 space-y-1">
            <li>Edit your profile</li>
            <li>Change specialities and products</li>
            <li>Update contact information</li>
            <li>Modify business or freelance details</li>
          </ul>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">4.2. Notification Preferences</h5>
          <ul className="list-disc pl-6 space-y-1">
            <li>Enable/disable push notifications</li>
            <li>Control alert settings</li>
          </ul>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">4.3. Location Permissions</h5>
          <ul className="list-disc pl-6 space-y-1">
            <li>Grant or revoke location access anytime</li>
          </ul>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">4.4. Marketing Opt-Out</h5>
          <p>You may opt out of optional marketing messages.</p>

          <h4 className="font-bold text-gray-900 mt-6 mb-3 text-lg">5. Data Deletion & Consent Withdrawal</h4>
          
          <h5 className="font-semibold text-gray-900 mt-4 mb-2">5.1. Account Deletion</h5>
          <p>You may request deletion of your account and associated data:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Through the "Delete Account" option in the App</li>
            <li>Or by emailing us at: <a href="mailto:info@themavy.com" className="text-blue-600 hover:underline">info@themavy.com</a></li>
          </ul>
          <p>We will process your request within 5 business days.</p>

          <h5 className="font-semibold text-gray-900 mt-4 mb-2">5.2. Consent Withdrawal</h5>
          <p>You may withdraw consent for:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Data processing</li>
            <li>Use of personal information</li>
            <li>Sharing with service providers</li>
          </ul>
          <p>Upon withdrawing consent:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Certain features may stop working</li>
            <li>Some services may become unavailable</li>
            <li>We will stop processing your data except where required by law</li>
          </ul>
          <p>We will handle your request with care and ensure safe removal wherever possible.</p>

          <h4 className="font-bold text-gray-900 mt-6 mb-3 text-lg">6. Data Security</h4>
          <p>We take meaningful steps to protect your information using:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Encrypted data transmission</li>
            <li>Secure servers</li>
            <li>Access restrictions</li>
            <li>Regular security audits</li>
            <li>Monitoring and fraud detection</li>
          </ul>
          <p>Despite our efforts, no online platform can guarantee 100% security. You use the App at your own risk.</p>

          <h4 className="font-bold text-gray-900 mt-6 mb-3 text-lg">7. Children's Privacy</h4>
          <p>Mavy is not intended for children under 13 years. We do not knowingly collect data from children under 13.</p>
          <p>If you believe a child has provided information, please contact us immediately so we may remove it.</p>

          <h4 className="font-bold text-gray-900 mt-6 mb-3 text-lg">8. International Use</h4>
          <p>If accessing Mavy from outside India:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Your information may be transferred and stored on servers in India</li>
            <li>You consent to this transfer by using the App</li>
          </ul>

          <h4 className="font-bold text-gray-900 mt-6 mb-3 text-lg">9. Changes to This Privacy Policy</h4>
          <p>We may update this Privacy Policy from time to time to reflect:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Changes in law</li>
            <li>Updates to our App</li>
            <li>Security improvements</li>
            <li>New features or services</li>
          </ul>
          <p>If changes are significant, we will provide a notice within the App. Continued use of Mavy after the update means you accept the revised policy.</p>

          <h4 className="font-bold text-gray-900 mt-6 mb-3 text-lg">10. Contact Us</h4>
          <p>For questions, concerns, complaints, or requests related to this Privacy Policy or legal compliance, contact us at:</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
            <p className="mb-2"><strong>Email:</strong> <a href="mailto:info@themavy.com" className="text-blue-600 hover:underline">info@themavy.com</a></p>
            <p className="mb-2"><strong>Phone:</strong> <a href="tel:+918886688864" className="text-blue-600 hover:underline">+91 88866 88864</a></p>
          </div>
          <p className="mt-3">We will respond as soon as possible.</p>
        </div>
      </div>
    </div>
  );
}

function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-3xl w-full my-8 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Terms & Conditions</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="prose prose-sm max-w-none">
          <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h4 className="font-semibold text-gray-900 mt-4 mb-2">1. Acceptance of Terms</h4>
          <p className="text-gray-700 mb-4">
            By accessing and using Mavy Partner, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h4 className="font-semibold text-gray-900 mt-4 mb-2">2. Use License</h4>
          <p className="text-gray-700 mb-4">
            Permission is granted to temporarily access the materials on Mavy Partner for personal, non-commercial use only.
          </p>

          <h4 className="font-semibold text-gray-900 mt-4 mb-2">3. User Accounts</h4>
          <p className="text-gray-700 mb-4">
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
          </p>

          <h4 className="font-semibold text-gray-900 mt-4 mb-2">4. Prohibited Uses</h4>
          <p className="text-gray-700 mb-4">
            You may not use our service for any illegal or unauthorized purpose. You must not violate any laws in your jurisdiction.
          </p>

          <h4 className="font-semibold text-gray-900 mt-4 mb-2">5. Termination</h4>
          <p className="text-gray-700 mb-4">
            We may terminate or suspend your account immediately, without prior notice, for any violation of these Terms.
          </p>
        </div>
      </div>
    </div>
  );
}

function RefundModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-3xl w-full my-8 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Refund Policy</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="prose prose-sm max-w-none">
          <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h4 className="font-semibold text-gray-900 mt-4 mb-2">1. Subscription Refunds</h4>
          <p className="text-gray-700 mb-4">
            We offer a 30-day money-back guarantee on all subscription plans. If you're not satisfied with our service within the first 30 days, you can request a full refund.
          </p>

          <h4 className="font-semibold text-gray-900 mt-4 mb-2">2. How to Request a Refund</h4>
          <p className="text-gray-700 mb-4">
            To request a refund, please contact our support team through the Help Desk with your account details and reason for the refund request.
          </p>

          <h4 className="font-semibold text-gray-900 mt-4 mb-2">3. Processing Time</h4>
          <p className="text-gray-700 mb-4">
            Refunds are typically processed within 5-10 business days and will be credited to your original payment method.
          </p>

          <h4 className="font-semibold text-gray-900 mt-4 mb-2">4. Exceptions</h4>
          <p className="text-gray-700 mb-4">
            Refunds are not available for services that have been fully delivered or consumed. Subscription cancellations do not automatically trigger refunds beyond the 30-day guarantee period.
          </p>

          <h4 className="font-semibold text-gray-900 mt-4 mb-2">5. Contact Us</h4>
          <p className="text-gray-700 mb-4">
            If you have any questions about our refund policy, please contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
