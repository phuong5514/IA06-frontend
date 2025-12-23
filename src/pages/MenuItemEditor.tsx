import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

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

interface ModifierGroup {
  id: number;
  menu_item_id: number;
  name: string;
  type: 'single' | 'multiple';
  is_required: boolean;
  display_order: number;
  options?: ModifierOption[];
}

interface ModifierOption {
  id: number;
  modifier_group_id: number;
  name: string;
  price_adjustment: number;
  display_order: number;
  is_available: boolean;
}

interface CreateMenuItemForm {
  category_id: number;
  name: string;
  description: string;
  price: number;
  dietary_tags: string[];
  display_order: number;
  is_available: boolean;
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
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [form, setForm] = useState<CreateMenuItemForm>({
    category_id: 0,
    name: '',
    description: '',
    price: 0,
    dietary_tags: [],
    display_order: 0,
    is_available: true,
  });

  useEffect(() => {
    fetchCategories();
    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/menu/categories');
      setCategories(response.data.categories);
    } catch (err: any) {
      setError('Failed to fetch categories');
    }
  };

  const fetchItem = async () => {
    if (!itemId) return;

    try {
      setLoading(true);
      const response = await apiClient.get(`/menu/items/${itemId}`);
      const item: MenuItem = response.data;
      setForm({
        category_id: item.category_id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        dietary_tags: item.dietary_tags || [],
        display_order: item.display_order,
        is_available: item.is_available,
      });
      if (item.image_url) {
        setImagePreview(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${item.image_url}`);
      }
      // Fetch modifier groups for this item
      await fetchModifierGroups();
    } catch (err: any) {
      setError('Failed to fetch menu item');
    } finally {
      setLoading(false);
    }
  };

  const fetchModifierGroups = async () => {
    if (!itemId) return;

    try {
      const response = await apiClient.get(`/menu/modifiers/items/${itemId}/groups`);
      setModifierGroups(response.data.groups);
    } catch (err: any) {
      console.error('Failed to fetch modifier groups:', err);
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

  const handleAddModifierGroup = async (groupData: Omit<ModifierGroup, 'id' | 'menu_item_id' | 'display_order' | 'options'>) => {
    if (!itemId) return;

    try {
      const response = await apiClient.post('/menu/modifiers/groups', {
        menu_item_id: itemId,
        ...groupData,
        display_order: modifierGroups.length,
      });
      setModifierGroups(prev => [...prev, response.data]);
    } catch (err: any) {
      setError('Failed to add modifier group');
    }
  };

  const handleUpdateModifierGroup = async (groupId: number, updates: Partial<ModifierGroup>) => {
    try {
      const response = await apiClient.patch(`/menu/modifiers/groups/${groupId}`, updates);
      setModifierGroups(prev => prev.map(group =>
        group.id === groupId ? response.data : group
      ));
    } catch (err: any) {
      setError('Failed to update modifier group');
    }
  };

  const handleDeleteModifierGroup = async (groupId: number) => {
    try {
      await apiClient.delete(`/menu/modifiers/groups/${groupId}`);
      setModifierGroups(prev => prev.filter(group => group.id !== groupId));
    } catch (err: any) {
      setError('Failed to delete modifier group');
    }
  };

  const handleAddModifierOption = async (groupId: number, optionData: Omit<ModifierOption, 'id' | 'modifier_group_id' | 'display_order'>) => {
    try {
      const group = modifierGroups.find(g => g.id === groupId);
      if (!group) return;

      const response = await apiClient.post('/menu/modifiers/options', {
        modifier_group_id: groupId,
        ...optionData,
        display_order: group.options?.length || 0,
      });
      setModifierGroups(prev => prev.map(group =>
        group.id === groupId
          ? { ...group, options: [...(group.options || []), response.data] }
          : group
      ));
    } catch (err: any) {
      setError('Failed to add modifier option');
    }
  };

  const handleUpdateModifierOption = async (optionId: number, updates: Partial<ModifierOption>) => {
    try {
      const response = await apiClient.patch(`/menu/modifiers/options/${optionId}`, updates);
      setModifierGroups(prev => prev.map(group => ({
        ...group,
        options: group.options?.map(option =>
          option.id === optionId ? response.data : option
        ),
      })));
    } catch (err: any) {
      setError('Failed to update modifier option');
    }
  };

  const handleDeleteModifierOption = async (optionId: number) => {
    try {
      await apiClient.delete(`/menu/modifiers/options/${optionId}`);
      setModifierGroups(prev => prev.map(group => ({
        ...group,
        options: group.options?.filter(option => option.id !== optionId),
      })));
    } catch (err: any) {
      setError('Failed to delete modifier option');
    }
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
        await apiClient.put(`/menu/items/${itemId}`, submitData);
      } else {
        const response = await apiClient.post('/menu/items', submitData);
        itemIdToUse = response.data.id;
      }

      // Upload image if selected
      if (imageFile && itemIdToUse) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await apiClient.post(`/menu/items/${itemIdToUse}/image`, formData, {
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
    return (
      <DashboardLayout>
        <div className="p-4">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  <svg className="w-3 h-3 mr-2.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2A1 1 0 0 0 1 10h2v8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-8h2a1 1 0 0 0 .707-1.707Z"/>
                  </svg>
                  Dashboard
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7"/>
                  </svg>
                  <Link
                    to="/admin/menu-items"
                    className="ml-1 text-sm font-medium text-gray-700 hover:text-indigo-600 md:ml-2"
                  >
                    Menu Items
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7"/>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    {itemId ? 'Edit Item' : 'Create Item'}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

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
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(e) => setForm(prev => ({ ...prev, is_available: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Available</span>
          </label>
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

        {/* Modifier Groups Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Modifier Groups
            </label>
            <button
              type="button"
              onClick={() => {
                const name = prompt('Enter modifier group name:');
                const type = confirm('Is this a multiple selection group? (Cancel for single)') ? 'multiple' : 'single';
                const isRequired = confirm('Is this group required?');
                if (name) {
                  handleAddModifierGroup({ name, type, is_required: isRequired });
                }
              }}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Add Group
            </button>
          </div>

          <div className="space-y-4">
            {modifierGroups.map((group) => (
              <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-medium">{group.name}</h4>
                    <p className="text-sm text-gray-600">
                      {group.type} • {group.is_required ? 'Required' : 'Optional'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const name = prompt('Enter new name:', group.name);
                        if (name) handleUpdateModifierGroup(group.id, { name });
                      }}
                      className="text-blue-600 text-sm hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteModifierGroup(group.id)}
                      className="text-red-600 text-sm hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Options</span>
                    <button
                      type="button"
                      onClick={() => {
                        const name = prompt('Enter option name:');
                        const priceStr = prompt('Enter price adjustment (0 for no change):', '0');
                        const price = parseFloat(priceStr || '0');
                        if (name && !isNaN(price)) {
                          handleAddModifierOption(group.id, { name, price_adjustment: price, is_available: true });
                        }
                      }}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      Add Option
                    </button>
                  </div>

                  <div className="space-y-2">
                    {group.options?.map((option) => (
                      <div key={option.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <div>
                          <span className="text-sm">{option.name}</span>
                          {option.price_adjustment !== 0 && (
                            <span className="text-sm text-gray-600 ml-2">
                              ({option.price_adjustment > 0 ? '+' : ''}${option.price_adjustment.toFixed(2)})
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const name = prompt('Enter new name:', option.name);
                              if (name) handleUpdateModifierOption(option.id, { name });
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteModifierOption(option.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )) || <p className="text-sm text-gray-500">No options yet</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    </DashboardLayout>
  );
}