import React, { useState, useEffect } from 'react';
import { apiClient } from '../config/api';
import { Plus, Edit, Trash2, MapPin, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';

interface Location {
  id: number;
  name: string;
  width: number;
  height: number;
  metadata?: any;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

const LocationManagement: React.FC = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLocations();
  }, [searchTerm]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await apiClient.get(`admin/locations?${params}`);
      setLocations(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this location? This will unassign all tables in this location.')) {
      return;
    }

    try {
      await apiClient.delete(`admin/locations/${id}`);
      setLocations(locations.filter(location => location.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete location');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
          <Link
            to="/admin/location-editor"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Location
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Locations Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <div key={location.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <MapPin className="w-6 h-6 text-indigo-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/admin/location-editor?id=${location.id}`)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>Size: {location.width} × {location.height} units</p>
                  <p>Position: ({location.position_x}, {location.position_y})</p>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>Tables: Loading...</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    to="/admin/map-viewer"
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    View Map →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {locations.length === 0 && !loading && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first location.</p>
            <Link
              to="/admin/location-editor"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 inline-flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Location
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LocationManagement;