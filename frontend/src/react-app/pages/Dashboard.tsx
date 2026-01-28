import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import BannerCarousel from "@/react-app/components/BannerCarousel";
import DailyActionFeed from "@/react-app/components/DailyActionFeed";
import WeeklyInsightsPanel from "@/react-app/components/WeeklyInsightsPanel";
import ChatBot from "@/react-app/components/ChatBot";
import GamificationPanel from "@/react-app/components/GamificationPanel";
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  Newspaper,
  Calendar,
  Network,
  Wrench,
  Heart,
  MessageCircle,
  TrendingUp,
  Users,
  Award,
  ArrowRight,
  Target,
  Star,
} from "lucide-react";

/* -----------------------------
   Types
------------------------------ */
type DashboardStats = {
  connections: number;
  certificates: number;
  xp: number;
  badges: number;
};

/* -----------------------------
   Static config (stable)
------------------------------ */
const PROFESSIONAL_TOOLS = [
  {
    title: "Earn - Service Orders",
    description: "Accept patient service requests",
    icon: <TrendingUp className="w-6 h-6" />,
    path: "/earn",
    color: "from-green-500 to-emerald-600",
    badge: "Earn Money",
    featured: true,
  },
  {
    title: "Service Manuals",
    description: "Access technical documentation",
    icon: <BookOpen className="w-6 h-6" />,
    path: "/manuals",
    color: "from-blue-500 to-cyan-500",
    badge: "Popular",
  },
  {
    title: "Job Board",
    description: "Find opportunities & gigs",
    icon: <Briefcase className="w-6 h-6" />,
    path: "/jobs",
    color: "from-indigo-500 to-blue-600",
    badge: "New Jobs",
  },
  {
    title: "Services Marketplace",
    description: "Offer or request services",
    icon: <Wrench className="w-6 h-6" />,
    path: "/services",
    color: "from-emerald-500 to-teal-500",
    badge: null,
  },
];

const LEARNING_GROWTH = [
  {
    title: "Learning Center",
    description: "Courses & certifications",
    icon: <GraduationCap className="w-6 h-6" />,
    path: "/learning",
    color: "from-purple-500 to-pink-500",
    badge: "Featured",
  },
  {
    title: "Industry News",
    description: "Stay updated with trends",
    icon: <Newspaper className="w-6 h-6" />,
    path: "/news",
    color: "from-orange-500 to-red-500",
    badge: null,
  },
  {
    title: "Medical Exhibitions",
    description: "Discover events worldwide",
    icon: <Calendar className="w-6 h-6" />,
    path: "/exhibitions",
    color: "from-green-500 to-emerald-600",
    badge: "Upcoming",
  },
];

const COMMUNITY_ENGAGEMENT = [
  {
    title: "C-Connect Network",
    description: "Professional networking",
    icon: <Network className="w-6 h-6" />,
    path: "/connect",
    color: "from-violet-500 to-purple-500",
    badge: null,
  },
  {
    title: "Global Community",
    description: "Chat with professionals",
    icon: <MessageCircle className="w-6 h-6" />,
    path: "/global-chat",
    color: "from-indigo-500 to-purple-600",
    badge: "Active",
  },
  {
    title: "Fundraising",
    description: "Support medical causes",
    icon: <Heart className="w-6 h-6" />,
    path: "/fundraising",
    color: "from-rose-500 to-pink-600",
    badge: null,
  },
];

/* -----------------------------
   Component
------------------------------ */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [greeting, setGreeting] = useState("");
  const [professionDisplay, setProfessionDisplay] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    connections: 0,
    certificates: 0,
    xp: 0,
    badges: 0,
  });

  /* -----------------------------
     Effects
  ------------------------------ */
  useEffect(() => {
    if (!user) return;

    const profile = (user as any).profile;

    if (!profile?.onboarding_completed) {
      navigate("/onboarding");
      return;
    }

    const hour = new Date().getHours();
    const userName = profile?.full_name?.split(" ")[0] || "there";

    if (hour < 12) setGreeting(`Good morning, ${userName}!`);
    else if (hour < 18) setGreeting(`Good afternoon, ${userName}!`);
    else setGreeting(`Good evening, ${userName}!`);

    // Determine profession display
    const accountType = profile?.account_type || "";
    const profession = (profile?.profession || "").toLowerCase();
    
    let profDisplay = "";
    
    if (profession.includes("nursing")) {
      profDisplay = "Nursing Professional";
    } else if (profession.includes("ambulance")) {
      profDisplay = "Ambulance Service Provider";
    } else if (profession.includes("physio")) {
      profDisplay = "Physiotherapy Professional";
    } else if (profession.includes("biomedical") || profession.includes("engineer")) {
      if (accountType === "business") {
        profDisplay = "Biomedical Business";
      } else if (accountType === "freelancer") {
        profDisplay = "Freelancer - Biomedical Engineering";
      } else {
        profDisplay = "Individual Biomedical Engineer";
      }
    } else {
      // Fallback based on account type
      if (accountType === "business") {
        profDisplay = "Business Professional";
      } else if (accountType === "freelancer") {
        profDisplay = "Freelancer";
      } else {
        profDisplay = "Professional";
      }
    }
    
    setProfessionDisplay(profDisplay);

    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) =>
        setStats({
          connections: data?.connections ?? 0,
          certificates: data?.certificates ?? 0,
          xp: data?.xp ?? 0,
          badges: data?.badges ?? 0,
        })
      )
      .catch(() => {
        // silent fail, UI remains stable
      });
  }, [user, navigate]);

  /* -----------------------------
     Derived UI data
  ------------------------------ */
  const quickStats = useMemo(
    () => [
      {
        icon: <Users className="w-5 h-5" />,
        label: "Connections",
        value: stats.connections,
        color: "text-blue-600 bg-blue-50",
      },
      {
        icon: <Award className="w-5 h-5" />,
        label: "Certificates",
        value: stats.certificates,
        color: "text-purple-600 bg-purple-50",
      },
      {
        icon: <TrendingUp className="w-5 h-5" />,
        label: "XP Earned",
        value: stats.xp,
        color: "text-green-600 bg-green-50",
      },
      {
        icon: <Star className="w-5 h-5" />,
        label: "Badges",
        value: stats.badges,
        color: "text-yellow-600 bg-yellow-50",
      },
    ],
    [stats]
  );

  /* -----------------------------
     Render
  ------------------------------ */
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pb-20 lg:pb-0">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-4 md:p-5 text-white mb-4 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <Target className="w-32 h-32 md:w-48 md:h-48" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <h1 className="text-lg md:text-xl font-bold">{greeting}</h1>
              {professionDisplay && (
                <span className="px-3 py-1 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-40 rounded-full text-xs font-semibold text-white shadow-md w-fit">
                  {professionDisplay}
                </span>
              )}
            </div>
            <p className="text-blue-100 mb-4 text-sm">
              Welcome back to your professional hub. Ready to make progress today?
            </p>
            <div className="grid grid-cols-4 gap-2 md:gap-3">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-2 md:p-3 border border-white border-opacity-30"
                >
                  <div
                    className={`w-6 h-6 md:w-8 md:h-8 ${stat.color} rounded-lg flex items-center justify-center mb-1`}
                  >
                    {stat.icon}
                  </div>
                  <p className="text-lg md:text-xl font-bold">{stat.value}</p>
                  <p className="text-[10px] md:text-xs text-blue-100">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <GamificationPanel />

        {/* Quick Access */}
        <section className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <Link
              to="/earn"
              className="group bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-white"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm">Earn</span>
              </div>
            </Link>

            <Link
              to="/manuals"
              className="group bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-white"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm">Manuals</span>
              </div>
            </Link>

            <Link
              to="/jobs"
              className="group bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-white"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1">
                  <Briefcase className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm">Jobs</span>
              </div>
            </Link>

            <Link
              to="/services"
              className="group bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-white"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1">
                  <Wrench className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm">Marketplace</span>
              </div>
            </Link>

            <Link
              to="/learning"
              className="group bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-white"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm">Learning</span>
              </div>
            </Link>

            <Link
              to="/news"
              className="group bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-white"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1">
                  <Newspaper className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm">Industry News</span>
              </div>
            </Link>

            <Link
              to="/exhibitions"
              className="group bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-white"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm">Exhibitions</span>
              </div>
            </Link>

            <Link
              to="/connect"
              className="group bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-white"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1">
                  <Network className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm">C-Connect</span>
              </div>
            </Link>

            <Link
              to="/global-chat"
              className="group bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-white"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm">Global Chat</span>
              </div>
            </Link>

            <Link
              to="/fundraising"
              className="group bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-4 md:p-5 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-white"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-1">
                  <Heart className="w-6 h-6" />
                </div>
                <span className="font-semibold text-sm">Fundraising</span>
              </div>
            </Link>
          </div>
        </section>

        <BannerCarousel />

        {/* Professional Tools */}
        <Section
          title="Professional Tools"
          icon={<Briefcase className="w-6 h-6 text-blue-600" />}
          items={PROFESSIONAL_TOOLS}
        />

        {/* Learning */}
        <Section
          title="Learning & Growth"
          icon={<GraduationCap className="w-6 h-6 text-purple-600" />}
          items={LEARNING_GROWTH}
        />

        {/* Community */}
        <Section
          title="Community & Networking"
          icon={<Network className="w-6 h-6 text-indigo-600" />}
          items={COMMUNITY_ENGAGEMENT}
        />

        <DailyActionFeed />
      </div>

      <WeeklyInsightsPanel />
      <ChatBot />
    </DashboardLayout>
  );
}

/* -----------------------------
   Reusable Section
------------------------------ */
function Section({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: any[];
}) {
  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          {icon}
          {title}
        </h2>
      </div>
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <Link
            key={item.title}
            to={item.path}
            className="group bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all border border-gray-100 hover:-translate-y-1"
          >
            <div
              className={`bg-gradient-to-br ${item.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg mb-3`}
            >
              {item.icon}
            </div>
            <h3 className="font-bold mb-1">{item.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
            <div className="flex items-center text-sm font-medium text-blue-600">
              Explore <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
