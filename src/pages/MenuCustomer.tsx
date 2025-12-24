import { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface MenuCategory {
  id: number;
  name: string;
  description?: string;
}

interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  dietary_tags: string[];
  is_available: boolean;
  display_order: number;
}

export default function MenuCustomer() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesResponse, itemsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/menu/categories`),
        axios.get(`${API_BASE_URL}/menu/items?available_only=true`),
      ]);

      setCategories(categoriesResponse.data.categories);
      setItems(itemsResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch menu');
    } finally {
      setLoading(false);
    }
  };

  const getItemsByCategory = (categoryId: number) => {
    return items.filter(item => item.category_id === categoryId);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">Loading menu...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-red-600">{error}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Our Menu</h1>

        {categories.map(category => {
          const categoryItems = getItemsByCategory(category.id);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.id} className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-gray-600 mb-4">{category.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryItems.map(item => (
                  <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {item.image_url && (
                      <img
                        src={`${API_BASE_URL}${item.image_url}`}
                        alt={item.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                      {item.description && (
                        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      )}
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold text-green-600">
                          ${parseFloat(item.price).toFixed(2)}
                        </span>
                      </div>
                      {item.dietary_tags && item.dietary_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.dietary_tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize"
                            >
                              {tag.replace('-', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                      <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                        Add to Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {categories.every(cat => getItemsByCategory(cat.id).length === 0) && (
          <div className="text-center text-gray-500">
            No menu items available at the moment.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}