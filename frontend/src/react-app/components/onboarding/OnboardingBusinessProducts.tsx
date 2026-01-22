import { useState, useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle, Plus, X, Upload } from "lucide-react";

interface OnboardingBusinessProductsProps {
  onNext: (data: any) => void;
  onBack: () => void;
  data: any;
}

interface Product {
  id: number;
  name: string;
  speciality_id: number;
}

interface Speciality {
  id: number;
  name: string;
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
}

interface ProductSelection {
  product_id: number;
  has_sales: boolean;
  has_service: boolean;
  brands: BrandInfo[];
}

export default function OnboardingBusinessProducts({ onNext, onBack, data }: OnboardingBusinessProductsProps) {
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSelections, setProductSelections] = useState<Record<number, ProductSelection>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [newBrandName, setNewBrandName] = useState<Record<number, string>>({});
  const [uploadingCert, setUploadingCert] = useState<{ productId: number; brandIndex: number } | null>(null);
  const [uploadingImage, setUploadingImage] = useState<{ productId: number; brandIndex: number } | null>(null);
  const [uploadingCatalog, setUploadingCatalog] = useState<{ productId: number; brandIndex: number } | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [specialitiesRes, productsRes] = await Promise.all([
        fetch("/api/specialities"),
        fetch("/api/products"),
      ]);

      if (specialitiesRes.ok && productsRes.ok) {
        const specialitiesData = await specialitiesRes.json();
        const productsData = await productsRes.json();

        const selectedSpecialities = specialitiesData.filter((s: Speciality) =>
          data.speciality_ids.includes(s.id)
        );

        setSpecialities(selectedSpecialities);
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
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
    setProductSelections((prev) => {
      const updated = {
        ...prev,
        [productId]: {
          ...prev[productId],
          has_sales: !prev[productId].has_sales,
        },
      };
      
      if (updated[productId].has_sales || updated[productId].has_service) {
        setExpandedProduct(productId);
      }
      
      return updated;
    });
  };

  const toggleService = (productId: number) => {
    setProductSelections((prev) => {
      const updated = {
        ...prev,
        [productId]: {
          ...prev[productId],
          has_service: !prev[productId].has_service,
        },
      };
      
      if (updated[productId].has_sales || updated[productId].has_service) {
        setExpandedProduct(productId);
      }
      
      return updated;
    });
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
        // Clear license data if changing from manufacturer
        ...(relationship !== "manufacturer" && { license_type: undefined, license_number: undefined }),
        // Clear cert if changing relationship
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
        // Clear cert if changing to none or direct_provider
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

  const handleSubmit = () => {
    const selectedProducts = Object.values(productSelections).filter(
      (p) => p.has_sales || p.has_service
    );

    if (selectedProducts.length === 0) {
      alert("Please select at least one product with sales or service enabled");
      return;
    }

    const productsNeedingBrands = selectedProducts.filter(
      (p) => (p.has_sales || p.has_service) && p.brands.length === 0
    );

    if (productsNeedingBrands.length > 0) {
      const productNames = productsNeedingBrands
        .map((p) => products.find((prod) => prod.id === p.product_id)?.name)
        .join(", ");
      
      if (!confirm(`You haven't added brands for: ${productNames}. Continue anyway?`)) {
        return;
      }
    }

    onNext({ products: selectedProducts });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-h-[90vh] overflow-y-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Products & Brands</h1>
      <p className="text-gray-600 mb-8">Choose products, indicate sales/service, and specify your business relationship</p>

      <div className="space-y-8 mb-8">
        {specialities.map((speciality) => {
          const specialityProducts = products.filter((p) => p.speciality_id === speciality.id);

          return (
            <div key={speciality.id} className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{speciality.name}</h3>
              <div className="space-y-3">
                {specialityProducts.map((product) => {
                  const isSelected = !!productSelections[product.id];
                  const selection = productSelections[product.id];
                  const isExpanded = expandedProduct === product.id;
                  const showBrands = isSelected && (selection.has_sales || selection.has_service);

                  return (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-4 transition-all ${
                        isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProduct(product.id)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-900">{product.name}</span>
                        </label>
                        {isSelected && <CheckCircle className="w-5 h-5 text-blue-600" />}
                      </div>

                      {isSelected && (
                        <>
                          <div className="ml-8 flex gap-4 mb-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selection.has_sales}
                                onChange={() => toggleSales(product.id)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">Sales</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selection.has_service}
                                onChange={() => toggleService(product.id)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">Service</span>
                            </label>
                          </div>

                          {showBrands && (
                            <div className="ml-8 border-t border-gray-200 pt-3 mt-3">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-medium text-gray-700">Companies/Brands ({selection.brands.length})</p>
                                <button
                                  onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                                  className="text-xs text-blue-600 hover:text-blue-700"
                                >
                                  {isExpanded ? "Hide" : "Manage Brands"}
                                </button>
                              </div>

                              {isExpanded && (
                                <div className="space-y-4">
                                  {selection.brands.map((brand, brandIndex) => (
                                    <div
                                      key={brandIndex}
                                      className="bg-white border border-gray-300 rounded-lg p-4"
                                    >
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

                                          {brand.sales_relationship === "none" && (
                                            <div className="mt-2">
                                              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                                ⚠️ You're selling without authorization from the manufacturer
                                              </p>
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

                                          {brand.service_relationship === "none" && (
                                            <div className="mt-2">
                                              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                                ⚠️ You're providing service without manufacturer authorization
                                              </p>
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
                                      placeholder="Enter company/brand name (e.g., GE Healthcare, Siemens, Philips)"
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

      <button
        onClick={handleSubmit}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all"
      >
        Continue to Summary
      </button>
    </div>
  );
}
