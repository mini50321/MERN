import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";

interface OnboardingIndividualSpecialitiesProps {
  onComplete: (data: any) => void;
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
}

export default function OnboardingIndividualSpecialities({ onComplete, onBack }: OnboardingIndividualSpecialitiesProps) {
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSpecialities, setSelectedSpecialities] = useState<number[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [productSelections, setProductSelections] = useState<Record<number, ProductSelection>>({});
  const [offerSalesService, setOfferSalesService] = useState(false);
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
        setSelectedProducts(current => current.filter(pid => !specialityProducts.includes(pid)));
        setProductSelections(current => {
          const updated = { ...current };
          specialityProducts.forEach(pid => delete updated[pid]);
          return updated;
        });
        return prev.filter((s) => s !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleProduct = (productId: number) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        const updated = { ...productSelections };
        delete updated[productId];
        setProductSelections(updated);
        return prev.filter(id => id !== productId);
      } else {
        setProductSelections(current => ({
          ...current,
          [productId]: {
            product_id: productId,
            has_sales: false,
            has_service: false,
          }
        }));
        return [...prev, productId];
      }
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

  const handleSubmit = () => {
    if (selectedSpecialities.length === 0) {
      alert("Please select at least one speciality");
      return;
    }

    if (selectedProducts.length === 0) {
      alert("Please select at least one product");
      return;
    }

    const productsData = offerSalesService 
      ? Object.values(productSelections)
      : selectedProducts.map(pid => ({
          product_id: pid,
          has_sales: false,
          has_service: false,
        }));

    onComplete({
      speciality_ids: selectedSpecialities,
      products: productsData,
      offer_sales_service: offerSalesService,
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

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Speciality & Expertise</h1>
      <p className="text-gray-600 mb-8">Select your areas of expertise</p>

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
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Products You Have Expertise In</h3>
          <div className="space-y-6">
            {selectedSpecialities.map((specialityId) => {
              const speciality = specialities.find(s => s.id === specialityId);
              const specialityProducts = products.filter(p => p.speciality_id === specialityId);

              return (
                <div key={specialityId} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">{speciality?.name}</h4>
                  <div className="space-y-2">
                    {specialityProducts.map((product) => {
                      const isSelected = selectedProducts.includes(product.id);
                      const selection = productSelections[product.id];

                      return (
                        <div
                          key={product.id}
                          className={`border rounded-lg p-3 transition-all ${
                            isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200"
                          }`}
                        >
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleProduct(product.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-900">{product.name}</span>
                          </label>

                          {isSelected && offerSalesService && (
                            <div className="ml-7 mt-2 flex gap-4">
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

      {selectedProducts.length > 0 && (
        <div className="mb-8">
          <label className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
            <input
              type="checkbox"
              checked={offerSalesService}
              onChange={(e) => setOfferSalesService(e.target.checked)}
              className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <div>
              <span className="font-medium text-gray-900 block">I also offer sales/service</span>
              <span className="text-sm text-gray-600">Enable this if you want to offer product sales or services</span>
            </div>
          </label>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={selectedSpecialities.length === 0 || selectedProducts.length === 0}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Complete Onboarding
      </button>
    </div>
  );
}
