import { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LayoutDashboard, Video, AlertCircle, Home, Search, Bell, Settings, User as UserIcon, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfile from './pages/UserProfile';
import ZoneDashboard from './views/ZoneDashboard';
import VenueDashboard from './views/VenueDashboard';
import NetflixScoreDashboard from './views/NetflixScoreDashboard';
import AnomalyDashboard from './views/AnomalyDashboard';
import ClientsTable from './components/ClientsTable';
import ChatWidget from './components/ChatWidget';
import {
  useVenueData,
  useCauseCodesData,
  useAnomaliesData,
  useClientsData,
  useHostsData,
  useOSDistributionData,
  useLoadData
} from './hooks/useDashboardData';
import {
  BandLoadData,
  Zone
} from './types';

// Create QueryClient with 20-minute cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20 * 60 * 1000, // 20 minutes - data is fresh for 20 minutes
      gcTime: 20 * 60 * 1000, // 20 minutes - cache is kept for 20 minutes
      refetchInterval: 20 * 60 * 1000, // Refetch every 20 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Use cached data if available
      retry: 2, // Retry failed requests 2 times
    },
  },
});

type DashboardView = 'zone' | 'venue' | 'netflix' | 'anomaly' | 'clients' | 'profile';

function Dashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<DashboardView>('venue');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const { username, signOut } = useAuth();

  // Use React Query hooks to fetch all data with 20-minute cache
  const { data: venueData, isLoading: venueLoading } = useVenueData();
  const { data: causeCodeData = [] } = useCauseCodesData();
  const { data: anomalies = [] } = useAnomaliesData();
  const { data: clientsResponse, isLoading: clientsLoading } = useClientsData();
  const { data: hosts = [] } = useHostsData();
  const { data: osDistribution = [] } = useOSDistributionData();
  const { data: loadResponse } = useLoadData();

  // Extract clients from response
  const clients = useMemo(() => {
    if (!clientsResponse?.data) return [];
    return Array.isArray(clientsResponse.data) ? clientsResponse.data : [];
  }, [clientsResponse]);

  // Extract load data from response
  const loadData = useMemo(() => {
    if (!loadResponse) return [];
    if (Array.isArray((loadResponse as { bands: BandLoadData[] })?.bands)) {
      return (loadResponse as { bands: BandLoadData[] }).bands;
    } else if (Array.isArray(loadResponse)) {
      return loadResponse as BandLoadData[];
    }
    return [];
  }, [loadResponse]);

  // Check if any query is still loading
  const loading = venueLoading;

  const selectedZone = useMemo(() => {
    if (!venueData?.zones?.length) return null;
    if (!selectedZoneId) return venueData.zones[0];
    return venueData.zones.find((z: Zone) => z.id === selectedZoneId) || venueData.zones[0];
  }, [selectedZoneId, venueData]);

  useEffect(() => {
    if (activeView === 'zone' && !selectedZoneId && venueData?.zones?.length) {
      setSelectedZoneId(venueData.zones[0].id);
    }
  }, [activeView, selectedZoneId, venueData]);

  const navigation = [
    {
      id: 'venue' as DashboardView,
      name: 'Network Overview',
      icon: Home,
    },
    {
      id: 'zone' as DashboardView,
      name: 'Zone Analysis',
      icon: LayoutDashboard,
    },
    {
      id: 'clients' as DashboardView,
      name: 'Clients',
      icon: Search,
    },
    {
      id: 'netflix' as DashboardView,
      name: 'Streaming Quality',
      icon: Video,
    },
    {
      id: 'anomaly' as DashboardView,
      name: 'Anomaly Detection',
      icon: AlertCircle,
    }
  ];

  const handleZoneSelect = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setActiveView('zone');
  };

  // Show loading dashboard while fetching all data
  if (loading) {
    return (
      <div className="min-h-screen bg-grafana-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="w-8 h-8 border-4 border-grafana-border border-t-grafana-orange rounded-full animate-spin" />
          </div>
          <p className="text-grafana-text-secondary font-medium text-lg mb-2">Loading Dashboard</p>
          <p className="text-grafana-text-tertiary text-sm">Fetching network data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grafana-bg text-grafana-text flex flex-col">
      <aside className="w-14 bg-grafana-panel border-r border-grafana-border flex-shrink-0 fixed h-full overflow-y-auto z-50">
        <div className="flex flex-col items-center py-4 space-y-2">
          <button className="w-10 h-10 flex items-center justify-center hover:bg-grafana-hover rounded transition-colors">
            <svg className="w-6 h-6 text-grafana-orange" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </button>

          <div className="w-8 h-px bg-grafana-border my-2" />

          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
                  isActive
                    ? 'bg-grafana-orange text-white'
                    : 'text-grafana-text-secondary hover:bg-grafana-hover hover:text-grafana-text'
                }`}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}

          <div className="flex-1" />

          <button
            onClick={() => setActiveView('profile')}
            className={`w-10 h-10 flex items-center justify-center rounded transition-colors ${
              activeView === 'profile'
                ? 'bg-grafana-orange text-white'
                : 'text-grafana-text-secondary hover:bg-grafana-hover hover:text-grafana-text'
            }`}
            title="User Profile"
          >
            <UserIcon className="w-5 h-5" />
          </button>

          <button className="w-10 h-10 flex items-center justify-center text-grafana-text-secondary hover:bg-grafana-hover hover:text-grafana-text rounded transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-14">
        <header className="bg-grafana-panel border-b border-grafana-border sticky top-0 z-40">
          <div className="px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-6">
                <h1 className="text-lg font-medium text-grafana-text">
                  {activeView === 'venue' && 'Network Overview'}
                  {activeView === 'zone' && 'Zone Analysis'}
                  {activeView === 'netflix' && 'Streaming Quality'}
                  {activeView === 'anomaly' && 'Anomaly Detection'}
                  {activeView === 'profile' && 'User Profile'}
                </h1>

                {activeView === 'zone' && venueData?.zones && venueData.zones.length > 0 && (
                  <select
                    value={selectedZoneId || ''}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="px-3 py-1.5 bg-grafana-bg border border-grafana-border rounded text-sm text-grafana-text focus:outline-none focus:border-grafana-blue"
                  >
                    {venueData.zones.map((zone: Zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button className="p-2 text-grafana-text-secondary hover:text-grafana-text hover:bg-grafana-hover rounded transition-colors">
                  <Search className="w-5 h-5" />
                </button>

                <button className="p-2 text-grafana-text-secondary hover:text-grafana-text hover:bg-grafana-hover rounded transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-grafana-red rounded-full" />
                </button>

                <div className="w-px h-6 bg-grafana-border" />

                <div className="flex items-center gap-2 px-2 py-1 hover:bg-grafana-hover rounded transition-colors cursor-pointer">
                  <div className="w-7 h-7 bg-grafana-orange rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-grafana-text">{username}</span>
                </div>

                <button
                  onClick={() => {
                    signOut();
                    navigate('/login');
                  }}
                  className="p-2 text-grafana-text-secondary hover:text-grafana-text hover:bg-grafana-hover rounded transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {!venueData ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-grafana-text-secondary">No data available</p>
            </div>
          ) : (
            <>
              {activeView === 'zone' && selectedZone && <ZoneDashboard zone={selectedZone} />}
          {activeView === 'venue' && (
            <VenueDashboard venueData={venueData} onZoneSelect={handleZoneSelect} loadData={loadData} />
          )}
          {activeView === 'clients' && (
            <div className="p-6">
              <ClientsTable clients={clients} hosts={hosts} osDistribution={osDistribution} loading={clientsLoading} />
            </div>
          )}
          {activeView === 'netflix' && (
            <NetflixScoreDashboard venueData={venueData} causeCodeData={causeCodeData} />
          )}
          {activeView === 'anomaly' && (
            <AnomalyDashboard venueData={venueData} anomalies={anomalies} />
          )}
          {activeView === 'profile' && <UserProfile />}
            </>
          )}
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-grafana-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="w-8 h-8 border-4 border-grafana-border border-t-grafana-orange rounded-full animate-spin" />
          </div>
          <p className="text-grafana-text-secondary font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect to dashboard if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-grafana-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="w-8 h-8 border-4 border-grafana-border border-t-grafana-orange rounded-full animate-spin" />
          </div>
          <p className="text-grafana-text-secondary font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Router Component
function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
        <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

