import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Phone, 
  Calendar,
  Settings,
  CheckCircle,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { createUser, deleteUser, fetchUsers, updateUserRole, User as ApiUser } from '../lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'supervisor' | 'operator' | 'maintenance' | 'user';
  status: 'active' | 'inactive';
  lastLogin: Date;
  createdAt: Date;
  permissions: string[];
}

const roleColors = {
  admin: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
  supervisor: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  operator: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  maintenance: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
  user: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
};

const roleLabels = {
  admin: 'Administrateur',
  supervisor: 'Superviseur',
  operator: 'Opérateur',
  maintenance: 'Maintenance',
  user: 'Utilisateur',
};

export function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('user');
  const [newRole, setNewRole] = useState('user');

  const mapApiUser = (u: ApiUser): User => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: '',
    role: (u.role as User['role']) || 'operator',
    status: 'active',
    lastLogin: new Date(),
    createdAt: new Date(u.created_at),
    permissions: [],
  });

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers((data || []).map(mapApiUser));
    } catch (err) {
      console.error('Failed to load users', err);
      toast.error('Impossible de charger les utilisateurs');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !user.email.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedTab !== 'all' && user.status !== selectedTab) return false;
      return true;
    });
  }, [users, searchQuery, selectedTab]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      admins: users.filter(u => u.role === 'admin').length,
    };
  }, [users]);

  const handleCreate = async () => {
    if (!formName || !formEmail) {
      toast.error('Nom et email requis');
      return;
    }
    if (!formPassword) {
      toast.error('Mot de passe requis');
      return;
    }
    if (formPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    try {
      const created = await createUser({ 
        name: formName, 
        email: formEmail, 
        password: formPassword,
        role: formRole 
      });
      setUsers(prev => [mapApiUser(created), ...prev]);
      toast.success('Utilisateur créé avec succès');
      setIsDialogOpen(false);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormRole('user');
    } catch (err: any) {
      console.error('Create user failed', err);
      const errorMessage = err?.message || 'Création impossible';
      
      // Messages d'erreur spécifiques
      if (errorMessage.includes('email already exists') || errorMessage.includes('already exists')) {
        toast.error('Cet email est déjà utilisé. Veuillez choisir un autre email.');
      } else if (errorMessage.includes('password') || errorMessage.includes('mot de passe')) {
        toast.error('Le mot de passe ne respecte pas les critères requis.');
      } else if (errorMessage.includes('Forbidden') || errorMessage.includes('Admin role required')) {
        toast.error('Action non autorisée. Seuls les administrateurs peuvent créer des utilisateurs.');
      } else {
        toast.error(`Erreur: ${errorMessage}`);
      }
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    
    if (newRole === selectedUser.role) {
      toast.info('Le rôle est déjà défini sur cette valeur');
      setIsRoleDialogOpen(false);
      return;
    }
    
    try {
      const updated = await updateUserRole(selectedUser.id, newRole);
      setUsers(prev => prev.map(u => 
        u.id === updated.id ? mapApiUser(updated) : u
      ));
      toast.success(`Rôle modifié en "${roleLabels[newRole as keyof typeof roleLabels] || newRole}"`);
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error('Update role failed', err);
      const errorMessage = err?.message || 'Modification impossible';
      toast.error(errorMessage);
    }
  };

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.id);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      toast.success(`Utilisateur "${userToDelete.name}" supprimé avec succès`);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Delete user failed', err);
      const errorMessage = err?.message || 'Suppression impossible';
      
      // Message spécifique si l'admin essaie de supprimer son propre compte
      if (errorMessage.includes('cannot delete your own account') || 
          errorMessage.includes('own account')) {
        toast.error('Vous ne pouvez pas supprimer votre propre compte. Demandez à un autre administrateur de le faire.');
      } else if (errorMessage.includes('Forbidden') || errorMessage.includes('Admin role required')) {
        toast.error('Action non autorisée. Seuls les administrateurs peuvent supprimer des utilisateurs.');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Gestion des utilisateurs</h1>
          <p className="text-gray-600 dark:text-zinc-400">
            {stats.total} utilisateurs • {stats.active} actifs
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un utilisateur</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input id="name" placeholder="Ex: Younes Jeddou" value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="younes.jeddou@ocp.ma" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe initial</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Minimum 8 caractères"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Le mot de passe doit contenir au moins 8 caractères
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Rôle</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="operator">Opérateur</SelectItem>
                    <SelectItem value="supervisor">Superviseur</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button className="border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate}>
                Créer l'utilisateur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Total utilisateurs</p>
                <p className="text-2xl text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Actifs</p>
                <p className="text-2xl text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactifs</p>
                <p className="text-2xl text-gray-600">{stats.inactive}</p>
              </div>
              <XCircle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Administrateurs</p>
                <p className="text-2xl text-purple-600">{stats.admins}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Users List */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="active">Actifs</TabsTrigger>
          <TabsTrigger value="inactive">Inactifs</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab}>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-blue-500 text-white">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg text-gray-900 dark:text-white">{user.name}</h3>
                            <Badge variant="outline" className={roleColors[user.role]}>
                              {roleLabels[user.role]}
                            </Badge>
                            {user.status === 'active' ? (
                              <Badge className="bg-green-100 text-green-700 border-green-300">
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-700">
                                Inactif
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 dark:text-zinc-400">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{user.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>Dernière connexion: {formatDate(user.lastLogin)}</span>
                            </div>
                          </div>
                        </div>
                        <Button className="h-8 px-2 hover:bg-gray-100 dark:hover:bg-zinc-800">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          className="h-8 px-3 text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800"
                          onClick={() => openRoleDialog(user)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Modifier le rôle
                        </Button>
                        <AlertDialog open={isDeleteDialogOpen && userToDelete?.id === user.id} onOpenChange={(open: boolean) => {
                          if (!open) {
                            setIsDeleteDialogOpen(false);
                            setUserToDelete(null);
                          }
                        }}>
                          <AlertDialogTrigger asChild>
                            <Button 
                              className="h-8 px-3 text-sm bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => openDeleteDialog(user)}
                            >
                              Supprimer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription className="space-y-2">
                                <p>
                                  Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete?.name}</strong> ?
                                </p>
                                <p className="text-sm text-gray-600 dark:text-zinc-400">
                                  Email: {userToDelete?.email}
                                </p>
                                <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                                  ⚠️ Cette action est irréversible. Toutes les données associées à cet utilisateur seront perdues.
                                </p>
                                {userToDelete?.role === 'admin' && (
                                  <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold">
                                    ⚠️ Attention : Cet utilisateur est un administrateur.
                                  </p>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Supprimer définitivement
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-zinc-400">Aucun utilisateur trouvé</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Role Update Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle de l'utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-2">
                  Utilisateur: <span className="font-semibold text-gray-900 dark:text-white">{selectedUser.name}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
                  Email: <span className="font-semibold text-gray-900 dark:text-white">{selectedUser.email}</span>
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newRole">Nouveau rôle</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger id="newRole">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="operator">Opérateur</SelectItem>
                    <SelectItem value="supervisor">Superviseur</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  Rôle actuel: <span className="font-semibold">{roleLabels[selectedUser.role as keyof typeof roleLabels] || selectedUser.role}</span>
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button className="border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800" onClick={() => setIsRoleDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateRole}>
              Confirmer la modification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
