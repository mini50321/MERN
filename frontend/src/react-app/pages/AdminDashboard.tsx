import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import {
  Users,
  FileText,
  Briefcase,
  Calendar,
  AlertTriangle,
  Shield,
  Trash2,
  CheckCircle,
  UserPlus,
  LogOut,
  X,
  Edit,
  BarChart3,
  Megaphone,
  Settings,
  Heart,
  Eye,
  XCircle,
  FileText as DocumentIcon,
  GraduationCap,
  Wrench,
  BookOpen,
  CreditCard,
  Save,
  Plus,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  FolderOpen,
  UserCog,
  Sliders,
  MessageCircle,
  UserCheck,
  Scissors,
} from "lucide-react";
import EditNewsModal from "@/react-app/components/EditNewsModal";
import EditExhibitionModal from "@/react-app/components/EditExhibitionModal";
import EditJobModal from "@/react-app/components/EditJobModal";
import EditFundraiserModal from "@/react-app/components/EditFundraiserModal";
import EditCourseModal from "@/react-app/components/EditCourseModal";
import AnalyticsOverview from "@/react-app/components/AnalyticsOverview";
import AdvertisingPanel from "@/react-app/components/AdvertisingPanel";
import PartnerManagementPanel from "@/react-app/components/PartnerManagementPanel";
import AdminPermissionsModal from "@/react-app/components/AdminPermissionsModal";

import PatientManagementPanel from "@/react-app/components/PatientManagementPanel";
import KYCManagementPanel from "@/react-app/components/KYCManagementPanel";
import SystemConfigPanel from "@/react-app/components/SystemConfigPanel";
import PricingManagementPanel from "@/react-app/components/PricingManagementPanel";
import RibbonSettingsPanel from "@/react-app/components/RibbonSettingsPanel";
import BookingsManagementPanel from "@/react-app/components/BookingsManagementPanel";
import SupportTicketsPanel from "@/react-app/components/SupportTicketsPanel";
import type { NewsWithCounts } from "@/shared/types";
import type { ExhibitionWithCounts } from "@/shared/exhibition-types";
import type { Job } from "@/shared/types";

type Tab = "analytics" | "users" | "posts" | "exhibitions" | "jobs" | "fundraising" | "reports" | "admins" | "advertising" | "learning" | "services" | "manuals" | "approvals" | "subscriptions" | "patients" | "kyc" | "system_config" | "pricing" | "ribbon_settings" | "bookings" | "support";

interface NavSection {
  id: string;
  title: string;
  icon: any;
  items: NavItem[];
}

interface NavItem {
  id: Tab;
  label: string;
  icon: any;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isPending, redirectToLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("analytics");
  const [posts, setPosts] = useState<any[]>([]);
  const [exhibitions, setExhibitions] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [fundraisers, setFundraisers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<string>("");
  const [permissions, setPermissions] = useState<Record<string, string>>({});
  const [editingPost, setEditingPost] = useState<NewsWithCounts | null>(null);
  const [editingExhibition, setEditingExhibition] = useState<ExhibitionWithCounts | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editingFundraiser, setEditingFundraiser] = useState<any>(null);
  const [viewingDocuments, setViewingDocuments] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [manuals, setManuals] = useState<any[]>([]);
  const [notificationCounts, setNotificationCounts] = useState<Record<string, number>>({});
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [kycSubmissions, setKycSubmissions] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    content: true,
    community: true,
    system: true,
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navSections: NavSection[] = [
    {
      id: "overview",
      title: "Overview",
      icon: LayoutDashboard,
      items: [
        { id: "analytics" as Tab, label: "Analytics", icon: BarChart3 },
      ],
    },
    {
      id: "content",
      title: "Content Management",
      icon: FolderOpen,
      items: [
        { id: "posts" as Tab, label: "News Posts", icon: FileText },
        { id: "exhibitions" as Tab, label: "Exhibitions", icon: Calendar },
        { id: "jobs" as Tab, label: "Job Listings", icon: Briefcase },
        { id: "learning" as Tab, label: "Courses", icon: GraduationCap },
        { id: "services" as Tab, label: "Services", icon: Wrench },
        { id: "manuals" as Tab, label: "Manuals", icon: BookOpen },
      ],
    },
    {
      id: "community",
      title: "Community & Users",
      icon: UserCog,
      items: [
        { id: "users" as Tab, label: "Partner Management", icon: Users },
        { id: "patients" as Tab, label: "Patient Management", icon: UserCheck },
        { id: "bookings" as Tab, label: "All Bookings", icon: Calendar },
        { id: "support" as Tab, label: "Support Tickets", icon: MessageCircle },
        { id: "kyc" as Tab, label: "KYC Verifications", icon: Shield },
        { id: "fundraising" as Tab, label: "Fundraisers", icon: Heart },
        { id: "reports" as Tab, label: "Reports", icon: AlertTriangle },
      ],
    },
    {
      id: "system",
      title: "System Settings",
      icon: Sliders,
      items: [
        { id: "system_config" as Tab, label: "Configuration", icon: Settings },
        { id: "pricing" as Tab, label: "Service Pricing", icon: CreditCard },
        
        { id: "ribbon_settings" as Tab, label: "Grand Opening", icon: Scissors },
        { id: "advertising" as Tab, label: "Advertising", icon: Megaphone },
        { id: "subscriptions" as Tab, label: "Subscriptions", icon: CreditCard },
        { id: "admins" as Tab, label: "Admin Users", icon: Shield },
      ],
    },
  ];

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (isPending) return;
      
      if (!user) {
        redirectToLogin();
        return;
      }

      const res = await fetch("/api/check-admin");
      const data = await res.json();
      
      if (!data.is_admin) {
        navigate("/dashboard");
        return;
      }
      
      setIsAdmin(true);
      setAdminRole(data.role || "admin");
      setPermissions(data.permissions || {});
    };

    checkAdminAccess();
  }, [user, isPending, navigate, redirectToLogin]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
      loadNotificationCounts();
    }
  }, [activeTab, isAdmin]);

  const loadNotificationCounts = async () => {
    try {
      const res = await fetch("/api/admin/notification-counts");
      if (res.ok) {
        const counts = await res.json();
        setNotificationCounts(counts);
      }
    } catch (error) {
      console.error("Error loading notification counts:", error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);

    try {
      if (activeTab === "posts") {
        const res = await fetch("/api/admin/posts");
        if (res.ok) setPosts(await res.json());
      } else if (activeTab === "exhibitions") {
        const res = await fetch("/api/admin/exhibitions");
        if (res.ok) setExhibitions(await res.json());
      } else if (activeTab === "jobs") {
        const res = await fetch("/api/admin/jobs");
        if (res.ok) setJobs(await res.json());
      } else if (activeTab === "fundraising") {
        const res = await fetch("/api/admin/fundraisers");
        if (res.ok) setFundraisers(await res.json());
      } else if (activeTab === "reports") {
        const res = await fetch("/api/admin/reports");
        if (res.ok) setReports(await res.json());
      } else if (activeTab === "admins") {
        const res = await fetch("/api/admin/admins");
        if (res.ok) setAdmins(await res.json());
      } else if (activeTab === "learning") {
        const res = await fetch("/api/admin/courses");
        if (res.ok) setCourses(await res.json());
      } else if (activeTab === "services") {
        const res = await fetch("/api/admin/services");
        if (res.ok) setServices(await res.json());
      } else if (activeTab === "manuals") {
        const res = await fetch("/api/admin/manuals");
        if (res.ok) setManuals(await res.json());
      } else if (activeTab === "subscriptions") {
        const res = await fetch("/api/admin/subscription-plans");
        if (res.ok) setSubscriptionPlans(await res.json());
      } else if (activeTab === "patients") {
        const res = await fetch("/api/admin/patients");
        if (res.ok) setPatients(await res.json());
      } else if (activeTab === "kyc") {
        const res = await fetch("/api/admin/kyc");
        if (res.ok) setKycSubmissions(await res.json());
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout");
    window.location.href = "/";
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    const res = await fetch(`/api/admin/posts/${postId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      loadData();
      alert("Post deleted successfully");
    }
  };

  const handleDeleteExhibition = async (exhibitionId: number) => {
    if (!confirm("Are you sure you want to delete this exhibition?")) return;

    const res = await fetch(`/api/admin/exhibitions/${exhibitionId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      loadData();
      alert("Exhibition deleted successfully");
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    const res = await fetch(`/api/admin/jobs/${jobId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      loadData();
      alert("Job deleted successfully");
    }
  };

  const handleResolveReport = async (reportId: number, reportType: string) => {
    const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ report_type: reportType }),
    });

    if (res.ok) {
      loadData();
      alert("Report resolved successfully");
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 transform ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-300 ease-in-out z-50 w-72 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
              <p className="text-xs text-gray-500">{adminRole === "super_admin" ? "Super Admin" : "Admin"}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          {navSections.map((section) => {
            const hasPermission = section.items.some(item => 
              item.id === "ribbon_settings" ? adminRole === "super_admin" : permissions[item.id]
            );
            if (!hasPermission) return null;

            const isExpanded = expandedSections[section.id];
            const SectionIcon = section.icon;

            return (
              <div key={section.id} className="mb-6">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mb-2"
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className="w-4 h-4 text-gray-500" />
                    <span>{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      // Super admins can see all items, regular admins need permissions
                      // ribbon_settings is super admin only
                      if (item.id === "ribbon_settings") {
                        if (adminRole !== "super_admin") return null;
                      } else if (item.id === "bookings" || item.id === "support") {
                        // Bookings and Support visible if admin has users OR patients permission
                        if (!permissions.users && !permissions.patients) return null;
                      } else if (!permissions[item.id]) {
                        return null;
                      }

                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const notificationCount = notificationCounts[item.id] || 0;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileSidebarOpen(false);
                          }}
                          className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="flex-1 text-left">{item.label}</span>
                          {notificationCount > 0 && (
                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold bg-red-500 text-white rounded-full">
                              {notificationCount > 99 ? "99+" : notificationCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto w-full">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          {/* Page Header */}
          <div className="mb-4 lg:mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
              {navSections
                .flatMap(s => s.items)
                .find(i => i.id === activeTab)?.label || "Dashboard"}
            </h2>
            <p className="text-xs lg:text-sm text-gray-600 mt-1">
              {activeTab === "analytics" && "Overview of platform metrics and insights"}
              {activeTab === "users" && "Manage service partners - change their service type, account type, and profile settings"}
              {activeTab === "patients" && "Manage patient accounts, profiles, and bookings"}
              {activeTab === "bookings" && "View and manage all service bookings across the platform"}
              {activeTab === "support" && "View and respond to customer support tickets"}
              {activeTab === "kyc" && "Review and approve partner KYC verification requests"}
              {activeTab === "posts" && "Manage news articles and blog posts"}
              {activeTab === "exhibitions" && "Manage biomedical exhibitions and conferences"}
              {activeTab === "jobs" && "Manage job postings and applications"}
              {activeTab === "fundraising" && "Review and approve fundraising campaigns"}
              {activeTab === "system_config" && "Configure API keys, hosting URLs, and service integrations"}
              {activeTab === "pricing" && "Manage fixed pricing for Nursing, Physiotherapy, and Ambulance services"}
              
              {activeTab === "advertising" && "Manage banner ads and promotional content"}
              {activeTab === "learning" && "Manage educational courses and training materials"}
              {activeTab === "services" && "Manage service provider listings"}
              {activeTab === "manuals" && "Manage equipment manuals and documentation"}
              {activeTab === "reports" && "Handle user reports and content moderation"}
              {activeTab === "subscriptions" && "Manage subscription plans and pricing"}
              {activeTab === "admins" && "Manage admin users and permissions"}
            </p>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            {isLoading && activeTab !== "analytics" ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading...</p>
              </div>
            ) : (
              <>
                {activeTab === "analytics" && <AnalyticsOverview />}
                {activeTab === "users" && <PartnerManagementPanel canEdit={permissions.users === "edit"} />}
                {activeTab === "patients" && (
                  <PatientManagementPanel patients={patients} onReload={loadData} canEdit={permissions.users === "edit"} />
                )}
                {activeTab === "bookings" && (
                  <BookingsManagementPanel canEdit={permissions.users === "edit"} />
                )}
                {activeTab === "support" && (
                  <SupportTicketsPanel canEdit={permissions.users === "edit"} />
                )}
                {activeTab === "kyc" && (
                  <KYCManagementPanel submissions={kycSubmissions} onReload={loadData} canEdit={permissions.kyc === "edit"} />
                )}
                {activeTab === "posts" && (
                  <PostsTable 
                    posts={posts} 
                    onDelete={handleDeletePost}
                    onEdit={(post) => setEditingPost(post)}
                    onReload={loadData}
                    canEdit={permissions.posts === "edit"}
                  />
                )}
                {activeTab === "exhibitions" && (
                  <ExhibitionsTable
                    exhibitions={exhibitions}
                    onDelete={handleDeleteExhibition}
                    onEdit={(exhibition) => setEditingExhibition(exhibition)}
                    onReload={loadData}
                    canEdit={permissions.exhibitions === "edit"}
                  />
                )}
                {activeTab === "jobs" && (
                  <JobsTable 
                    jobs={jobs} 
                    onDelete={handleDeleteJob}
                    onEdit={(job) => setEditingJob(job)}
                    canEdit={permissions.jobs === "edit"}
                  />
                )}
                {activeTab === "fundraising" && (
                  <FundraisersTable
                    fundraisers={fundraisers}
                    onReload={loadData}
                    onEdit={(fundraiser) => setEditingFundraiser(fundraiser)}
                    onViewDocuments={(fundraiser) => setViewingDocuments(fundraiser)}
                    canEdit={permissions.fundraising === "edit"}
                  />
                )}
                {activeTab === "system_config" && <SystemConfigPanel />}
                {activeTab === "pricing" && <PricingManagementPanel canEdit={adminRole === "super_admin"} />}
                {activeTab === "ribbon_settings" && <RibbonSettingsPanel />}
                
                {activeTab === "advertising" && <AdvertisingPanel canEdit={permissions.advertising === "edit"} />}
                {activeTab === "learning" && (
                  <LearningManagementPanel courses={courses} onReload={loadData} canEdit={permissions.learning === "edit"} />
                )}
                {activeTab === "services" && (
                  <ServicesManagementPanel services={services} onReload={loadData} canEdit={permissions.services === "edit"} />
                )}
                {activeTab === "manuals" && (
                  <ManualsManagementPanel manuals={manuals} onReload={loadData} canEdit={permissions.manuals === "edit"} />
                )}
                {activeTab === "reports" && (
                  <ReportsTable reports={reports} onResolve={handleResolveReport} canEdit={permissions.reports === "edit"} />
                )}
                {activeTab === "subscriptions" && (
                  <SubscriptionManagementPanel plans={subscriptionPlans} onReload={loadData} canEdit={permissions.subscriptions === "edit"} />
                )}
                {activeTab === "admins" && (
                  <AdminsTable admins={admins} onReload={loadData} isSuperAdmin={adminRole === "super_admin"} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {editingPost && (
        <EditNewsModal
          post={editingPost}
          isOpen={true}
          onClose={() => setEditingPost(null)}
          onSuccess={() => {
            setEditingPost(null);
            loadData();
          }}
        />
      )}

      {editingExhibition && (
        <EditExhibitionModal
          exhibition={editingExhibition}
          isOpen={true}
          onClose={() => setEditingExhibition(null)}
          onSuccess={() => {
            setEditingExhibition(null);
            loadData();
          }}
        />
      )}

      {editingJob && (
        <EditJobModal
          job={editingJob}
          isOpen={true}
          onClose={() => setEditingJob(null)}
          onSuccess={() => {
            setEditingJob(null);
            loadData();
          }}
        />
      )}

      {editingFundraiser && (
        <EditFundraiserModal
          fundraiser={editingFundraiser}
          isOpen={true}
          onClose={() => setEditingFundraiser(null)}
          onSuccess={() => {
            setEditingFundraiser(null);
            loadData();
          }}
        />
      )}

      {viewingDocuments && (
        <ViewDocumentsModal
          fundraiser={viewingDocuments}
          onClose={() => setViewingDocuments(null)}
        />
      )}
    </div>
  );
}

// ... rest of the component functions remain the same ...
function LearningManagementPanel({ courses, onReload, canEdit }: { courses: any[]; onReload: () => void; canEdit: boolean }) {
  const [reviewingCourse, setReviewingCourse] = useState<any>(null);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const handleToggleActive = async (courseId: number, isActive: boolean) => {
    if (!canEdit) return;

    const res = await fetch(`/api/admin/courses/${courseId}/toggle-active`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });

    if (res.ok) {
      onReload();
    } else {
      alert("Failed to update course status");
    }
  };

  const handleDelete = async (courseId: number) => {
    if (!canEdit || !confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;

    const res = await fetch(`/api/admin/courses/${courseId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      onReload();
      alert("Course deleted successfully");
    } else {
      alert("Failed to delete course");
    }
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Title</th>
              <th className="text-left py-3 px-4">Equipment</th>
              <th className="text-left py-3 px-4">Category</th>
              <th className="text-left py-3 px-4">Submitter</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Visibility</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-xs text-gray-500">{course.duration_hours}h • {course.modules_count} modules</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {course.equipment_name ? (
                    <div>
                      <p className="text-sm">{course.equipment_name}</p>
                      {course.equipment_model && (
                        <p className="text-xs text-gray-500">{course.equipment_model}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">N/A</span>
                  )}
                </td>
                <td className="py-3 px-4">{course.category}</td>
                <td className="py-3 px-4">
                  <span className="text-sm">{course.submitter_name || "System"}</span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.approval_status === "approved"
                      ? "bg-green-100 text-green-800"
                      : course.approval_status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {course.approval_status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.is_active
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {course.is_active ? "Visible" : "Hidden"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {canEdit ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReviewingCourse(course)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        title="Review Course"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingCourse(course)}
                        className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                        title="Edit Course"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(course.id, course.is_active)}
                        className={`p-2 rounded-lg ${
                          course.is_active
                            ? "bg-orange-100 text-orange-600 hover:bg-orange-200"
                            : "bg-green-100 text-green-600 hover:bg-green-200"
                        }`}
                        title={course.is_active ? "Hide Course" : "Show Course"}
                      >
                        {course.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        title="Delete Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">View Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No courses found
          </div>
        )}
      </div>

      {reviewingCourse && (
        <ReviewCourseModal
          course={reviewingCourse}
          onClose={() => setReviewingCourse(null)}
          onSuccess={() => {
            setReviewingCourse(null);
            onReload();
          }}
        />
      )}

      {editingCourse && (
        <EditCourseModal
          course={editingCourse}
          isOpen={true}
          onClose={() => setEditingCourse(null)}
          onSuccess={() => {
            setEditingCourse(null);
            onReload();
          }}
        />
      )}
    </div>
  );
}

function ServicesManagementPanel({ services, canEdit }: { services: any[]; onReload: () => void; canEdit: boolean }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Title</th>
              <th className="text-left py-3 px-4">Provider</th>
              <th className="text-left py-3 px-4">Type</th>
              <th className="text-left py-3 px-4">Location</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{service.title}</td>
                <td className="py-3 px-4">{service.provider_name || "N/A"}</td>
                <td className="py-3 px-4">{service.service_type}</td>
                <td className="py-3 px-4">{service.location || "N/A"}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${service.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {service.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {canEdit ? (
                    <div className="flex gap-2">
                      <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">View Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ManualsManagementPanel({ manuals, canEdit }: { manuals: any[]; onReload: () => void; canEdit: boolean }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div />
        {canEdit && (
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Upload Manual
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Title</th>
              <th className="text-left py-3 px-4">Manufacturer</th>
              <th className="text-left py-3 px-4">Model</th>
              <th className="text-left py-3 px-4">Type</th>
              <th className="text-left py-3 px-4">Downloads</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {manuals.map((manual) => (
              <tr key={manual.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{manual.title}</td>
                <td className="py-3 px-4">{manual.manufacturer || "N/A"}</td>
                <td className="py-3 px-4">{manual.model_number || "N/A"}</td>
                <td className="py-3 px-4">{manual.equipment_type || "N/A"}</td>
                <td className="py-3 px-4">{manual.download_count}</td>
                <td className="py-3 px-4">
                  {canEdit ? (
                    <div className="flex gap-2">
                      <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">View Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PostsTable({
  posts,
  onDelete,
  onEdit,
  onReload,
  canEdit,
}: {
  posts: any[];
  onDelete: (id: number) => void;
  onEdit: (post: any) => void;
  onReload: () => void;
  canEdit: boolean;
}) {
  const [isFetching, setIsFetching] = useState(false);
  const [pendingNews, setPendingNews] = useState<any[]>([]);

  useEffect(() => {
    loadPendingNews();
  }, []);

  const loadPendingNews = async () => {
    try {
      const res = await fetch("/api/admin/content/pending-news");
      if (res.ok) {
        const data = await res.json();
        setPendingNews(data);
      }
    } catch (error) {
      console.error("Error loading pending news:", error);
    }
  };

  const handleFetchNews = async () => {
    if (!canEdit) return;
    
    setIsFetching(true);
    try {
      const res = await fetch("/api/admin/content/fetch", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Successfully fetched ${data.items_fetched} news items for approval`);
        loadPendingNews();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to fetch news");
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      alert("An error occurred while fetching news");
    } finally {
      setIsFetching(false);
    }
  };

  const handleApproveNews = async (contentId: number) => {
    if (!canEdit) return;
    
    try {
      const res = await fetch(`/api/admin/content/${contentId}/approve`, {
        method: "PUT",
      });

      if (res.ok) {
        alert("News approved and published");
        loadPendingNews();
        onReload();
      } else {
        alert("Failed to approve news");
      }
    } catch (error) {
      console.error("Error approving news:", error);
      alert("An error occurred");
    }
  };

  const handleRejectNews = async (contentId: number) => {
    if (!canEdit || !confirm("Reject this news item?")) return;
    
    try {
      const res = await fetch(`/api/admin/content/${contentId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: "Does not meet quality standards" }),
      });

      if (res.ok) {
        alert("News rejected");
        loadPendingNews();
      } else {
        alert("Failed to reject news");
      }
    } catch (error) {
      console.error("Error rejecting news:", error);
      alert("An error occurred");
    }
  };

  const handleDeletePendingNews = async (contentId: number) => {
    if (!canEdit || !confirm("Delete this pending news item?")) return;
    
    try {
      const res = await fetch(`/api/admin/content/${contentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        loadPendingNews();
      } else {
        alert("Failed to delete news");
      }
    } catch (error) {
      console.error("Error deleting news:", error);
      alert("An error occurred");
    }
  };

  return (
    <div>
      {canEdit && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleFetchNews}
            disabled={isFetching}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetching ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Fetching...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>Fetch News with AI</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Pending News Approvals */}
      {pendingNews.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">NEW</span>
            Pending Approval ({pendingNews.length})
          </h3>
          <div className="grid gap-4">
            {pendingNews.map((item) => (
              <div key={item.id} className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.image_url || 'https://via.placeholder.com/150'}
                      alt={item.title}
                      className="w-32 h-24 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.content}</p>
                      </div>
                      <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs whitespace-nowrap">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      {item.source_url && (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Source Link →
                        </a>
                      )}
                      <span className="text-xs text-gray-500">
                        Fetched: {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {canEdit && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleApproveNews(item.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                        title="Approve and Publish"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectNews(item.id)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 text-sm font-medium"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleDeletePendingNews(item.id)}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published News Posts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Published News ({posts.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Title</th>
              <th className="text-left py-3 px-4">Author</th>
              <th className="text-left py-3 px-4">Category</th>
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{post.title}</td>
                <td className="py-3 px-4">{post.author_name || "System"}</td>
                <td className="py-3 px-4">{post.category}</td>
                <td className="py-3 px-4">
                  {new Date(post.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  {canEdit ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(post)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(post.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">View Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function ExhibitionsTable({
  exhibitions,
  onDelete,
  onEdit,
  onReload,
  canEdit,
}: {
  exhibitions: any[];
  onDelete: (id: number) => void;
  onEdit: (exhibition: any) => void;
  onReload: () => void;
  canEdit: boolean;
}) {
  const [isFetching, setIsFetching] = useState(false);
  const [pendingExhibitions, setPendingExhibitions] = useState<any[]>([]);

  useEffect(() => {
    loadPendingExhibitions();
  }, []);

  const loadPendingExhibitions = async () => {
    try {
      const res = await fetch("/api/admin/content/pending-exhibitions");
      if (res.ok) {
        const data = await res.json();
        setPendingExhibitions(data);
      }
    } catch (error) {
      console.error("Error loading pending exhibitions:", error);
    }
  };

  const handleFetchExhibitions = async () => {
    if (!canEdit) return;
    
    setIsFetching(true);
    try {
      const res = await fetch("/api/admin/content/fetch-exhibitions", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Successfully fetched ${data.items_fetched} exhibitions for approval`);
        loadPendingExhibitions();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to fetch exhibitions");
      }
    } catch (error) {
      console.error("Error fetching exhibitions:", error);
      alert("An error occurred while fetching exhibitions");
    } finally {
      setIsFetching(false);
    }
  };

  const handleApproveExhibition = async (contentId: number) => {
    if (!canEdit) return;
    
    try {
      const res = await fetch(`/api/admin/content/${contentId}/approve`, {
        method: "PUT",
      });

      if (res.ok) {
        alert("Exhibition approved and published");
        loadPendingExhibitions();
        onReload();
      } else {
        alert("Failed to approve exhibition");
      }
    } catch (error) {
      console.error("Error approving exhibition:", error);
      alert("An error occurred");
    }
  };

  const handleRejectExhibition = async (contentId: number) => {
    if (!canEdit || !confirm("Reject this exhibition?")) return;
    
    try {
      const res = await fetch(`/api/admin/content/${contentId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: "Does not meet quality standards" }),
      });

      if (res.ok) {
        alert("Exhibition rejected");
        loadPendingExhibitions();
      } else {
        alert("Failed to reject exhibition");
      }
    } catch (error) {
      console.error("Error rejecting exhibition:", error);
      alert("An error occurred");
    }
  };

  const handleDeletePendingExhibition = async (contentId: number) => {
    if (!canEdit || !confirm("Delete this pending exhibition?")) return;
    
    try {
      const res = await fetch(`/api/admin/content/${contentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        loadPendingExhibitions();
      } else {
        alert("Failed to delete exhibition");
      }
    } catch (error) {
      console.error("Error deleting exhibition:", error);
      alert("An error occurred");
    }
  };

  return (
    <div>
      {canEdit && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleFetchExhibitions}
            disabled={isFetching}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetching ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Fetching...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>Fetch Exhibitions with AI</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Pending Exhibitions Approvals */}
      {pendingExhibitions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">NEW</span>
            Pending Approval ({pendingExhibitions.length})
          </h3>
          <div className="grid gap-4">
            {pendingExhibitions.map((item) => (
              <div key={item.id} className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.image_url || 'https://via.placeholder.com/150'}
                      alt={item.title}
                      className="w-32 h-24 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                      </div>
                      <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs whitespace-nowrap">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-600">
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.location}
                        </span>
                      )}
                      {item.event_start_date && (
                        <span>
                          {new Date(item.event_start_date).toLocaleDateString()} - {new Date(item.event_end_date).toLocaleDateString()}
                        </span>
                      )}
                      <span className="text-gray-500">
                        Fetched: {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {canEdit && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleApproveExhibition(item.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                        title="Approve and Publish"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectExhibition(item.id)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2 text-sm font-medium"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleDeletePendingExhibition(item.id)}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published Exhibitions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Published Exhibitions ({exhibitions.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Title</th>
              <th className="text-left py-3 px-4">Organizer</th>
              <th className="text-left py-3 px-4">Location</th>
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exhibitions.map((exhibition) => (
              <tr key={exhibition.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{exhibition.title}</td>
                <td className="py-3 px-4">{exhibition.organizer_name || "N/A"}</td>
                <td className="py-3 px-4">{exhibition.location || "N/A"}</td>
                <td className="py-3 px-4">
                  {exhibition.event_start_date
                    ? new Date(exhibition.event_start_date).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="py-3 px-4">
                  {canEdit ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(exhibition)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(exhibition.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">View Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function JobsTable({
  jobs,
  onDelete,
  onEdit,
  canEdit,
}: {
  jobs: any[];
  onDelete: (id: number) => void;
  onEdit: (job: any) => void;
  canEdit: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">Title</th>
            <th className="text-left py-3 px-4">Company</th>
            <th className="text-left py-3 px-4">Type</th>
            <th className="text-left py-3 px-4">Location</th>
            <th className="text-left py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">{job.title}</td>
              <td className="py-3 px-4">{job.company_name || "N/A"}</td>
              <td className="py-3 px-4">{job.job_type || "N/A"}</td>
              <td className="py-3 px-4">{job.location || "N/A"}</td>
              <td className="py-3 px-4">
                {canEdit ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(job)}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(job.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">View Only</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportsTable({
  reports,
  onResolve,
  canEdit,
}: {
  reports: any[];
  onResolve: (id: number, type: string) => void;
  canEdit: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">Type</th>
            <th className="text-left py-3 px-4">Reported Item</th>
            <th className="text-left py-3 px-4">Reason</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-left py-3 px-4">Date</th>
            <th className="text-left py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={`${report.report_type}-${report.id}`} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs capitalize">
                  {report.report_type}
                </span>
              </td>
              <td className="py-3 px-4">{report.item_title || "N/A"}</td>
              <td className="py-3 px-4">{report.reason}</td>
              <td className="py-3 px-4">
                {report.status === "pending" ? (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    Pending
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Resolved
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                {new Date(report.created_at).toLocaleDateString()}
              </td>
              <td className="py-3 px-4">
                {report.status === "pending" && canEdit && (
                  <button
                    onClick={() => onResolve(report.id, report.report_type)}
                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                    title="Resolve"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                {report.status === "pending" && !canEdit && (
                  <span className="text-sm text-gray-500">View Only</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FundraisersTable({
  fundraisers,
  onReload,
  onEdit,
  onViewDocuments,
  canEdit,
}: {
  fundraisers: any[];
  onReload: () => void;
  onEdit: (fundraiser: any) => void;
  onViewDocuments: (fundraiser: any) => void;
  canEdit: boolean;
}) {
  const handleApprove = async (fundraiserId: number) => {
    if (!confirm("Approve this fundraiser?")) return;

    const res = await fetch(`/api/admin/fundraisers/${fundraiserId}/verify`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });

    if (res.ok) {
      onReload();
      alert("Fundraiser approved");
    }
  };

  const handleReject = async (fundraiserId: number) => {
    if (!confirm("Reject this fundraiser?")) return;

    const res = await fetch(`/api/admin/fundraisers/${fundraiserId}/verify`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });

    if (res.ok) {
      onReload();
      alert("Fundraiser rejected");
    }
  };

  const handleDelete = async (fundraiserId: number) => {
    if (!confirm("Are you sure you want to delete this fundraiser?")) return;

    const res = await fetch(`/api/admin/fundraisers/${fundraiserId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      onReload();
      alert("Fundraiser deleted");
    }
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Title</th>
              <th className="text-left py-3 px-4">Category</th>
              <th className="text-left py-3 px-4">Beneficiary</th>
              <th className="text-left py-3 px-4">Goal</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Documents</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fundraisers.map((fundraiser) => (
              <tr key={fundraiser.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium">{fundraiser.title}</p>
                    <p className="text-xs text-gray-500">{fundraiser.case_type}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                    {fundraiser.category}
                  </span>
                </td>
                <td className="py-3 px-4">{fundraiser.beneficiary_name}</td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium">${Number(fundraiser.goal_amount).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      ${Number(fundraiser.current_amount || 0).toLocaleString()} raised
                    </p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    fundraiser.verification_status === "approved"
                      ? "bg-green-100 text-green-800"
                      : fundraiser.verification_status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {fundraiser.verification_status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onViewDocuments(fundraiser)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <DocumentIcon className="w-4 h-4" />
                    View
                  </button>
                </td>
                <td className="py-3 px-4">
                  {canEdit ? (
                    <div className="flex gap-2">
                      {fundraiser.verification_status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(fundraiser.id)}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(fundraiser.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => onEdit(fundraiser)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(fundraiser.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">View Only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {fundraisers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No fundraisers found
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCourseModal({ course, onClose, onSuccess }: { course: any; onClose: () => void; onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/approve`, {
        method: "PUT",
      });

      if (res.ok) {
        alert("Course approved successfully");
        onSuccess();
      } else {
        alert("Failed to approve course");
      }
    } catch (error) {
      console.error("Error approving course:", error);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });

      if (res.ok) {
        alert("Course rejected");
        onSuccess();
      } else {
        alert("Failed to reject course");
      }
    } catch (error) {
      console.error("Error rejecting course:", error);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Review Course Submission</h2>
            <p className="text-sm text-gray-600 mt-1">
              Status: <span className={`font-medium ${
                course.approval_status === "approved" ? "text-green-600" :
                course.approval_status === "rejected" ? "text-red-600" : "text-yellow-600"
              }`}>{course.approval_status}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Video Player */}
            {course.video_url && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Course Video</h3>
                <div className="bg-black rounded-lg overflow-hidden aspect-video">
                  <video
                    controls
                    className="w-full h-full"
                    src={course.video_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}

            {/* Course Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Course Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Title</label>
                    <p className="text-gray-900">{course.title}</p>
                  </div>
                  
                  {course.equipment_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Equipment Name</label>
                      <p className="text-gray-900">{course.equipment_name}</p>
                    </div>
                  )}
                  
                  {course.equipment_model && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Equipment Model</label>
                      <p className="text-gray-900">{course.equipment_model}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="text-gray-900">{course.category}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Duration</label>
                      <p className="text-gray-900">{course.duration_hours || "N/A"} hours</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Modules</label>
                      <p className="text-gray-900">{course.modules_count || 0}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Price</label>
                      <p className="text-gray-900">{course.currency} {course.price || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Instructor</label>
                      <p className="text-gray-900">{course.instructor_name || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Additional Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900 text-sm">{course.description || "No description provided"}</p>
                  </div>

                  {course.content && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Course Content</label>
                      <p className="text-gray-900 text-sm whitespace-pre-wrap">{course.content}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600">Submitted By</label>
                    <p className="text-gray-900">{course.submitter_name || "System"}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Submitted On</label>
                    <p className="text-gray-900">{new Date(course.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {course.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Rejection Reason</h3>
                <p className="text-red-800 text-sm">{course.rejection_reason}</p>
              </div>
            )}

            {showRejectInput && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this course is being rejected..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          {course.approval_status === "pending" ? (
            showRejectInput ? (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectInput(false);
                    setRejectionReason("");
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isSubmitting || !rejectionReason.trim()}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                  disabled={isSubmitting}
                >
                  Close
                </button>
                <button
                  onClick={() => setShowRejectInput(true)}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Decline
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Approving..." : "Approve"}
                </button>
              </div>
            )
          ) : (
            <button
              onClick={onClose}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ViewDocumentsModal({ fundraiser, onClose }: { fundraiser: any; onClose: () => void }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch(`/api/admin/fundraisers/${fundraiser.id}/documents`);
        if (res.ok) {
          const docs = await res.json();
          setDocuments(docs);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [fundraiser.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Supporting Documents</h2>
            <p className="text-sm text-gray-600 mt-1">{fundraiser.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No documents uploaded
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <DocumentIcon className="w-5 h-5 text-gray-600 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.document_type}</p>
                        <p className="text-sm text-gray-600">{doc.file_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}



function SubscriptionManagementPanel({ plans, onReload, canEdit }: { plans: any[]; onReload: () => void; canEdit: boolean }) {
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [yearlyDiscountPercentage, setYearlyDiscountPercentage] = useState(17);
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [tempDiscount, setTempDiscount] = useState(17);

  useEffect(() => {
    fetchDiscountSettings();
  }, []);

  const fetchDiscountSettings = async () => {
    try {
      const res = await fetch("/api/admin/subscription-settings");
      if (res.ok) {
        const data = await res.json();
        setYearlyDiscountPercentage(data.yearly_discount_percentage || 17);
        setTempDiscount(data.yearly_discount_percentage || 17);
      }
    } catch (error) {
      console.error("Error fetching discount settings:", error);
    }
  };

  const handleSaveDiscount = async () => {
    if (tempDiscount < 0 || tempDiscount > 100) {
      alert("Discount percentage must be between 0 and 100");
      return;
    }

    try {
      const res = await fetch("/api/admin/subscription-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearly_discount_percentage: tempDiscount }),
      });

      if (res.ok) {
        setYearlyDiscountPercentage(tempDiscount);
        setIsEditingDiscount(false);
        alert("Yearly discount percentage updated successfully");
      } else {
        alert("Failed to update discount percentage");
      }
    } catch (error) {
      console.error("Error updating discount:", error);
      alert("An error occurred");
    }
  };

  const handleSavePlan = async (plan: any) => {
    if (!canEdit) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/subscription-plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });

      if (res.ok) {
        setEditingPlan(null);
        onReload();
        alert("Subscription plan updated successfully");
      } else {
        alert("Failed to update subscription plan");
      }
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      alert("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (planId: number, isActive: boolean) => {
    if (!canEdit) return;

    const res = await fetch(`/api/admin/subscription-plans/${planId}/toggle-active`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });

    if (res.ok) {
      onReload();
    } else {
      alert("Failed to update plan status");
    }
  };

  return (
    <div>
      {/* Yearly Discount Settings */}
      {canEdit && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Yearly Subscription Discount</h3>
              <p className="text-sm text-gray-600">Configure the discount percentage applied to yearly subscriptions</p>
            </div>
            {!isEditingDiscount ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">{yearlyDiscountPercentage}%</div>
                  <div className="text-xs text-gray-600">Current Discount</div>
                </div>
                <button
                  onClick={() => setIsEditingDiscount(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tempDiscount}
                    onChange={(e) => setTempDiscount(parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-semibold"
                  />
                  <span className="text-gray-600 font-medium">%</span>
                </div>
                <button
                  onClick={() => {
                    setIsEditingDiscount(false);
                    setTempDiscount(yearlyDiscountPercentage);
                  }}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDiscount}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.sort((a, b) => a.display_order - b.display_order).map((plan) => {
          const isFree = (plan.monthly_price || plan.price) === 0;
          const monthlyPrice = plan.monthly_price || plan.price || 0;
          const yearlyPrice = plan.yearly_price || (plan.monthly_price ? plan.monthly_price * 10 : plan.price * 10) || 0;
          
          return (
            <div
              key={plan.id}
              className={`border rounded-2xl p-6 ${
                plan.tier_name.includes("mavy_max")
                  ? "border-purple-500 shadow-lg bg-gradient-to-br from-purple-50 to-white"
                  : plan.tier_name.includes("mavy_pro")
                  ? "border-blue-500 shadow-lg bg-gradient-to-br from-blue-50 to-white"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{plan.tier_name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</h3>
                  <div className="mt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{plan.currency} {Number(monthlyPrice).toFixed(2)}</span>
                      <span className="text-gray-600 text-sm">/month</span>
                    </div>
                    {!isFree && (
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-lg font-semibold text-green-600">{plan.currency} {Number(yearlyPrice).toFixed(2)}</span>
                        <span className="text-gray-600 text-xs">/year</span>
                        <span className="text-xs text-green-600 ml-1">
                          (Save {yearlyDiscountPercentage}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {canEdit && (
                    <>
                      <button
                        onClick={() => setEditingPlan(plan)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                        title="Edit Plan"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(plan.id, plan.is_active)}
                        className={`p-2 rounded-lg ${
                          plan.is_active
                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        title={plan.is_active ? "Active" : "Inactive"}
                      >
                        {plan.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Benefits:</h4>
                <ul className="space-y-2">
                  {JSON.parse(plan.benefits || "[]").map((benefit: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  plan.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {plan.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {editingPlan && (
        <EditSubscriptionPlanModal
          plan={editingPlan}
          isOpen={true}
          onClose={() => setEditingPlan(null)}
          onSave={handleSavePlan}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function EditSubscriptionPlanModal({
  plan,
  isOpen,
  onClose,
  onSave,
  isSaving,
}: {
  plan: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: any) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    ...plan,
    benefits: JSON.parse(plan.benefits || "[]"),
  });

  const handleAddBenefit = () => {
    setFormData({
      ...formData,
      benefits: [...formData.benefits, ""],
    });
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_: any, i: number) => i !== index),
    });
  };

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData({
      ...formData,
      benefits: newBenefits,
    });
  };

  const handleSubmit = () => {
    const updatedPlan = {
      ...formData,
      benefits: JSON.stringify(formData.benefits),
    };
    onSave(updatedPlan);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Edit Subscription Plan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Name
              </label>
              <input
                type="text"
                value={formData.tier_name}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthly_price || formData.price || 0}
                  onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value), price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yearly Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.yearly_price || ((formData.monthly_price || formData.price || 0) * 10) || 0}
                  onChange={(e) => setFormData({ ...formData, yearly_price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Suggested: {formData.currency} {((formData.monthly_price || formData.price || 0) * 10).toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Benefits
                </label>
                <button
                  onClick={handleAddBenefit}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Benefit
                </button>
              </div>
              <div className="space-y-3">
                {formData.benefits.map((benefit: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => handleBenefitChange(index, e.target.value)}
                      placeholder="Enter benefit description"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleRemoveBenefit(index)}
                      className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {formData.benefits.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No benefits added yet. Click "Add Benefit" to add one.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminsTable({ admins, onReload, isSuperAdmin }: { admins: any[]; onReload: () => void; isSuperAdmin: boolean }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "super_admin">("admin");
  const [newAdminPermissions, setNewAdminPermissions] = useState<Record<string, string>>({});
  const [editingPermissions, setEditingPermissions] = useState<any>(null);

  const handleAddAdmin = async () => {
    const permissionsArray = Object.entries(newAdminPermissions).map(([tab_name, permission_level]) => ({
      tab_name,
      permission_level,
    }));

    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: newAdminEmail,
        role: newAdminRole,
        permissions: newAdminRole === "admin" ? permissionsArray : [],
      }),
    });

    if (res.ok) {
      setShowAddModal(false);
      setNewAdminEmail("");
      setNewAdminRole("admin");
      setNewAdminPermissions({});
      onReload();
      alert("Admin added successfully");
    } else {
      alert("Failed to add admin");
    }
  };

  const handleTogglePermission = (tabId: string) => {
    setNewAdminPermissions(prev => {
      const newPerms = { ...prev };
      if (newPerms[tabId]) {
        delete newPerms[tabId];
      } else {
        newPerms[tabId] = "view";
      }
      return newPerms;
    });
  };

  const handleChangePermissionLevel = (tabId: string, level: "view" | "edit") => {
    setNewAdminPermissions(prev => ({
      ...prev,
      [tabId]: level,
    }));
  };

  const handleDeleteAdmin = async (adminId: number) => {
    if (!confirm("Are you sure you want to delete this admin?")) return;

    const res = await fetch(`/api/admin/admins/${adminId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      onReload();
      alert("Admin deleted successfully");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div />
        {isSuperAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Add Admin
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Role</th>
              <th className="text-left py-3 px-4">Permissions</th>
              <th className="text-left py-3 px-4">Created</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{admin.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    admin.role === "super_admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {admin.role === "super_admin" ? (
                    <span className="text-sm text-gray-600">All Permissions</span>
                  ) : (
                    <span className="text-sm text-gray-600">
                      {admin.permissions?.length || 0} tab{admin.permissions?.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {new Date(admin.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    {isSuperAdmin && admin.role !== "super_admin" && (
                      <button
                        onClick={() => setEditingPermissions(admin)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Manage Permissions"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                    {isSuperAdmin && admin.email !== "info@themavy.com" && (
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Add New Admin</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Role</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={newAdminRole === "admin"}
                      onChange={(e) => setNewAdminRole(e.target.value as "admin")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <p className="font-medium">Admin</p>
                      <p className="text-xs text-gray-600">Custom permissions for specific tabs</p>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="role"
                      value="super_admin"
                      checked={newAdminRole === "super_admin"}
                      onChange={(e) => setNewAdminRole(e.target.value as "super_admin")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="ml-3">
                      <p className="font-medium">Super Admin</p>
                      <p className="text-xs text-gray-600">Full access to all features</p>
                    </div>
                  </label>
                </div>
              </div>

              {newAdminRole === "admin" && (
                <div>
                  <label className="block text-sm font-medium mb-3">Tab Permissions</label>
                  <div className="space-y-2">
                    {[
                      { id: "analytics", label: "Analytics" },
                      { id: "users", label: "Users" },
                      { id: "posts", label: "News Posts" },
                      { id: "exhibitions", label: "Exhibitions" },
                      { id: "jobs", label: "Jobs" },
                      { id: "fundraising", label: "Fundraising" },
                      { id: "advertising", label: "Advertising" },
                      { id: "learning", label: "Learning" },
                      { id: "services", label: "Services" },
                      { id: "manuals", label: "Manuals" },
                      { id: "reports", label: "Reports" },
                      { id: "subscriptions", label: "Subscriptions" },
                      { id: "admins", label: "Admins" },
                    ].map((tab) => {
                      const hasAccess = !!newAdminPermissions[tab.id];
                      const level = newAdminPermissions[tab.id] || "view";

                      return (
                        <div
                          key={tab.id}
                          className={`border rounded-lg p-3 ${
                            hasAccess ? "border-blue-300 bg-blue-50" : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={hasAccess}
                              onChange={() => handleTogglePermission(tab.id)}
                              className="mt-0.5 w-4 h-4 text-blue-600"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{tab.label}</p>
                              {hasAccess && (
                                <div className="mt-2 flex gap-3">
                                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`${tab.id}-level`}
                                      value="view"
                                      checked={level === "view"}
                                      onChange={() => handleChangePermissionLevel(tab.id, "view")}
                                      className="w-3 h-3"
                                    />
                                    View Only
                                  </label>
                                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`${tab.id}-level`}
                                      value="edit"
                                      checked={level === "edit"}
                                      onChange={() => handleChangePermissionLevel(tab.id, "edit")}
                                      className="w-3 h-3"
                                    />
                                    View + Edit
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={handleAddAdmin}
                disabled={!newAdminEmail || (newAdminRole === "admin" && Object.keys(newAdminPermissions).length === 0)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Add Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {editingPermissions && (
        <AdminPermissionsModal
          admin={editingPermissions}
          isOpen={true}
          onClose={() => setEditingPermissions(null)}
          onSuccess={() => {
            setEditingPermissions(null);
            onReload();
          }}
        />
      )}
    </div>
  );
}
