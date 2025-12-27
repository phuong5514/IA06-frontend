import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
  price: string;
  image_url?: string;
  dietary_tags: string[];
  status: 'available' | 'unavailable' | 'sold_out';
  display_order: number;
  preparation_time?: number;
  chef_recommendation?: boolean;
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
  price_adjustment: string;
  display_order: number;
  is_available: boolean;
}

interface CreateMenuItemForm {
  category_id: number;
  name: string;
  description: string;
  price: string;
  dietary_tags: string[];
  display_order: number;
  status: 'available' | 'unavailable' | 'sold_out';
  preparation_time?: number;
  chef_recommendation?: boolean;
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlItemId = searchParams.get('id');
  const currentItemId = itemId || (urlItemId ? parseInt(urlItemId, 10) : null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [showModifierGroupModal, setShowModifierGroupModal] = useState(false);
  const [editingModifierGroup, setEditingModifierGroup] = useState<ModifierGroup | null>(null);
  const [showModifierOptionModal, setShowModifierOptionModal] = useState(false);
  const [editingModifierOption, setEditingModifierOption] = useState<ModifierOption | null>(null);
  const [currentGroupForOption, setCurrentGroupForOption] = useState<number | null>(null);
  const [modifierGroupForm, setModifierGroupForm] = useState({
    name: '',
    type: 'single' as 'single' | 'multiple',
    is_required: false,
  });
  const [modifierOptionForm, setModifierOptionForm] = useState({
    name: '',
    price_adjustment: '0',
    is_available: true,
  });
  const [form, setForm] = useState<CreateMenuItemForm>({
    category_id: 0,
    name: '',
    description: '',
    price: '0',
    dietary_tags: [],
    display_order: 0,
    status: 'available',
    preparation_time: undefined,
    chef_recommendation: undefined,
  });

  useEffect(() => {
    fetchCategories();
    if (currentItemId) {
      fetchItem();
    }
  }, [currentItemId]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/menu/categories');
      setCategories(response.data.categories);
    } catch (err: any) {
      setError('Failed to fetch categories');
    }
  };

  const fetchItem = async () => {
    if (!currentItemId) return;

    try {
      setLoading(true);
      const response = await apiClient.get(`/menu/items/${currentItemId}`);
      const item: MenuItem = response.data;
      setForm({
        category_id: item.category_id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        dietary_tags: item.dietary_tags || [],
        display_order: item.display_order,
        status: item.status,
        preparation_time: item.preparation_time,
        chef_recommendation: item.chef_recommendation,
      });
      if (item.image_url) {
        setImagePreview(item.image_url);
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
    if (!currentItemId) return;

    try {
      const response = await apiClient.get(`/menu/modifiers/items/${currentItemId}/groups`);
      // Ensure we always set an array
      setModifierGroups(Array.isArray(response.data.groups) ? response.data.groups : []);
    } catch (err: any) {
      console.error('Failed to fetch modifier groups:', err);
      // Set empty array on error to prevent map errors
      setModifierGroups([]);
    }
  };

  const handleImageUpload = async (file: File, itemId?: number) => {
    const idToUse = itemId || currentItemId;
    if (!idToUse) return;

    setUploadingImage(true);
    setUploadProgress('Getting upload URL...');

    try {
      // Step 1: Get signed upload URL from backend
      const uploadUrlResponse = await apiClient.post(`/menu/items/${idToUse}/image/upload-url`, {
        fileName: file.name,
        contentType: file.type,
      });

      const { signedUrl, fileName: gcsFileName } = uploadUrlResponse.data;
      setUploadProgress('Uploading to Google Cloud...');

      // Step 2: Upload file directly to GCS
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to cloud storage');
      }

      setUploadProgress('Confirming upload...');

      // Step 3: Confirm upload and get processed URLs
      const confirmResponse = await apiClient.post(`/menu/items/${idToUse}/image/confirm`, {
        gcsFileName,
      });

      setUploadProgress('Upload complete!');
      setTimeout(() => setUploadProgress(''), 2000);

      // Update the form with the new image URL
      // The backend should have updated the menu item with the display URL
      // Let's refresh the item data or update the preview
      setImagePreview(confirmResponse.data.urls.display);

    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to upload image');
      setUploadProgress('');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!acceptedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPG, PNG, or WebP)');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // If we have a current item ID, start the upload process
      if (currentItemId) {
        handleImageUpload(file);
      }
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
    if (currentItemId) {
      // For existing items, create on server immediately
      try {
        const response = await apiClient.post('/menu/modifiers/groups', {
          menu_item_id: currentItemId,
          ...groupData,
          display_order: modifierGroups.length,
        });
        setModifierGroups(prev => [...prev, response.data]);
      } catch (err: any) {
        setError('Failed to add modifier group');
      }
    } else {
      // For new items, just add to local state - will be created when item is saved
      const newGroup: ModifierGroup = {
        id: Date.now(), // Temporary ID for UI purposes
        menu_item_id: 0, // Will be set when item is created
        name: groupData.name,
        type: groupData.type,
        is_required: groupData.is_required,
        display_order: modifierGroups.length,
        options: [],
      };
      setModifierGroups(prev => [...prev, newGroup]);
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

      if (currentItemId && group.menu_item_id > 0) {
        // For existing items with real server IDs, create on server
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
      } else {
        // For new items, add to local state only
        const newOption: ModifierOption = {
          id: Date.now(), // Temporary ID
          modifier_group_id: groupId,
          name: optionData.name,
          price_adjustment: optionData.price_adjustment,
          display_order: group.options?.length || 0,
          is_available: optionData.is_available,
        };
        setModifierGroups(prev => prev.map(group =>
          group.id === groupId
            ? { ...group, options: [...(group.options || []), newOption] }
            : group
        ));
      }
    } catch (err: any) {
      setError('Failed to add modifier option');
    }
  };
  const openModifierGroupModal = (group?: ModifierGroup) => {
    if (group) {
      setEditingModifierGroup(group);
      setModifierGroupForm({
        name: group.name,
        type: group.type,
        is_required: group.is_required,
      });
    } else {
      setEditingModifierGroup(null);
      setModifierGroupForm({
        name: '',
        type: 'single',
        is_required: false,
      });
    }
    setShowModifierGroupModal(true);
  };

  const closeModifierGroupModal = () => {
    setShowModifierGroupModal(false);
    setEditingModifierGroup(null);
  };

  const handleModifierGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingModifierGroup) {
      await handleUpdateModifierGroup(editingModifierGroup.id, modifierGroupForm);
    } else {
      await handleAddModifierGroup(modifierGroupForm);
    }
    closeModifierGroupModal();
  };

  const openModifierOptionModal = (groupId: number, option?: ModifierOption) => {
    setCurrentGroupForOption(groupId);
    if (option) {
      setEditingModifierOption(option);
      setModifierOptionForm({
        name: option.name,
        price_adjustment: option.price_adjustment,
        is_available: option.is_available,
      });
    } else {
      setEditingModifierOption(null);
      setModifierOptionForm({
        name: '',
        price_adjustment: '0',
        is_available: true,
      });
    }
    setShowModifierOptionModal(true);
  };

  const closeModifierOptionModal = () => {
    setShowModifierOptionModal(false);
    setEditingModifierOption(null);
    setCurrentGroupForOption(null);
  };

  const handleModifierOptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGroupForOption) return;

    if (editingModifierOption) {
      await handleUpdateModifierOption(editingModifierOption.id, modifierOptionForm);
    } else {
      await handleAddModifierOption(currentGroupForOption, modifierOptionForm);
    }
    closeModifierOptionModal();
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

    // Validate name: required, 2-80 characters
    if (!form.name || form.name.trim().length < 2 || form.name.trim().length > 80) {
      setError('Name is required and must be between 2-80 characters');
      return;
    }

    // Validate price: must be a positive number (0.01 to 999999)
    const priceValue = parseFloat(form.price);
    if (isNaN(priceValue) || priceValue < 0.01 || priceValue > 999999) {
      setError('Price must be a positive number between 0.01 and 999,999');
      return;
    }

    // Validate category
    if (!form.category_id) {
      setError('Please select a category');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const submitData = {
        ...form,
      };

      let itemIdToUse = currentItemId;

      if (currentItemId) {
        // Update existing menu item
        await apiClient.put(`/menu/items/${currentItemId}`, submitData);
      } else {
        // Create new menu item
        const response = await apiClient.post('/menu/items', submitData);
        itemIdToUse = response.data.id;
      }

      // Handle modifier groups for new items or when editing
      if (!currentItemId && itemIdToUse) {
        // For new items, create all modifier groups
        for (const group of modifierGroups) {
          try {
            const groupResponse = await apiClient.post('/menu/modifiers/groups', {
              menu_item_id: itemIdToUse,
              name: group.name,
              type: group.type,
              is_required: group.is_required,
              display_order: group.display_order,
            });

            const newGroupId = groupResponse.data.id;

            // Create options for this group
            if (group.options && group.options.length > 0) {
              for (const option of group.options) {
                await apiClient.post('/menu/modifiers/options', {
                  modifier_group_id: newGroupId,
                  name: option.name,
                  price_adjustment: option.price_adjustment,
                  display_order: option.display_order,
                  is_available: option.is_available,
                });
              }
            }
          } catch (groupErr: any) {
            console.error('Failed to create modifier group:', groupErr);
            setError('Menu item created but some modifier groups failed to save');
          }
        }
      }

      // Upload image if selected
      if (imageFile && itemIdToUse) {
        await handleImageUpload(imageFile, itemIdToUse);
      }

      setSuccess(currentItemId ? 'Menu item updated successfully!' : 'Menu item created successfully!');
      setTimeout(() => {
        navigate('/admin/menu-items');
      }, 1500);

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
                    {currentItemId ? 'Edit Item' : 'Create Item'}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <h2 className="text-2xl font-bold mb-6">
        {currentItemId ? 'Edit Menu Item' : 'Create Menu Item'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
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
            minLength={2}
            maxLength={80}
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
            min="0.01"
            max="999999"
            value={form.price}
            onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image (JPG, PNG, WebP - Max 5MB)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            disabled={uploadingImage}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          {uploadProgress && (
            <div className="mt-2 text-sm text-blue-600">
              {uploadProgress}
            </div>
          )}
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
            Status *
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as 'available' | 'unavailable' | 'sold_out' }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
            <option value="sold_out">Sold Out</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preparation Time (minutes)
          </label>
          <input
            type="number"
            min="0"
            max="240"
            value={form.preparation_time || ''}
            onChange={(e) => {
              const value = e.target.value;
              const numValue = value ? parseInt(value) : undefined;
              if (numValue === undefined || (numValue >= 0 && numValue <= 240)) {
                setForm(prev => ({ ...prev, preparation_time: numValue }));
              }
            }}
            placeholder="Optional (0-240 minutes)"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={form.chef_recommendation || false}
              onChange={(e) => setForm(prev => ({ ...prev, chef_recommendation: e.target.checked || undefined }))}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Chef Recommendation</span>
          </label>
        </div>

        {/* Modifier Groups Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Modifier Groups
            </label>
            <button
              type="button"
              onClick={() => openModifierGroupModal()}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Add Group
            </button>
          </div>

          <div className="space-y-4">
            {Array.isArray(modifierGroups) && modifierGroups.map((group) => (
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
                      onClick={() => openModifierGroupModal(group)}
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
                      onClick={() => openModifierOptionModal(group.id)}
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
                          {parseFloat(option.price_adjustment) !== 0 && (
                            <span className="text-sm text-gray-600 ml-2">
                              ({parseFloat(option.price_adjustment) > 0 ? '+' : ''}${parseFloat(option.price_adjustment).toFixed(2)})
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openModifierOptionModal(group.id, option)}
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
            {saving ? 'Saving...' : (currentItemId ? 'Update Item' : 'Create Item')}
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

      {/* Modifier Group Modal */}
      {showModifierGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {editingModifierGroup ? 'Edit Modifier Group' : 'Add Modifier Group'}
            </h3>
            <form onSubmit={handleModifierGroupSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={modifierGroupForm.name}
                    onChange={(e) => setModifierGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={modifierGroupForm.type}
                    onChange={(e) => setModifierGroupForm(prev => ({ ...prev, type: e.target.value as 'single' | 'multiple' }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="single">Single Selection</option>
                    <option value="multiple">Multiple Selection</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={modifierGroupForm.is_required}
                      onChange={(e) => setModifierGroupForm(prev => ({ ...prev, is_required: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Required</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModifierGroupModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingModifierGroup ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modifier Option Modal */}
      {showModifierOptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {editingModifierOption ? 'Edit Modifier Option' : 'Add Modifier Option'}
            </h3>
            <form onSubmit={handleModifierOptionSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={modifierOptionForm.name}
                    onChange={(e) => setModifierOptionForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Adjustment
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={modifierOptionForm.price_adjustment}
                    onChange={(e) => setModifierOptionForm(prev => ({ ...prev, price_adjustment: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={modifierOptionForm.is_available}
                      onChange={(e) => setModifierOptionForm(prev => ({ ...prev, is_available: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Available</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModifierOptionModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingModifierOption ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </DashboardLayout>
  );
}