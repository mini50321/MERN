import { useState } from "react";
import { useAuth } from "@getmocha/users-service/react";
import {
  X,
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Award,
  Mail,
  Phone,
  Globe,
  GraduationCap,
  ListChecks,
  Gift,
  Users,
  Link as LinkIcon,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Temporary", "Internship", "Gig", "On-site Service"];
const REMOTE_TYPES = ["On-site", "Remote", "Hybrid"];
const EXPERIENCE_LEVELS = ["Entry Level", "1-2 years", "2-5 years", "5-10 years", "10+ years", "Executive"];
const EDUCATION_LEVELS = ["High School", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD", "Professional Certification", "Not Required"];
const SALARY_PERIODS = ["hourly", "daily", "weekly", "monthly", "yearly"];
const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", 
  "United Arab Emirates", "Saudi Arabia", "Singapore", "Japan", "Netherlands", "Switzerland",
  "Sweden", "Denmark", "Norway", "Finland", "Ireland", "New Zealand", "South Africa", "Brazil",
  "Mexico", "China", "South Korea", "Malaysia", "Philippines", "Indonesia", "Thailand", "Vietnam",
  "Bangladesh", "Pakistan", "Sri Lanka", "Nepal", "Qatar", "Kuwait", "Oman", "Bahrain", "Egypt",
  "Nigeria", "Kenya", "Ghana", "Other"
];

const STATES_BY_COUNTRY: Record<string, string[]> = {
  "India": [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal", "Delhi", "Chandigarh", "Puducherry", "Jammu and Kashmir", "Ladakh"
  ],
  "United States": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "District of Columbia"
  ],
  "United Kingdom": [
    "England", "Scotland", "Wales", "Northern Ireland",
    "Greater London", "West Midlands", "Greater Manchester", "West Yorkshire", "South Yorkshire",
    "Merseyside", "Tyne and Wear", "Kent", "Essex", "Hampshire", "Surrey", "Lancashire"
  ],
  "Canada": [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
    "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
    "Quebec", "Saskatchewan", "Yukon"
  ],
  "Australia": [
    "New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia",
    "Tasmania", "Australian Capital Territory", "Northern Territory"
  ],
  "Germany": [
    "Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse",
    "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate",
    "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"
  ],
  "United Arab Emirates": [
    "Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"
  ],
  "Saudi Arabia": [
    "Riyadh", "Makkah", "Madinah", "Eastern Province", "Asir", "Jazan", "Najran", "Al Bahah",
    "Northern Borders", "Al Jawf", "Hail", "Qassim", "Tabuk"
  ],
  "Pakistan": [
    "Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Islamabad Capital Territory",
    "Gilgit-Baltistan", "Azad Kashmir"
  ],
  "Bangladesh": [
    "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", "Sylhet", "Rangpur", "Mymensingh"
  ],
  "Malaysia": [
    "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Perak", "Perlis",
    "Penang", "Sabah", "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"
  ],
  "Philippines": [
    "Metro Manila", "Cebu", "Davao", "Calabarzon", "Central Luzon", "Western Visayas",
    "Central Visayas", "Northern Mindanao", "Ilocos Region", "Bicol Region"
  ],
  "Singapore": ["Central Region", "East Region", "North Region", "North-East Region", "West Region"],
  "Japan": [
    "Tokyo", "Osaka", "Kanagawa", "Aichi", "Saitama", "Chiba", "Hyogo", "Hokkaido", "Fukuoka", "Kyoto"
  ],
  "South Korea": [
    "Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Ulsan", "Sejong",
    "Gyeonggi", "Gangwon", "North Chungcheong", "South Chungcheong", "North Jeolla",
    "South Jeolla", "North Gyeongsang", "South Gyeongsang", "Jeju"
  ],
  "China": [
    "Beijing", "Shanghai", "Guangdong", "Zhejiang", "Jiangsu", "Shandong", "Sichuan",
    "Henan", "Hubei", "Hunan", "Fujian", "Anhui", "Liaoning", "Shaanxi", "Tianjin"
  ],
  "South Africa": [
    "Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Free State",
    "Limpopo", "Mpumalanga", "North West", "Northern Cape"
  ],
  "Nigeria": [
    "Lagos", "Kano", "Rivers", "Kaduna", "Oyo", "Katsina", "Ogun", "Edo", "Delta", "Abuja FCT"
  ],
  "Kenya": ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Central", "Coast", "Eastern", "Rift Valley"],
  "Brazil": [
    "São Paulo", "Rio de Janeiro", "Minas Gerais", "Bahia", "Paraná", "Rio Grande do Sul",
    "Pernambuco", "Ceará", "Pará", "Santa Catarina"
  ],
  "Mexico": [
    "Mexico City", "Jalisco", "Estado de México", "Nuevo León", "Veracruz", "Puebla",
    "Guanajuato", "Chihuahua", "Michoacán", "Baja California"
  ]
};

export default function CreateJobModal({ isOpen, onClose, onSuccess }: CreateJobModalProps) {
  const { user } = useAuth();
  const profile = (user as any)?.profile;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useCustomState, setUseCustomState] = useState(false);

  const [form, setForm] = useState({
    title: "",
    company_name: profile?.business_name || "",
    job_type: "Full-time",
    remote_type: "On-site",
    
    // Location
    country: profile?.country || "India",
    state: profile?.state || "",
    city: profile?.city || "",
    
    // Description
    description: "",
    responsibilities: "",
    skills_required: "",
    
    // Requirements
    experience: "Entry Level",
    education_required: "Not Required",
    
    // Compensation
    salary_min: "",
    salary_max: "",
    salary_currency: "INR",
    salary_period: "yearly",
    benefits: "",
    
    // Openings
    number_of_openings: "1",
    deadline_date: "",
    
    // Contact
    contact_email: profile?.patient_email || "",
    contact_number: profile?.phone || "",
    company_website: "",
    application_url: "",
    
    // Target
    target_profession: profile?.profession || "biomedical_engineer",
  });

  const updateForm = (field: string, value: string) => {
    if (field === "country") {
      // Reset state when country changes
      setForm({ ...form, [field]: value, state: "" });
      setUseCustomState(false);
    } else {
      setForm({ ...form, [field]: value });
    }
  };

  const availableStates = form.country ? STATES_BY_COUNTRY[form.country] || [] : [];

  const aiAutofill = async () => {
    if (!aiMessage.trim()) return;
    setIsGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/jobs/ai-autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: aiMessage }),
      });
      const data = await res.json();
      setForm({ ...form, ...data });
      setAiMessage("");
    } catch {
      setError("AI autofill failed. Please fill in the fields manually.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        ...form,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
        number_of_openings: parseInt(form.number_of_openings) || 1,
        is_remote: form.remote_type !== "On-site",
        location: [form.city, form.state, form.country].filter(Boolean).join(", "),
      };

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post job");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to post job");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-4 max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Post a Job</h2>
            <p className="text-sm text-gray-500 mt-1">Fill in the details to post your job listing</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* AI Autofill */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Sparkles className="w-4 h-4 inline mr-1 text-blue-600" />
              AI Job Parser (Optional)
            </label>
            <textarea
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              placeholder="Paste an existing job description and let AI extract the details..."
              className="w-full border border-gray-300 p-3 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <button
              type="button"
              onClick={aiAutofill}
              disabled={isGenerating || !aiMessage.trim()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? "Parsing..." : "AI Autofill"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Basic Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="e.g., Senior Biomedical Engineer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.company_name}
                    onChange={(e) => updateForm("company_name", e.target.value)}
                    placeholder="e.g., Apollo Hospital, MedTech Solutions, City Clinic"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Users className="w-4 h-4 inline mr-1" />
                    Number of Openings
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.number_of_openings}
                    onChange={(e) => updateForm("number_of_openings", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <select
                    value={form.job_type}
                    onChange={(e) => updateForm("job_type", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {JOB_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
                  <select
                    value={form.remote_type}
                    onChange={(e) => updateForm("remote_type", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {REMOTE_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                Location
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.country}
                    onChange={(e) => updateForm("country", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                  {availableStates.length > 0 && !useCustomState ? (
                    <div className="space-y-2">
                      <select
                        value={form.state}
                        onChange={(e) => updateForm("state", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select State</option>
                        {availableStates.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomState(true);
                          setForm({ ...form, state: "" });
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        State not listed? Enter manually
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => updateForm("state", e.target.value)}
                        placeholder="Enter state/province"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {availableStates.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setUseCustomState(false);
                            setForm({ ...form, state: "" });
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Select from list instead
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateForm("city", e.target.value)}
                    placeholder="e.g., San Francisco"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Job Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-purple-600" />
                Job Details
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Provide a detailed description of the job role, expectations, and what the candidate will be doing..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Responsibilities</label>
                <textarea
                  value={form.responsibilities}
                  onChange={(e) => updateForm("responsibilities", e.target.value)}
                  placeholder="• Maintain and repair medical equipment&#10;• Conduct preventive maintenance&#10;• Train hospital staff on equipment usage"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
                <textarea
                  value={form.skills_required}
                  onChange={(e) => updateForm("skills_required", e.target.value)}
                  placeholder="• Knowledge of medical imaging equipment&#10;• Experience with X-ray, CT, MRI machines&#10;• Strong troubleshooting skills"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Requirements Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-orange-600" />
                Requirements
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Award className="w-4 h-4 inline mr-1" />
                    Experience Level
                  </label>
                  <select
                    value={form.experience}
                    onChange={(e) => updateForm("experience", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {EXPERIENCE_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <GraduationCap className="w-4 h-4 inline mr-1" />
                    Education Required
                  </label>
                  <select
                    value={form.education_required}
                    onChange={(e) => updateForm("education_required", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {EDUCATION_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Compensation Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Compensation
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={form.salary_currency}
                    onChange={(e) => updateForm("salary_currency", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
                  <input
                    type="number"
                    value={form.salary_min}
                    onChange={(e) => updateForm("salary_min", e.target.value)}
                    placeholder="e.g., 50000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
                  <input
                    type="number"
                    value={form.salary_max}
                    onChange={(e) => updateForm("salary_max", e.target.value)}
                    placeholder="e.g., 80000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select
                    value={form.salary_period}
                    onChange={(e) => updateForm("salary_period", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {SALARY_PERIODS.map((period) => (
                      <option key={period} value={period}>
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Gift className="w-4 h-4 inline mr-1" />
                  Benefits & Perks
                </label>
                <textarea
                  value={form.benefits}
                  onChange={(e) => updateForm("benefits", e.target.value)}
                  placeholder="• Health insurance&#10;• Paid time off&#10;• Professional development&#10;• Company vehicle"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Contact Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                Contact Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => updateForm("contact_email", e.target.value)}
                    placeholder="hr@company.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={form.contact_number}
                    onChange={(e) => updateForm("contact_number", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Organization Website
                    </label>
                    <input
                      type="url"
                      value={form.company_website}
                      onChange={(e) => updateForm("company_website", e.target.value)}
                      placeholder="https://hospital.com or https://company.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <LinkIcon className="w-4 h-4 inline mr-1" />
                      Application URL
                    </label>
                    <input
                      type="url"
                      value={form.application_url}
                      onChange={(e) => updateForm("application_url", e.target.value)}
                      placeholder="https://company.com/careers"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                    <input
                      type="date"
                      value={form.deadline_date}
                      onChange={(e) => updateForm("deadline_date", e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Profession</label>
                    <select
                      value={form.target_profession}
                      onChange={(e) => updateForm("target_profession", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Professions</option>
                      <option value="biomedical_engineer">Biomedical Engineering</option>
                      <option value="nursing">Nursing</option>
                      <option value="physiotherapy">Physiotherapy</option>
                      <option value="ambulance_service">Ambulance Services</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim() || !form.description.trim() || !form.company_name.trim() || !form.contact_email.trim() || isSubmitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Briefcase className="w-4 h-4" />
                <span>Post Job</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
