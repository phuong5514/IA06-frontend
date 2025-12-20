import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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

interface CreateMenuItemForm {
  category_id: number;
  name: string;
  description: string;
  price: number;
  dietary_tags: string[];
  display_order: number;
}

const DIETARY_TAGS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'spicy',
  'halal',
  'kosher',
];

interface MenuItemEditorProps {
  itemId?: number;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function MenuItemEditor({ itemId, onSave, onCancel }: MenuItemEditorProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState<CreateMenuItemForm>({
    category_id: 0,
    name: '',
    description: '',
    price: 0,
    dietary_tags: [],
    display_order: 0,
  });

  useEffect(() => {
    fetchCategories();
    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/menu/categories`);
      setCategories(response.data.categories);
    } catch (err: any) {
      setError('Failed to fetch categories');
    }
  };

  const fetchItem = async () => {
    if (!itemId) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/menu/items/${itemId}`);
      const item: MenuItem = response.data;
      setForm({
        category_id: item.category_id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        dietary_tags: item.dietary_tags || [],
        display_order: item.display_order,
      });
      if (item.image_url) {
        setImagePreview(`${API_BASE_URL}${item.image_url}`);
      }
    } catch (err: any) {
      setError('Failed to fetch menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDietaryTagToggle = (tag: string) => {
    setForm(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(t => t !== tag)
        : [...prev.dietary_tags, tag],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.category_id || !form.name || form.price <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const submitData = {
        ...form,
        price: parseFloat(form.price.toString()),
      };

      let itemIdToUse = itemId;

      if (itemId) {
        await axios.put(`${API_BASE_URL}/api/menu/items/${itemId}`, submitData);
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/menu/items`, submitData);
        itemIdToUse = response.data.id;
      }

      // Upload image if selected
      if (imageFile && itemIdToUse) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await axios.post(`${API_BASE_URL}/api/menu/items/${itemIdToUse}/image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      onSave?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save menu item');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {itemId ? 'Edit Menu Item' : 'Create Menu Item'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={form.category_id}
            onChange={(e) => setForm(prev => ({ ...prev, category_id: parseInt(e.target.value) }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value={0}>Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {imagePreview && (
            <div className="mt-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-full h-48 object-cover rounded-md"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dietary Tags
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DIETARY_TAGS.map(tag => (
              <label key={tag} className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.dietary_tags.includes(tag)}
                  onChange={() => handleDietaryTagToggle(tag)}
                  className="mr-2"
                />
                <span className="text-sm capitalize">{tag.replace('-', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Order
          </label>
          <input
            type="number"
            min="0"
            value={form.display_order}
            onChange={(e) => setForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : (itemId ? 'Update Item' : 'Create Item')}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}