import { useState, useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { Package, Building2, CheckCircle, Shield, FileText, Image, File, MapPin, User, Mail, Phone } from "lucide-react";

interface Product {
  id: number;
  name: string;
}

interface UserProduct {
  id: number;
  product_id: number;
  has_sales: boolean;
  has_service: boolean;
  hourly_rate?: number;
  service_charge?: number;
}

interface Brand {
  id: number;
  user_product_id: number;
  brand_name: string;
  is_authorized: boolean;
  authorization_certificate_url?: string;
  license_type?: string;
  license_number?: string;
  sales_relationship?: string;
  service_relationship?: string;
  product_image_url?: string;
  catalog_url?: string;
  territories?: string;
  engineer_name?: string;
  engineer_email?: string;
  engineer_contact?: string;
}

export default function ProductPortfolio() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [brands, setBrands] = useState<Record<number, Brand[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [productsRes, userProductsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/user/products"),
      ]);

      if (productsRes.ok && userProductsRes.ok) {
        const productsData = await productsRes.json();
        const userProductsData = await userProductsRes.json();

        setProducts(productsData);
        setUserProducts(userProductsData);

        // Fetch brands for each user product
        const brandsData: Record<number, Brand[]> = {};
        for (const userProduct of userProductsData) {
          const brandsRes = await fetch(`/api/user/products/${userProduct.id}/brands`);
          if (brandsRes.ok) {
            brandsData[userProduct.id] = await brandsRes.json();
          }
        }
        setBrands(brandsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductName = (productId: number) => {
    return products.find(p => p.id === productId)?.name || "Unknown Product";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto mb-20 lg:mb-0 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading portfolio...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (userProducts.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto mb-20 lg:mb-0 px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Product Portfolio</h1>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h2>
            <p className="text-gray-600 mb-6">Add products to your portfolio by editing your onboarding details.</p>
            <a
              href="/edit-profile"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Products
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto mb-20 lg:mb-0 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Product Portfolio</h1>
          <a
            href="/edit-profile"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Manage Products
          </a>
        </div>

        <div className="space-y-6">
          {userProducts.map((userProduct) => {
            const productBrands = brands[userProduct.id] || [];
            const productName = getProductName(userProduct.product_id);

            return (
              <div key={userProduct.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Product Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <Package className="w-8 h-8" />
                    <h2 className="text-2xl font-bold">{productName}</h2>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {userProduct.has_sales && (
                      <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        <span>Sales</span>
                      </div>
                    )}
                    {userProduct.has_service && (
                      <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        <span>Service</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Rates */}
                {userProduct.has_service && (userProduct.hourly_rate || userProduct.service_charge) && (
                  <div className="p-4 bg-green-50 border-b border-green-100">
                    <div className="flex gap-6 text-sm">
                      {userProduct.hourly_rate && (
                        <div>
                          <span className="text-gray-600">Hourly Rate:</span>
                          <span className="ml-2 font-semibold text-gray-900">${userProduct.hourly_rate}</span>
                        </div>
                      )}
                      {userProduct.service_charge && (
                        <div>
                          <span className="text-gray-600">Service Charge:</span>
                          <span className="ml-2 font-semibold text-gray-900">${userProduct.service_charge}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Brands */}
                {productBrands.length > 0 ? (
                  <div className="p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      Companies/Brands ({productBrands.length})
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {productBrands.map((brand) => (
                        <div key={brand.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">{brand.brand_name}</h4>
                            {brand.is_authorized && (
                              <Shield className="w-5 h-5 text-green-600" />
                            )}
                          </div>

                          {/* Product Image and Catalog */}
                          {(brand.product_image_url || brand.catalog_url) && (
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {brand.product_image_url && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    <Image className="w-3 h-3" /> Product Image
                                  </p>
                                  <img
                                    src={brand.product_image_url}
                                    alt="Product"
                                    className="w-full h-24 object-contain border border-gray-200 rounded bg-gray-50"
                                  />
                                </div>
                              )}
                              {brand.catalog_url && (
                                <div>
                                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    <File className="w-3 h-3" /> Catalog
                                  </p>
                                  <a
                                    href={brand.catalog_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center h-24 border border-gray-200 rounded bg-red-50 hover:bg-red-100 transition-colors"
                                  >
                                    <div className="text-center">
                                      <svg className="w-8 h-8 mx-auto text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                      </svg>
                                      <p className="text-xs text-gray-600 mt-1">View PDF</p>
                                    </div>
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Sales Relationship */}
                          {userProduct.has_sales && brand.sales_relationship && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-500 mb-1">Sales Relationship</p>
                              <div className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                                {brand.sales_relationship === "manufacturer" && "Manufacturer"}
                                {brand.sales_relationship === "dealer" && "Authorized Dealer"}
                                {brand.sales_relationship === "importer" && "Importer"}
                                {brand.sales_relationship === "none" && "Direct Sales"}
                              </div>
                            </div>
                          )}

                          {/* License Information */}
                          {brand.license_type && brand.license_number && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Manufacturing License
                              </p>
                              <div className="text-sm bg-gray-50 px-2 py-1 rounded">
                                <div><strong>{brand.license_type}:</strong> {brand.license_number}</div>
                              </div>
                            </div>
                          )}

                          {/* Service Relationship */}
                          {userProduct.has_service && brand.service_relationship && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-500 mb-1">Service Relationship</p>
                              <div className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
                                {brand.service_relationship === "direct_provider" && "Direct Provider"}
                                {brand.service_relationship === "dealer" && "Service Dealer"}
                                {brand.service_relationship === "none" && "Independent"}
                              </div>
                            </div>
                          )}

                          {/* Authorization Certificate */}
                          {brand.authorization_certificate_url && (
                            <div className="mt-2">
                              <a
                                href={brand.authorization_certificate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <Shield className="w-3 h-3" />
                                View Authorization
                              </a>
                            </div>
                          )}

                          {/* Territory Coverage */}
                          {brand.territories && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Territory Coverage
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {JSON.parse(brand.territories).slice(0, 3).map((territory: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full"
                                  >
                                    {territory}
                                  </span>
                                ))}
                                {JSON.parse(brand.territories).length > 3 && (
                                  <span className="text-xs text-gray-500 px-2 py-1">
                                    +{JSON.parse(brand.territories).length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Engineer Contact */}
                          {brand.engineer_name && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                <User className="w-3 h-3" /> Service Engineer
                              </p>
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {brand.engineer_name}
                                </div>
                                {brand.engineer_email && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Mail className="w-3 h-3" />
                                    <a href={`mailto:${brand.engineer_email}`} className="hover:text-blue-600">
                                      {brand.engineer_email}
                                    </a>
                                  </div>
                                )}
                                {brand.engineer_contact && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Phone className="w-3 h-3" />
                                    <a href={`tel:${brand.engineer_contact}`} className="hover:text-blue-600">
                                      {brand.engineer_contact}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">No brands added for this product</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
