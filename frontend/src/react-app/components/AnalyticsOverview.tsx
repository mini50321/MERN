import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  Users, 
  Activity, 
  UserCheck, 
  Calendar, 
  Shield, 
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface AnalyticsData {
  userStats: {
    totalPartners: number;
    totalPatients: number;
    partnersThisWeek: number;
    patientsThisWeek: number;
    activePartners: number;
    activePatients: number;
  };
  partnersByProfession: Array<{ profession: string; count: number }>;
  partnersByAccountType: Array<{ account_type: string; count: number }>;
  patientsByState: Array<{ state: string; count: number }>;
  bookingStats: {
    totalBookings: number;
    pendingBookings: number;
    acceptedBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    bookingsThisWeek: number;
    bookingsThisMonth: number;
  };
  bookingTrend: Array<{ date: string; bookings: number }>;
  bookingsByStatus: Array<{ status: string; count: number }>;
  kycStats: {
    totalSubmissions: number;
    pendingReview: number;
    approved: number;
    rejected: number;
    pendingThisWeek: number;
  };
  supportStats: {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    closedTickets: number;
    avgResponseTime: number;
    ticketsThisWeek: number;
  };
  engagementMetrics: {
    totalCourses: number;
    totalExhibitions: number;
    totalJobs: number;
    totalFundraisers: number;
    totalNews: number;
  };
  featureAccessAnalytics?: {
    partnerFeatureUsage: Array<{ feature: string; total_uses: number; unique_users: number }>;
    patientFeatureUsage: Array<{ feature: string; total_uses: number; unique_users: number }>;
    serviceTypeUsage: Array<{ service_type: string; booking_count: number; unique_patients: number; completed_count: number }>;
    topFeatures: Array<{ feature: string; access_count: number; unique_users: number; avg_duration: number }>;
  };
  activeUsers: number;
}

export default function AnalyticsOverview() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${dateRange}`);
      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Platform Analytics</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            {data.activeUsers || 0} Active Now
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as "7d" | "30d" | "90d")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* User Overview - Partners vs Patients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Partners Section */}
        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Service Partners</h3>
              <p className="text-sm text-gray-600">Healthcare professionals & businesses</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Partners</p>
              <p className="text-3xl font-bold text-blue-600">{data.userStats?.totalPartners || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-3xl font-bold text-green-600">{data.userStats?.activePartners || 0}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600 mb-1">New this week</p>
              <p className="text-2xl font-bold text-gray-900">{data.userStats?.partnersThisWeek || 0}</p>
            </div>
          </div>
        </div>

        {/* Patients Section */}
        <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl shadow-sm border border-green-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Patients</h3>
              <p className="text-sm text-gray-600">Service seekers</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Patients</p>
              <p className="text-3xl font-bold text-green-600">{data.userStats?.totalPatients || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-3xl font-bold text-blue-600">{data.userStats?.activePatients || 0}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600 mb-1">New this week</p>
              <p className="text-2xl font-bold text-gray-900">{data.userStats?.patientsThisWeek || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Statistics */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">Service Bookings</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="Total Bookings"
            value={data.bookingStats?.totalBookings || 0}
            color="bg-blue-100 text-blue-600"
            icon={<Calendar className="w-5 h-5" />}
          />
          <StatCard
            title="Pending"
            value={data.bookingStats?.pendingBookings || 0}
            color="bg-yellow-100 text-yellow-600"
            icon={<Clock className="w-5 h-5" />}
          />
          <StatCard
            title="Accepted"
            value={data.bookingStats?.acceptedBookings || 0}
            color="bg-green-100 text-green-600"
            icon={<CheckCircle className="w-5 h-5" />}
          />
          <StatCard
            title="Completed"
            value={data.bookingStats?.completedBookings || 0}
            color="bg-purple-100 text-purple-600"
            icon={<CheckCircle className="w-5 h-5" />}
          />
          <StatCard
            title="Cancelled"
            value={data.bookingStats?.cancelledBookings || 0}
            color="bg-red-100 text-red-600"
            icon={<XCircle className="w-5 h-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Booking Trend */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Booking Trend</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.bookingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="bookings" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bookings by Status */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Bookings by Status</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.bookingsByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.bookingsByStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* KYC & Support Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KYC Verifications */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">KYC Verifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total Submissions</span>
              <span className="text-lg font-bold text-gray-900">{data.kycStats?.totalSubmissions || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-yellow-700">Pending Review</span>
              <span className="text-lg font-bold text-yellow-600">{data.kycStats?.pendingReview || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-700">Approved</span>
              <span className="text-lg font-bold text-green-600">{data.kycStats?.approved || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-red-700">Rejected</span>
              <span className="text-lg font-bold text-red-600">{data.kycStats?.rejected || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-700">New This Week</span>
              <span className="text-lg font-bold text-blue-600">{data.kycStats?.pendingThisWeek || 0}</span>
            </div>
          </div>
        </div>

        {/* Support Tickets */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Support Tickets</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total Tickets</span>
              <span className="text-lg font-bold text-gray-900">{data.supportStats?.totalTickets || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-yellow-700">Open</span>
              <span className="text-lg font-bold text-yellow-600">{data.supportStats?.openTickets || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-700">In Progress</span>
              <span className="text-lg font-bold text-blue-600">{data.supportStats?.inProgressTickets || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-700">Closed</span>
              <span className="text-lg font-bold text-green-600">{data.supportStats?.closedTickets || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-700">Avg Response Time</span>
              <span className="text-lg font-bold text-purple-600">{data.supportStats?.avgResponseTime || 0}h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Partners by Profession */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Partners by Service Type</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.partnersByProfession}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="profession" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Partners by Account Type */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Partners by Account Type</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.partnersByAccountType}
                dataKey="count"
                nameKey="account_type"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.partnersByAccountType.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Patients by State */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Patients by State</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.patientsByState.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="state" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Platform Content */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-6">Platform Content</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100">
            <p className="text-3xl font-bold text-blue-600">{data.engagementMetrics.totalCourses}</p>
            <p className="text-sm text-gray-600 mt-2">Courses</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-100">
            <p className="text-3xl font-bold text-purple-600">{data.engagementMetrics.totalExhibitions}</p>
            <p className="text-sm text-gray-600 mt-2">Exhibitions</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-100">
            <p className="text-3xl font-bold text-green-600">{data.engagementMetrics.totalJobs}</p>
            <p className="text-sm text-gray-600 mt-2">Job Listings</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-white rounded-lg border border-pink-100">
            <p className="text-3xl font-bold text-pink-600">{data.engagementMetrics.totalFundraisers}</p>
            <p className="text-sm text-gray-600 mt-2">Fundraisers</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-100">
            <p className="text-3xl font-bold text-orange-600">{data.engagementMetrics.totalNews}</p>
            <p className="text-sm text-gray-600 mt-2">News Posts</p>
          </div>
        </div>
      </div>

      {/* Feature Access Analytics */}
      {data.featureAccessAnalytics && (
        <>
          {/* Top Features Overall */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Most Accessed Features (Last 7 Days)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-3 font-semibold text-gray-700">Feature</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Total Access</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Unique Users</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Avg Time (sec)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.featureAccessAnalytics.topFeatures.map((feature, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{feature.feature}</td>
                      <td className="py-2 px-3">{feature.access_count.toLocaleString()}</td>
                      <td className="py-2 px-3">{feature.unique_users.toLocaleString()}</td>
                      <td className="py-2 px-3">{Math.round(feature.avg_duration)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Partner vs Patient Feature Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Partner Feature Usage */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Partner Activity (Last 7 Days)</h3>
              </div>
              <div className="space-y-2">
                {data.featureAccessAnalytics.partnerFeatureUsage.slice(0, 10).map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{feature.feature}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">{feature.unique_users} users</span>
                      <span className="text-sm font-bold text-blue-600">{feature.total_uses}</span>
                    </div>
                  </div>
                ))}
                {data.featureAccessAnalytics.partnerFeatureUsage.length === 0 && (
                  <p className="text-center text-sm text-gray-500 py-4">No partner activity recorded</p>
                )}
              </div>
            </div>

            {/* Patient Feature Usage */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Patient Activity (Last 7 Days)</h3>
              </div>
              <div className="space-y-2">
                {data.featureAccessAnalytics.patientFeatureUsage.slice(0, 10).map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{feature.feature}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">{feature.unique_users} users</span>
                      <span className="text-sm font-bold text-green-600">{feature.total_uses}</span>
                    </div>
                  </div>
                ))}
                {data.featureAccessAnalytics.patientFeatureUsage.length === 0 && (
                  <p className="text-center text-sm text-gray-500 py-4">No patient activity recorded</p>
                )}
              </div>
            </div>
          </div>

          {/* Service Type Usage */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Service Booking Analytics (Last 7 Days)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 px-3 font-semibold text-gray-700">Service Type</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Total Bookings</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Unique Patients</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Completed</th>
                    <th className="py-2 px-3 font-semibold text-gray-700">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.featureAccessAnalytics.serviceTypeUsage.map((service, idx) => {
                    const successRate = service.booking_count > 0 
                      ? Math.round((service.completed_count / service.booking_count) * 100) 
                      : 0;
                    return (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium">{service.service_type}</td>
                        <td className="py-2 px-3">{service.booking_count}</td>
                        <td className="py-2 px-3">{service.unique_patients}</td>
                        <td className="py-2 px-3">{service.completed_count}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            successRate >= 70 ? 'bg-green-100 text-green-800' :
                            successRate >= 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {successRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.featureAccessAnalytics.serviceTypeUsage.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-4">No service bookings recorded</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
  icon,
}: {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-600">{title}</p>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}
