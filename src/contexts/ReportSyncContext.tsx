import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ReportFormData {
  keyword: string;
  anchorText: string;
  destinationUrl: string;
  urlList: string;
}

interface GeneratedReport {
  id: string;
  url: string;
  data: any;
  createdAt: string;
}

interface ReportSyncState {
  formData: ReportFormData;
  lastGeneratedReport: GeneratedReport | null;
  isGenerating: boolean;
  reportHistory: GeneratedReport[];
}

interface ReportSyncContextType {
  state: ReportSyncState;
  updateFormData: (data: Partial<ReportFormData>) => void;
  setGeneratedReport: (report: GeneratedReport) => void;
  setIsGenerating: (generating: boolean) => void;
  clearFormData: () => void;
  getReportById: (id: string) => GeneratedReport | null;
  navigateToReportView: (reportId: string) => void;
  navigateToReportForm: (prefillData?: Partial<ReportFormData>) => void;
}

const ReportSyncContext = createContext<ReportSyncContextType | undefined>(undefined);

const STORAGE_KEY = 'reportSyncState';
const MAX_HISTORY_SIZE = 10;

const defaultFormData: ReportFormData = {
  keyword: '',
  anchorText: '',
  destinationUrl: '',
  urlList: ''
};

const defaultState: ReportSyncState = {
  formData: defaultFormData,
  lastGeneratedReport: null,
  isGenerating: false,
  reportHistory: []
};

export function ReportSyncProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReportSyncState>(defaultState);
  const location = useLocation();
  const navigate = useNavigate();

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        setState(prevState => ({
          ...prevState,
          ...parsedState,
          isGenerating: false // Reset generating state on page load
        }));
      }
    } catch (error) {
      console.warn('Failed to load report sync state:', error);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save report sync state:', error);
    }
  }, [state]);

  // Handle route changes and state synchronization
  useEffect(() => {
    const currentPath = location.pathname;
    
    // If user navigates directly to /report without reportId, redirect to form
    if (currentPath === '/report' || currentPath === '/report/') {
      navigate('/backlink-report', { replace: true });
    }
  }, [location.pathname, navigate]);

  const updateFormData = (data: Partial<ReportFormData>) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        ...data
      }
    }));
  };

  const setGeneratedReport = (report: GeneratedReport) => {
    setState(prev => ({
      ...prev,
      lastGeneratedReport: report,
      reportHistory: [
        report,
        ...prev.reportHistory.filter(r => r.id !== report.id)
      ].slice(0, MAX_HISTORY_SIZE)
    }));
  };

  const setIsGenerating = (generating: boolean) => {
    setState(prev => ({
      ...prev,
      isGenerating: generating
    }));
  };

  const clearFormData = () => {
    setState(prev => ({
      ...prev,
      formData: defaultFormData
    }));
  };

  const getReportById = (id: string): GeneratedReport | null => {
    return state.reportHistory.find(report => report.id === id) || null;
  };

  const navigateToReportView = (reportId: string) => {
    // Ensure the report exists before navigating
    const report = getReportById(reportId);
    if (report || reportId.startsWith('demo_') || localStorage.getItem(`report_${reportId}`)) {
      navigate(`/report/${reportId}`);
    } else {
      console.warn(`Report ${reportId} not found`);
      navigate('/backlink-report');
    }
  };

  const navigateToReportForm = (prefillData?: Partial<ReportFormData>) => {
    if (prefillData) {
      updateFormData(prefillData);
    }
    navigate('/backlink-report');
  };

  const contextValue: ReportSyncContextType = {
    state,
    updateFormData,
    setGeneratedReport,
    setIsGenerating,
    clearFormData,
    getReportById,
    navigateToReportView,
    navigateToReportForm
  };

  return (
    <ReportSyncContext.Provider value={contextValue}>
      {children}
    </ReportSyncContext.Provider>
  );
}

export function useReportSync() {
  const context = useContext(ReportSyncContext);
  if (context === undefined) {
    throw new Error('useReportSync must be used within a ReportSyncProvider');
  }
  return context;
}

// Utility hook for easier form data management
export function useReportFormData() {
  const { state, updateFormData, clearFormData } = useReportSync();
  
  return {
    formData: state.formData,
    updateFormData,
    clearFormData,
    isValid: state.formData.keyword && state.formData.anchorText && state.formData.destinationUrl
  };
}

// Utility hook for report history management
export function useReportHistory() {
  const { state, getReportById, navigateToReportView } = useReportSync();
  
  return {
    reports: state.reportHistory,
    lastReport: state.lastGeneratedReport,
    getReportById,
    navigateToReportView
  };
}
