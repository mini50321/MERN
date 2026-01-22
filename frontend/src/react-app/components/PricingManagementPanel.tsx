import { useState, useEffect } from "react";
import { Edit, Save, CheckCircle, XCircle, Heart, Stethoscope, Ambulance } from "lucide-react";

interface PricingManagementPanelProps {
  canEdit: boolean;
}

interface NursingPrice {
  id: number;
  service_name: string;
  per_visit_price: number;
  monthly_price: number | null;
  description: string | null;
  is_active: boolean;
}

interface PhysiotherapyPrice {
  id: number;
  service_name: string;
  per_session_price: number;
  monthly_price: number | null;
  description: string | null;
  is_active: boolean;
}

interface AmbulancePrice {
  id: number;
  service_name: string;
  minimum_fare: number;
  minimum_km: number;
  per_km_charge: number;
  description: string | null;
  is_active: boolean;
}

export default function PricingManagementPanel({ canEdit }: PricingManagementPanelProps) {
  const [activeServiceType, setActiveServiceType] = useState<"nursing" | "physiotherapy" | "ambulance">("nursing");
  const [nursingPrices, setNursingPrices] = useState<NursingPrice[]>([]);
  const [physiotherapyPrices, setPhysiotherapyPrices] = useState<PhysiotherapyPrice[]>([]);
  const [ambulancePrices, setAmbulancePrices] = useState<AmbulancePrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [nightDutyPercentage, setNightDutyPercentage] = useState(20);
  const [emergencyPercentage, setEmergencyPercentage] = useState(15);
  const [isEditingPercentages, setIsEditingPercentages] = useState(false);
  const [tempNightDuty, setTempNightDuty] = useState(20);
  const [tempEmergency, setTempEmergency] = useState(15);

  useEffect(() => {
    loadAllPrices();
    loadDynamicPricingSettings();
  }, []);

  const loadDynamicPricingSettings = async () => {
    try {
      const nightRes = await fetch("/api/admin/dynamic-pricing/night-duty");
      const emergencyRes = await fetch("/api/admin/dynamic-pricing/emergency");
      
      if (nightRes.ok) {
        const data = await nightRes.json();
        setNightDutyPercentage(data.percentage || 20);
        setTempNightDuty(data.percentage || 20);
      }
      if (emergencyRes.ok) {
        const data = await emergencyRes.json();
        setEmergencyPercentage(data.percentage || 15);
        setTempEmergency(data.percentage || 15);
      }
    } catch (error) {
      console.error("Error loading dynamic pricing settings:", error);
    }
  };

  const loadAllPrices = async () => {
    setIsLoading(true);
    try {
      const [nursingRes, physioRes, ambulanceRes] = await Promise.all([
        fetch("/api/admin/nursing-prices"),
        fetch("/api/admin/physiotherapy-prices"),
        fetch("/api/admin/ambulance-prices")
      ]);

      if (nursingRes.ok) setNursingPrices(await nursingRes.json());
      if (physioRes.ok) setPhysiotherapyPrices(await physioRes.json());
      if (ambulanceRes.ok) setAmbulancePrices(await ambulanceRes.json());
    } catch (error) {
      console.error("Error loading prices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (price: any) => {
    setEditingId(price.id);
    setEditFormData({ ...price });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSave = async () => {
    if (!canEdit) return;
    
    setIsSaving(true);
    try {
      const endpoint = activeServiceType === "nursing" 
        ? `/api/admin/nursing-prices/${editingId}`
        : activeServiceType === "physiotherapy"
        ? `/api/admin/physiotherapy-prices/${editingId}`
        : `/api/admin/ambulance-prices/${editingId}`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData)
      });

      if (res.ok) {
        await loadAllPrices();
        setEditingId(null);
        setEditFormData({});
        alert("Prices updated successfully");
      } else {
        alert("Failed to update prices");
      }
    } catch (error) {
      console.error("Error saving prices:", error);
      alert("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (priceId: number, currentStatus: boolean) => {
    if (!canEdit) return;

    try {
      const endpoint = activeServiceType === "nursing"
        ? `/api/admin/nursing-prices/${priceId}/toggle-active`
        : activeServiceType === "physiotherapy"
        ? `/api/admin/physiotherapy-prices/${priceId}/toggle-active`
        : `/api/admin/ambulance-prices/${priceId}/toggle-active`;

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (res.ok) {
        await loadAllPrices();
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("An error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading pricing data...</p>
      </div>
    );
  }

  const handleSavePercentages = async () => {
    if (!canEdit) return;

    if (tempNightDuty < 0 || tempNightDuty > 100 || tempEmergency < 0 || tempEmergency > 100) {
      alert("Percentages must be between 0 and 100");
      return;
    }

    try {
      const nightRes = await fetch("/api/admin/dynamic-pricing/night-duty", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percentage: tempNightDuty })
      });

      const emergencyRes = await fetch("/api/admin/dynamic-pricing/emergency", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percentage: tempEmergency })
      });

      if (nightRes.ok && emergencyRes.ok) {
        setNightDutyPercentage(tempNightDuty);
        setEmergencyPercentage(tempEmergency);
        setIsEditingPercentages(false);
        alert("Dynamic pricing percentages updated successfully");
      } else {
        alert("Failed to update percentages");
      }
    } catch (error) {
      console.error("Error updating percentages:", error);
      alert("An error occurred");
    }
  };

  return (
    <div>
      {/* Dynamic Pricing Settings (Super Admin Only) */}
      {canEdit && (
        <div className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Dynamic Pricing Adjustments</h3>
            <p className="text-sm text-gray-600">Configure automatic price increases for night hours and urgent/emergency bookings. These apply across all service types.</p>
          </div>
          
          {!isEditingPercentages ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Night Duty Surcharge</h4>
                    <p className="text-xs text-gray-600">Applied for bookings between 6 PM - 7 AM</p>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{nightDutyPercentage}%</div>
                </div>
                <p className="text-xs text-gray-500">Example: ₹200 base → ₹{Math.round(200 * (1 + nightDutyPercentage / 100))} after hours</p>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-red-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Emergency/Urgent Surcharge</h4>
                    <p className="text-xs text-gray-600">Applied for emergency or urgent priority bookings</p>
                  </div>
                  <div className="text-3xl font-bold text-red-600">{emergencyPercentage}%</div>
                </div>
                <p className="text-xs text-gray-500">Example: ₹200 base → ₹{Math.round(200 * (1 + emergencyPercentage / 100))} for emergency</p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Night Duty % (6 PM - 7 AM)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tempNightDuty}
                    onChange={(e) => setTempNightDuty(parseInt(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold text-lg"
                  />
                  <span className="text-gray-600 font-semibold text-lg">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Preview: ₹200 → ₹{Math.round(200 * (1 + tempNightDuty / 100))}</p>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-red-300">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Emergency/Urgent %
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tempEmergency}
                    onChange={(e) => setTempEmergency(parseInt(e.target.value) || 0)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-center font-bold text-lg"
                  />
                  <span className="text-gray-600 font-semibold text-lg">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Preview: ₹200 → ₹{Math.round(200 * (1 + tempEmergency / 100))}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            {!isEditingPercentages ? (
              <button
                onClick={() => setIsEditingPercentages(true)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit Percentages
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditingPercentages(false);
                    setTempNightDuty(nightDutyPercentage);
                    setTempEmergency(emergencyPercentage);
                  }}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePercentages}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Service Type Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => { setActiveServiceType("nursing"); setEditingId(null); }}
          className={`px-6 py-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeServiceType === "nursing"
              ? "text-pink-600 border-pink-600"
              : "text-gray-600 border-transparent hover:text-pink-600"
          }`}
        >
          <Heart className="w-4 h-4" />
          Nursing Services
        </button>
        <button
          onClick={() => { setActiveServiceType("physiotherapy"); setEditingId(null); }}
          className={`px-6 py-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeServiceType === "physiotherapy"
              ? "text-purple-600 border-purple-600"
              : "text-gray-600 border-transparent hover:text-purple-600"
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Physiotherapy
        </button>
        <button
          onClick={() => { setActiveServiceType("ambulance"); setEditingId(null); }}
          className={`px-6 py-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeServiceType === "ambulance"
              ? "text-red-600 border-red-600"
              : "text-gray-600 border-transparent hover:text-red-600"
          }`}
        >
          <Ambulance className="w-4 h-4" />
          Ambulance Services
        </button>
      </div>

      {/* Nursing Services Pricing */}
      {activeServiceType === "nursing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Nursing Service Prices</h3>
            <span className="text-sm text-gray-500">{nursingPrices.length} services</span>
          </div>
          {nursingPrices.map((price) => (
            <div key={price.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              {editingId === price.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                    <input
                      type="text"
                      value={editFormData.service_name || ""}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Per Visit Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editFormData.per_visit_price || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, per_visit_price: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editFormData.monthly_price || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, monthly_price: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={editFormData.description || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900">{price.service_name}</h4>
                      {price.description && (
                        <p className="text-sm text-gray-600 mt-1">{price.description}</p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(price)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Edit Price"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(price.id, price.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            price.is_active
                              ? "bg-green-100 text-green-600 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title={price.is_active ? "Active" : "Inactive"}
                        >
                          {price.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Per Visit</p>
                      <p className="text-2xl font-bold text-pink-700">₹{price.per_visit_price.toLocaleString()}</p>
                    </div>
                    {price.monthly_price && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Monthly Package</p>
                        <p className="text-2xl font-bold text-green-700">₹{price.monthly_price.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      price.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {price.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {nursingPrices.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No nursing service prices found
            </div>
          )}
        </div>
      )}

      {/* Physiotherapy Services Pricing */}
      {activeServiceType === "physiotherapy" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Physiotherapy Service Prices</h3>
            <span className="text-sm text-gray-500">{physiotherapyPrices.length} services</span>
          </div>
          {physiotherapyPrices.map((price) => (
            <div key={price.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              {editingId === price.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                    <input
                      type="text"
                      value={editFormData.service_name || ""}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Per Session Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editFormData.per_session_price || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, per_session_price: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editFormData.monthly_price || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, monthly_price: e.target.value ? parseFloat(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={editFormData.description || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900">{price.service_name}</h4>
                      {price.description && (
                        <p className="text-sm text-gray-600 mt-1">{price.description}</p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(price)}
                          className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                          title="Edit Price"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(price.id, price.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            price.is_active
                              ? "bg-green-100 text-green-600 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title={price.is_active ? "Active" : "Inactive"}
                        >
                          {price.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Per Session</p>
                      <p className="text-2xl font-bold text-purple-700">₹{price.per_session_price.toLocaleString()}</p>
                    </div>
                    {price.monthly_price && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Monthly Package</p>
                        <p className="text-2xl font-bold text-green-700">₹{price.monthly_price.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      price.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {price.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {physiotherapyPrices.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No physiotherapy service prices found
            </div>
          )}
        </div>
      )}

      {/* Ambulance Services Pricing */}
      {activeServiceType === "ambulance" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Ambulance Service Prices</h3>
            <span className="text-sm text-gray-500">{ambulancePrices.length} services</span>
          </div>
          {ambulancePrices.map((price) => (
            <div key={price.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              {editingId === price.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                    <input
                      type="text"
                      value={editFormData.service_name || ""}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Fare (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editFormData.minimum_fare || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, minimum_fare: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum KM</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={editFormData.minimum_km || 5}
                        onChange={(e) => setEditFormData({ ...editFormData, minimum_km: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Per KM Charge (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={editFormData.per_km_charge || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, per_km_charge: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={editFormData.description || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900">{price.service_name}</h4>
                      {price.description && (
                        <p className="text-sm text-gray-600 mt-1">{price.description}</p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(price)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Edit Price"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(price.id, price.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            price.is_active
                              ? "bg-green-100 text-green-600 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title={price.is_active ? "Active" : "Inactive"}
                        >
                          {price.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Minimum Fare</p>
                      <p className="text-2xl font-bold text-red-700">₹{price.minimum_fare.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">for first {price.minimum_km} km</p>
                    </div>
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Per KM Charge</p>
                      <p className="text-2xl font-bold text-orange-700">₹{price.per_km_charge}</p>
                      <p className="text-xs text-gray-500 mt-1">after {price.minimum_km} km</p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Minimum KM</p>
                      <p className="text-2xl font-bold text-blue-700">{price.minimum_km}</p>
                      <p className="text-xs text-gray-500 mt-1">included in base fare</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      price.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {price.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {ambulancePrices.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No ambulance service prices found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
