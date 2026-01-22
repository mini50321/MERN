import { Link, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@getmocha/users-service/react";
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  Settings,
  User,
  Newspaper,
  Network,
  Menu,
  FileText,
  Bookmark,
  Calendar,
  MessageCircle,
  Store,
  DollarSign,
} from "lucide-react";

/* =========================
   Types
========================= */
type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
  highlighted?: boolean;
};

/* =========================
   Navigation Config (SINGLE SOURCE)
========================= */
const MAIN_NAV: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: <Menu className="w-4 h-4" /> },
  { path: "/earn", label: "Earn", icon: <DollarSign className="w-4 h-4" />, highlighted: true },
  { path: "/manuals", label: "Manuals", icon: <BookOpen className="w-4 h-4" /> },
  { path: "/jobs", label: "Jobs", icon: <Briefcase className="w-4 h-4" /> },
  { path: "/learning", label: "Learning", icon: <GraduationCap className="w-4 h-4" /> },
  { path: "/news", label: "News", icon: <Newspaper className="w-4 h-4" /> },
  { path: "/exhibitions", label: "Exhibitions", icon: <Calendar className="w-4 h-4" /> },
  { path: "/connect", label: "C-Connect", icon: <Network className="w-4 h-4" /> },
  { path: "/global-chat", label: "Global Chat", icon: <MessageCircle className="w-4 h-4" /> },
];

const SECONDARY_NAV: NavItem[] = [
  { path: "/my-posts", label: "My Posts", icon: <FileText className="w-4 h-4" /> },
  { path: "/saved-posts", label: "Saved Posts", icon: <Bookmark className="w-4 h-4" /> },
  { path: "/my-exhibitions", label: "My Exhibitions", icon: <Calendar className="w-4 h-4" /> },
  { path: "/saved-exhibitions", label: "Saved Exhibitions", icon: <Bookmark className="w-4 h-4" /> },
  { path: "/profile", label: "Profile", icon: <User className="w-4 h-4" /> },
  { path: "/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

/* =========================
   Reusable Nav Renderer
========================= */
function NavLinks({
  items,
  onClick,
  pathname,
}: {
  items: NavItem[];
  onClick?: () => void;
  pathname: string;
}) {
  return (
    <>
      {items.map((item) => {
        const active = pathname === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              active
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                : item.highlighted
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
            {item.highlighted && (
              <span className="ml-auto px-2 py-0.5 bg-white bg-opacity-30 text-xs rounded-full">
                New
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}

/* =========================
   Layout Component
========================= */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [navbarTransform, setNavbarTransform] = useState(0);

  useEffect(() => {
    const profile = (user as any)?.profile;
    setAccountType(profile?.account_type ?? null);
  }, [user]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    let scrollTimeout: NodeJS.Timeout;

    const updateNavbar = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY;

      // Calculate transform with clamping (0 to 100)
      setNavbarTransform((prev) => {
        const newValue = prev + scrollDiff * 0.5;
        return Math.max(0, Math.min(100, newValue));
      });

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNavbar);
        ticking = true;
      }

      // Debounce: reset to visible after scroll stops
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setNavbarTransform(0);
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20 lg:pb-24 overflow-y-auto">
      {/* Quick Access Bar - Desktop (Fixed Bottom) */}
      <div 
        className="hidden lg:block fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50"
        style={{
          transform: `translateY(${navbarTransform}%)`,
          transition: 'transform 250ms ease-out'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/news"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transform hover:scale-110 active:scale-95 ${
                location.pathname === "/news"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg animate-bounce-subtle"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              style={{ transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
            >
              <Newspaper className="w-5 h-5" style={{ transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} />
              <span className="font-medium">News Updates</span>
            </Link>
            <Link
              to="/connect"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transform hover:scale-110 active:scale-95 ${
                location.pathname === "/connect"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg animate-bounce-subtle"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              style={{ transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
            >
              <Network className="w-5 h-5" style={{ transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} />
              <span className="font-medium">C-Connect</span>
            </Link>
            <Link
              to="/earn"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transform hover:scale-110 active:scale-95 ${
                location.pathname === "/earn"
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg animate-bounce-subtle"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg"
              }`}
              style={{ transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
            >
              <DollarSign className="w-5 h-5" style={{ transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} />
              <span className="font-medium">Earn</span>
            </Link>
            <Link
              to="/global-chat"
              className={`flex items-center gap-2 px-6 py-2 rounded-xl transform hover:scale-110 active:scale-95 ${
                location.pathname === "/global-chat"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg animate-bounce-subtle"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              style={{ transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
            >
              <MessageCircle className="w-5 h-5" style={{ transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} />
              <span className="font-medium">Global Chat</span>
            </Link>
            <Link
              to="/settings"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transform hover:scale-110 active:scale-95 ${
                location.pathname === "/settings"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg animate-bounce-subtle"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              style={{ transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
            >
              <Settings className="w-5 h-5" style={{ transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} />
              <span className="font-medium">Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-40">
        <button onClick={() => setMobileMenuOpen((v) => !v)} className="p-1 rounded-lg hover:bg-gray-100">
          <Menu className="w-6 h-6" />
        </button>
        <img
          src="https://mocha-cdn.com/019aa4be-ddf3-7171-a6f8-d818a2612e58/34458975_transparent.png"
          alt="Mavy"
          className="h-8 absolute left-1/2 transform -translate-x-1/2"
        />
        <Link
          to="/profile"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <User className="w-6 h-6 text-gray-700" />
        </Link>
      </div>

      {/* Mobile Quick Access Bar - Fixed Bottom */}
      <div 
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50"
        style={{
          transform: `translateY(${navbarTransform}%)`,
          transition: 'transform 250ms ease-out'
        }}
      >
        <div className="grid grid-cols-5 gap-1 p-2">
          <Link
            to="/news"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transform active:scale-90 ${
              location.pathname === "/news"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white animate-bounce-subtle"
                : "hover:bg-gray-100 text-gray-700"
            }`}
            style={{ transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
          >
            <Newspaper className="w-5 h-5" style={{ transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} />
            <span className="text-xs font-medium">News</span>
          </Link>
          <Link
            to="/connect"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transform active:scale-90 ${
              location.pathname === "/connect"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white animate-bounce-subtle"
                : "hover:bg-gray-100 text-gray-700"
            }`}
            style={{ transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
          >
            <Network className="w-5 h-5" style={{ transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} />
            <span className="text-xs font-medium">Connect</span>
          </Link>
          <Link
            to="/earn"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transform active:scale-90 ${
              location.pathname === "/earn"
                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white animate-bounce-subtle"
                : "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
            }`}
            style={{ transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
          >
            <DollarSign className="w-5 h-5" style={{ transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} />
            <span className="text-xs font-medium">Earn</span>
          </Link>
          <Link
            to="/global-chat"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transform active:scale-90 ${
              location.pathname === "/global-chat"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white animate-bounce-subtle"
                : "hover:bg-gray-100 text-gray-700"
            }`}
            style={{ transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
          >
            <MessageCircle className="w-5 h-5" style={{ transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} />
            <span className="text-xs font-medium">Chat</span>
          </Link>
          <Link
            to="/settings"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transform active:scale-90 ${
              location.pathname === "/settings"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white animate-bounce-subtle"
                : "hover:bg-gray-100 text-gray-700"
            }`}
            style={{ transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}
          >
            <Settings className="w-5 h-5" style={{ transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }} />
            <span className="text-xs font-medium">Settings</span>
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {accountType === "business" && (
            <>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Business</h3>
                <Link
                  to="/business-dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                >
                  <Store className="w-5 h-5" />
                  Business Dashboard
                </Link>
              </div>
              <div className="border-t border-gray-200"></div>
            </>
          )}
          
          {/* Main Features */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Main Features</h3>
            <div className="space-y-1">
              <NavLinks items={[
                { path: "/dashboard", label: "Dashboard", icon: <Menu className="w-4 h-4" /> },
                { path: "/earn", label: "Earn", icon: <DollarSign className="w-4 h-4" />, highlighted: true },
                { path: "/manuals", label: "Manuals", icon: <BookOpen className="w-4 h-4" /> },
                { path: "/jobs", label: "Jobs", icon: <Briefcase className="w-4 h-4" /> },
                { path: "/learning", label: "Learning", icon: <GraduationCap className="w-4 h-4" /> },
              ]} pathname={location.pathname} onClick={() => setMobileMenuOpen(false)} />
            </div>
          </div>

          <div className="border-t border-gray-200"></div>

          {/* Community */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Community</h3>
            <div className="space-y-1">
              <NavLinks items={[
                { path: "/news", label: "News", icon: <Newspaper className="w-4 h-4" /> },
                { path: "/exhibitions", label: "Exhibitions", icon: <Calendar className="w-4 h-4" /> },
                { path: "/connect", label: "C-Connect", icon: <Network className="w-4 h-4" /> },
                { path: "/global-chat", label: "Global Chat", icon: <MessageCircle className="w-4 h-4" /> },
              ]} pathname={location.pathname} onClick={() => setMobileMenuOpen(false)} />
            </div>
          </div>

          <div className="border-t border-gray-200"></div>

          {/* My Content */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">My Content</h3>
            <div className="space-y-1">
              <NavLinks items={[
                { path: "/my-posts", label: "My Posts", icon: <FileText className="w-4 h-4" /> },
                { path: "/saved-posts", label: "Saved Posts", icon: <Bookmark className="w-4 h-4" /> },
                { path: "/my-exhibitions", label: "My Exhibitions", icon: <Calendar className="w-4 h-4" /> },
                { path: "/saved-exhibitions", label: "Saved Exhibitions", icon: <Bookmark className="w-4 h-4" /> },
              ]} pathname={location.pathname} onClick={() => setMobileMenuOpen(false)} />
            </div>
          </div>

          <div className="border-t border-gray-200"></div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Account</h3>
            <div className="space-y-1">
              <NavLinks items={[
                { path: "/profile", label: "Profile", icon: <User className="w-4 h-4" /> },
                { path: "/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
              ]} pathname={location.pathname} onClick={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-56 bg-white border-r min-h-screen sticky top-0">
          <div className="p-4">
            <img
              src="https://mocha-cdn.com/019aa4be-ddf3-7171-a6f8-d818a2612e58/34458975_transparent.png"
              className="h-10 mb-6"
            />

            {accountType === "business" && (
              <Link
                to="/business-dashboard"
                className="flex items-center gap-2 px-3 py-2 mb-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              >
                <Store className="w-5 h-5" />
                Business Dashboard
              </Link>
            )}

            <nav className="space-y-1">
              <NavLinks items={MAIN_NAV} pathname={location.pathname} />
            </nav>
          </div>

          <div className="absolute bottom-0 w-full p-4 border-t space-y-1">
            <NavLinks items={SECONDARY_NAV} pathname={location.pathname} />
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-3 lg:p-4 pb-20 lg:pb-24">{children}</main>
      </div>
    </div>
  );
}
