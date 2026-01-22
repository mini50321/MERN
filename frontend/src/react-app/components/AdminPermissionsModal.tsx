import { useState } from "react";
import { X, Shield, Eye, Edit2 } from "lucide-react";

interface AdminPermissionsModalProps {
  admin: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_TABS = [
  { id: "analytics", label: "Analytics" },
  { id: "users", label: "Users" },
  { id: "posts", label: "News Posts" },
  { id: "exhibitions", label: "Exhibitions" },
  { id: "jobs", label: "Jobs" },
  { id: "advertising", label: "Advertising" },
  { id: "reports", label: "Reports" },
  { id: "admins", label: "Admins" },
];

export default function AdminPermissionsModal({
  admin,
  isOpen,
  onClose,
  onSuccess,
}: AdminPermissionsModalProps) {
  const [permissions, setPermissions] = useState<Record<string, string>>(() => {
    const perms: Record<string, string> = {};
    if (admin.permissions) {
      admin.permissions.forEach((p: any) => {
        perms[p.tab_name] = p.permission_level;
      });
    }
    return perms;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleTab = (tabId: string) => {
    setPermissions(prev => {
      const newPerms = { ...prev };
      if (newPerms[tabId]) {
        delete newPerms[tabId];
      } else {
        newPerms[tabId] = "view";
      }
      return newPerms;
    });
  };

  const handleChangeLevel = (tabId: string, level: "view" | "edit") => {
    setPermissions(prev => ({
      ...prev,
      [tabId]: level,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const permissionsArray = Object.entries(permissions).map(([tab_name, permission_level]) => ({
        tab_name,
        permission_level,
      }));

      const res = await fetch(`/api/admin/admins/${admin.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permissionsArray }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to update permissions");
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      alert("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Manage Permissions</h2>
              <p className="text-sm text-gray-600 mt-1">{admin.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select which tabs this admin can access and their permission level for each.
            </p>

            {AVAILABLE_TABS.map((tab) => {
              const hasAccess = !!permissions[tab.id];
              const level = permissions[tab.id] || "view";

              return (
                <div
                  key={tab.id}
                  className={`border rounded-lg p-4 transition-all ${
                    hasAccess ? "border-blue-300 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={hasAccess}
                        onChange={() => handleToggleTab(tab.id)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <div className="flex-1">
                        <label className="font-medium text-gray-900 cursor-pointer">
                          {tab.label}
                        </label>
                        {hasAccess && (
                          <div className="mt-3 flex gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`${tab.id}-level`}
                                value="view"
                                checked={level === "view"}
                                onChange={() => handleChangeLevel(tab.id, "view")}
                                className="w-4 h-4 text-blue-600"
                                disabled={isSubmitting}
                              />
                              <div className="flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-700">View Only</span>
                              </div>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`${tab.id}-level`}
                                value="edit"
                                checked={level === "edit"}
                                onChange={() => handleChangeLevel(tab.id, "edit")}
                                className="w-4 h-4 text-blue-600"
                                disabled={isSubmitting}
                              />
                              <div className="flex items-center gap-1.5">
                                <Edit2 className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-700">View + Edit</span>
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </form>

        <div className="p-6 border-t border-gray-200 flex gap-3">
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
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save Permissions"}
          </button>
        </div>
      </div>
    </div>
  );
}
