import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import {
  MapPin,
  DollarSign,
  Plus,
  Building2,
  Award,
  Globe,
  Briefcase,
  Users,
  Clock,
  Phone,
  Mail,
} from "lucide-react";
import type { Job } from "@/shared/types";
import JobApplicationModal from "@/react-app/components/JobApplicationModal";
import CreateJobModal from "@/react-app/components/CreateJobModal";
import EditJobModal from "@/react-app/components/EditJobModal";
import DeleteConfirmModal from "@/react-app/components/DeleteConfirmModal";
import { MoreHorizontal, Code, Flag } from "lucide-react";

/* =========================
   Constants
========================= */
const JOB_TYPES = ["All", "Full-time", "Contract", "Gig", "On-site Service"];

/* =========================
   Component
========================= */
export default function Jobs() {
  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);

  const [showPost, setShowPost] = useState(false);
  const [hasResume, setHasResume] = useState(false);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [applied, setApplied] = useState<Set<number>>(new Set());
  const [countryFilter, setCountryFilter] = useState("");
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showMenuForJob, setShowMenuForJob] = useState<number | null>(null);
  const menuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  /* =========================
     Effects
  ========================= */
  useEffect(() => {
    fetchJobs();
  }, [type, countryFilter]);

  useEffect(() => {
    if (user) {
      checkResume();
      fetchUserProfile();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenuForJob !== null) {
        const menuElement = menuRefs.current[showMenuForJob];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setShowMenuForJob(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenuForJob]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const userId = data.profile?.user_id || data.user_id || (user as any).user_id || (user as any).id;
        setCurrentUserId(userId);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  /* =========================
     Data
  ========================= */
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (type && type !== "All") params.append("type", type);
      if (countryFilter) params.append("country", countryFilter);

      const res = await fetch(`/api/jobs?${params.toString()}`, {
        credentials: "include"
      });
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const checkResume = async () => {
    try {
      const res = await fetch("/api/users/me");
      const data = await res.json();
      setHasResume(!!data.profile?.resume_url);
    } catch {
      setHasResume(false);
    }
  };

  /* =========================
     Handlers
  ========================= */
  const applyJob = async () => {
    if (!selectedJob) return;
    setApplyingId(selectedJob.id);
    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/apply`, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) throw new Error();
      setApplied(new Set([...applied, selectedJob.id]));
      setSelectedJob(null);
    } catch {
      alert("Application failed");
    } finally {
      setApplyingId(null);
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setShowMenuForJob(null);
  };

  const handleDelete = async (jobId: number) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setJobs(jobs.filter(j => j.id !== jobId));
        setDeletingJobId(null);
      } else {
        alert("Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    fetchJobs();
    setEditingJob(null);
  };

  /* =========================
     Render
  ========================= */
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto mb-20 lg:mb-0 p-3 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4 sm:mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold">Job Board</h1>
            <p className="text-gray-600 text-xs sm:text-base">
              Find opportunities in biomedical engineering
            </p>
          </div>
          <button
            onClick={() => setShowPost(true)}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm sm:text-base flex-shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Post Job</span><span className="sm:hidden">Post</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-6 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {JOB_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  type === t || (!type && t === "All")
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="flex-1 sm:flex-none sm:w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Countries</option>
              <option value="India">India</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="Germany">Germany</option>
              <option value="United Arab Emirates">UAE</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="Singapore">Singapore</option>
            </select>
          </div>
        </div>

        {/* Jobs */}
        {loading ? (
          <div className="text-center py-8 text-sm sm:text-base">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-white p-6 sm:p-12 rounded-2xl shadow text-center">
            <p className="text-sm sm:text-base">No jobs available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job: any) => {
              const isOwner = currentUserId && job.posted_by_user_id && String(currentUserId) === String(job.posted_by_user_id);
              return (
              <div key={job.id} className="bg-white p-4 sm:p-6 rounded-2xl shadow hover:shadow-lg transition-shadow relative">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold break-words text-gray-900">{job.title}</h3>
                    {job.company_name && (
                      <p className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <span className="break-words">{job.company_name}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-2">
                    {job.job_type && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {job.job_type}
                      </span>
                    )}
                    {job.remote_type && job.remote_type !== "On-site" && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {job.remote_type}
                      </span>
                    )}
                    {job.number_of_openings > 1 && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {job.number_of_openings} openings
                      </span>
                    )}
                    </div>
                    {isOwner && (
                      <div className="relative" ref={(el) => { menuRefs.current[job.id] = el; }}>
                        <button
                          onClick={() => setShowMenuForJob(showMenuForJob === job.id ? null : job.id)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreHorizontal className="w-5 h-5 text-gray-600" />
                        </button>
                        {showMenuForJob === job.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-64 z-50">
                            <button
                              onClick={() => handleEdit(job)}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                            >
                              <Code className="w-5 h-5" />
                              <span className="text-sm font-medium">Edit Job</span>
                            </button>
                            <button
                              onClick={() => {
                                setDeletingJobId(job.id);
                                setShowMenuForJob(null);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 text-red-600"
                            >
                              <Flag className="w-5 h-5" />
                              <span className="text-sm font-medium">Delete Job</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <p className="my-3 text-sm sm:text-base text-gray-700 line-clamp-3">{job.description}</p>

                <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  {(job.location || job.country) && (
                    <span className="flex gap-1 items-center">
                      <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" /> 
                      <span className="break-words">{job.location || [job.city, job.state, job.country].filter(Boolean).join(", ")}</span>
                    </span>
                  )}
                  {(job.salary_min || job.salary_max || job.compensation) && (
                    <span className="flex gap-1 items-center">
                      <DollarSign className="w-4 h-4 flex-shrink-0 text-gray-400" /> 
                      <span className="break-words">
                        {job.salary_min && job.salary_max 
                          ? `${job.salary_currency || ''} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}/${job.salary_period || 'year'}`
                          : job.compensation}
                      </span>
                    </span>
                  )}
                  {job.experience && (
                    <span className="flex gap-1 items-center">
                      <Award className="w-4 h-4 flex-shrink-0 text-gray-400" /> 
                      <span className="break-words">{job.experience}</span>
                    </span>
                  )}
                  {job.deadline_date && (
                    <span className="flex gap-1 items-center">
                      <Clock className="w-4 h-4 flex-shrink-0 text-gray-400" /> 
                      <span>Deadline: {new Date(job.deadline_date).toLocaleDateString()}</span>
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    disabled={applied.has(job.id)}
                    onClick={() => setSelectedJob(job)}
                    className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                      applied.has(job.id)
                        ? "bg-green-100 text-green-700"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg"
                    }`}
                  >
                    {applied.has(job.id) ? "Applied" : "Apply Now"}
                  </button>
                  {job.contact_number && (
                    <a
                      href={`tel:${job.contact_number}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
                    >
                      <Phone className="w-4 h-4" />
                      <span className="hidden sm:inline">Call</span>
                    </a>
                  )}
                  {job.contact_email && (
                    <a
                      href={`mailto:${job.contact_email}?subject=Application for ${encodeURIComponent(job.title)}`}
                      className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="hidden sm:inline">Email</span>
                    </a>
                  )}
                  {job.application_url && (
                    <a
                      href={job.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 sm:px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
                    >
                      External Apply
                    </a>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* Post Job Modal */}
      <CreateJobModal
        isOpen={showPost}
        onClose={() => setShowPost(false)}
        onSuccess={() => {
          setShowPost(false);
          fetchJobs();
        }}
      />

      {/* Apply Modal */}
      <JobApplicationModal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onConfirm={applyJob}
        jobTitle={selectedJob?.title || ""}
        hasResume={hasResume}
        isApplying={applyingId === selectedJob?.id}
      />

      {/* Edit Job Modal */}
      {editingJob && (
        <EditJobModal
          job={editingJob}
          isOpen={!!editingJob}
          onClose={() => setEditingJob(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deletingJobId !== null}
        onClose={() => {
          if (!isDeleting) {
            setDeletingJobId(null);
          }
        }}
        onConfirm={async () => {
          if (deletingJobId) {
            await handleDelete(deletingJobId);
          }
        }}
        title="Delete Job"
        message="Are you sure you want to delete this job posting? This action cannot be undone."
        itemName={jobs.find(j => j.id === deletingJobId)?.title}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
}
