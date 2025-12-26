import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { Plus, Edit, Trash2, QrCode, Download, Search } from 'lucide-react';
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

const TableManagement: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: 4,
    location: '',
    description: '',
  });

  useEffect(() => {
    fetchTables();
  }, [searchTerm, statusFilter, locationFilter]);

  const fetchTables = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (locationFilter) params.append('location', locationFilter);

      const response = await apiClient.get(`admin/tables?${params}`);
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('admin/tables', formData);
      setShowCreateModal(false);
      setFormData({ table_number: '', capacity: 4, location: '', description: '' });
      fetchTables();
    } catch (error) {
      console.error('Error creating table:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;

    try {
      await apiClient.put(`admin/tables/${editingTable.id}`, formData);
      setEditingTable(null);
      setFormData({ table_number: '', capacity: 4, location: '', description: '' });
      fetchTables();
    } catch (error) {
      console.error('Error updating table:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this table?')) return;

    try {
      await apiClient.patch(`admin/tables/${id}/status`, { is_active: false });
      fetchTables();
    } catch (error) {
      console.error('Error deactivating table:', error);
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      await apiClient.patch(`admin/tables/${id}/status`, { is_active: true });
      fetchTables();
    } catch (error) {
      console.error('Error reactivating table:', error);
    }
  };

  const handleGenerateQR = async (id: number) => {
    try {
      await apiClient.post(`admin/tables/${id}/qr/generate`);
      fetchTables();
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleDownloadQR = async (id: number, format: 'png' | 'pdf') => {
    try {
      const response = await apiClient.get(`admin/tables/${id}/qr/download/${format}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `table-${id}-qr.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  const handleDownloadAll = async () => {
    try {
      const response = await apiClient.get('admin/tables/qr/download-all', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'all-tables-qr-codes.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading all QR codes:', error);
    }
  };

  const openEditModal = (table: Table) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      capacity: table.capacity,
      location: table.location || '',
      description: table.description || '',
    });
  };

  const resetForm = () => {
    setFormData({ table_number: '', capacity: 4, location: '', description: '' });
    setEditingTable(null);
    setShowCreateModal(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Table Management</h1>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadAll}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
          >
            <Download size={16} />
            Download All QR
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus size={16} />
            Add Table
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="border rounded px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input
          type="text"
          placeholder="Filter by location..."
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* Table List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <div key={table.id} className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">Table {table.table_number}</h3>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  table.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {table.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-600 mb-4">
              <p>Capacity: {table.capacity} seats</p>
              {table.location && <p>Location: {table.location}</p>}
              {table.description && <p>Description: {table.description}</p>}
              {table.qr_generated_at && (
                <p>QR Generated: {new Date(table.qr_generated_at).toLocaleDateString()}</p>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => openEditModal(table)}
                className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 flex items-center gap-1"
              >
                <Edit size={14} />
                Edit
              </button>

              {table.is_active ? (
                <button
                  onClick={() => handleDelete(table.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => handleReactivate(table.id)}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                >
                  Reactivate
                </button>
              )}

              <button
                onClick={() => handleGenerateQR(table.id)}
                className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 flex items-center gap-1"
              >
                <QrCode size={14} />
                {table.qr_token ? 'Regenerate' : 'Generate'} QR
              </button>

              {table.qr_token && (
                <>
                  <button
                    onClick={() => handleDownloadQR(table.id, 'png')}
                    className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600"
                  >
                    Download PNG
                  </button>
                  <button
                    onClick={() => handleDownloadQR(table.id, 'pdf')}
                    className="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600"
                  >
                    Download PDF
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTable) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingTable ? 'Edit Table' : 'Create New Table'}
            </h2>

            <form onSubmit={editingTable ? handleUpdate : handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Table Number</label>
                  <input
                    type="text"
                    required
                    value={formData.table_number}
                    onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Capacity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {editingTable ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TableManagement;