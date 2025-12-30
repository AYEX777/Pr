import { Badge } from './ui/badge';
import { 
  Factory, 
  Gauge, 
  AlertCircle, 
  Clock, 
  Wrench, 
  FileText,
  Settings,
  Users,
  Radio,
  User,
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  alertCount?: number;
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export function Sidebar({ currentView, onNavigate, alertCount = 0, className }: SidebarProps) {
  const mainNavItems: NavItem[] = [
    {
      id: 'lines',
      label: 'Lignes de production',
      icon: <Factory className="w-5 h-5" />,
    },
    {
      id: 'alerts',
      label: 'Alertes actives',
      icon: <AlertCircle className="w-5 h-5" />,
      badge: alertCount,
    },
    {
      id: 'history',
      label: 'Historique',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      id: 'historical-data',
      label: 'Analyse Historique',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      id: 'interventions',
      label: 'Interventions',
      icon: <Wrench className="w-5 h-5" />,
    },
  ];

  const configItems: NavItem[] = [
    {
      id: 'thresholds',
      label: "Seuils d'alerte",
      icon: <Settings className="w-5 h-5" />,
    },
    {
      id: 'users',
      label: 'Utilisateurs',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'sensors',
      label: 'Capteurs',
      icon: <Radio className="w-5 h-5" />,
    },
  ];

  return (
    <aside className={cn("w-64 bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-white/10 flex flex-col transition-colors", className)}>
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        {/* Main Navigation */}
        <nav className="space-y-1">
          <div className="px-3 mb-3">
            <h2 className="text-gray-500 dark:text-zinc-400 uppercase tracking-wider" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>
              Navigation
            </h2>
          </div>
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                currentView === item.id
                  ? "bg-gradient-to-r from-[#00843D] to-[#006B32] text-white shadow-sm"
                  : "text-gray-700 dark:text-zinc-50 hover:bg-gray-50 dark:hover:bg-zinc-800"
              )}
            >
              <span className={cn(
                "flex-shrink-0 transition-transform group-hover:scale-105",
                currentView === item.id ? "text-white" : "text-gray-500 dark:text-zinc-400"
              )}>
                {item.icon}
              </span>
              <span className="flex-1 text-left" style={{ fontSize: '14px', fontWeight: currentView === item.id ? '600' : '500' }}>
                {item.label}
              </span>
              {item.badge && item.badge > 0 && (
                <Badge 
                  className={cn(
                    "px-2 py-0.5 rounded-md",
                    currentView === item.id 
                      ? "bg-white/20 text-white border-white/30" 
                      : "bg-red-500 text-white border-0"
                  )}
                  style={{ fontSize: '11px', fontWeight: '600' }}
                >
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Configuration Section */}
        <div className="mt-6">
          <div className="px-3 mb-3">
            <h2 className="text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>
              Configuration
            </h2>
          </div>
          <nav className="space-y-1">
            {configItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors text-sm",
                  currentView === item.id
                    ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-md border border-[#00843D]/20 dark:border-[#00c853]/20"
                    : "text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800"
                )}
              >
                <span className={cn(
                  "flex-shrink-0 w-4 h-4",
                  currentView === item.id ? "text-[#00843D] dark:text-[#00c853]" : "text-gray-500 dark:text-zinc-500"
                )}>
                  {item.icon}
                </span>
                <span className={cn(
                  "flex-1 text-left text-xs font-medium",
                  currentView === item.id ? "text-gray-900 dark:text-zinc-100 font-semibold" : ""
                )}>
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer - System Info */}
      <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-zinc-950">
        <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-[#00843D] animate-pulse-subtle"></div>
          <span style={{ fontSize: '12px', fontWeight: '500' }}>Système opérationnel</span>
        </div>
        <p className="text-gray-500 dark:text-zinc-400" style={{ fontSize: '11px' }}>
          PRISK v1.0.0 • Groupe OCP
        </p>
      </div>
    </aside>
  );
}
