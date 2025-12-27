import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { Plus, Edit, Trash2, QrCode, Download, Search, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  useEffect(() => {
    fetchTables();
  }, [searchTerm, statusFilter, locationFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDownloadMenu && !(event.target as Element).closest('.relative')) {
        setShowDownloadMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (locationFilter) params.append('location', locationFilter);

      const response = await apiClient.get(`admin/tables?${params}`);
      setTables(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this table?')) return;

    try {
      setError(null);
      await apiClient.patch(`admin/tables/${id}/status`, { is_active: false });
      fetchTables();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate table');
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      setError(null);
      await apiClient.patch(`admin/tables/${id}/status`, { is_active: true });
      fetchTables();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reactivate table');
    }
  };

  const handleGenerateQR = async (id: number) => {
    try {
      setError(null);
      await apiClient.post(`admin/tables/${id}/qr/generate`);
      fetchTables();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate QR code');
    }
  };

  const handleDownloadQR = async (id: number, format: 'png' | 'pdf') => {
    try {
      setError(null);
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download QR code');
    }
  };

  const handleDownloadAllPNGs = async () => {
    try {
      setError(null);
      const response = await apiClient.get('admin/tables/qr/download-all-pngs', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'all-tables-qr-codes-png.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowDownloadMenu(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download all PNG QR codes');
    }
  };

  const handleDownloadCombinedPDF = async () => {
    try {
      setError(null);
      const response = await apiClient.get('admin/tables/qr/download-combined-pdf', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'all-tables-qr-codes-combined.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowDownloadMenu(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download combined PDF QR codes');
    }
  };

  if (loading && tables.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading tables...</div>
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
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Table Management</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Table Management</h1>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Download All QR
                <ChevronDown size={16} />
              </button>
              
              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleDownloadAllPNGs}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 flex items-center gap-2"
                  >
                    <Download size={14} />
                    Download All PNGs
                  </button>
                  <button
                    onClick={handleDownloadCombinedPDF}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download size={14} />
                    Download Combined PDF
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate('/admin/table-editor')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Add Table
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button onClick={() => setError(null)} className="float-right ml-2">&times;</button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Table List */}
        {tables.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No tables found</p>
            <button
              onClick={() => navigate('/admin/table-editor')}
              className="mt-4 text-indigo-600 hover:text-indigo-800"
            >
              Create your first table
            </button>
          </div>
        ) : (
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
                    onClick={() => navigate(`/admin/table-editor?id=${table.id}`)}
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
        )}
      </div>
    </DashboardLayout>
  );
};

export default TableManagement;