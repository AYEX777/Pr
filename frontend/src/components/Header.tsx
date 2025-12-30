import { Bell, Search, User, AlertCircle, Home, Settings, LogOut } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert } from '../types';
import type { UserProfile } from '../lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { getRelativeTime } from '../lib/utils';
import ocpLogo from 'figma:asset/552359b3b863782cc2ece06d4ed88f723b463399.png';
import { motion } from 'motion/react';

interface HeaderProps {
  onSearch?: (query: string) => void;
  alerts?: Alert[];
  onLogout: () => void;
  onNavigateHome?: () => void;
  showHomeButton?: boolean;
  onNavigate?: (view: string) => void;
  currentUser?: UserProfile | null;
}

export function Header({ onSearch, alerts = [], onLogout, onNavigateHome, showHomeButton, onNavigate, currentUser }: HeaderProps) {
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  const criticalAlerts = unacknowledgedAlerts.filter(a => a.level === 'critical');

  const fullName = currentUser?.full_name || 'Utilisateur PRISK';
  const email = currentUser?.email || 'utilisateur@prisk.local';
  const roleLabel =
    currentUser?.role === 'admin'
      ? 'Administrateur'
      : currentUser?.role === 'supervisor'
      ? 'Superviseur'
      : currentUser?.role === 'operator'
      ? 'Opérateur Principal'
      : 'Utilisateur';

  return (
    <header className="bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-white/10 sticky top-0 z-50 transition-colors">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-8">
          {/* Logo & Branding */}
          <motion.div 
            className="flex items-center gap-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.img 
              src={ocpLogo} 
              alt="OCP Logo" 
              className="w-12 h-12 object-contain"
              style={{ 
                filter: 'drop-shadow(0 6px 16px rgba(0, 132, 61, 0.4)) drop-shadow(0 3px 8px rgba(0, 132, 61, 0.25)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))' 
              }}
              whileHover={{ rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            />
            <div className="border-l border-gray-300 dark:border-white/10 pl-4 h-10 flex flex-col justify-center">
              <h1 className="text-gray-900 dark:text-zinc-50 tracking-tight leading-none" style={{ fontSize: '18px', fontWeight: '700' }}>
                PRISK
              </h1>
              <p className="text-gray-500 dark:text-zinc-400 leading-none" style={{ fontSize: '11px', marginTop: '2px' }}>
                Groupe OCP
              </p>
            </div>
          </motion.div>
          
          {showHomeButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateHome}
              className="gap-2 text-gray-700 dark:text-gray-300 hover:text-[#00843D] hover:bg-green-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
              style={{ fontSize: '14px', fontWeight: '500' }}
            >
              <Home className="w-4 h-4" />
              Accueil
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-500 w-4 h-4" />
            <Input
              type="search"
              placeholder="Rechercher une ligne ou un compensateur..."
              className="pl-10 h-11 bg-gray-50 dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 focus:bg-white dark:focus:bg-zinc-800 focus:border-[#00843D] dark:focus:border-[#00843D] focus:ring-[#00843D] dark:focus:ring-[#00843D]/20 transition-colors rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-400 dark:hover:border-zinc-500"
              style={{ fontSize: '14px' }}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Alerts Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 w-10 h-10"
              >
                <Bell className="w-5 h-5 text-gray-700 dark:text-zinc-50" />
                {unacknowledgedAlerts.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0"
                    style={{ fontSize: '11px' }}
                  >
                    {unacknowledgedAlerts.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Alertes récentes</span>
                {unacknowledgedAlerts.length > 0 && (
                  <Badge variant="secondary" style={{ fontSize: '11px' }}>
                    {unacknowledgedAlerts.length} nouvelle(s)
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {alerts.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500" style={{ fontSize: '14px' }}>
                    Aucune alerte
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {alerts.slice(0, 5).map((alert) => (
                    <DropdownMenuItem 
                      key={alert.id} 
                      className="flex flex-col items-start p-4 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            alert.level === 'critical' 
                              ? 'bg-red-100 text-red-600' 
                              : 'bg-orange-100 text-orange-600'
                          }`}
                        >
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 mb-1" style={{ fontSize: '14px', fontWeight: '500' }}>
                            {alert.message}
                          </p>
                          <p className="text-gray-500" style={{ fontSize: '12px' }}>
                            {getRelativeTime(alert.timestamp)}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark Mode Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="gap-3 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg h-10 pl-2 pr-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00843D] to-[#006B32] flex items-center justify-center text-white">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-gray-900 dark:text-zinc-50 leading-none" style={{ fontSize: '14px', fontWeight: '500' }}>
                    {fullName}
                  </p>
                  <p className="text-gray-500 dark:text-zinc-400 leading-none" style={{ fontSize: '12px', marginTop: '2px' }}>
                    {roleLabel}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
              <DropdownMenuLabel className="text-gray-900 dark:text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00843D] to-[#006B32] flex items-center justify-center text-white">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white" style={{ fontSize: '14px', fontWeight: '600' }}>
                      {fullName}
                    </p>
                    <p className="text-gray-500 dark:text-white" style={{ fontSize: '12px' }}>
                      {email}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-gray-900 dark:!text-white cursor-pointer" onClick={() => onNavigate?.('profile')} style={{ color: 'inherit' }}>
                <User className="w-4 h-4 text-gray-700 dark:!text-white" />
                <span className="dark:!text-white">Mon Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-gray-900 dark:!text-white cursor-pointer" onClick={() => onNavigate?.('thresholds')} style={{ color: 'inherit' }}>
                <Settings className="w-4 h-4 text-gray-700 dark:!text-white" />
                <span className="dark:!text-white">Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400 gap-2 cursor-pointer">
                <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-600 text-white px-8 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600' }}>
              {criticalAlerts.length} alerte{criticalAlerts.length > 1 ? 's' : ''} critique{criticalAlerts.length > 1 ? 's' : ''}
            </p>
            <p style={{ fontSize: '12px', opacity: 0.9 }}>
              Intervention requise immédiatement
            </p>
          </div>
        </div>
      )}
    </header>
  );
}