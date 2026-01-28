import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { ArrowLeft, Building2, FileText, Upload, Briefcase, CheckCircle, DollarSign, Save, Sparkles, X, Plus, Mail } from "lucide-react";

interface Speciality {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  speciality_id: number;
}

interface BrandInfo {
  brand_name: string;
  sales_relationship?: "manufacturer" | "dealer" | "importer" | "none";
  service_relationship?: "direct_provider" | "dealer" | "none";
  authorization_certificate_url?: string;
  license_type?: string;
  license_number?: string;
  product_image_url?: string;
  catalog_url?: string;
  territories?: string[];
  engineer_name?: string;
  engineer_email?: string;
  engineer_contact?: string;
}

interface ProductSelection {
  product_id: number;
  has_sales: boolean;
  has_service: boolean;
  hourly_rate?: number;
  service_charge?: number;
  brands: BrandInfo[];
}

interface ProfileCompletionStatus {
  completionPercentage: number;
  totalFields: number;
  filledFields: number;
  missingFields: string[];
  potentialXP: number;
}

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [showXpNotification, setShowXpNotification] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<ProfileCompletionStatus | null>(null);
  const [showCompletionBanner, setShowCompletionBanner] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Business data
  const [businessData, setBusinessData] = useState({
    business_name: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    gst_number: "",
    phone: "",
    email: "",
  });
  const [gstDocument, setGstDocument] = useState<File | null>(null);
  const [isUploadingGst, setIsUploadingGst] = useState(false);

  // Individual data
  const [individualData, setIndividualData] = useState({
    workplace_type: "",
    workplace_name: "",
  });

  // Freelancer data
  const [freelancerData, setFreelancerData] = useState({
    full_name: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    phone: "",
    email: "",
  });

  // Common data
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSpecialities, setSelectedSpecialities] = useState<number[]>([]);
  const [productSelections, setProductSelections] = useState<Record<number, ProductSelection>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [newBrandName, setNewBrandName] = useState<Record<number, string>>({});
  const [uploadingCert, setUploadingCert] = useState<{ productId: number; brandIndex: number } | null>(null);
  const [uploadingImage, setUploadingImage] = useState<{ productId: number; brandIndex: number } | null>(null);
  const [uploadingCatalog, setUploadingCatalog] = useState<{ productId: number; brandIndex: number } | null>(null);

  const manufacturingLicenses = [
    { value: "CDSCO", label: "CDSCO (India)" },
    { value: "FDA", label: "FDA (USA)" },
    { value: "CE", label: "CE Mark (Europe)" },
    { value: "MHRA", label: "MHRA (UK)" },
    { value: "TGA", label: "TGA (Australia)" },
    { value: "PMDA", label: "PMDA (Japan)" },
    { value: "NMPA", label: "NMPA (China)" },
    { value: "Other", label: "Other" }
  ];

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  useEffect(() => {
    if (user) {
      loadData();
      loadCompletionStatus();
    }
  }, [user]);

  const loadCompletionStatus = async () => {
    try {
      const response = await fetch("/api/profile/completion-status");
      if (response.ok) {
        const status = await response.json();
        setCompletionStatus(status);
      }
    } catch (error) {
      console.error("Error loading completion status:", error);
    }
  };

  const loadData = async () => {
    if (!user) return;
    
    try {
      const profile = (user as any).profile;
      setAccountType(profile?.account_type || "");

      // Load specialities and products
      const [specialitiesRes, productsRes, userSpecialitiesRes, userProductsRes] = await Promise.all([
        fetch("/api/specialities"),
        fetch("/api/products"),
        fetch("/api/user/specialities"),
        fetch("/api/user/products"),
      ]);

      if (specialitiesRes.ok && productsRes.ok) {
        const specialitiesData = await specialitiesRes.json();
        const productsData = await productsRes.json();
        setSpecialities(specialitiesData);
        setProducts(productsData);

        if (userSpecialitiesRes.ok) {
          const userSpecialitiesData = await userSpecialitiesRes.json();
          setSelectedSpecialities(userSpecialitiesData.map((s: any) => s.speciality_id));
        }

        if (userProductsRes.ok) {
          const userProductsData = await userProductsRes.json();
          const selections: Record<number, ProductSelection> = {};
          
          for (const p of userProductsData) {
            // Fetch brands for this product
            const brandsRes = await fetch(`/api/user/products/${p.id}/brands`);
            let brands: BrandInfo[] = [];
            
            if (brandsRes.ok) {
              const brandsData = await brandsRes.json();
              brands = brandsData.map((b: any) => {
                let territories: string[] = [];
                try {
                  territories = b.territories ? JSON.parse(b.territories) : [];
                } catch (e) {
                  console.error("Error parsing territories for brand:", b.brand_name, e);
                  territories = [];
                }
                return {
                  brand_name: b.brand_name,
                  sales_relationship: b.sales_relationship,
                  service_relationship: b.service_relationship,
                  authorization_certificate_url: b.authorization_certificate_url,
                  license_type: b.license_type,
                  license_number: b.license_number,
                  product_image_url: b.product_image_url,
                  catalog_url: b.catalog_url,
                  territories: territories,
                  engineer_name: b.engineer_name,
                  engineer_email: b.engineer_email,
                  engineer_contact: b.engineer_contact,
                };
              });
            }

            selections[p.product_id] = {
              product_id: p.product_id,
              has_sales: p.has_sales === 1,
              has_service: p.has_service === 1,
              hourly_rate: p.hourly_rate,
              service_charge: p.service_charge,
              brands: brands,
            };
          }
          
          setProductSelections(selections);
        }
      }

      // Load account-specific data
      if (profile?.account_type === "business") {
        setBusinessData({
          business_name: profile.business_name || "",
          country: profile.country || "",
          state: profile.state || "",
          city: profile.city || "",
          pincode: profile.pincode || "",
          gst_number: profile.gst_number || "",
          phone: profile.phone || "",
          email: user?.email || "",
        });
      } else if (profile?.account_type === "individual") {
        setIndividualData({
          workplace_type: profile.workplace_type || "",
          workplace_name: profile.workplace_name || "",
        });
      } else if (profile?.account_type === "freelancer") {
        setFreelancerData({
          full_name: profile.full_name || "",
          country: profile.country || "",
          state: profile.state || "",
          city: profile.city || "",
          pincode: profile.pincode || "",
          phone: profile.phone || "",
          email: user?.email || "",
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      alert("There was an error loading your profile data. Please refresh the page and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpeciality = (id: number) => {
    setSelectedSpecialities((prev) => {
      if (prev.includes(id)) {
        // Remove speciality and its products
        const specialityProducts = products.filter(p => p.speciality_id === id).map(p => p.id);
        const updated = { ...productSelections };
        specialityProducts.forEach(pid => delete updated[pid]);
        setProductSelections(updated);
        return prev.filter((s) => s !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleProduct = (productId: number) => {
    setProductSelections((prev) => {
      const newSelections = { ...prev };
      if (newSelections[productId]) {
        delete newSelections[productId];
        setExpandedProduct(null);
      } else {
        newSelections[productId] = {
          product_id: productId,
          has_sales: false,
          has_service: false,
          brands: [],
        };
      }
      return newSelections;
    });
  };

  const toggleSales = (productId: number) => {
    setProductSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        has_sales: !prev[productId].has_sales,
      },
    }));
  };

  const toggleService = (productId: number) => {
    setProductSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        has_service: !prev[productId].has_service,
      },
    }));
  };

  const updateRate = (productId: number, field: "hourly_rate" | "service_charge", value: string) => {
    setProductSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value ? parseFloat(value) : undefined,
      },
    }));
  };

  const addBrand = (productId: number) => {
    const brandName = newBrandName[productId]?.trim();
    if (!brandName) {
      alert("Please enter a company/brand name");
      return;
    }

    setProductSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        brands: [
          ...prev[productId].brands,
          {
            brand_name: brandName,
            territories: [],
          },
        ],
      },
    }));

    setNewBrandName((prev) => ({
      ...prev,
      [productId]: "",
    }));
  };

  const removeBrand = (productId: number, brandIndex: number) => {
    setProductSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        brands: prev[productId].brands.filter((_, i) => i !== brandIndex),
      },
    }));
  };

  const updateSalesRelationship = (productId: number, brandIndex: number, relationship: string) => {
    setProductSelections((prev) => {
      const brands = [...prev[productId].brands];
      brands[brandIndex] = {
        ...brands[brandIndex],
        sales_relationship: relationship as any,
        ...(relationship !== "manufacturer" && { license_type: undefined, license_number: undefined }),
        authorization_certificate_url: undefined,
      };
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          brands,
        },
      };
    });
  };

  const updateServiceRelationship = (productId: number, brandIndex: number, relationship: string) => {
    setProductSelections((prev) => {
      const brands = [...prev[productId].brands];
      brands[brandIndex] = {
        ...brands[brandIndex],
        service_relationship: relationship as any,
        ...(relationship !== "dealer" && { authorization_certificate_url: undefined }),
      };
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          brands,
        },
      };
    });
  };

  const updateBrandLicenseType = (productId: number, brandIndex: number, licenseType: string) => {
    setProductSelections((prev) => {
      const brands = [...prev[productId].brands];
      brands[brandIndex] = {
        ...brands[brandIndex],
        license_type: licenseType,
      };
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          brands,
        },
      };
    });
  };

  const updateBrandLicenseNumber = (productId: number, brandIndex: number, licenseNumber: string) => {
    setProductSelections((prev) => {
      const brands = [...prev[productId].brands];
      brands[brandIndex] = {
        ...brands[brandIndex],
        license_number: licenseNumber,
      };
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          brands,
        },
      };
    });
  };

  const updateBrandTerritories = (productId: number, brandIndex: number, territory: string) => {
    setProductSelections((prev) => {
      const brands = [...prev[productId].brands];
      const currentTerritories = brands[brandIndex].territories || [];
      const newTerritories = currentTerritories.includes(territory)
        ? currentTerritories.filter(t => t !== territory)
        : [...currentTerritories, territory];
      
      brands[brandIndex] = {
        ...brands[brandIndex],
        territories: newTerritories,
      };
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          brands,
        },
      };
    });
  };

  const updateBrandEngineerName = (productId: number, brandIndex: number, name: string) => {
    setProductSelections((prev) => {
      const brands = [...prev[productId].brands];
      brands[brandIndex] = {
        ...brands[brandIndex],
        engineer_name: name,
      };
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          brands,
        },
      };
    });
  };

  const updateBrandEngineerEmail = (productId: number, brandIndex: number, email: string) => {
    setProductSelections((prev) => {
      const brands = [...prev[productId].brands];
      brands[brandIndex] = {
        ...brands[brandIndex],
        engineer_email: email,
      };
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          brands,
        },
      };
    });
  };

  const updateBrandEngineerContact = (productId: number, brandIndex: number, contact: string) => {
    setProductSelections((prev) => {
      const brands = [...prev[productId].brands];
      brands[brandIndex] = {
        ...brands[brandIndex],
        engineer_contact: contact,
      };
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          brands,
        },
      };
    });
  };

  const handleCertificateUpload = async (productId: number, brandIndex: number, file: File) => {
    if (!file) return;

    if (!file.type.match(/^(application\/pdf|image\/(jpeg|jpg|png))$/)) {
      alert("Only PDF and image files are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setUploadingCert({ productId, brandIndex });

    try {
      const formData = new FormData();
      formData.append("document", file);

      const response = await fetch("/api/onboarding/upload-gst", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        setProductSelections((prev) => {
          const brands = [...prev[productId].brands];
          brands[brandIndex] = {
            ...brands[brandIndex],
            authorization_certificate_url: data.document_url,
          };
          return {
            ...prev,
            [productId]: {
              ...prev[productId],
              brands,
            },
          };
        });
      } else {
        alert("Failed to upload document");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload document");
    } finally {
      setUploadingCert(null);
    }
  };

  const handleProductImageUpload = async (productId: number, brandIndex: number, file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUploadingImage({ productId, brandIndex });

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/onboarding/upload-logo", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        setProductSelections((prev) => {
          const brands = [...prev[productId].brands];
          brands[brandIndex] = {
            ...brands[brandIndex],
            product_image_url: data.logo_url,
          };
          return {
            ...prev,
            [productId]: {
              ...prev[productId],
              brands,
            },
          };
        });
      } else {
        alert("Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingImage(null);
    }
  };

  const handleCatalogUpload = async (productId: number, brandIndex: number, file: File) => {
    if (!file) return;

    if (!file.type.match(/^(application\/pdf)$/)) {
      alert("Only PDF files are allowed for catalogs");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Catalog size must be less than 10MB");
      return;
    }

    setUploadingCatalog({ productId, brandIndex });

    try {
      const formData = new FormData();
      formData.append("document", file);

      const response = await fetch("/api/onboarding/upload-gst", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        setProductSelections((prev) => {
          const brands = [...prev[productId].brands];
          brands[brandIndex] = {
            ...brands[brandIndex],
            catalog_url: data.document_url,
          };
          return {
            ...prev,
            [productId]: {
              ...prev[productId],
              brands,
            },
          };
        });
      } else {
        alert("Failed to upload catalog");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload catalog");
    } finally {
      setUploadingCatalog(null);
    }
  };

  const handleGstUpload = async () => {
    if (!gstDocument) return null;

    setIsUploadingGst(true);
    try {
      const formData = new FormData();
      formData.append("document", gstDocument);

      const response = await fetch("/api/onboarding/upload-gst", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.document_url;
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploadingGst(false);
    }
    return null;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      let gst_document_url = null;
      if (gstDocument) {
        gst_document_url = await handleGstUpload();
      }

      const updateData: any = {
        speciality_ids: selectedSpecialities,
        products: Object.values(productSelections).filter(
          (p) => p.has_sales || p.has_service
        ),
      };

      if (accountType === "business") {
        Object.assign(updateData, businessData);
        if (gst_document_url) {
          updateData.gst_document_url = gst_document_url;
        }
      } else if (accountType === "individual") {
        Object.assign(updateData, individualData);
      } else if (accountType === "freelancer") {
        Object.assign(updateData, freelancerData);
      }

      const response = await fetch("/api/profile/onboarding-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        setSaveSuccess(true);
        
        if (data.xp_awarded && data.xp_awarded > 0) {
          setXpAwarded(data.xp_awarded);
          setShowXpNotification(true);
          setTimeout(() => setShowXpNotification(false), 5000);
        }
        
        await loadCompletionStatus();
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        alert("Failed to save changes");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto mb-20 lg:mb-0">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto mb-20 lg:mb-0">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Profile
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Onboarding Details</h1>
              <p className="text-gray-600">Update your {accountType} account information</p>
            </div>
            <div className="flex items-center gap-3">
              {showXpNotification && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 rounded-lg animate-bounce">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold">+{xpAwarded} XP</span>
                </div>
              )}
              {saveSuccess && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Saved!</span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Completion Banner */}
          {completionStatus && completionStatus.completionPercentage < 100 && showCompletionBanner && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 relative">
              <button
                onClick={() => setShowCompletionBanner(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Complete Your Profile for More XP!
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    You can earn up to <span className="font-bold text-blue-600">{completionStatus.potentialXP} XP</span> by completing your profile.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionStatus.completionPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {completionStatus.completionPercentage}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {completionStatus.filledFields} of {completionStatus.totalFields} fields completed
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-8">
            {/* Business Details */}
            {accountType === "business" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Business Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={businessData.business_name}
                    onChange={(e) => setBusinessData({ ...businessData, business_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                    <input
                      type="text"
                      value={businessData.country}
                      onChange={(e) => setBusinessData({ ...businessData, country: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                    <input
                      type="text"
                      value={businessData.state}
                      onChange={(e) => setBusinessData({ ...businessData, state: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      value={businessData.city}
                      onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={businessData.pincode}
                      onChange={(e) => setBusinessData({ ...businessData, pincode: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={businessData.gst_number}
                    onChange={(e) => setBusinessData({ ...businessData, gst_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {businessData.gst_number && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Upload className="w-4 h-4 inline mr-2" />
                      Update GST Document (Optional)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setGstDocument(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
                    >
                      {gstDocument ? gstDocument.name : "Click to upload new GST document"}
                    </button>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone *</label>
                    <input
                      type="tel"
                      value={businessData.phone}
                      onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                      <span className="text-xs text-gray-500 ml-2">(from your login)</span>
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg text-gray-700 border border-gray-300">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <span>{user?.google_user_data?.email || businessData.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Details */}
            {accountType === "individual" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Employment Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Workplace Type *
                  </label>
                  <select
                    value={individualData.workplace_type}
                    onChange={(e) => setIndividualData({ ...individualData, workplace_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="hospital">Hospital</option>
                    <option value="company">Company</option>
                    <option value="r&d">R&D</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {individualData.workplace_type === "other" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Workplace Name</label>
                    <input
                      type="text"
                      value={individualData.workplace_name}
                      onChange={(e) => setIndividualData({ ...individualData, workplace_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Freelancer Details */}
            {accountType === "freelancer" && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={freelancerData.full_name}
                    onChange={(e) => setFreelancerData({ ...freelancerData, full_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                    <input
                      type="text"
                      value={freelancerData.country}
                      onChange={(e) => setFreelancerData({ ...freelancerData, country: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                    <input
                      type="text"
                      value={freelancerData.state}
                      onChange={(e) => setFreelancerData({ ...freelancerData, state: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                    <input
                      type="text"
                      value={freelancerData.city}
                      onChange={(e) => setFreelancerData({ ...freelancerData, city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={freelancerData.pincode}
                      onChange={(e) => setFreelancerData({ ...freelancerData, pincode: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      value={freelancerData.phone}
                      onChange={(e) => setFreelancerData({ ...freelancerData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                      <span className="text-xs text-gray-500 ml-2">(from your login)</span>
                    </label>
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-lg text-gray-700 border border-gray-300">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <span>{user?.google_user_data?.email || freelancerData.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Specialities */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Specialities</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {specialities.map((speciality) => {
                  const isSelected = selectedSpecialities.includes(speciality.id);
                  return (
                    <button
                      key={speciality.id}
                      onClick={() => toggleSpeciality(speciality.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{speciality.name}</span>
                        {isSelected && <CheckCircle className="w-5 h-5 text-blue-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products */}
            {selectedSpecialities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Products & Services</h2>
                <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2">
                  {selectedSpecialities.map((specialityId) => {
                    const speciality = specialities.find(s => s.id === specialityId);
                    const specialityProducts = products.filter(p => p.speciality_id === specialityId);

                    return (
                      <div key={specialityId} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">{speciality?.name}</h3>
                        <div className="space-y-3">
                          {specialityProducts.map((product) => {
                            const isSelected = !!productSelections[product.id];
                            const selection = productSelections[product.id];
                            const isExpanded = expandedProduct === product.id;
                            const showBrands = isSelected && (selection?.has_sales || selection?.has_service);

                            return (
                              <div
                                key={product.id}
                                className={`border rounded-lg p-3 transition-all ${
                                  isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200"
                                }`}
                              >
                                <label className="flex items-center gap-3 cursor-pointer mb-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleProduct(product.id)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                  />
                                  <span className="text-sm font-medium text-gray-900">{product.name}</span>
                                </label>

                                {isSelected && selection && (
                                  <>
                                    <div className="ml-7 space-y-3">
                                      <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={selection.has_sales || false}
                                            onChange={() => toggleSales(product.id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                          />
                                          <span className="text-sm text-gray-700">Sales</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={selection.has_service || false}
                                            onChange={() => toggleService(product.id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                          />
                                          <span className="text-sm text-gray-700">Service</span>
                                        </label>
                                      </div>

                                      {selection.has_service && accountType === "freelancer" && (
                                        <div className="grid md:grid-cols-2 gap-3">
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                              <DollarSign className="w-3 h-3 inline" />
                                              Hourly Rate
                                            </label>
                                            <input
                                              type="number"
                                              value={selection.hourly_rate || ""}
                                              onChange={(e) => updateRate(product.id, "hourly_rate", e.target.value)}
                                              placeholder="e.g., 50"
                                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                              <DollarSign className="w-3 h-3 inline" />
                                              Service Charge
                                            </label>
                                            <input
                                              type="number"
                                              value={selection.service_charge || ""}
                                              onChange={(e) => updateRate(product.id, "service_charge", e.target.value)}
                                              placeholder="e.g., 500"
                                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {showBrands && (
                                        <div className="border-t border-gray-200 pt-3 mt-3">
                                          <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-medium text-gray-700">Companies/Brands ({selection.brands?.length || 0})</p>
                                            <button
                                              onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                                              className="text-xs text-blue-600 hover:text-blue-700"
                                            >
                                              {isExpanded ? "Hide" : "Manage Brands"}
                                            </button>
                                          </div>

                                          {isExpanded && (
                                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                              {selection.brands?.map((brand, brandIndex) => (
                                                <div
                                                  key={brandIndex}
                                                  className="bg-white border border-gray-300 rounded-lg p-4"
                                                >
                                                  {/* Brand header and remove button - continuing in next file chunk */}
                                                  <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                      <p className="font-semibold text-gray-900">{brand.brand_name}</p>
                                                    </div>
                                                    <button
                                                      onClick={() => removeBrand(product.id, brandIndex)}
                                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    >
                                                      <X className="w-4 h-4" />
                                                    </button>
                                                  </div>

                                                  {/* Product Image & Catalog Upload */}
                                                  <div className="mb-3 grid grid-cols-2 gap-3">
                                                    <div>
                                                      <label className="block text-xs text-gray-600 mb-1">Product Image</label>
                                                      {brand.product_image_url && (
                                                        <div className="mb-2">
                                                          <img
                                                            src={brand.product_image_url}
                                                            alt="Product"
                                                            className="w-full h-24 object-contain border border-gray-200 rounded bg-gray-50"
                                                          />
                                                        </div>
                                                      )}
                                                      <input
                                                        ref={(el) => {
                                                          fileInputRefs.current[`${product.id}-${brandIndex}-image`] = el;
                                                        }}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                          const file = e.target.files?.[0];
                                                          if (file) handleProductImageUpload(product.id, brandIndex, file);
                                                        }}
                                                        className="hidden"
                                                      />
                                                      <button
                                                        type="button"
                                                        onClick={() => fileInputRefs.current[`${product.id}-${brandIndex}-image`]?.click()}
                                                        disabled={uploadingImage?.productId === product.id && uploadingImage?.brandIndex === brandIndex}
                                                        className="flex items-center gap-2 text-xs px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 w-full justify-center"
                                                      >
                                                        <Upload className="w-3 h-3" />
                                                        {uploadingImage?.productId === product.id && uploadingImage?.brandIndex === brandIndex
                                                          ? "Uploading..."
                                                          : brand.product_image_url
                                                          ? "Change Image"
                                                          : "Upload Image"}
                                                      </button>
                                                      {brand.product_image_url && (
                                                        <p className="text-xs text-green-600 mt-1">✓ Image uploaded</p>
                                                      )}
                                                    </div>

                                                    <div>
                                                      <label className="block text-xs text-gray-600 mb-1">Product Catalog (PDF)</label>
                                                      {brand.catalog_url && (
                                                        <div className="mb-2 flex items-center justify-center h-24 border border-gray-200 rounded bg-gray-50">
                                                          <div className="text-center">
                                                            <svg className="w-8 h-8 mx-auto text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                                            </svg>
                                                            <p className="text-xs text-gray-500 mt-1">PDF</p>
                                                          </div>
                                                        </div>
                                                      )}
                                                      <input
                                                        ref={(el) => {
                                                          fileInputRefs.current[`${product.id}-${brandIndex}-catalog`] = el;
                                                        }}
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={(e) => {
                                                          const file = e.target.files?.[0];
                                                          if (file) handleCatalogUpload(product.id, brandIndex, file);
                                                        }}
                                                        className="hidden"
                                                      />
                                                      <button
                                                        type="button"
                                                        onClick={() => fileInputRefs.current[`${product.id}-${brandIndex}-catalog`]?.click()}
                                                        disabled={uploadingCatalog?.productId === product.id && uploadingCatalog?.brandIndex === brandIndex}
                                                        className="flex items-center gap-2 text-xs px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 w-full justify-center"
                                                      >
                                                        <Upload className="w-3 h-3" />
                                                        {uploadingCatalog?.productId === product.id && uploadingCatalog?.brandIndex === brandIndex
                                                          ? "Uploading..."
                                                          : brand.catalog_url
                                                          ? "Change Catalog"
                                                          : "Upload Catalog"}
                                                      </button>
                                                      {brand.catalog_url && (
                                                        <p className="text-xs text-green-600 mt-1">✓ Catalog uploaded</p>
                                                      )}
                                                    </div>
                                                  </div>

                                                  {selection.has_sales && (
                                                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Sales Relationship
                                                      </label>
                                                      <select
                                                        value={brand.sales_relationship || ""}
                                                        onChange={(e) => updateSalesRelationship(product.id, brandIndex, e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                      >
                                                        <option value="">Select relationship type</option>
                                                        <option value="manufacturer">Manufacturer - I manufacture this product</option>
                                                        <option value="dealer">Dealer - I'm an authorized dealer</option>
                                                        <option value="importer">Importer - I import this product</option>
                                                        <option value="none">None - Selling without authorization</option>
                                                      </select>

                                                      {brand.sales_relationship === "manufacturer" && (
                                                        <div className="mt-3 space-y-2">
                                                          <div>
                                                            <label className="block text-xs text-gray-600 mb-1">Manufacturing License Type *</label>
                                                            <select
                                                              value={brand.license_type || ""}
                                                              onChange={(e) => updateBrandLicenseType(product.id, brandIndex, e.target.value)}
                                                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                            >
                                                              <option value="">Select License Type</option>
                                                              {manufacturingLicenses.map((license) => (
                                                                <option key={license.value} value={license.value}>
                                                                  {license.label}
                                                                </option>
                                                              ))}
                                                            </select>
                                                          </div>
                                                          <div>
                                                            <label className="block text-xs text-gray-600 mb-1">License Number *</label>
                                                            <input
                                                              type="text"
                                                              value={brand.license_number || ""}
                                                              onChange={(e) => updateBrandLicenseNumber(product.id, brandIndex, e.target.value)}
                                                              placeholder="Enter license number"
                                                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                          </div>
                                                          <div>
                                                            <label className="block text-xs text-gray-600 mb-1">License Document</label>
                                                            <input
                                                              ref={(el) => {
                                                                fileInputRefs.current[`${product.id}-${brandIndex}-sales`] = el;
                                                              }}
                                                              type="file"
                                                              accept=".pdf,.jpg,.jpeg,.png"
                                                              onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleCertificateUpload(product.id, brandIndex, file);
                                                              }}
                                                              className="hidden"
                                                            />
                                                            <button
                                                              type="button"
                                                              onClick={() => fileInputRefs.current[`${product.id}-${brandIndex}-sales`]?.click()}
                                                              disabled={uploadingCert?.productId === product.id && uploadingCert?.brandIndex === brandIndex}
                                                              className="flex items-center gap-2 text-xs px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 w-full justify-center"
                                                            >
                                                              <Upload className="w-3 h-3" />
                                                              {uploadingCert?.productId === product.id && uploadingCert?.brandIndex === brandIndex
                                                                ? "Uploading..."
                                                                : brand.authorization_certificate_url
                                                                ? "Change License Document"
                                                                : "Upload License Document"}
                                                            </button>
                                                            {brand.authorization_certificate_url && (
                                                              <p className="text-xs text-green-600 mt-1">✓ Document uploaded</p>
                                                            )}
                                                          </div>
                                                        </div>
                                                      )}

                                                      {brand.sales_relationship === "dealer" && (
                                                        <div className="mt-3">
                                                          <label className="block text-xs text-gray-600 mb-1">Authorized Dealer Certificate</label>
                                                          <input
                                                            ref={(el) => {
                                                              fileInputRefs.current[`${product.id}-${brandIndex}-sales`] = el;
                                                            }}
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(e) => {
                                                              const file = e.target.files?.[0];
                                                              if (file) handleCertificateUpload(product.id, brandIndex, file);
                                                            }}
                                                            className="hidden"
                                                          />
                                                          <button
                                                            type="button"
                                                            onClick={() => fileInputRefs.current[`${product.id}-${brandIndex}-sales`]?.click()}
                                                            disabled={uploadingCert?.productId === product.id && uploadingCert?.brandIndex === brandIndex}
                                                            className="flex items-center gap-2 text-xs px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 w-full justify-center"
                                                          >
                                                            <Upload className="w-3 h-3" />
                                                            {uploadingCert?.productId === product.id && uploadingCert?.brandIndex === brandIndex
                                                              ? "Uploading..."
                                                              : brand.authorization_certificate_url
                                                              ? "Change Authorization Letter"
                                                              : "Upload Authorization Letter"}
                                                          </button>
                                                          {brand.authorization_certificate_url && (
                                                            <p className="text-xs text-green-600 mt-1">✓ Letter uploaded</p>
                                                          )}
                                                        </div>
                                                      )}

                                                      {brand.sales_relationship === "importer" && (
                                                        <div className="mt-3">
                                                          <label className="block text-xs text-gray-600 mb-1">Import License/Proof</label>
                                                          <input
                                                            ref={(el) => {
                                                              fileInputRefs.current[`${product.id}-${brandIndex}-sales`] = el;
                                                            }}
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(e) => {
                                                              const file = e.target.files?.[0];
                                                              if (file) handleCertificateUpload(product.id, brandIndex, file);
                                                            }}
                                                            className="hidden"
                                                          />
                                                          <button
                                                            type="button"
                                                            onClick={() => fileInputRefs.current[`${product.id}-${brandIndex}-sales`]?.click()}
                                                            disabled={uploadingCert?.productId === product.id && uploadingCert?.brandIndex === brandIndex}
                                                            className="flex items-center gap-2 text-xs px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 w-full justify-center"
                                                          >
                                                            <Upload className="w-3 h-3" />
                                                            {uploadingCert?.productId === product.id && uploadingCert?.brandIndex === brandIndex
                                                              ? "Uploading..."
                                                              : brand.authorization_certificate_url
                                                              ? "Change Import Proof"
                                                              : "Upload Import Proof"}
                                                          </button>
                                                          {brand.authorization_certificate_url && (
                                                            <p className="text-xs text-green-600 mt-1">✓ Proof uploaded</p>
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}

                                                  {selection.has_service && (
                                                    <div className="p-3 bg-green-50 rounded-lg">
                                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Service Relationship
                                                      </label>
                                                      <select
                                                        value={brand.service_relationship || ""}
                                                        onChange={(e) => updateServiceRelationship(product.id, brandIndex, e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                                      >
                                                        <option value="">Select service type</option>
                                                        <option value="direct_provider">Direct Service Provider - I provide services directly</option>
                                                        <option value="dealer">Authorized Service Dealer</option>
                                                        <option value="none">None - Providing service without authorization</option>
                                                      </select>

                                                      {brand.service_relationship === "dealer" && (
                                                        <div className="mt-3">
                                                          <label className="block text-xs text-gray-600 mb-1">Service Authorization Certificate</label>
                                                          <input
                                                            ref={(el) => {
                                                              fileInputRefs.current[`${product.id}-${brandIndex}-service`] = el;
                                                            }}
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(e) => {
                                                              const file = e.target.files?.[0];
                                                              if (file) handleCertificateUpload(product.id, brandIndex, file);
                                                            }}
                                                            className="hidden"
                                                          />
                                                          <button
                                                            type="button"
                                                            onClick={() => fileInputRefs.current[`${product.id}-${brandIndex}-service`]?.click()}
                                                            disabled={uploadingCert?.productId === product.id && uploadingCert?.brandIndex === brandIndex}
                                                            className="flex items-center gap-2 text-xs px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 w-full justify-center"
                                                          >
                                                            <Upload className="w-3 h-3" />
                                                            {uploadingCert?.productId === product.id && uploadingCert?.brandIndex === brandIndex
                                                              ? "Uploading..."
                                                              : brand.authorization_certificate_url
                                                              ? "Change Service Certificate"
                                                              : "Upload Service Certificate"}
                                                          </button>
                                                          {brand.authorization_certificate_url && (
                                                            <p className="text-xs text-green-600 mt-1">✓ Certificate uploaded</p>
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}

                                                  {/* Territory Selection */}
                                                  <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                      Territory Coverage *
                                                    </label>
                                                    <p className="text-xs text-gray-600 mb-2">Select states/territories where this product is available</p>
                                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded border border-gray-200">
                                                      {indianStates.map((state) => (
                                                        <label key={state} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                          <input
                                                            type="checkbox"
                                                            checked={(brand.territories || []).includes(state)}
                                                            onChange={() => updateBrandTerritories(product.id, brandIndex, state)}
                                                            className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                                                          />
                                                          <span className="text-gray-700">{state}</span>
                                                        </label>
                                                      ))}
                                                    </div>
                                                    {brand.territories && brand.territories.length > 0 && (
                                                      <p className="text-xs text-purple-600 mt-2">
                                                        ✓ {brand.territories.length} {brand.territories.length === 1 ? 'territory' : 'territories'} selected
                                                      </p>
                                                    )}
                                                  </div>

                                                  {/* Engineer Contact Information */}
                                                  <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                      Service Engineer Contact
                                                    </label>
                                                    <div className="space-y-2">
                                                      <div>
                                                        <label className="block text-xs text-gray-600 mb-1">Engineer Name *</label>
                                                        <input
                                                          type="text"
                                                          value={brand.engineer_name || ""}
                                                          onChange={(e) => updateBrandEngineerName(product.id, brandIndex, e.target.value)}
                                                          placeholder="Enter engineer's full name"
                                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                        />
                                                      </div>
                                                      <div>
                                                        <label className="block text-xs text-gray-600 mb-1">Engineer Email *</label>
                                                        <input
                                                          type="email"
                                                          value={brand.engineer_email || ""}
                                                          onChange={(e) => updateBrandEngineerEmail(product.id, brandIndex, e.target.value)}
                                                          placeholder="engineer@example.com"
                                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                        />
                                                      </div>
                                                      <div>
                                                        <label className="block text-xs text-gray-600 mb-1">Engineer Contact Number *</label>
                                                        <input
                                                          type="tel"
                                                          value={brand.engineer_contact || ""}
                                                          onChange={(e) => updateBrandEngineerContact(product.id, brandIndex, e.target.value)}
                                                          placeholder="+91 XXXXXXXXXX"
                                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}

                                              <div className="flex gap-2">
                                                <input
                                                  type="text"
                                                  value={newBrandName[product.id] || ""}
                                                  onChange={(e) =>
                                                    setNewBrandName((prev) => ({
                                                      ...prev,
                                                      [product.id]: e.target.value,
                                                    }))
                                                  }
                                                  onKeyPress={(e) => {
                                                    if (e.key === "Enter") {
                                                      e.preventDefault();
                                                      addBrand(product.id);
                                                    }
                                                  }}
                                                  placeholder="Enter company/brand name"
                                                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <button
                                                  onClick={() => addBrand(product.id)}
                                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                >
                                                  <Plus className="w-4 h-4" />
                                                  <span className="text-sm">Add</span>
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={isSaving || isUploadingGst}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isSaving ? "Saving..." : isUploadingGst ? "Uploading..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
