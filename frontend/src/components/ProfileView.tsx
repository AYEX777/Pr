import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Shield, 
  Bell, 
  Lock, 
  Activity,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings,
  Camera,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentUser, getCurrentUserStats, updateCurrentUserProfile, getHistory, UserProfile, UserStats } from '../lib/api';

export function ProfileView() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+212 6 12 34 56 78',
    location: 'Khouribga',
    department: 'Surveillance Industrielle',
    role: '',
    badge: 'OP-2547'
  });
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    criticalOnly: true,
    dailyReport: true,
    weeklyReport: false
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        const stats = await getCurrentUserStats();
        const history = await getHistory({ type: 'all', limit: 10 });

        const nameParts = user.full_name.split(' ');
        setProfileData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: user.email,
          phone: '+212 6 12 34 56 78',
          location: 'Khouribga',
          department: 'Surveillance Industrielle',
          role: user.role === 'admin' ? 'Administrateur' : user.role === 'supervisor' ? 'Superviseur' : user.role === 'operator' ? 'Opérateur Principal' : 'Utilisateur',
          badge: 'OP-2547'
        });
        setUserStats(stats);

        // Convertir l'historique en format recentActivity
        const activity = history.slice(0, 4).map(event => ({
          action: event.title,
          target: event.lineId || 'Système',
          time: formatRelativeTime(new Date(event.timestamp)),
          type: event.level === 'critical' ? 'warning' : event.type === 'intervention' ? 'info' : 'success'
        }));
        setRecentActivity(activity);
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        toast.error('Impossible de charger le profil');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  const stats = userStats ? [
    { label: 'Alertes traitées', value: userStats.alerts_processed.toString(), icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Interventions', value: userStats.interventions.toString(), icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Temps de réponse moyen', value: `${userStats.avg_response_time_minutes}min`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Taux de résolution', value: `${userStats.resolution_rate_percent}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' }
  ] : [
    { label: 'Alertes traitées', value: '0', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Interventions', value: '0', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Temps de réponse moyen', value: '0min', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Taux de résolution', value: '0%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  const achievements = [
    { title: 'Expert Réactivité', description: 'Temps de réponse < 15min', earned: true },
    { title: 'Maintenance Pro', description: '50+ interventions', earned: true },
    { title: 'Surveillance Elite', description: '100+ alertes traitées', earned: true },
    { title: 'Zéro Incident', description: '30 jours sans incident', earned: false }
  ];

  const handleSaveProfile = async () => {
    try {
      await updateCurrentUserProfile({
        full_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
        email: profileData.email,
      });
      toast.success('Profil mis à jour avec succès !');
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error('Impossible de mettre à jour le profil');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast.success('Préférence de notification mise à jour');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-white dark:bg-zinc-900 min-h-screen">
      {/* Header Profile Card */}
      <div>
        <Card className="overflow-hidden border-0 shadow-lg bg-white dark:bg-zinc-800">
          <div className="h-32 bg-gradient-to-r from-[#00843D] via-[#00a844] to-[#00c853] relative">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0 L0 0 0 40' fill='none' stroke='white' stroke-width='0.5' opacity='0.3'/%3E%3C/svg%3E")`,
              }}></div>
            </div>
          </div>
          <CardContent className="relative -mt-16 pb-6 bg-white dark:bg-zinc-800">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
              {/* Avatar Section */}
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-white dark:border-zinc-800 shadow-xl ring-4 ring-green-100 dark:ring-green-900 transition-all group-hover:ring-green-200 dark:group-hover:ring-green-800">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Younes&accessories=prescription02&facialHair=medium&facialHairColor=black&hair=short&hairColor=black&skinColor=brown&top=shortHairShortFlat" />
                  <AvatarFallback className="bg-gradient-to-br from-[#00843D] to-[#00c853] text-white text-3xl font-bold">
                    YJ
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-2 right-2 w-10 h-10 bg-[#00843D] hover:bg-[#00c853] text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{profileData.firstName} {profileData.lastName}</h2>
                  <p className="text-lg text-gray-600 dark:text-zinc-400 mt-1">{profileData.role}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
                    <Building2 className="w-4 h-4" />
                    {profileData.department}
                  </Badge>
                  <Badge variant="outline" className="gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
                    <Shield className="w-4 h-4" />
                    Badge: {profileData.badge}
                  </Badge>
                  <Badge className="gap-1.5 px-3 py-1.5 bg-[#00843D] hover:bg-[#00c853] text-white border-0">
                    <CheckCircle2 className="w-4 h-4" />
                    Actif
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="bg-[#00843D] hover:bg-[#00c853] text-white shadow-md hover:shadow-lg transition-all gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Modifier le profil
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={handleSaveProfile}
                      className="bg-[#00843D] hover:bg-[#00c853] text-white gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Enregistrer
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} dark:bg-opacity-20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-zinc-50 mt-1">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <div>
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm p-1">
            <TabsTrigger value="info" className="gap-2">
              <User className="w-4 h-4" />
              Informations
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              Activité
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Award className="w-4 h-4" />
              Récompenses
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="w-4 h-4" />
              Sécurité
            </TabsTrigger>
          </TabsList>

          {/* Informations Tab */}
          <TabsContent value="info" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Gérez vos informations de profil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input 
                      id="firstName" 
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      disabled={!isEditing}
                      className="transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input 
                      id="lastName" 
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Téléphone
                    </Label>
                    <Input 
                      id="phone" 
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Localisation
                    </Label>
                    <Input 
                      id="location" 
                      value={profileData.location}
                      onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Département
                    </Label>
                    <Input 
                      id="department" 
                      value={profileData.department}
                      onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Activité récente
                </CardTitle>
                <CardDescription>
                  Historique de vos dernières actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${
                        activity.type === 'success' ? 'bg-green-50 text-green-600' :
                        activity.type === 'warning' ? 'bg-orange-50 text-orange-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {activity.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                         activity.type === 'warning' ? <AlertCircle className="w-5 h-5" /> :
                         <Activity className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 dark:text-white">{activity.action}</p>
                        <p className="text-sm text-gray-600 dark:text-zinc-400 truncate">{activity.target}</p>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-zinc-400 whitespace-nowrap">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  Récompenses & Certifications
                </CardTitle>
                <CardDescription>
                  Vos accomplissements et badges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-6 rounded-2xl border-2 transition-all hover:shadow-lg ${
                        achievement.earned 
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300' 
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          achievement.earned 
                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' 
                            : 'bg-gray-300 text-gray-500'
                        }`}>
                          <Award className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-gray-900 dark:text-white mb-1">{achievement.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-zinc-400">{achievement.description}</p>
                          {achievement.earned && (
                            <Badge className="mt-3 bg-green-600 hover:bg-green-700">
                              Obtenu
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-green-600" />
                  Préférences de notification
                </CardTitle>
                <CardDescription>
                  Gérez comment vous souhaitez être notifié
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <Label htmlFor="emailAlerts" className="cursor-pointer">
                        Alertes par email
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                        Recevoir les alertes par email
                      </p>
                    </div>
                    <Switch 
                      id="emailAlerts"
                      checked={notifications.emailAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('emailAlerts', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <Label htmlFor="smsAlerts" className="cursor-pointer">
                        Alertes par SMS
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                        Recevoir les alertes critiques par SMS
                      </p>
                    </div>
                    <Switch 
                      id="smsAlerts"
                      checked={notifications.smsAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('smsAlerts', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <Label htmlFor="criticalOnly" className="cursor-pointer">
                        Alertes critiques uniquement
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                        Ne recevoir que les alertes de niveau critique
                      </p>
                    </div>
                    <Switch 
                      id="criticalOnly"
                      checked={notifications.criticalOnly}
                      onCheckedChange={(checked) => handleNotificationChange('criticalOnly', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <Label htmlFor="dailyReport" className="cursor-pointer">
                        Rapport quotidien
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                        Recevoir un résumé quotidien par email
                      </p>
                    </div>
                    <Switch 
                      id="dailyReport"
                      checked={notifications.dailyReport}
                      onCheckedChange={(checked) => handleNotificationChange('dailyReport', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <Label htmlFor="weeklyReport" className="cursor-pointer">
                        Rapport hebdomadaire
                      </Label>
                      <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                        Recevoir une analyse hebdomadaire détaillée
                      </p>
                    </div>
                    <Switch 
                      id="weeklyReport"
                      checked={notifications.weeklyReport}
                      onCheckedChange={(checked) => handleNotificationChange('weeklyReport', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-green-600" />
                  Sécurité du compte
                </CardTitle>
                <CardDescription>
                  Gérez la sécurité de votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-green-900">Authentification activée</p>
                        <p className="text-sm text-green-700 mt-1">
                          Votre compte est protégé par l'authentification OCP
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Changer le mot de passe</Label>
                    <Button variant="outline" className="w-full justify-start hover:bg-gray-50">
                      <Lock className="w-4 h-4 mr-2" />
                      Modifier le mot de passe
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Historique de connexion</Label>
                    <div className="space-y-3 mt-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">Connexion actuelle</p>
                          <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Khouribga, Maroc • Aujourd'hui à 08:30</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-50 text-green-700">Actif</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">Session précédente</p>
                          <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Khouribga, Maroc • Hier à 16:45</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
