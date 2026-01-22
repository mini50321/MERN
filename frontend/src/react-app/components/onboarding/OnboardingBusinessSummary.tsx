import { useState, useEffect } from "react";
import { ArrowLeft, Building2, MapPin, CheckCircle } from "lucide-react";

interface OnboardingBusinessSummaryProps {
  onComplete: (data: any) => void;
  onBack: () => void;
  data: any;
}

interface Speciality {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
}

export default function OnboardingBusinessSummary({ onComplete, onBack, data }: OnboardingBusinessSummaryProps) {
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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

  const getSpecialityName = (id: number) => {
    return specialities.find((s) => s.id === id)?.name || "";
  };

  const groupProductsBySpeciality = () => {
    const grouped: Record<number, any[]> = {};
    
    data.products?.forEach((product: any) => {
      const productDetails = products.find((p) => p.id === product.product_id);
      if (productDetails) {
        const specialityId = (productDetails as any).speciality_id;
        if (!grouped[specialityId]) {
          grouped[specialityId] = [];
        }
        grouped[specialityId].push({
          ...product,
          name: productDetails.name,
        });
      }
    });

    return grouped;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading summary...</p>
        </div>
      </div>
    );
  }

  const productsBySpeciality = groupProductsBySpeciality();

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-h-[90vh] overflow-y-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Summary</h1>
      <p className="text-gray-600 mb-8">Review your business profile before completing</p>

      <div className="space-y-6 mb-8">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
            <Building2 className="w-5 h-5" />
            Business Information
          </h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Name:</span> {data.business_name}</p>
            <p><span className="font-medium">Phone:</span> {data.phone}</p>
            <p><span className="font-medium">Email:</span> {data.email}</p>
            {data.gst_number && <p><span className="font-medium">GST:</span> {data.gst_number}</p>}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
            <MapPin className="w-5 h-5" />
            Location
          </h3>
          <p className="text-sm">
            {data.city}, {data.state}, {data.country}
            {data.pincode && ` - ${data.pincode}`}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
            <CheckCircle className="w-5 h-5" />
            Specialities & Products
          </h3>
          <div className="space-y-4">
            {data.speciality_ids?.map((specialityId: number) => (
              <div key={specialityId}>
                <h4 className="font-semibold text-gray-900 mb-2">{getSpecialityName(specialityId)}</h4>
                <div className="ml-4 space-y-1">
                  {productsBySpeciality[specialityId]?.map((product: any, idx: number) => (
                    <div key={idx} className="text-sm text-gray-700">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-gray-500 ml-2">
                        ({[
                          product.has_sales && "Sales",
                          product.has_service && "Service"
                        ].filter(Boolean).join(", ")})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onComplete({})}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all"
      >
        Complete Onboarding
      </button>
    </div>
  );
}
