import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import DailyActionFeed from "@/react-app/components/DailyActionFeed";
import ChatBot from "@/react-app/components/ChatBot";
import { 
  Package, Wrench, Plus, 
  Edit2, Trash2, MapPin, UserPlus, Award, Eye, EyeOff 
} from "lucide-react";

interface Product {
  id: number | string;
  name: string;
  description: string;
  category: string;
  manufacturer: string;
  model_number: string;
  dealer_price: number | null;
  customer_price: number | null;
  currency: string;
  is_active: boolean | number;
  images: any[];
  catalogs: any[];
}

interface Territory {
  id: number;
  country: string;
  state: string;
  city: string;
  pincode: string;
  is_primary: number;
}

interface Engineer {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  specialization: string;
  country: string;
  state: string;
  city: string;
  is_active: number;
}

interface Dealer {
  id: number;
  company_name: string;
  product_category: string;
  valid_from: string;
  valid_until: string;
  is_verified: number;
}

export default function BusinessDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showTerritoryModal, setShowTerritoryModal] = useState(false);
  const [showEngineerModal, setShowEngineerModal] = useState(false);
  const [showDealerModal, setShowDealerModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null);

  useEffect(() => {
    if (user) {
      const profile = (user as any).profile;
      if (!profile?.onboarding_completed) {
        navigate("/onboarding");
        return;
      }
      if (profile?.account_type !== "business") {
        navigate("/onboarding");
        return;
      }
      loadData();
    }
  }, [user, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, territoriesRes, engineersRes, dealersRes] = await Promise.all([
        fetch("/api/business/products", { credentials: "include" }),
        fetch("/api/business/territories", { credentials: "include" }),
        fetch("/api/business/engineers", { credentials: "include" }),
        fetch("/api/business/dealers", { credentials: "include" }),
      ]);

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        const formattedProducts = productsData.map((p: any) => ({
          ...p,
          id: p.id || p._id?.toString() || p._id
        }));
        setProducts(formattedProducts);
      }
      if (territoriesRes.ok) setTerritories(await territoriesRes.json());
      if (engineersRes.ok) setEngineers(await engineersRes.json());
      if (dealersRes.ok) setDealers(await dealersRes.json());
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number | string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    const response = await fetch(`/api/business/products/${id}`, { 
      method: "DELETE",
      credentials: "include"
    });
    if (response.ok) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleDeleteEngineer = async (id: number) => {
    if (!confirm("Are you sure you want to delete this engineer?")) return;
    
    const response = await fetch(`/api/business/engineers/${id}`, { method: "DELETE" });
    if (response.ok) {
      setEngineers(engineers.filter(e => e.id !== id));
    }
  };

  const handleDeleteTerritory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this territory?")) return;
    
    const response = await fetch(`/api/business/territories/${id}`, { method: "DELETE" });
    if (response.ok) {
      setTerritories(territories.filter(t => t.id !== id));
    }
  };

  const handleToggleProductActive = async (product: Product) => {
    const response = await fetch(`/api/business/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...product, is_active: product.is_active ? 0 : 1 }),
    });

    if (response.ok) {
      setProducts(products.map(p => 
        p.id === product.id ? { ...p, is_active: p.is_active ? 0 : 1 } : p
      ));
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error("Failed to toggle product active:", errorData);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto pb-20 lg:pb-0">
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pb-20 lg:pb-0">
        {/* Daily Action Feed */}
        <DailyActionFeed />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Dashboard</h1>
          <p className="text-gray-600">Manage your sales, services, and business operations</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{products.length}</h3>
            <p className="text-sm text-gray-600">Products Listed</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{territories.length}</h3>
            <p className="text-sm text-gray-600">Territories</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Wrench className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{engineers.length}</h3>
            <p className="text-sm text-gray-600">Service Engineers</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{dealers.length}</h3>
            <p className="text-sm text-gray-600">Authorized Dealers</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {["products", "territories", "engineers", "dealers"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Products Tab */}
            {activeTab === "products" && (
              <div>
                {/* Banner for Edit Profile */}
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Manage Complete Product Portfolio</h3>
                        <p className="text-sm text-gray-600">Add products with brands, territories, engineer contacts, images, catalogs & licenses</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate("/edit-profile")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Portfolio
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Product Portfolio</h2>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setShowProductModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Quick Add
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No products added yet</p>
                    <button
                      onClick={() => setShowProductModal(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Your First Product
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {products.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-600">{product.manufacturer} - {product.model_number}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleProductActive(product)}
                              className={`p-2 rounded-lg ${
                                product.is_active
                                  ? "bg-green-100 text-green-600 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                              title={product.is_active ? "Active" : "Inactive"}
                            >
                              {product.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setShowProductModal(true);
                              }}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-1">Dealer Price</p>
                            <p className="font-bold text-blue-600">
                              {product.currency} {product.dealer_price?.toLocaleString() || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">B2B Only</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-1">Customer Price</p>
                            <p className="font-bold text-green-600">
                              {product.currency} {product.customer_price?.toLocaleString() || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Public</p>
                          </div>
                        </div>

                        <div className="flex gap-2 text-xs">
                          <span className="px-2 py-1 bg-gray-100 rounded">{product.images?.length || 0} images</span>
                          <span className="px-2 py-1 bg-gray-100 rounded">{product.catalogs?.length || 0} catalogs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Territories Tab */}
            {activeTab === "territories" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Service Territories</h2>
                  <button
                    onClick={() => setShowTerritoryModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Territory
                  </button>
                </div>

                {territories.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No territories defined yet</p>
                    <button
                      onClick={() => setShowTerritoryModal(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Define Your First Territory
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {territories.map((territory) => (
                      <div
                        key={territory.id}
                        className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {territory.city}, {territory.state}, {territory.country}
                              {territory.pincode && ` - ${territory.pincode}`}
                            </p>
                            {territory.is_primary === 1 && (
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                Primary Territory
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTerritory(territory.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Engineers Tab */}
            {activeTab === "engineers" && (
              <div>
                <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Wrench className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Manage Territory Engineers</h3>
                      <p className="text-sm text-gray-600">Add multiple engineers to each territory with specific designations (Sales Engineer, Service Engineer, Territory Manager, etc.)</p>
                    </div>
                  </div>
                </div>

                {territories.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Add territories first to assign engineers</p>
                    <button
                      onClick={() => setActiveTab("territories")}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go to Territories
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {territories.map((territory) => {
                      const territoryEngineers = engineers.filter(e => 
                        e.country === territory.country && 
                        e.state === territory.state && 
                        e.city === territory.city
                      );

                      return (
                        <div key={territory.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <div>
                                  <h3 className="font-bold text-gray-900">
                                    {territory.city}, {territory.state}, {territory.country}
                                  </h3>
                                  {territory.pincode && (
                                    <p className="text-sm text-gray-600">Pincode: {territory.pincode}</p>
                                  )}
                                  {territory.is_primary === 1 && (
                                    <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                      Primary Territory
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingEngineer({ 
                                    country: territory.country,
                                    state: territory.state,
                                    city: territory.city,
                                    territory_id: territory.id
                                  } as any);
                                  setShowEngineerModal(true);
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                <Plus className="w-4 h-4" />
                                Add Engineer
                              </button>
                            </div>
                          </div>

                          <div className="p-4">
                            {territoryEngineers.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm">No engineers assigned to this territory</p>
                              </div>
                            ) : (
                              <div className="grid md:grid-cols-2 gap-4">
                                {territoryEngineers.map((engineer) => (
                                  <div key={engineer.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1">
                                        <h4 className="font-bold text-gray-900">{engineer.name}</h4>
                                        <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                          {engineer.role || "Service Engineer"}
                                        </span>
                                      </div>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => {
                                            setEditingEngineer(engineer);
                                            setShowEngineerModal(true);
                                          }}
                                          className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                          title="Edit"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteEngineer(engineer.id)}
                                          className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="space-y-1 text-xs text-gray-600">
                                      {engineer.email && <p>📧 {engineer.email}</p>}
                                      <p>📞 {engineer.phone}</p>
                                      {engineer.specialization && <p>🔧 {engineer.specialization}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Dealers Tab */}
            {activeTab === "dealers" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Authorized Dealerships</h2>
                  <button
                    onClick={() => setShowDealerModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Dealer Authorization
                  </button>
                </div>

                {dealers.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No dealer authorizations added yet</p>
                    <button
                      onClick={() => setShowDealerModal(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Your First Authorization
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dealers.map((dealer) => (
                      <div
                        key={dealer.id}
                        className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <h3 className="font-bold text-gray-900">{dealer.company_name}</h3>
                          <p className="text-sm text-gray-600">{dealer.product_category}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Valid: {dealer.valid_from} to {dealer.valid_until}
                          </p>
                          {dealer.is_verified === 1 && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded mt-1 inline-block">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals would go here - simplified for now */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSave={async () => {
            await loadData();
            setShowProductModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {showTerritoryModal && (
        <TerritoryModal
          onClose={() => setShowTerritoryModal(false)}
          onSave={() => {
            loadData();
            setShowTerritoryModal(false);
          }}
        />
      )}

      {showEngineerModal && (
        <EngineerModal
          engineer={editingEngineer}
          onClose={() => {
            setShowEngineerModal(false);
            setEditingEngineer(null);
          }}
          onSave={() => {
            loadData();
            setShowEngineerModal(false);
            setEditingEngineer(null);
          }}
        />
      )}

      {showDealerModal && (
        <DealerModal
          onClose={() => setShowDealerModal(false)}
          onSave={() => {
            loadData();
            setShowDealerModal(false);
          }}
        />
      )}
      <ChatBot />
    </DashboardLayout>
  );
}

// Modal components (simplified versions)
function ProductModal({ product, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "",
    manufacturer: product?.manufacturer || "",
    model_number: product?.model_number || "",
    specifications: product?.specifications || "",
    dealer_price: product?.dealer_price || "",
    customer_price: product?.customer_price || "",
    currency: product?.currency || "INR",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const url = product ? `/api/business/products/${product.id}` : "/api/business/products";
    const method = product ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Product saved successfully:", responseData);
        await onSave();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to save product: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-4">{product ? "Edit Product" : "Add Product"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Product Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg"
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg"
            rows={3}
          />
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Manufacturer"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              className="px-4 py-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Model Number"
              value={formData.model_number}
              onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
              className="px-4 py-3 border rounded-lg"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Dealer Price (B2B)"
              value={formData.dealer_price}
              onChange={(e) => setFormData({ ...formData, dealer_price: e.target.value })}
              className="px-4 py-3 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Customer Price (Public)"
              value={formData.customer_price}
              onChange={(e) => setFormData({ ...formData, customer_price: e.target.value })}
              className="px-4 py-3 border rounded-lg"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TerritoryModal({ onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    country: "",
    state: "",
    city: "",
    pincode: "",
    is_primary: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/business/territories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (response.ok) onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Add Territory</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Country *"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="State"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg"
          />
          <input
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Pincode"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_primary}
              onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Set as primary territory</span>
          </label>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border rounded-lg">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg">Add Territory</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EngineerModal({ engineer, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: engineer?.name || "",
    email: engineer?.email || "",
    phone: engineer?.phone || "",
    role: engineer?.role || "Service Engineer",
    specialization: engineer?.specialization || "",
    country: engineer?.country || "",
    state: engineer?.state || "",
    city: engineer?.city || "",
  });

  const designationOptions = [
    "Service Engineer",
    "Sales Engineer", 
    "Territory Manager",
    "Field Service Technician",
    "Installation Specialist",
    "Technical Support Engineer",
    "Application Engineer",
    "Regional Manager",
    "Customer Support Engineer",
    "Maintenance Engineer",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = engineer ? `/api/business/engineers/${engineer.id}` : "/api/business/engineers";
    const method = engineer ? "PUT" : "POST";
    
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (response.ok) onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-4">{engineer ? "Edit Engineer" : "Add Engineer"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg"
            required
          />
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-4 py-3 border rounded-lg"
            />
            <input
              type="tel"
              placeholder="Phone *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-4 py-3 border rounded-lg"
              required
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="px-4 py-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="px-4 py-3 border rounded-lg"
            />
            <input
              type="text"
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="px-4 py-3 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Designation *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg"
              required
            >
              {designationOptions.map((designation) => (
                <option key={designation} value={designation}>{designation}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Specialization (e.g., MRI Systems)"
            value={formData.specialization}
            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg"
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border rounded-lg">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg">
              {engineer ? "Update" : "Add"} Engineer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DealerModal({ onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    company_name: "",
    product_category: "",
    valid_from: "",
    valid_until: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/business/dealers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (response.ok) onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Add Dealer Authorization</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Company Name *"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Product Category"
            value={formData.product_category}
            onChange={(e) => setFormData({ ...formData, product_category: e.target.value })}
            className="w-full px-4 py-3 border rounded-lg"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Valid From</label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Valid Until</label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border rounded-lg">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg">Add Authorization</button>
          </div>
        </form>
      </div>
    </div>
  );
}
