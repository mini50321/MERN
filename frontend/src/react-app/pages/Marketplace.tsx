import { useState, useEffect } from "react";
import DashboardLayout from "@/react-app/components/DashboardLayout";
import { ShoppingBag, MapPin, Mail, Building2, Award, Filter, Search } from "lucide-react";

interface MarketplaceProduct {
  product_id: number;
  product_name: string;
  speciality_name: string;
  brand_name: string;
  sales_relationship: string;
  territories: string[];
  product_image_url: string;
  catalog_url: string;
  authorization_certificate_url: string;
  business_name: string;
  business_logo_url: string;
  business_user_id: string;
  city: string;
  state: string;
  country: string;
}

export default function Marketplace() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTerritory, setSelectedTerritory] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);
  const [territories, setTerritories] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);

  useEffect(() => {
    loadMarketplaceProducts();
  }, []);

  const loadMarketplaceProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/marketplace/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);

        // Extract unique categories and territories
        const uniqueCategories = [...new Set(data.map((p: MarketplaceProduct) => p.speciality_name))] as string[];
        const uniqueTerritories = new Set<string>();
        data.forEach((p: MarketplaceProduct) => {
          p.territories?.forEach((t: string) => uniqueTerritories.add(t));
        });

        setCategories(uniqueCategories);
        setTerritories(Array.from(uniqueTerritories).sort());
      }
    } catch (error) {
      console.error("Error loading marketplace products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      searchQuery === "" ||
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.business_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || product.speciality_name === selectedCategory;

    const matchesTerritory =
      selectedTerritory === "All" ||
      product.territories?.includes(selectedTerritory);

    return matchesSearch && matchesCategory && matchesTerritory;
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto mb-20 lg:mb-0">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <ShoppingBag className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
          </div>
          <p className="text-gray-600">Discover biomedical equipment from verified businesses and dealers</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, brands, or businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Territory Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedTerritory}
                onChange={(e) => setSelectedTerritory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="All">All Territories</option>
                {territories.map((territory) => (
                  <option key={territory} value={territory}>
                    {territory}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedCategory !== "All" || selectedTerritory !== "All") && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  Search: "{searchQuery}"
                </span>
              )}
              {selectedCategory !== "All" && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {selectedCategory}
                </span>
              )}
              {selectedTerritory !== "All" && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {selectedTerritory}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedTerritory("All");
                }}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        {!isLoading && (
          <div className="mb-4">
            <p className="text-gray-600">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
            </p>
          </div>
        )}

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={`${product.product_id}-${product.business_user_id}-${index}`}
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                {/* Product Image */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center relative overflow-hidden">
                  {product.product_image_url ? (
                    <img
                      src={product.product_image_url}
                      alt={product.product_name}
                      className="w-full h-full object-contain p-4 bg-white"
                    />
                  ) : (
                    <ShoppingBag className="w-16 h-16 text-white opacity-80" />
                  )}
                  {product.authorization_certificate_url && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-green-600 text-white rounded-full text-xs font-medium flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Verified
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {product.speciality_name}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {product.product_name}
                  </h3>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Brand:</strong> {product.brand_name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {product.sales_relationship?.replace(/_/g, " ")}
                    </p>
                  </div>

                  {/* Business Info */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      {product.business_logo_url ? (
                        <img
                          src={product.business_logo_url}
                          alt={product.business_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {product.business_name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-1">
                          {product.business_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {product.city}, {product.state}
                        </p>
                      </div>
                    </div>

                    <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all font-medium text-sm">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.product_name}</h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column - Product Image */}
                  <div>
                    {selectedProduct.product_image_url ? (
                      <img
                        src={selectedProduct.product_image_url}
                        alt={selectedProduct.product_name}
                        className="w-full h-64 object-contain bg-gray-50 rounded-lg border border-gray-200 p-4"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-24 h-24 text-white opacity-80" />
                      </div>
                    )}

                    {selectedProduct.catalog_url && (
                      <a
                        href={selectedProduct.catalog_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                      >
                        <Building2 className="w-5 h-5" />
                        Download Product Catalog
                      </a>
                    )}
                  </div>

                  {/* Right Column - Product Details */}
                  <div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-1">Category</h3>
                        <p className="text-gray-900">{selectedProduct.speciality_name}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-1">Brand</h3>
                        <p className="text-gray-900 font-semibold">{selectedProduct.brand_name}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-1">Seller Type</h3>
                        <p className="text-gray-900 capitalize">
                          {selectedProduct.sales_relationship?.replace(/_/g, " ")}
                        </p>
                        {selectedProduct.authorization_certificate_url && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                            <Award className="w-4 h-4" />
                            <span>Authorized & Verified</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-2">Available in</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.territories?.slice(0, 5).map((territory, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                            >
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {territory}
                            </span>
                          ))}
                          {selectedProduct.territories?.length > 5 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{selectedProduct.territories.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Contact Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Seller Information
                  </h3>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center gap-4 mb-4">
                      {selectedProduct.business_logo_url ? (
                        <img
                          src={selectedProduct.business_logo_url}
                          alt={selectedProduct.business_name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                          {selectedProduct.business_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-xl text-gray-900">{selectedProduct.business_name}</h4>
                        <p className="text-gray-600 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {selectedProduct.city}, {selectedProduct.state}, {selectedProduct.country}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <a
                        href={`/profile/${selectedProduct.business_user_id}`}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                      >
                        <Building2 className="w-5 h-5" />
                        View Business Profile
                      </a>
                      <button
                        onClick={() => {
                          // In a real app, this would open a contact modal or send a message
                          alert("Contact feature coming soon! For now, visit their profile to connect.");
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium"
                      >
                        <Mail className="w-5 h-5" />
                        Contact Seller
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
