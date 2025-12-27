import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';


interface LocationForm {
  name: string;
  width: number;
  height: number;
  position_x: number;
  position_y: number;
  metadata: string;
}

export default function LocationEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const locationId = searchParams.get('id');
  const isEditing = !!locationId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<LocationForm>({
    name: '',
    width: 800,
    height: 600,
    position_x: 0,
    position_y: 0,
    metadata: '{}',
  });

  useEffect(() => {
    if (isEditing && locationId) {
      fetchLocation(parseInt(locationId, 10));
    }
  }, [isEditing, locationId]);

  const fetchLocation = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`admin/locations/${id}`);
      const location = response.data;

      setForm({
        name: location.name,
        width: location.width,
        height: location.height,
        position_x: location.position_x,
        position_y: location.position_y,
        metadata: JSON.stringify(location.metadata || {}, null, 2),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load location');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      let metadata;
      try {
        metadata = JSON.parse(form.metadata);
      } catch {
        setError('Invalid JSON in metadata field');
        return;
      }

      const locationData = {
        name: form.name,
        width: form.width,
        height: form.height,
        position_x: form.position_x,
        position_y: form.position_y,
        metadata,
      };

      if (isEditing && locationId) {
        await apiClient.put(`admin/locations/${locationId}`, locationData);
        setSuccess('Location updated successfully!');
      } else {
        await apiClient.post('admin/locations', locationData);
        setSuccess('Location created successfully!');
      }

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/admin/locations');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof LocationForm, value: string | number | null) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Location' : 'Create Location'}
          </h1>
          <Link
            to="/admin/locations"
            className="text-indigo-600 hover:text-indigo-900"
          >
            ← Back to Locations
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Location Name *
              </label>
              <input
                type="text"
                id="name"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Main Dining Room"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2">
                  Width (units) *
                </label>
                <input
                  type="number"
                  id="width"
                  value={form.width}
                  onChange={(e) => handleInputChange('width', parseInt(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  required
                />
              </div>

              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
                  Height (units) *
                </label>
                <input
                  type="number"
                  id="height"
                  value={form.height}
                  onChange={(e) => handleInputChange('height', parseInt(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="position_x" className="block text-sm font-medium text-gray-700 mb-2">
                  Position X
                </label>
                <input
                  type="number"
                  id="position_x"
                  value={form.position_x}
                  onChange={(e) => handleInputChange('position_x', parseInt(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="position_y" className="block text-sm font-medium text-gray-700 mb-2">
                  Position Y
                </label>
                <input
                  type="number"
                  id="position_y"
                  value={form.position_y}
                  onChange={(e) => handleInputChange('position_y', parseInt(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="metadata" className="block text-sm font-medium text-gray-700 mb-2">
                Metadata (JSON)
              </label>
              <textarea
                id="metadata"
                value={form.metadata}
                onChange={(e) => handleInputChange('metadata', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                placeholder='{"backgroundColor": "#f0f0f0", "gridSize": 20}'
              />
              <p className="text-xs text-gray-500 mt-1">
                JSON object for map styling and configuration
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <Link
                to="/admin/locations"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : (isEditing ? 'Update Location' : 'Create Location')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}