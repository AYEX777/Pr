import { useState, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import { LoginPage } from "./components/LoginPage";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { LineDetailPage } from "./components/LineDetailPage";
import { ParameterHistoryPage } from "./components/ParameterHistoryPage";
import { CompensatorDetail } from "./components/CompensatorDetail";
import { LineRiskDetailView } from "./components/LineRiskDetailView";
import { AlertsView } from "./components/AlertsView";
import { HistoryView } from "./components/HistoryView";
import { HistoricalDataView } from "./components/HistoricalDataView";
import { InterventionsView } from "./components/InterventionsView";
import { ReportsView } from "./components/ReportsView";
import { ThresholdsView } from "./components/ThresholdsView";
import { UsersView } from "./components/UsersView";
import { SensorsView } from "./components/SensorsView";
import { ProfileView } from "./components/ProfileView";
import { FloatingActionButton } from "./components/FloatingActionButton";
import { LoadingSkeleton } from "./components/LoadingSpinner";
import { Toaster } from "./components/ui/sonner";
import { DarkModeTest } from "./components/DarkModeTest";
// useRealtimeAlerts n'est plus utilisé - les alertes viennent maintenant de l'API
import { mockProductionLines } from "./lib/mockData";
import { toast } from "sonner";
import { ProductionLine, Alert } from "./types";
import { pushNotificationService } from "./services/pushNotificationService";
import { getCurrentUser, type UserProfile } from "./lib/api";

// Inner component that uses router hooks
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: lineId } = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Charger les données depuis l'API
  const [realtimeLines, setRealtimeLines] = useState<ProductionLine[]>(mockProductionLines);
  const [realtimeAlerts, setRealtimeAlerts] = useState<Alert[]>([]);
  const [processedAlertIds, setProcessedAlertIds] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Initialiser le service de notifications au démarrage
  useEffect(() => {
    pushNotificationService.initialize();
  }, []);

  // Charger l'utilisateur courant pour l'afficher dans le header
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Erreur lors du chargement de l'utilisateur courant:", error);
      }
    };

    loadUser();
  }, []);

  // Charger les lignes et alertes depuis l'API au démarrage et périodiquement
  useEffect(() => {
    const loadData = async () => {
      try {
        const { fetchDashboardData, fetchAlerts } = await import('./lib/api');
        const data = await fetchDashboardData();
        setRealtimeLines(data.lines);
        
        // Charger les alertes depuis l'API
        const alerts = await fetchAlerts();
        
        // Détecter les nouvelles alertes critiques
        const newCriticalAlerts = alerts.filter(alert => 
          alert.severity === 'critical' && 
          !processedAlertIds.has(alert.id)
        );
        
        // Envoyer des notifications pour les nouvelles alertes critiques
        for (const alert of newCriticalAlerts) {
          const line = data.lines.find(l => l.id === alert.line_id);
          const lineName = line?.name || 'Ligne inconnue';
          
          await pushNotificationService.sendCriticalAlert({
            id: alert.id,
            lineName: lineName,
            message: alert.message || `Alerte critique sur ${lineName}`,
            riskScore: alert.risk_score,
          });
          
          // Marquer l'alerte comme traitée
          setProcessedAlertIds(prev => new Set(prev).add(alert.id));
        }
        
        setRealtimeAlerts(alerts);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000); // Rafraîchir toutes les 5 secondes
    return () => clearInterval(interval);
  }, [processedAlertIds]);
  
  // Helper functions for alerts - utilise l'API réelle
  const handleAcknowledgeAlert = async (id: string) => {
    try {
      const { acknowledgeAlert, fetchAlerts } = await import('./lib/api');
      await acknowledgeAlert(id);
      toast.success('Alerte acquittée');
      
      // Recharger les alertes après acquittement
      const alerts = await fetchAlerts();
      setRealtimeAlerts(alerts);
    } catch (error) {
      console.error('Erreur lors de l\'acquittement de l\'alerte:', error);
      toast.error('Erreur lors de l\'acquittement de l\'alerte');
    }
  };
  
  const refreshAlerts = async () => {
    try {
      const { fetchAlerts } = await import('./lib/api');
      const alerts = await fetchAlerts();
      setRealtimeAlerts(alerts);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des alertes:', error);
    }
  };

  // Determine current view from location
  const getCurrentView = () => {
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return "dashboard";
    if (path === "/lines") return "lines";
    if (path.startsWith("/lines/")) return "line";
    if (path === "/alerts") return "alerts";
    if (path === "/history") return "history";
    if (path === "/historical-data" || path === "/historique") return "historical-data";
    if (path === "/interventions") return "interventions";
    if (path === "/reports") return "reports";
    if (path === "/thresholds") return "thresholds";
    if (path === "/users") return "users";
    if (path === "/sensors") return "sensors";
    if (path === "/profile") return "profile";
    return "dashboard";
  };

  const currentView = getCurrentView();

  // Add page transition effect
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleNavigate = (view: string) => {
    const routeMap: Record<string, string> = {
      dashboard: "/",
      lines: "/lines",
      alerts: "/alerts",
      history: "/history",
      "historical-data": "/historical-data",
      interventions: "/interventions",
      reports: "/reports",
      thresholds: "/thresholds",
      users: "/users",
      sensors: "/sensors",
      profile: "/profile",
    };
    const route = routeMap[view] || "/";
    navigate(route);
  };

  const handleSelectLine = (lineId: string) => {
    navigate(`/lines/${lineId}`);
  };

  const handleBackToDashboard = () => {
    navigate("/");
  };

  const handleBackToLines = () => {
    navigate("/lines");
  };

  const selectedLine = lineId
    ? realtimeLines.find((line) => line.id === lineId)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex transition-colors">
      <DarkModeTest />
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        alertCount={realtimeAlerts.filter(a => !a.acknowledged).length}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header
          onSearch={setSearchQuery}
          alerts={realtimeAlerts}
          currentUser={currentUser}
          onLogout={async () => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          onNavigateHome={
            currentView !== "dashboard" && currentView !== "lines"
              ? handleBackToDashboard
              : undefined
          }
          showHomeButton={
            currentView !== "dashboard" &&
            currentView !== "lines" &&
            !["alerts", "history", "interventions", "reports", "thresholds", "users", "sensors", "profile"].includes(currentView)
          }
        />

        <main className="flex-1 overflow-auto relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
              <LoadingSkeleton />
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard lines={realtimeLines} onSelectLine={handleSelectLine} searchQuery={searchQuery} />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/lines" element={<Dashboard lines={realtimeLines} onSelectLine={handleSelectLine} searchQuery={searchQuery} />} />
              <Route path="/lines/:id/risk" element={<LineRiskDetailView />} />
              <Route path="/lines/:id/parameter/:paramName" element={<ParameterHistoryPage lines={realtimeLines} />} />
              <Route path="/lines/:id" element={<LineDetailPage lines={realtimeLines} />} />
              <Route path="/compensators" element={<Navigate to="/lines" replace />} />
              <Route path="/alerts" element={
                <AlertsView
                  alerts={realtimeAlerts}
                  onSelectLine={handleSelectLine}
                  onAcknowledgeAlert={async (id) => {
                    await handleAcknowledgeAlert(id);
                    refreshAlerts();
                  }}
                />
              } />
              <Route path="/history" element={<HistoryView alerts={realtimeAlerts} />} />
              <Route path="/historical-data" element={<HistoricalDataView />} />
              <Route path="/historique" element={<HistoricalDataView />} />
              <Route path="/interventions" element={<InterventionsView />} />
              <Route path="/reports" element={<ReportsView />} />
              <Route path="/thresholds" element={<ThresholdsView />} />
              <Route path="/users" element={<UsersView />} />
              <Route path="/sensors" element={<SensorsView lines={realtimeLines} />} />
              <Route path="/profile" element={<ProfileView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>

        {/* Floating Action Button - Only show on main views */}
        {["/", "/dashboard", "/lines"].includes(location.pathname) && <FloatingActionButton />}

        <Toaster position="top-right" />
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("token"));

  const handleLogin = async (email: string, password: string) => {
    try {
      const apiUrl =
        (import.meta as any).env?.VITE_API_URL ||
        'http://localhost:3000';
      
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur de connexion');
      }

      const data = await response.json();
      
      // Stocker le token
      localStorage.setItem("token", data.token);
      setIsAuthenticated(true);
      toast.success("Connexion réussie");
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      toast.error(error.message || 'Erreur de connexion');
      throw error;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin as any} />;
  }

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
