import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient } from '../config/api';

interface BrandingSettings {
  restaurantName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
}

interface WorkflowSettings {
  defaultSeatsPerTable: number;
  orderAutoAcceptEnabled: boolean;
  kitchenPreparationAlertTime: number;
}

interface SettingsContextType {
  branding: BrandingSettings;
  workflow: WorkflowSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultBranding: BrandingSettings = {
  restaurantName: 'Smart Restaurant',
  primaryColor: '#4F46E5',
  secondaryColor: '#10B981',
  logoUrl: '',
};

const defaultWorkflow: WorkflowSettings = {
  defaultSeatsPerTable: 4,
  orderAutoAcceptEnabled: false,
  kitchenPreparationAlertTime: 15,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [workflow, setWorkflow] = useState<WorkflowSettings>(defaultWorkflow);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      
      // Fetch branding settings
      const brandingResponse = await apiClient.get('/system-settings/branding');
      setBranding(brandingResponse.data);
      
      // Apply theme colors to CSS variables
      document.documentElement.style.setProperty('--primary-color', brandingResponse.data.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', brandingResponse.data.secondaryColor);
      
      // Fetch workflow settings
      try {
        const workflowResponse = await apiClient.get('/system-settings/workflow/config');
        setWorkflow(workflowResponse.data);
      } catch (err) {
        console.error('Failed to fetch workflow settings:', err);
        setWorkflow(defaultWorkflow);
      }
    } catch (error) {
      console.error('Failed to fetch branding settings:', error);
      // Use defaults if fetch fails
      setBranding(defaultBranding);
      setWorkflow(defaultWorkflow);
      document.documentElement.style.setProperty('--primary-color', defaultBranding.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', defaultBranding.secondaryColor);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <SettingsContext.Provider value={{ branding, workflow, isLoading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
