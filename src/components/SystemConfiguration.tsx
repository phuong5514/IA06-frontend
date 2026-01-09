import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Settings, Palette, Zap, Wrench, Check } from 'lucide-react';

export default function SystemConfiguration() {
  const { user } = useAuth();
  const { refreshSettings } = useSettings();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'branding' | 'workflow' | 'general'>('branding');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Local state for form values
  const [brandingSettings, setBrandingSettings] = useState({
    restaurant_name: '',
    theme_primary_color: '',
    theme_secondary_color: '',
    restaurant_logo_url: '',
  });

  const [workflowSettings, setWorkflowSettings] = useState({
    default_seats_per_table: '',
    order_auto_accept_enabled: 'false',
    kitchen_preparation_alert_time: '',
  });

  const [generalSettings, setGeneralSettings] = useState({
    enable_customer_feedback: 'true',
  });

  // Fetch all settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings-all'],
    queryFn: async () => {
      const response = await apiClient.get('/system-settings?includePrivate=true');
      return response.data;
    },
  });

  // Initialize form values when data is loaded
  useEffect(() => {
    if (settings?.settings) {
      setBrandingSettings({
        restaurant_name: settings.settings.restaurant_name?.value || '',
        theme_primary_color: settings.settings.theme_primary_color?.value || '#4F46E5',
        theme_secondary_color: settings.settings.theme_secondary_color?.value || '#10B981',
        restaurant_logo_url: settings.settings.restaurant_logo_url?.value || '',
      });

      setWorkflowSettings({
        default_seats_per_table: settings.settings.default_seats_per_table?.value || '4',
        order_auto_accept_enabled: settings.settings.order_auto_accept_enabled?.value || 'false',
        kitchen_preparation_alert_time: settings.settings.kitchen_preparation_alert_time?.value || '15',
      });

      setGeneralSettings({
        enable_customer_feedback: settings.settings.enable_customer_feedback?.value || 'true',
      });
    }
  }, [settings]);

  // Set logo preview when settings are loaded
  useEffect(() => {
    if (brandingSettings.restaurant_logo_url) {
      setLogoPreview(brandingSettings.restaurant_logo_url);
    }
  }, [brandingSettings.restaurant_logo_url]);

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    setUploadProgress('Getting upload URL...');

    try {
      // Step 1: Get signed upload URL from backend
      const uploadUrlResponse = await apiClient.post('/system-settings/logo/upload-url', {
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
        throw new Error('Failed to upload logo to cloud storage');
      }

      setUploadProgress('Confirming upload...');

      // Step 3: Confirm upload and get processed URLs
      const confirmResponse = await apiClient.post('/system-settings/logo/confirm', {
        gcsFileName,
      });

      setUploadProgress('Upload complete!');
      setTimeout(() => setUploadProgress(''), 2000);

      // Update the form with the new logo URL
      setBrandingSettings(prev => ({
        ...prev,
        restaurant_logo_url: confirmResponse.data.url,
      }));
      setLogoPreview(confirmResponse.data.url);
      
      // Invalidate queries to refresh the logo
      queryClient.invalidateQueries({ queryKey: ['system-settings-all'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings-branding'] });
      
      // Refresh settings context to update all headers immediately
      await refreshSettings();
      
      setSuccessMessage('Logo uploaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error: any) {
      console.error('Logo upload error:', error);
      setUploadProgress('');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!acceptedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG, PNG, or WebP)');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('Image size must be less than 5MB');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Start the upload process
      handleLogoUpload(file);
    }
  };

  // Bulk update mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Array<{ key: string; value: string }>) => {
      const response = await apiClient.put('/system-settings', { settings });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings-all'] });
      queryClient.invalidateQueries({ queryKey: ['system-settings-branding'] });
      setSuccessMessage('Settings updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      const settings = Object.entries(brandingSettings).map(([key, value]) => ({
        key,
        value: value.toString(),
      }));
      await updateSettingsMutation.mutateAsync(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      const settings = Object.entries(workflowSettings).map(([key, value]) => ({
        key,
        value: value.toString(),
      }));
      await updateSettingsMutation.mutateAsync(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      const settings = Object.entries(generalSettings).map(([key, value]) => ({
        key,
        value: value.toString(),
      }));
      await updateSettingsMutation.mutateAsync(settings);
    } finally {
      setIsSaving(false);
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
        <p className="text-red-700">
          Only super administrators can access system configuration settings.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          System Configuration
        </h2>
        <p className="text-red-100">Configure restaurant-wide settings (Super Admin Only)</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium flex items-center gap-2">
            <Check className="w-4 h-4" />
            {successMessage}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('branding')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'branding'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Palette className="w-4 h-4" />
              Branding
            </button>
            <button
              onClick={() => setActiveTab('workflow')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'workflow'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Zap className="w-4 h-4" />
              Workflow
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'general'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Wrench className="w-4 h-4" />
              General
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Branding Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  value={brandingSettings.restaurant_name}
                  onChange={(e) =>
                    setBrandingSettings({ ...brandingSettings, restaurant_name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="My Restaurant"
                />
                <p className="text-sm text-gray-500 mt-1">
                  The name of your restaurant displayed throughout the application
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Theme Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingSettings.theme_primary_color}
                      onChange={(e) =>
                        setBrandingSettings({ ...brandingSettings, theme_primary_color: e.target.value })
                      }
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingSettings.theme_primary_color}
                      onChange={(e) =>
                        setBrandingSettings({ ...brandingSettings, theme_primary_color: e.target.value })
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="#4F46E5"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Main brand color (buttons, headers, etc.)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Theme Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingSettings.theme_secondary_color}
                      onChange={(e) =>
                        setBrandingSettings({ ...brandingSettings, theme_secondary_color: e.target.value })
                      }
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingSettings.theme_secondary_color}
                      onChange={(e) =>
                        setBrandingSettings({ ...brandingSettings, theme_secondary_color: e.target.value })
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="#10B981"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Secondary accent color</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Logo (JPG, PNG, WebP - Max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoChange}
                  disabled={uploadingLogo}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                />
                {uploadProgress && (
                  <div className="mt-2 text-sm text-indigo-600">
                    {uploadProgress}
                  </div>
                )}
                {logoPreview && (
                  <div className="mt-2">
                    <img
                      src={logoPreview}
                      alt="Restaurant Logo Preview"
                      className="max-w-full h-48 object-contain rounded-md"
                    />
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Upload a logo for your restaurant (recommended size: 500x500px)
                </p>
              </div>

              <button
                onClick={handleSaveBranding}
                disabled={isSaving}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? 'Saving...' : 'Save Branding Settings'}
              </button>
            </div>
          )}

          {/* Workflow Tab */}
          {activeTab === 'workflow' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Workflow Settings</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Seats Per Table
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={workflowSettings.default_seats_per_table}
                  onChange={(e) =>
                    setWorkflowSettings({ ...workflowSettings, default_seats_per_table: e.target.value })
                  }
                  className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Default capacity when creating new tables
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Auto-Accept
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="auto_accept"
                      checked={workflowSettings.order_auto_accept_enabled === 'true'}
                      onChange={() =>
                        setWorkflowSettings({ ...workflowSettings, order_auto_accept_enabled: 'true' })
                      }
                      className="mr-2"
                    />
                    Enabled
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="auto_accept"
                      checked={workflowSettings.order_auto_accept_enabled === 'false'}
                      onChange={() =>
                        setWorkflowSettings({ ...workflowSettings, order_auto_accept_enabled: 'false' })
                      }
                      className="mr-2"
                    />
                    Disabled
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Automatically accept customer orders without staff confirmation
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kitchen Preparation Alert Time (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={workflowSettings.kitchen_preparation_alert_time}
                  onChange={(e) =>
                    setWorkflowSettings({
                      ...workflowSettings,
                      kitchen_preparation_alert_time: e.target.value,
                    })
                  }
                  className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Alert kitchen staff when preparation time exceeds this threshold
                </p>
              </div>

              <button
                onClick={handleSaveWorkflow}
                disabled={isSaving}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? 'Saving...' : 'Save Workflow Settings'}
              </button>
            </div>
          )}

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Feedback
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="feedback"
                      checked={generalSettings.enable_customer_feedback === 'true'}
                      onChange={() =>
                        setGeneralSettings({ ...generalSettings, enable_customer_feedback: 'true' })
                      }
                      className="mr-2"
                    />
                    Enabled
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="feedback"
                      checked={generalSettings.enable_customer_feedback === 'false'}
                      onChange={() =>
                        setGeneralSettings({ ...generalSettings, enable_customer_feedback: 'false' })
                      }
                      className="mr-2"
                    />
                    Disabled
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Allow customers to provide feedback after completing their orders
                </p>
              </div>

              <button
                onClick={handleSaveGeneral}
                disabled={isSaving}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSaving ? 'Saving...' : 'Save General Settings'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Important Notes</h4>
        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
          <li>Changes to branding settings may require users to refresh their browsers</li>
          <li>Workflow settings affect how the system processes orders and operations</li>
          <li>Be cautious when modifying advanced settings as they may impact system behavior</li>
          <li>All changes are logged in the audit trail for security purposes</li>
        </ul>
      </div>
    </div>
  );
}
