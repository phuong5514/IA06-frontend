import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

interface Table {
  id: number;
  table_number: string;
  capacity: number;
  location?: string;
  description?: string;
  is_active: boolean;
  qr_token?: string;
  qr_generated_at?: string;
  created_at: string;
  updated_at: string;
}

interface TableForm {
  table_number: string;
  capacity: number;
  location: string;
  description: string;
}

export default function TableEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tableId = searchParams.get('id');
  const isEditing = !!tableId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<TableForm>({
    table_number: '',
    capacity: 4,
    location: '',
    description: '',
  });

  useEffect(() => {
    if (isEditing && tableId) {
      fetchTable(parseInt(tableId, 10));
    }
  }, [isEditing, tableId]);

  const fetchTable = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`admin/tables/${id}`);
      const table: Table = response.data;

      setForm({
        table_number: table.table_number,
        capacity: table.capacity,
        location: table.location || '',
        description: table.description || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load table');
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

      if (isEditing && tableId) {
        await apiClient.put(`admin/tables/${tableId}`, form);
        setSuccess('Table updated successfully');
      } else {
        await apiClient.post('admin/tables', form);
        setSuccess('Table created successfully');
      }

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/admin/tables');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save table');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof TableForm, value: string | number) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading table...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
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
                    to="/admin/tables"
                    className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                  >
                    Table Management
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-gray-400 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7"/>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    {isEditing ? 'Edit Table' : 'Add Table'}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Table' : 'Add New Table'}
          </h1>
        </div>

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

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Number *
                </label>
                <input
                  type="text"
                  required
                  value={form.table_number}
                  onChange={(e) => handleInputChange('table_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., A1, 001, T-01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={form.capacity}
                  onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 4)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">Number of seats (1-20)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Main Dining, Patio, VIP Room"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Optional description or notes about the table"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : (isEditing ? 'Update Table' : 'Create Table')}
              </button>
              <Link
                to="/admin/tables"
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}