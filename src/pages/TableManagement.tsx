import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { Plus, Edit, Trash2, QrCode, Download, Search, ChevronDown, Printer } from 'lucide-react';
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
  const [sortBy, setSortBy] = useState<'table_number' | 'capacity' | 'created_at' | 'updated_at'>('table_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printLayout, setPrintLayout] = useState<'single' | 'multiple'>('multiple');
  const [selectedTablesForPrint, setSelectedTablesForPrint] = useState<number[]>([]);
  const [qrImageUrls, setQrImageUrls] = useState<Record<number, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    fetchTables();
  }, [searchTerm, statusFilter, locationFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (showPrintPreview) {
      // Get all tables with QR codes for printing
      const tablesWithQR = tables.filter(table => table.qr_token);
      setSelectedTablesForPrint(tablesWithQR.map(table => table.id));
      loadQrImages(tablesWithQR);

      // Add print styles to document head
      const style = document.createElement('style');
      style.id = 'print-styles';
      style.textContent = `
        .qr-print-grid {
          display: grid;
          grid-template-columns: ${printLayout === 'multiple' ? 'repeat(2, 1fr)' : '1fr'};
          gap: 20px;
        }
        .qr-print-item {
          text-align: center;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .qr-print-item.single {
          max-width: 400px;
          margin: 0 auto;
        }
      `;
      document.head.appendChild(style);

      return () => {
        const existingStyle = document.getElementById('print-styles');
        if (existingStyle) {
          document.head.removeChild(existingStyle);
        }
        // Clean up blob URLs
        Object.values(qrImageUrls).forEach(url => {
          if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        setQrImageUrls({});
      };
    }
  }, [showPrintPreview, printLayout, tables]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (locationFilter) params.append('location', locationFilter);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

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

  const handlePrintPreview = () => {
    // Get all tables with QR codes for printing
    const tablesWithQR = tables.filter(table => table.qr_token);
    setSelectedTablesForPrint(tablesWithQR.map(table => table.id));
    loadQrImages(tablesWithQR);
    setShowPrintPreview(true);
    setShowDownloadMenu(false);
  };

  const loadQrImages = async (tablesWithQR: Table[]) => {
    const imageUrls: Record<number, string> = {};

    for (const table of tablesWithQR) {
      try {
        const response = await apiClient.get(`admin/tables/${table.id}/qr/image`, {
          responseType: 'blob',
        });
        const blobUrl = URL.createObjectURL(response.data);
        imageUrls[table.id] = blobUrl;
      } catch (error) {
        console.error(`Failed to load QR image for table ${table.id}:`, error);
        // Fallback to direct URL if blob loading fails
        imageUrls[table.id] = `${apiClient.defaults.baseURL}admin/tables/${table.id}/qr/image`;
      }
    }

    setQrImageUrls(imageUrls);
  };

  const handlePrint = () => {
    // Create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      return;
    }

    // Get the print preview content
    const printContent = document.querySelector('.print-preview-container');
    if (!printContent) {
      document.body.removeChild(iframe);
      return;
    }

    // Clone the content
    const clonedContent = printContent.cloneNode(true) as HTMLElement;

    // Build the complete HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Print QR Codes</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              .qr-print-grid {
                display: grid !important;
                grid-template-columns: ${printLayout === 'multiple' ? 'repeat(2, 1fr)' : '1fr'} !important;
                gap: 20px !important;
                page-break-inside: avoid !important;
              }
              .qr-print-item {
                page-break-inside: avoid !important;
                text-align: center !important;
                padding: 20px !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 8px !important;
                break-inside: avoid !important;
                margin-bottom: 20px !important;
                ${printLayout === 'single' ? 'page-break-after: always !important;' : ''}
              }
              .qr-print-item.single {
                max-width: 400px !important;
                margin: 0 auto !important;
              }
              img {
                max-width: 200px !important;
                max-height: 200px !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 4px !important;
              }
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
              color: black;
            }
            .qr-print-grid {
              display: grid;
              grid-template-columns: ${printLayout === 'multiple' ? 'repeat(2, 1fr)' : '1fr'};
              gap: 20px;
              width: 100%;
            }
            .qr-print-item {
              text-align: center;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              margin-bottom: 20px;
              background: white;
            }
            .qr-print-item.single {
              max-width: 400px;
              margin: 0 auto;
            }
            .qr-print-item h3 {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 8px;
              color: #111827;
            }
            .qr-print-item .text-sm {
              font-size: 14px;
              color: #6b7280;
            }
            .qr-print-item img {
              max-width: 200px;
              max-height: 200px;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              margin: 0 auto 8px auto;
              display: block;
            }
          </style>
        </head>
        <body>
          ${clonedContent.outerHTML}
        </body>
      </html>
    `;

    // Open, write, and close the document
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Wait for images to load, then print
    const images = iframeDoc.querySelectorAll('img');
    let loadedImages = 0;
    const totalImages = images.length;

    const doPrint = () => {
      try {
        // Focus the iframe before printing to ensure print dialog opens for the correct content
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (error) {
        console.error('Print failed:', error);
      } finally {
        document.body.removeChild(iframe);
      }
    };

    if (totalImages === 0) {
      // Small delay to ensure DOM is ready
      setTimeout(doPrint, 100);
    } else {
      let hasError = false;
      images.forEach(img => {
        if (img.complete) {
          loadedImages++;
        } else {
          img.onload = () => {
            loadedImages++;
            if (loadedImages === totalImages && !hasError) {
              setTimeout(doPrint, 100);
            }
          };
          img.onerror = () => {
            hasError = true;
            loadedImages++;
            if (loadedImages === totalImages) {
              setTimeout(doPrint, 100);
            }
          };
        }
      });

      // If all images were already loaded
      if (loadedImages === totalImages && !hasError) {
        setTimeout(doPrint, 100);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  // Calculate pagination
  const totalTables = tables.length;
  const totalPages = Math.ceil(totalTables / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTables = tables.slice(startIndex, endIndex);

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
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 flex items-center gap-2"
                  >
                    <Download size={14} />
                    Download Combined PDF
                  </button>
                  <button
                    onClick={handlePrintPreview}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Printer size={14} />
                    Print Preview
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'table_number' | 'capacity' | 'created_at' | 'updated_at')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="table_number">Table Number</option>
                <option value="capacity">Capacity</option>
                <option value="created_at">Creation Date</option>
                <option value="updated_at">Last Edited</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table List */}
        {totalTables === 0 ? (
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
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedTables.map((table) => (
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
                  <p>Created: {new Date(table.created_at).toLocaleDateString()}</p>
                  <p>Updated: {new Date(table.updated_at).toLocaleDateString()}</p>
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

            {/* Pagination */}
            <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6 mt-6">
              <div className="flex items-center">
                <div className="text-sm text-gray-700">
                  Showing {totalTables === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalTables)} of {totalTables} tables
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div>
                  <label className="text-sm text-gray-700 mr-2">Items per page:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={6}>6</option>
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 print-modal-overlay">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b print-modal-header">
              <h2 className="text-xl font-semibold text-gray-800">Print Preview - QR Codes</h2>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="text-gray-400 hover:text-gray-600 no-print"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-4 print-modal-controls">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="printLayout"
                      value="multiple"
                      checked={printLayout === 'multiple'}
                      onChange={(e) => setPrintLayout(e.target.value as 'single' | 'multiple')}
                      className="text-indigo-600 no-print"
                    />
                    <span className="text-sm text-gray-700 no-print">Multiple QR codes per page</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="printLayout"
                      value="single"
                      checked={printLayout === 'single'}
                      onChange={(e) => setPrintLayout(e.target.value as 'single' | 'multiple')}
                      className="text-indigo-600 no-print"
                    />
                    <span className="text-sm text-gray-700 no-print">Single QR code per page</span>
                  </label>
                </div>
                <button
                  onClick={handlePrint}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 no-print"
                >
                  <Printer size={16} />
                  Print
                </button>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50 print-preview-container max-h-96 overflow-y-auto">
                <div className="qr-print-grid">
                  {tables
                    .filter(table => table.qr_token && selectedTablesForPrint.includes(table.id))
                    .map(table => (
                      <div key={table.id} className={`qr-print-item ${printLayout === 'single' ? 'single' : ''}`}>
                        <h3 className="text-lg font-semibold mb-2">Table {table.table_number}</h3>
                        <div className="mb-2">
                          <img
                            src={qrImageUrls[table.id] || `${apiClient.defaults.baseURL}admin/tables/${table.id}/qr/image`}
                            alt={`QR Code for Table ${table.table_number}`}
                            className="mx-auto border rounded"
                            style={{ maxWidth: '200px', maxHeight: '200px' }}
                          />
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Capacity: {table.capacity} seats</p>
                          {table.location && <p>Location: {table.location}</p>}
                          {table.description && <p>{table.description}</p>}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TableManagement;