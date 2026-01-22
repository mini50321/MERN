import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, DollarSign } from "lucide-react";

interface OnboardingFreelancerSpecialitiesProps {
  onNext: (data: any) => void;
  onBack: () => void;
}

interface Speciality {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  speciality_id: number;
}

interface ProductSelection {
  product_id: number;
  has_sales: boolean;
  has_service: boolean;
  hourly_rate?: number;
  service_charge?: number;
}

export default function OnboardingFreelancerSpecialities({ onNext, onBack }: OnboardingFreelancerSpecialitiesProps) {
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSpecialities, setSelectedSpecialities] = useState<number[]>([]);
  const [productSelections, setProductSelections] = useState<Record<number, ProductSelection>>({});
  const [isLoading, setIsLoading] = useState(true);

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
        setSpecialities(specialitiesData);
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
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
      } else {
        newSelections[productId] = {
          product_id: productId,
          has_sales: false,
          has_service: false,
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

  const handleSubmit = () => {
    if (selectedSpecialities.length === 0) {
      alert("Please select at least one speciality");
      return;
    }

    const selectedProducts = Object.values(productSelections).filter(
      (p) => p.has_sales || p.has_service
    );

    if (selectedProducts.length === 0) {
      alert("Please select at least one product with sales or service enabled");
      return;
    }

    onNext({
      speciality_ids: selectedSpecialities,
      products: selectedProducts,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
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

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Specialities & Services</h1>
      <p className="text-gray-600 mb-8">Select your specialities and the products you offer</p>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Specialities</h3>
        <div className="grid md:grid-cols-2 gap-3">
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

      {selectedSpecialities.length > 0 && (
        <div className="space-y-6">
          {selectedSpecialities.map((specialityId) => {
            const speciality = specialities.find(s => s.id === specialityId);
            const specialityProducts = products.filter(p => p.speciality_id === specialityId);

            return (
              <div key={specialityId} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{speciality?.name}</h4>
                <div className="space-y-3">
                  {specialityProducts.map((product) => {
                    const isSelected = !!productSelections[product.id];
                    const selection = productSelections[product.id];

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

                        {isSelected && (
                          <div className="ml-7 space-y-3">
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selection?.has_sales || false}
                                  onChange={() => toggleSales(product.id)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Sales</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selection?.has_service || false}
                                  onChange={() => toggleService(product.id)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Service</span>
                              </label>
                            </div>

                            {selection?.has_service && (
                              <div className="grid md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">
                                    <DollarSign className="w-3 h-3 inline" />
                                    Hourly Rate (Optional)
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
                                    Service Charge (Optional)
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
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={selectedSpecialities.length === 0}
        className="w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}
