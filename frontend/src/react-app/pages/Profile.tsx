import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { useNavigate } from "react-router";
import { User, Mail, Phone, MapPin, Award, Edit2, Save, Upload, FileText, Download, Trash2, Briefcase, GraduationCap, Code, CheckCircle, Plus, X, Instagram, Facebook, Linkedin, Globe, Users, Send, AlertCircle, Building2, Star, Receipt, IndianRupee } from "lucide-react";

interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  grade: string;
  description: string;
}

interface ExperienceEntry {
  id: string;
  title: string;
  organization: string;
  employment_type: string;
  start_date: string;
  end_date: string;
  currently_working: boolean;
  location: string;
  description: string;
}

interface PartnerRating {
  id: number;
  patient_name: string;
  service_type: string;
  equipment_name: string;
  partner_rating: number;
  partner_review: string;
  created_at: string;
}

const SectionCard = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
    {children}
  </div>
);

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isDeletingResume, setIsDeletingResume] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const lastNameInputRef = useRef<HTMLInputElement>(null);
  const [localFullName, setLocalFullName] = useState("");
  const [localLastName, setLocalLastName] = useState("");
  const [isUploadingProfilePic, setIsUploadingProfilePic] = useState(false);
  const [ratings, setRatings] = useState<PartnerRating[]>([]);
  const [isLoadingRatings, setIsLoadingRatings] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    last_name: "",
    specialisation: "",
    bio: "",
    phone: "",
    country_code: "+1",
    location: "",
    skills: "",
    instagram_url: "",
    facebook_url: "",
    linkedin_url: "",
    instagram_visibility: "everyone",
    facebook_visibility: "everyone",
    linkedin_visibility: "everyone",
    is_open_to_work: false,
    state: "",
    country: "",
  });
  const [hasResume, setHasResume] = useState(false);
  const [educationEntries, setEducationEntries] = useState<EducationEntry[]>([]);
  const [experienceEntries, setExperienceEntries] = useState<ExperienceEntry[]>([]);


  const [profileInitialized, setProfileInitialized] = useState(false);

  useEffect(() => {
    if (!user || profileInitialized || isEditing) {
      return;
    }
    
    const userProfile = (user as any).profile || user;
    
    if (!userProfile?.onboarding_completed) {
      navigate("/onboarding");
      return;
    }
    
    if (userProfile?.account_type !== "patient") {
      loadRatings();
      
      if (userProfile?.account_type === "partner") {
        loadTransactions();
      }
    }
    
    const phoneNumber = userProfile?.phone || "";
    const fullName = userProfile?.full_name || (user as any)?.google_user_data?.name || "";
    const lastName = userProfile?.last_name || "";
    setLocalFullName(fullName);
    setLocalLastName(lastName);
    setProfile({
      full_name: fullName,
      last_name: lastName,
      specialisation: userProfile?.specialisation || "",
      bio: userProfile?.bio || "",
      phone: phoneNumber,
      country_code: userProfile?.country_code || "+1",
      location: userProfile?.location || "",
      skills: userProfile?.skills || "",
      instagram_url: userProfile?.instagram_url || "",
      facebook_url: userProfile?.facebook_url || "",
      linkedin_url: userProfile?.linkedin_url || "",
      instagram_visibility: userProfile?.instagram_visibility || "everyone",
      facebook_visibility: userProfile?.facebook_visibility || "everyone",
      linkedin_visibility: userProfile?.linkedin_visibility || "everyone",
      is_open_to_work: userProfile?.is_open_to_work === 1,
      state: userProfile?.state || "",
      country: userProfile?.country || "",
    });
    setOriginalPhone(phoneNumber);
    setHasResume(!!userProfile?.resume_url);

    if (userProfile?.education_json) {
      try {
        const parsed = JSON.parse(userProfile.education_json);
        setEducationEntries(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setEducationEntries([]);
      }
    }

    if (userProfile?.experience_json) {
      try {
        const parsed = JSON.parse(userProfile.experience_json);
        setExperienceEntries(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setExperienceEntries([]);
      }
    }
    
    setProfileInitialized(true);
  }, [user, profileInitialized, isEditing]);

  const loadRatings = async () => {
    setIsLoadingRatings(true);
    try {
      const response = await fetch("/api/partner/ratings", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings || []);
        setAverageRating(data.average_rating || 0);
      } else {
        console.error("Failed to load ratings:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error loading ratings:", error);
    } finally {
      setIsLoadingRatings(false);
    }
  };

  const loadTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const response = await fetch("/api/partner/transactions", {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotalEarnings(data.total_earnings || 0);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleSave = async () => {
    // Check if phone number changed
    if (profile.phone !== originalPhone && profile.phone) {
      // Validate Indian phone number format
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(profile.phone)) {
        setSaveError("Invalid phone number format. Please enter a valid 10-digit Indian mobile number.");
        return;
      }
      
      // Trigger OTP verification
      setPendingPhone(profile.phone);
      setShowPhoneVerification(true);
      return;
    }

    // Save without phone verification if number didn't change
    await saveProfile();
  };

  const saveProfile = async () => {
    setSaveSuccess(false);
    setSaveError("");
    setIsSaving(true);
    
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...profile,
          experience_json: experienceEntries,
          education_json: educationEntries,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.details 
          ? `Failed to save profile: ${errorData.details}` 
          : errorData.error || "Failed to save profile";
        throw new Error(errorMessage);
      }

      setOriginalPhone(profile.phone);
      setIsEditing(false);
      setSaveSuccess(true);
      
      setTimeout(() => {
        setSaveSuccess(false);
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to save profile. Please try again.";
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhoneVerified = async () => {
    setShowPhoneVerification(false);
    await saveProfile();
  };

  const handleCancel = () => {
    if (user) {
      const userProfile = (user as any).profile;
      const fullName = userProfile?.full_name || user.google_user_data.name || "";
      const lastName = userProfile?.last_name || "";
      setLocalFullName(fullName);
      setLocalLastName(lastName);
      setProfile({
        full_name: fullName,
        last_name: lastName,
        specialisation: userProfile?.specialisation || "",
        bio: userProfile?.bio || "",
        phone: userProfile?.phone || "",
        country_code: userProfile?.country_code || "+1",
        location: userProfile?.location || "",
        skills: userProfile?.skills || "",
        instagram_url: userProfile?.instagram_url || "",
        facebook_url: userProfile?.facebook_url || "",
        linkedin_url: userProfile?.linkedin_url || "",
        instagram_visibility: userProfile?.instagram_visibility || "everyone",
        facebook_visibility: userProfile?.facebook_visibility || "everyone",
        linkedin_visibility: userProfile?.linkedin_visibility || "everyone",
        is_open_to_work: userProfile?.is_open_to_work === 1,
        state: userProfile?.state || "",
        country: userProfile?.country || "",
      });

      if (userProfile?.education_json) {
        try {
          const parsed = JSON.parse(userProfile.education_json);
          setEducationEntries(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setEducationEntries([]);
        }
      } else {
        setEducationEntries([]);
      }

      if (userProfile?.experience_json) {
        try {
          const parsed = JSON.parse(userProfile.experience_json);
          setExperienceEntries(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setExperienceEntries([]);
        }
      } else {
        setExperienceEntries([]);
      }
    }
    
    setIsEditing(false);
    setSaveError("");
  };

  const addEducation = () => {
    setEducationEntries([
      ...educationEntries,
      {
        id: Date.now().toString(),
        institution: "",
        degree: "",
        field_of_study: "",
        start_date: "",
        end_date: "",
        grade: "",
        description: "",
      },
    ]);
  };

  const removeEducation = (id: string) => {
    setEducationEntries(educationEntries.filter((e) => e.id !== id));
  };

  const updateEducation = (id: string, field: keyof EducationEntry, value: string) => {
    setEducationEntries(
      educationEntries.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const addExperience = () => {
    setExperienceEntries([
      ...experienceEntries,
      {
        id: Date.now().toString(),
        title: "",
        organization: "",
        employment_type: "",
        start_date: "",
        end_date: "",
        currently_working: false,
        location: "",
        description: "",
      },
    ]);
  };

  const removeExperience = (id: string) => {
    setExperienceEntries(experienceEntries.filter((e) => e.id !== id));
  };

  const updateExperience = (id: string, field: keyof ExperienceEntry, value: string | boolean) => {
    setExperienceEntries(
      experienceEntries.map((e) => {
        if (e.id === id) {
          const updated = { ...e, [field]: value };
          if (field === "currently_working" && value === true) {
            updated.end_date = "";
          }
          return updated;
        }
        return e;
      })
    );
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setIsUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/profile/resume", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setHasResume(true);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        alert("Failed to upload resume");
      }
    } catch (error) {
      console.error("Error uploading resume:", error);
      alert("Failed to upload resume");
    } finally {
      setIsUploadingResume(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleResumeDownload = async () => {
    try {
      const response = await fetch("/api/profile/resume");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "resume.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to download resume");
      }
    } catch (error) {
      console.error("Error downloading resume:", error);
      alert("Failed to download resume");
    }
  };

  const handleResumeDelete = async () => {
    if (!confirm("Are you sure you want to delete your resume?")) return;

    setIsDeletingResume(true);
    try {
      const response = await fetch("/api/profile/resume", {
        method: "DELETE",
      });

      if (response.ok) {
        setHasResume(false);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        alert("Failed to delete resume");
      }
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert("Failed to delete resume");
    } finally {
      setIsDeletingResume(false);
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setIsUploadingProfilePic(true);
    try {
      const formData = new FormData();
      formData.append("profile_picture", file);

      const response = await fetch("/api/profile/profile-picture", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await refreshUser();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Failed to upload profile picture");
    } finally {
      setIsUploadingProfilePic(false);
      if (profilePicInputRef.current) {
        profilePicInputRef.current.value = "";
      }
    }
  };

  const VisibilityToggle = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange("everyone")}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          value === "everyone"
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        <Globe className="w-4 h-4" />
        Everyone
      </button>
      <button
        type="button"
        onClick={() => onChange("friends")}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
          value === "friends"
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        <Users className="w-4 h-4" />
        Friends Only
      </button>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto mb-20 lg:mb-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your professional information</p>
        </div>

        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">Profile saved successfully!</span>
            </div>
            <button onClick={() => setSaveSuccess(false)} className="text-green-600 hover:text-green-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {saveError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-red-800 font-medium">{saveError}</span>
            <button onClick={() => setSaveError("")} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center p-1">
                  {((user as any)?.profile_picture_url || (user as any)?.profile?.profile_picture_url) ? (
                    <img
                      src={(user as any)?.profile_picture_url || (user as any)?.profile?.profile_picture_url}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : user?.google_user_data?.picture ? (
                    <img
                      src={user.google_user_data.picture}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-blue-600" />
                  )}
                </div>
                <input
                  ref={profilePicInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicUpload}
                  className="hidden"
                />
                <button
                  onClick={() => profilePicInputRef.current?.click()}
                  disabled={isUploadingProfilePic}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  title="Edit profile picture"
                >
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </button>
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">
                  {profile.full_name || "Unnamed User"} {profile.last_name}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  {(user as any)?.profile?.is_verified === 1 && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                      <Award className="w-4 h-4" />
                      <span className="text-sm font-medium">Verified Engineer</span>
                    </div>
                  )}
                  {profile.is_open_to_work && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-400/90 text-white rounded-full">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Open to Work</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all font-medium"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white text-blue-600 rounded-lg hover:shadow-md transition-all font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white text-blue-600 rounded-lg hover:shadow-md transition-all font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <SectionCard title="Basic Information" icon={User}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  ref={fullNameInputRef}
                  type="text"
                  value={isEditing ? localFullName : (profile.full_name || "")}
                  onChange={(e) => {
                    if (!isEditing) return;
                    const value = e.target.value;
                    setLocalFullName(value);
                    setProfile(prev => ({ ...prev, full_name: value }));
                  }}
                  readOnly={!isEditing}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !isEditing ? "bg-gray-50 cursor-default" : ""
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  ref={lastNameInputRef}
                  type="text"
                  value={isEditing ? localLastName : (profile.last_name || "")}
                  onChange={(e) => {
                    if (!isEditing) return;
                    const value = e.target.value;
                    setLocalLastName(value);
                    setProfile(prev => ({ ...prev, last_name: value }));
                  }}
                  readOnly={!isEditing}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !isEditing ? "bg-gray-50 cursor-default" : ""
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
                <span className="text-xs text-gray-500 ml-2">(from your login account)</span>
              </label>
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg text-gray-900 border border-gray-200">
                <Mail className="w-5 h-5 text-gray-500" />
                <span>{(user as any)?.profile?.email || (user as any)?.profile?.patient_email || (user as any)?.google_user_data?.email || (user as any)?.email || 'Not set'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">This email cannot be changed as it's linked to your login account</p>
            </div>
          </div>
        </SectionCard>

        {/* Contact Information */}
        <SectionCard title="Contact Information" icon={Phone}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.country_code}
                    onChange={(e) => setProfile({ ...profile, country_code: e.target.value })}
                    placeholder="+1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg">
                    {profile.country_code}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="1234567890"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span>{profile.country_code} {profile.phone || "Not set"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Location Information */}
        <SectionCard title="Location Information" icon={MapPin}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-900 flex items-center justify-between">
                  <span>{profile.state || "Not detected"}</span>
                  {profile.state && <AlertCircle className="w-4 h-4 text-gray-500" />}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <div className="px-4 py-3 bg-gray-100 rounded-lg text-gray-900 flex items-center justify-between">
                  <span>{profile.country || "Not detected"}</span>
                  {profile.country && <AlertCircle className="w-4 h-4 text-gray-500" />}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location (City)</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="City, Country"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <span>{profile.location || "Not set"}</span>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <button
                onClick={() => setShowLocationModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
              >
                <Send className="w-4 h-4" />
                {profile.state && profile.country ? "Request Location Change" : "Set Location"}
              </button>
              <p className="text-xs text-blue-700 mt-2">
                {profile.state && profile.country 
                  ? "Your location was automatically detected during signup. Contact an admin if you need to update it."
                  : "Your location was not detected. Request to set your location manually."
                }
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Professional Information */}
        <SectionCard title="Professional Information" icon={Building2}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialisation</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.specialisation}
                  onChange={(e) => setProfile({ ...profile, specialisation: e.target.value })}
                  placeholder="e.g., Medical Imaging, Laboratory Equipment"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg">
                  {profile.specialisation || "Not set"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              {isEditing ? (
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  placeholder="Tell us about yourself and your professional background..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                  {profile.bio || "Not set"}
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Work Experience - Hidden for Business accounts */}
        {(user as any)?.profile?.account_type !== "business" && (
        <SectionCard title="Work Experience" icon={Briefcase}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Showcase your professional journey</p>
              {isEditing && (
                <button
                  onClick={addExperience}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Experience
                </button>
              )}
            </div>

            {experienceEntries.length === 0 && !isEditing && (
              <p className="text-gray-500 px-4 py-3 bg-gray-50 rounded-lg text-center">No work experience added yet</p>
            )}

            <div className="space-y-4">
              {experienceEntries.map((exp) => (
                <div key={exp.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Job Title"
                            value={exp.title}
                            onChange={(e) => updateExperience(exp.id, "title", e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Organization Name"
                            value={exp.organization}
                            onChange={(e) => updateExperience(exp.id, "organization", e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={() => removeExperience(exp.id)}
                          className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          value={exp.employment_type}
                          onChange={(e) => updateExperience(exp.id, "employment_type", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Employment Type</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Freelance">Freelance</option>
                          <option value="Internship">Internship</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Location"
                          value={exp.location}
                          onChange={(e) => updateExperience(exp.id, "location", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="month"
                          placeholder="Start Date"
                          value={exp.start_date}
                          onChange={(e) => updateExperience(exp.id, "start_date", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="month"
                          placeholder="End Date"
                          value={exp.end_date}
                          onChange={(e) => updateExperience(exp.id, "end_date", e.target.value)}
                          disabled={exp.currently_working}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
                        />
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={exp.currently_working}
                          onChange={(e) => updateExperience(exp.id, "currently_working", e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Currently working in this job</span>
                      </label>
                      <textarea
                        placeholder="Description"
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                      <p className="text-gray-700">{exp.organization}</p>
                      <p className="text-sm text-gray-600">
                        {exp.employment_type} • {exp.location}
                      </p>
                      <p className="text-sm text-gray-600">
                        {exp.start_date} - {exp.currently_working ? "Present" : exp.end_date}
                      </p>
                      {exp.description && (
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{exp.description}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
        )}

        {/* Skills - Hidden for Business accounts */}
        {(user as any)?.profile?.account_type !== "business" && (
        <SectionCard title="Skills & Expertise" icon={Code}>
          <div>
            {isEditing ? (
              <textarea
                value={profile.skills}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                rows={4}
                placeholder="List your technical skills, certifications, and expertise areas..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                {profile.skills || "No skills listed"}
              </p>
            )}
          </div>
        </SectionCard>
        )}

        {/* Education - Hidden for Business accounts */}
        {(user as any)?.profile?.account_type !== "business" && (
        <SectionCard title="Education" icon={GraduationCap}>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Share your academic background</p>
              {isEditing && (
                <button
                  onClick={addEducation}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Education
                </button>
              )}
            </div>

            {educationEntries.length === 0 && !isEditing && (
              <p className="text-gray-500 px-4 py-3 bg-gray-50 rounded-lg text-center">No education added yet</p>
            )}

            <div className="space-y-4">
              {educationEntries.map((edu) => (
                <div key={edu.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Institution Name"
                            value={edu.institution}
                            onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Degree"
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={() => removeEducation(edu.id)}
                          className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Field of Study"
                          value={edu.field_of_study}
                          onChange={(e) => updateEducation(edu.id, "field_of_study", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Grade/GPA"
                          value={edu.grade}
                          onChange={(e) => updateEducation(edu.id, "grade", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="month"
                          placeholder="Start Date"
                          value={edu.start_date}
                          onChange={(e) => updateEducation(edu.id, "start_date", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="month"
                          placeholder="End Date"
                          value={edu.end_date}
                          onChange={(e) => updateEducation(edu.id, "end_date", e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <textarea
                        placeholder="Description"
                        value={edu.description}
                        onChange={(e) => updateEducation(edu.id, "description", e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-gray-900">{edu.institution}</h4>
                      <p className="text-gray-700">
                        {edu.degree} {edu.field_of_study && `in ${edu.field_of_study}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {edu.start_date} - {edu.end_date}
                      </p>
                      {edu.grade && <p className="text-sm text-gray-600">Grade: {edu.grade}</p>}
                      {edu.description && (
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{edu.description}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
        )}

        {/* Social Media */}
        <SectionCard title="Social Media Profiles" icon={Globe}>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Linkedin className="w-5 h-5 text-blue-600" />
                  LinkedIn
                </label>
                {isEditing && (
                  <VisibilityToggle
                    value={profile.linkedin_visibility}
                    onChange={(val) => setProfile({ ...profile, linkedin_visibility: val })}
                  />
                )}
              </div>
              {isEditing ? (
                <input
                  type="url"
                  value={profile.linkedin_url}
                  onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {profile.linkedin_url ? (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {profile.linkedin_url}
                      </a>
                    ) : (
                      <span className="text-gray-500">Not set</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3 px-2 py-1 bg-white rounded-lg text-xs text-gray-600">
                    {profile.linkedin_visibility === "everyone" ? (
                      <>
                        <Globe className="w-3 h-3" />
                        Everyone
                      </>
                    ) : (
                      <>
                        <Users className="w-3 h-3" />
                        Friends Only
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Instagram className="w-5 h-5 text-pink-600" />
                  Instagram
                </label>
                {isEditing && (
                  <VisibilityToggle
                    value={profile.instagram_visibility}
                    onChange={(val) => setProfile({ ...profile, instagram_visibility: val })}
                  />
                )}
              </div>
              {isEditing ? (
                <input
                  type="url"
                  value={profile.instagram_url}
                  onChange={(e) => setProfile({ ...profile, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/yourprofile"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {profile.instagram_url ? (
                      <a
                        href={profile.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:underline break-all"
                      >
                        {profile.instagram_url}
                      </a>
                    ) : (
                      <span className="text-gray-500">Not set</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3 px-2 py-1 bg-white rounded-lg text-xs text-gray-600">
                    {profile.instagram_visibility === "everyone" ? (
                      <>
                        <Globe className="w-3 h-3" />
                        Everyone
                      </>
                    ) : (
                      <>
                        <Users className="w-3 h-3" />
                        Friends Only
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Facebook className="w-5 h-5 text-blue-700" />
                  Facebook
                </label>
                {isEditing && (
                  <VisibilityToggle
                    value={profile.facebook_visibility}
                    onChange={(val) => setProfile({ ...profile, facebook_visibility: val })}
                  />
                )}
              </div>
              {isEditing ? (
                <input
                  type="url"
                  value={profile.facebook_url}
                  onChange={(e) => setProfile({ ...profile, facebook_url: e.target.value })}
                  placeholder="https://facebook.com/yourprofile"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {profile.facebook_url ? (
                      <a
                        href={profile.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline break-all"
                      >
                        {profile.facebook_url}
                      </a>
                    ) : (
                      <span className="text-gray-500">Not set</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3 px-2 py-1 bg-white rounded-lg text-xs text-gray-600">
                    {profile.facebook_visibility === "everyone" ? (
                      <>
                        <Globe className="w-3 h-3" />
                        Everyone
                      </>
                    ) : (
                      <>
                        <Users className="w-3 h-3" />
                        Friends Only
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Career Preferences - Hidden for Business accounts */}
        {(user as any)?.profile?.account_type !== "business" && (
        <SectionCard title="Career Preferences" icon={Briefcase}>
          <label className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 cursor-pointer hover:border-green-400 transition-all">
            <div className="flex items-center gap-3">
              <CheckCircle className={`w-6 h-6 ${profile.is_open_to_work ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <span className="font-medium text-gray-900 block">Open to Work</span>
                <span className="text-sm text-gray-600">Let employers know you're available for opportunities</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={profile.is_open_to_work}
              onChange={(e) => setProfile({ ...profile, is_open_to_work: e.target.checked })}
              disabled={!isEditing}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer disabled:cursor-not-allowed"
            />
          </label>
        </SectionCard>
        )}

        {/* Resume - Hidden for Business accounts */}
        {(user as any)?.profile?.account_type !== "business" && (
        <SectionCard title="Resume / CV" icon={FileText}>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
            {hasResume ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Resume.pdf</p>
                    <p className="text-sm text-gray-500">Your current resume</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleResumeDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={handleResumeDelete}
                    disabled={isDeletingResume}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeletingResume ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Upload your resume (PDF only, max 5MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingResume}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all font-medium disabled:opacity-50"
                >
                  {isUploadingResume ? "Uploading..." : "Choose File"}
                </button>
              </div>
            )}
          </div>
        </SectionCard>
        )}

        {/* My Rating Section - For All Users */}
        <SectionCard title="My Rating" icon={Star}>
          {isLoadingRatings ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border-2 border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Overall Rating</p>
                    <div className="flex items-center gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {(ratings.length > 0 
                          ? averageRating 
                          : ((user as any)?.profile?.rating_stats?.average_rating || 0)
                        ).toFixed(1)}
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const rating = ratings.length > 0 
                            ? averageRating 
                            : ((user as any)?.profile?.rating_stats?.average_rating || 0);
                          const fullStars = Math.floor(rating);
                          const decimalPart = rating % 1;
                          
                          if (star <= fullStars) {
                            return (
                              <Star
                                key={star}
                                className="w-6 h-6 fill-yellow-400 text-yellow-400"
                              />
                            );
                          } else if (star === fullStars + 1 && decimalPart > 0) {
                            const fillPercentage = decimalPart * 100;
                            return (
                              <div key={star} className="relative w-6 h-6">
                                <Star className="w-6 h-6 text-gray-300" />
                                <div 
                                  className="absolute top-0 left-0 overflow-hidden" 
                                  style={{ width: `${fillPercentage}%` }}
                                >
                                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <Star
                                key={star}
                                className="w-6 h-6 text-gray-300"
                              />
                            );
                          }
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Reviews</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {ratings.length > 0 
                        ? ratings.length 
                        : ((user as any)?.profile?.rating_stats?.total_ratings || 0)}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center mt-4">
                Your overall rating is visible to others on the platform
              </p>
            </>
          )}
        </SectionCard>

        {/* Transaction History - Only for Business/Freelancer */}
        {((user as any)?.profile?.account_type === "business" || (user as any)?.profile?.account_type === "freelancer") && (
          <SectionCard title="Transaction History" icon={Receipt}>
            {isLoadingTransactions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No completed transactions yet</p>
                <p className="text-sm text-gray-400 mt-1">Earnings from completed orders will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl p-4 text-white">
                  <p className="text-sm opacity-90">Total Earnings</p>
                  <div className="flex items-center gap-1 mt-1">
                    <IndianRupee className="h-6 w-6" />
                    <span className="text-2xl font-bold">{totalEarnings.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-sm opacity-75 mt-1">{transactions.length} completed order{transactions.length !== 1 ? 's' : ''}</p>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{txn.patient_name}</p>
                          <p className="text-sm text-gray-600">
                            {txn.service_type || txn.service_category}
                            {txn.equipment_name && ` - ${txn.equipment_name}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {txn.completed_at ? new Date(txn.completed_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) : 'Completed'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                            <IndianRupee className="h-4 w-4" />
                            <span>{txn.quoted_price?.toLocaleString('en-IN') || '0'}</span>
                          </div>
                          {txn.partner_rating && (
                            <div className="flex items-center gap-1 text-xs text-amber-500 mt-1 justify-end">
                              <Star className="h-3 w-3 fill-current" />
                              <span>{txn.partner_rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        )}

        {/* Onboarding Details - Hidden for Nursing, Physiotherapy, and Ambulance providers */}
        {(user as any)?.profile?.account_type && 
         !["Nursing Professional", "Physiotherapy Professional", "Ambulance Provider"].includes((user as any)?.profile?.profession) && (
          <SectionCard title="Onboarding Details" icon={Building2}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">Your account-specific information</p>
              <button
                onClick={() => navigate("/profile/edit")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
              >
                <Edit2 className="w-4 h-4" />
                Edit Details
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Account Type</span>
                <span className="font-medium text-gray-900 capitalize">
                  {(user as any)?.profile?.account_type || "N/A"}
                </span>
              </div>

              {(user as any)?.profile?.account_type === "business" && (
                <>
                  {(user as any)?.profile?.business_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Name</span>
                      <span className="font-medium text-gray-900">
                        {(user as any).profile.business_name}
                      </span>
                    </div>
                  )}
                  {(user as any)?.profile?.gst_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST Number</span>
                      <span className="font-medium text-gray-900">
                        {(user as any).profile.gst_number}
                      </span>
                    </div>
                  )}
                  {(user as any)?.profile?.city && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">City</span>
                      <span className="font-medium text-gray-900">
                        {(user as any).profile.city}
                      </span>
                    </div>
                  )}
                </>
              )}

              {(user as any)?.profile?.account_type === "individual" && (
                <>
                  {(user as any)?.profile?.workplace_type && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Workplace Type</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {(user as any).profile.workplace_type}
                      </span>
                    </div>
                  )}
                  {(user as any)?.profile?.workplace_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Workplace Name</span>
                      <span className="font-medium text-gray-900">
                        {(user as any).profile.workplace_name}
                      </span>
                    </div>
                  )}
                </>
              )}

              {(user as any)?.profile?.account_type === "freelancer" && (
                <>
                  {(user as any)?.profile?.city && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">City</span>
                      <span className="font-medium text-gray-900">
                        {(user as any).profile.city}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </SectionCard>
        )}

        {/* Account Information */}
        <SectionCard title="Account Information" icon={Award}>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subscription Tier</span>
              <span className="font-medium text-gray-900 capitalize">
                {(user as any)?.profile?.subscription_tier || "Free"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Referral Code</span>
              <span className="font-mono font-medium text-blue-600">
                {(user as any)?.profile?.referral_code || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Member Since</span>
              <span className="font-medium text-gray-900">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Bottom Save/Cancel Buttons */}
        {isEditing && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 rounded-xl shadow-lg p-6 mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">Don't forget to save your changes</p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {showLocationModal && (
          <LocationChangeModal
            currentState={profile.state}
            currentCountry={profile.country}
            onClose={() => setShowLocationModal(false)}
          />
        )}

        {showPhoneVerification && (
          <PhoneVerificationModal
            phoneNumber={pendingPhone}
            onClose={() => {
              setShowPhoneVerification(false);
              setProfile({ ...profile, phone: originalPhone });
            }}
            onVerified={handlePhoneVerified}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function PhoneVerificationModal({ 
  phoneNumber, 
  onClose, 
  onVerified 
}: { 
  phoneNumber: string; 
  onClose: () => void;
  onVerified: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setResendTimer(60);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      setError("Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch("/api/auth/otp/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone_number: phoneNumber, 
          otp: otp 
        }),
      });

      const data = await response.json();

      if (data.success) {
        onVerified();
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    handleSendOtp();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Verify Phone Number</h3>
            <p className="text-sm text-gray-600 mt-1">We've sent an OTP to +91 {phoneNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {otpSent && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="000000"
                autoFocus
              />
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={isVerifying || otp.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Verify OTP
                </>
              )}
            </button>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-gray-600">
                  Resend OTP in <span className="font-semibold text-blue-600">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {isSendingOtp ? "Sending..." : "Resend OTP"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const COUNTRIES = [
  "United States", "India", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Japan", "China", "Brazil", "Mexico", "Italy",
  "Spain", "Netherlands", "Switzerland", "Sweden", "Singapore", "South Korea",
  "New Zealand", "Ireland", "Belgium", "Norway", "Denmark", "Finland",
  "Austria", "Poland", "Portugal", "Greece", "Czech Republic", "Hungary"
].sort();

const STATES_BY_COUNTRY: Record<string, string[]> = {
  "United States": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
    "New Hampshire", "New Jersey", "New Mexico", "New York",
    "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
    "West Virginia", "Wisconsin", "Wyoming"
  ],
  "India": [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal"
  ],
  "Canada": [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick",
    "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia",
    "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan",
    "Yukon"
  ],
  "Australia": [
    "Australian Capital Territory", "New South Wales", "Northern Territory",
    "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia"
  ],
  "United Kingdom": [
    "England", "Scotland", "Wales", "Northern Ireland"
  ]
};

function LocationChangeModal({ 
  currentState, 
  currentCountry, 
  onClose 
}: { 
  currentState: string; 
  currentCountry: string; 
  onClose: () => void;
}) {
  const [requestedState, setRequestedState] = useState("");
  const [requestedCountry, setRequestedCountry] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const availableStates = requestedCountry ? STATES_BY_COUNTRY[requestedCountry] || [] : [];

  const handleCountryChange = (country: string) => {
    setRequestedCountry(country);
    setRequestedState("");
  };

  const handleSubmit = async () => {
    if (!requestedState || !requestedCountry) {
      alert("Please fill in both state and country");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/profile/location-change-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          requested_state: requestedState,
          requested_country: requestedCountry,
          reason,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        alert("Failed to submit request");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Request Location Change</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {success ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Request Submitted</h4>
            <p className="text-gray-600">An admin will review your request shortly</p>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Current Location:</strong> {currentState}, {currentCountry}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requested Country
                </label>
                <select
                  value={requestedCountry}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select a country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requested State/Region
                </label>
                {availableStates.length > 0 ? (
                  <select
                    value={requestedState}
                    onChange={(e) => setRequestedState(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    disabled={!requestedCountry}
                  >
                    <option value="">Select a state/region</option>
                    {availableStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={requestedState}
                    onChange={(e) => setRequestedState(e.target.value)}
                    placeholder={requestedCountry ? "Enter state/region" : "Select a country first"}
                    disabled={!requestedCountry}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why you need to change your location"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !requestedState || !requestedCountry}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
