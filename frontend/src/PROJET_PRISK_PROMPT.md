# 🏭 PROMPT DE PROJET - PLATEFORME PRISK (Groupe OCP)

## 📋 DESCRIPTION GÉNÉRALE DU PROJET

**Nom:** PRISK (Plateforme de Risque Industriel)  
**Client:** Groupe OCP - Leader mondial du phosphate  
**Type:** Application web de monitoring industriel temps réel  
**Utilisateurs cibles:** Opérateurs d'usine OCP  
**Objectif:** Surveillance en temps réel des lignes de production et compensateurs avec gestion proactive des risques

---

## 🎯 OBJECTIFS UX & FONCT££££££££££££££IONNELS

### Vision UX
- **Information critique immédiatement lisible** et actionnable en conditions industrielles
- **Navigation rapide** de la vue générale vers les détails (3 niveaux: Dashboard → Ligne → Compensateur)
- **Priorisation visuelle** des alertes avec codage couleur intuitif
- **Interface stable** en environnement industriel
- **Disponibilité mobile** pour les opérateurs sur le terrain
- **Temps de réponse critique:** Alertes < 60s

### Fonctionnalités Core
1. **Monitoring temps réel** de 12 paramètres par compensateur (144 capteurs au total)
2. **Système d'alertes** intelligent avec 3 niveaux (info, warning, critical)
3. **Historique d'interventions** complet et traçable
4. **Fiches détaillées** des capteurs avec graphiques temps réel
5. **Tableau de bord** avec vue d'ensemble multi-lignes
6. **Filtrage et recherche** avancés

---

## 🎨 IDENTITÉ VISUELLE OCP

### Palette de Couleurs
**Couleurs principales:**
- Vert signature OCP: `#00843D`
- Vert foncé: `#006B32`
- Vert plus foncé: `#005A29`
- Dégradés: `from-[#00843D] via-[#006B32] to-[#005A29]`

**Couleurs de risque:**
- **Low (Faible):** `bg-green-100 text-green-800` (Score: 0-64%)
- **Medium (Moyen):** `bg-yellow-100 text-yellow-800` (Score: 65-84%)
- **High (Élevé):** `bg-orange-100 text-orange-800` (Score: 85-99%)
- **Critical (Critique):** `bg-red-100 text-red-800` (Score: 100%+)

### Éléments Visuels
- **Logo OCP:** Importé depuis Figma avec drop shadow 3 couches pour visibilité parfaite
- **Typographie:** System fonts Apple/Roboto avec hiérarchie claire
- **Drop Shadows Logo:**
  ```css
  filter: drop-shadow(0 10px 25px rgba(0, 132, 61, 0.5)) 
          drop-shadow(0 6px 15px rgba(0, 132, 61, 0.3)) 
          drop-shadow(0 3px 8px rgba(0, 0, 0, 0.1))
  ```

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack Technologique
- **Framework:** React avec TypeScript
- **Styling:** Tailwind CSS v4.0
- **Composants UI:** Shadcn/ui
- **Icônes:** Lucide React
- **Graphiques:** Recharts
- **Animations:** Motion (Framer Motion)
- **Notifications:** Sonner v2.0.3
- **État:** React Hooks (useState, useEffect, useMemo)

### Structure de Fichiers
```
├── App.tsx                    # Point d'entrée, gestion navigation
├── types/index.ts            # Types TypeScript complets
├── lib/
│   ├── mockData.ts          # Données mockées pour 5 lignes
│   └── utils.ts             # Fonctions utilitaires
├── hooks/
│   └── useRealtimeData.ts   # Hooks temps réel (12 capteurs)
├── components/
│   ├── LoginPage.tsx        # Page login split-screen moderne
│   ├── Dashboard.tsx        # Vue d'ensemble lignes
│   ├── LinePage.tsx         # Détail d'une ligne
│   ├── CompensatorDetail.tsx # Détail compensateur
│   ├── Header.tsx           # Header avec logo OCP
│   ├── Sidebar.tsx          # Navigation principale
│   ├── AlertsView.tsx       # Gestion alertes
│   ├── CompensatorsView.tsx # Vue tous compensateurs
│   ├── InterventionsView.tsx # Historique interventions
│   ├── SensorsView.tsx      # Catalogue capteurs
│   └── ui/                  # Composants Shadcn
└── styles/
    └── globals.css          # Styles globaux + animations premium
```

---

## 📊 MODÈLE DE DONNÉES

### Type: ProductionLine
```typescript
interface ProductionLine {
  id: string;                    // 'line-1', 'line-2'...
  name: string;                  // 'Ligne A - Attaque Sulfurique'
  zone?: string;                 // 'Zone Nord', 'Zone Sud'...
  riskLevel: RiskLevel;          // 'low' | 'medium' | 'high' | 'critical'
  maxRiskScore: number;          // 0.0 à 1.0
  compensators: Compensator[];   // Liste des compensateurs
  lastUpdate: Date;
}
```

### Type: Compensator (12 paramètres)
```typescript
interface Compensator {
  id: string;
  name: string;
  lineId: string;
  riskLevel: RiskLevel;
  riskScore: number;             // Score calculé 0.0-1.0
  
  // 12 CAPTEURS PHYSIQUES:
  pressure: Sensor;              // Pression (bar)
  temperature: Sensor;           // Température (°C)
  volume: Sensor;                // Volume (L)
  pH: Sensor;                    // pH (sans unité)
  concentration: Sensor;         // Concentration (%)
  flow: Sensor;                  // Débit (m³/h)
  viscosity: Sensor;             // Viscosité (cP)
  level: Sensor;                 // Niveau (%)
  conductivity: Sensor;          // Conductivité (mS/cm)
  turbidity: Sensor;             // Turbidité (NTU)
  density: Sensor;               // Densité (g/cm³)
  vibration: Sensor;             // Vibration (mm/s)
  
  lastUpdate: Date;
  interventions: Intervention[];
}
```

### Type: Sensor
```typescript
interface Sensor {
  id: string;
  name: string;
  value: number;                 // Valeur actuelle
  unit: string;                  // Unité de mesure
  status: 'ok' | 'warning' | 'error';
  threshold: number;             // Seuil d'alerte
  lastUpdate: Date;
}
```

### Type: Intervention
```typescript
interface Intervention {
  id: string;
  date: Date;
  type: 'maintenance' | 'repair' | 'inspection' | 'alert';
  description: string;
  technician: string;            // Nom du technicien
  status: 'pending' | 'in_progress' | 'completed';
  attachments?: string[];
}
```

### Type: Alert
```typescript
interface Alert {
  id: string;
  compensatorId: string;
  lineId: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}
```

---

## 🔄 SYSTÈME TEMPS RÉEL

### Hook: useRealtimeProductionLines
**Fonction:** Simule la mise à jour temps réel de tous les capteurs  
**Intervalle:** 2000ms (2 secondes)  
**Logique:**
```typescript
// Pour chaque capteur:
1. Ajouter variance de ±5% à la valeur actuelle
2. Calculer le ratio: value / threshold
3. Déterminer le status:
   - ratio >= 1.0 → 'error'
   - ratio >= 0.85 → 'warning'
   - ratio < 0.85 → 'ok'
4. Mettre à jour lastUpdate

// Pour chaque compensateur:
5. Calculer riskScore = max(tous les ratios)
6. Déterminer riskLevel:
   - score >= 1.0 → 'critical'
   - score >= 0.85 → 'high'
   - score >= 0.65 → 'medium'
   - score < 0.65 → 'low'

// Pour chaque ligne:
7. riskLevel = max(riskLevel de tous compensateurs)
8. maxRiskScore = max(riskScore de tous compensateurs)
```

### Hook: useRealtimeAlerts
**Fonction:** Génère automatiquement des alertes basées sur les niveaux de risque  
**Logique:**
- Compensateur **critical** → Alerte critique immédiate
- Compensateur **high** → Alerte warning (probabilité 30%)
- Maximum 10 alertes récentes gardées en mémoire

### Hook: useRealtimeHistory
**Fonction:** Génère l'historique en temps réel pour les graphiques  
**Points de données:** 48-50 points (dernières 12-15 heures)  
**Mise à jour:** Toutes les 5 secondes

---

## 🎬 ANIMATIONS & EFFETS PREMIUM

### Motion (Framer Motion) - Utilisé partout
**Page Login:**
```typescript
// Slide-in depuis la gauche (section visuelle)
<motion.div 
  initial={{ x: -100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
/>

// Slide-in depuis la droite (formulaire)
<motion.div 
  initial={{ x: 100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
/>

// Logo avec hover interactif
<motion.img 
  whileHover={{ scale: 1.05, rotate: 2 }}
  transition={{ type: "spring", stiffness: 300 }}
/>

// Boutons avec scale
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
/>
```

**Header:**
```typescript
// Logo OCP avec rotation au hover
<motion.img 
  whileHover={{ rotate: 5 }}
  transition={{ type: "spring", stiffness: 400 }}
/>
```

### Effets CSS Premium (voir PREMIUM_EFFECTS.md)
**Classes principales utilisées:**
- `.liquid-glass` - Glassmorphisme avancé
- `.aurora-background` - Fond gradient animé
- `.neon-glow-green` / `.neon-glow-red` - Lueurs néon
- `.depth-layer-1` à `.depth-layer-4` - Ombres progressives
- `.animate-breathe` - Animation respiration
- `.hover-3d` - Effet 3D au survol
- `.text-shimmer` - Texte avec brillance animée
- `.energy-flow` - Gradient en mouvement
- `.morphing-blob` - Formes organiques animées

**Animations personnalisées:**
```css
@keyframes slide-in-right
@keyframes slide-up
@keyframes fade-in
@keyframes scale-in
@keyframes bounce-gentle
@keyframes glow
@keyframes float
@keyframes shimmer
```

---

## 📱 NAVIGATION & VUES

### Flux de Navigation
```
Login → Dashboard → [Ligne spécifique] → [Compensateur spécifique]
         ↓
    [Autres vues:]
    - Compensateurs (vue globale)
    - Alertes
    - Historique
    - Interventions
    - Rapports
    - Seuils
    - Utilisateurs
    - Capteurs
    - Profil
```

### Views Type
```typescript
type View = 
  | 'login' 
  | 'dashboard' 
  | 'lines'
  | 'compensators'
  | 'line' 
  | 'compensator' 
  | 'alerts' 
  | 'history' 
  | 'interventions' 
  | 'reports'
  | 'thresholds'
  | 'users'
  | 'sensors'
  | 'profile';
```

---

## 🎨 PAGE LOGIN (Split-Screen Design)

### Structure
```
┌─────────────────────────────────────────────────┐
│  LEFT SIDE (50%)        │  RIGHT SIDE (50%)    │
│  ─────────────          │  ─────────────       │
│                         │                       │
│  • Background OCP vert  │  • Formulaire Login  │
│  • Image industrielle   │  • Email + Password  │
│    avec overlay         │  • Remember Me       │
│  • Logo OCP animé       │  • Bouton connexion  │
│  • Titre PRISK          │  • Logo mobile       │
│  • Description          │  • Sécurité info     │
│  • 3 features avec ✓    │  • Version système   │
│  • Footer copyright     │                       │
│                         │                       │
└─────────────────────────────────────────────────┘
```

### Caractéristiques Login
- **Split-screen** moderne responsive
- **Gradient OCP** sur section gauche: `from-[#00843D] via-[#006B32] to-[#005A29]`
- **Image industrielle** Unsplash avec opacity 20%
- **Animations Motion** sur tous les éléments
- **Logo avec drop shadow 3 couches** pour visibilité parfaite
- **Formulaire avec icônes** (Mail, Lock) et focus states verts
- **Badge "Système opérationnel"** avec pulse animation

---

## 🎛️ DASHBOARD PRINCIPAL

### Composants
1. **Header sticky** avec:
   - Logo OCP animé
   - Barre de recherche
   - Badge alertes avec compteur
   - Menu utilisateur (dropdown)
   - Bouton déconnexion

2. **Sidebar** (navigation gauche):
   - Vue d'ensemble (Dashboard)
   - Lignes de production
   - Compensateurs
   - Alertes actives (badge count)
   - Historique
   - Interventions
   - Rapports
   - Seuils
   - Utilisateurs
   - Capteurs
   - Profil

3. **Zone principale:**
   - Stats globales (cartes)
   - Filtres par niveau de risque
   - Liste des lignes avec:
     - Nom + zone
     - Badge niveau de risque
     - Score max
     - Nombre compensateurs
     - Indicateur gradient de risque
     - Timestamp dernière maj
     - Bouton "Voir détails"

4. **Floating Action Button** (FAB):
   - Accessible sur vues principales
   - Actions rapides contextuelles

---

## 📊 PAGE LIGNE DE PRODUCTION

### Vue détaillée d'une ligne
**Affichage:**
- Breadcrumb de navigation
- Bouton retour
- En-tête avec:
  - Nom de la ligne
  - Zone
  - Badge risque global
  - Score maximum
  - Stats en temps réel

**Liste des compensateurs:**
- Grille responsive (3 colonnes desktop, 1 mobile)
- Cartes avec:
  - Nom compensateur
  - Badge risque
  - Indicateur visuel (jauge/gradient)
  - 4 capteurs principaux affichés
  - Timestamp
  - Bouton accès détails

**Filtrage:**
- Par niveau de risque
- Par statut capteur
- Recherche texte

---

## 🔬 PAGE DÉTAIL COMPENSATEUR

### Onglets (Tabs)
1. **Vue d'ensemble:**
   - Indicateur de risque principal (grande jauge)
   - Stats clés
   - Actions rapides (Appeler, Intervenir)
   - Statut temps réel

2. **Capteurs (12 paramètres):**
   - Grille 3×4 de cartes capteurs
   - Chaque carte affiche:
     - Nom + icône
     - Valeur actuelle / Seuil
     - Jauge visuelle
     - Badge statut (ok/warning/error)
     - Mini graphique sparkline
   
   **Liste des 12 capteurs:**
   - Pression (bar) - Gauge icon
   - Température (°C) - Thermometer icon
   - Volume (L) - Droplet icon
   - pH - Beaker icon
   - Concentration (%) - Flask icon
   - Débit (m³/h) - Waves icon
   - Viscosité (cP) - Wind icon
   - Niveau (%) - BarChart3 icon
   - Conductivité (mS/cm) - Zap icon
   - Turbidité (NTU) - Eye icon
   - Densité (g/cm³) - Package icon
   - Vibration (mm/s) - Activity icon

3. **Graphiques:**
   - Sélecteur période (1h, 6h, 24h, 7d)
   - Graphiques temps réel pour:
     - Pression
     - Température
     - Volume
     - (Autres capteurs sur demande)
   - Charts Recharts avec:
     - Ligne principale
     - Ligne seuil (rouge pointillé)
     - Gradient sous courbe
     - Tooltip informatif
     - Axes responsifs

4. **Interventions:**
   - Liste chronologique
   - Filtres par type/statut
   - Cartes intervention avec:
     - Type (icône + badge)
     - Date + heure
     - Description
     - Technicien
     - Statut (badge coloré)
     - Pièces jointes (optionnel)

---

## 🚨 SYSTÈME D'ALERTES

### AlertsView
**Fonctionnalités:**
- Liste temps réel des alertes
- Filtrage par niveau (info/warning/critical)
- Tri par date
- Accusé de réception (acknowledge)
- Navigation vers compensateur concerné
- Badge compteur dans sidebar

**Affichage alerte:**
```tsx
<Card>
  <Icon niveau />
  <Badge niveau />
  <Titre + message />
  <Timestamp relatif />
  <Ligne/Compensateur />
  <Bouton "Voir" />
  <Bouton "Accuser réception" />
</Card>
```

**Couleurs alertes:**
- **Critical:** Rouge (`bg-red-50 border-red-200`)
- **Warning:** Jaune/Orange (`bg-yellow-50 border-yellow-200`)
- **Info:** Bleu (`bg-blue-50 border-blue-200`)

---

## 📈 COMPOSANTS GRAPHIQUES CLÉS

### RiskGradientIndicator
Barre de gradient horizontal représentant le risque:
```typescript
// Gradient: vert → jaune → orange → rouge
background: linear-gradient(
  to right,
  #10B981 0%,      // Vert (0-65%)
  #FCD34D 65%,     // Jaune (65-85%)
  #FB923C 85%,     // Orange (85-100%)
  #EF4444 100%     // Rouge (100%+)
)
```

### RiskGauge (Jauge circulaire)
- Basé sur GaugeChart
- Couleurs dynamiques selon score
- Animation de remplissage
- Affichage pourcentage central

### GaugeChart
- Demi-cercle gauge
- Recharts RadialBarChart
- Responsive
- Labels personnalisés

### ParameterCard
Carte pour chaque capteur avec:
- Icône Lucide appropriée
- Nom + unité
- Valeur actuelle
- Seuil
- Barre de progression colorée
- Badge statut

---

## 🎨 DESIGN SYSTEM

### Couleurs Tailwind Personnalisées
```css
--primary: #16A34A;           /* Vert OCP */
--primary-foreground: #FFFFFF;
--background: #F8FAFC;         /* Gris très clair */
--foreground: #0F172A;         /* Gris très foncé */
--muted: #F1F5F9;
--muted-foreground: #64748B;
--border: #E2E8F0;
--ring: #16A34A;               /* Focus ring vert */
```

### Typographie (globals.css)
**Ne jamais utiliser les classes Tailwind pour:**
- Font size (utiliser les défauts H1-H6, p, button)
- Font weight (utiliser var(--font-weight-medium) ou --font-weight-normal)
- Line height

**Raison:** Design tokens définis dans `styles/globals.css` pour cohérence

### Radius
```css
--radius: 0.75rem;            /* 12px - arrondi par défaut */
```

### Shadows
Progressive depth avec 4 niveaux (.depth-layer-1 à .depth-layer-4)

---

## 🔧 COMPOSANTS SHADCN UTILISÉS

**Essentiels:**
- `button` - Boutons avec variantes
- `card` - Conteneurs de contenu
- `badge` - Badges de statut/risque
- `input` - Champs de formulaire
- `select` - Sélecteurs dropdown
- `tabs` - Onglets (détail compensateur)
- `dropdown-menu` - Menus contextuels
- `alert` - Messages d'information
- `dialog` - Modales
- `toast` (sonner) - Notifications
- `table` - Tableaux de données
- `scroll-area` - Zones scrollables
- `separator` - Séparateurs visuels

**Avancés:**
- `chart` - Base pour Recharts
- `tooltip` - Info-bulles
- `progress` - Barres de progression
- `skeleton` - États de chargement

---

## 📦 DONNÉES MOCKÉES

### 5 Lignes de Production
```typescript
1. Ligne A - Attaque Sulfurique (Zone Nord)
   - 3 compensateurs (A1: critical, A2: high, A3: medium)
   - Risque global: CRITICAL (score 0.89)

2. Ligne B - Granulation (Zone Sud)
   - 3 compensateurs (B1: high, B2: medium, B3: low)
   - Risque global: HIGH (score 0.75)

3. Ligne C - Filtration (Zone Est)
   - 3 compensateurs (C1: medium, C2: low, C3: low)
   - Risque global: MEDIUM (score 0.52)

4. Ligne D - Séchage (Zone Ouest)
   - 2 compensateurs (D1: low, D2: low)
   - Risque global: LOW (score 0.25)

5. Ligne E - Stockage Acide (Zone Nord)
   - 2 compensateurs (E1: medium, E2: low)
   - Risque global: MEDIUM (score 0.58)
```

**Total:** 13 compensateurs × 12 capteurs = **156 points de données en temps réel**

---

## 🚀 FONCTIONNALITÉS AVANCÉES

### Recherche Globale
- Dans Header
- Filtre lignes par nom/ID
- Temps réel (debounce recommandé)

### Filtrage Multi-critères
- Par niveau de risque (all/low/medium/high/critical)
- Par zone
- Par statut capteur
- Par période temporelle

### Auto-refresh
- Dashboard: refresh timestamp toutes les 2s
- Données: mise à jour toutes les 2s (hook)
- Indicateur "Live" avec pulse animation

### Notifications Toast
- Sonner v2.0.3
- Position: `top-right`
- Types: success, error, info, warning
- Messages contextuels (actions, erreurs, confirmations)

### Responsive Design
- **Mobile first** mais optimisé desktop
- Breakpoints Tailwind:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
- Sidebar collapsible sur mobile
- Grilles adaptatives (1-3 colonnes)
- Login split-screen devient vertical mobile

---

## 🔐 AUTHENTIFICATION & SÉCURITÉ

### Page Login
- **Email:** operateur@ocp.ma (placeholder)
- **Password:** Requis (validation simple)
- **Remember Me:** Checkbox persistant
- **Forgot Password:** Modal/Alert admin contact
- **Sécurité:** Message avec icône Shield

### État Auth
```typescript
const [isAuthenticated, setIsAuthenticated] = useState(false);

// Login success:
setIsAuthenticated(true);
setCurrentView('dashboard');

// Logout:
setIsAuthenticated(false);
setCurrentView('login');
// Reset selected IDs
```

### Pas de backend réel
- Données mockées en frontend
- Pas d'API calls (simulation pure)
- Pas de JWT/sessions (state React seulement)

---

## 📱 RESPONSIVE & MOBILE

### Breakpoints Clés
- **Mobile (< 768px):**
  - Sidebar en drawer/overlay
  - Grilles 1 colonne
  - Login vertical
  - Header compact
  - FAB repositionné

- **Tablet (768px - 1024px):**
  - Grilles 2 colonnes
  - Sidebar collapsible
  - Charts responsive

- **Desktop (> 1024px):**
  - Grilles 3 colonnes
  - Sidebar fixe
  - Split-screen login
  - Tous détails visibles

### Classes Responsive Tailwind
```tsx
// Exemple grille compensateurs:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Logo header:
<img className="w-12 h-12 lg:w-16 lg:h-16" />

// Hidden mobile:
<div className="hidden lg:block">
```

---

## 🎯 ÉTAT APPLICATION & PROPS DRILLING

### État Global (App.tsx)
```typescript
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [currentView, setCurrentView] = useState<View>('login');
const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
const [selectedCompensatorId, setSelectedCompensatorId] = useState<string | null>(null);
const [searchQuery, setSearchQuery] = useState('');
const [isLoading, setIsLoading] = useState(false);

// Données temps réel:
const realtimeLines = useRealtimeProductionLines(mockProductionLines, 2000);
const realtimeAlerts = useRealtimeAlerts(realtimeLines);
```

### Props Principales
**Dashboard:**
```typescript
interface DashboardProps {
  lines: ProductionLine[];
  onSelectLine: (lineId: string) => void;
  searchQuery?: string;
}
```

**LinePage:**
```typescript
interface LinePageProps {
  line: ProductionLine;
  onBack: () => void;
  onSelectCompensator: (compensatorId: string) => void;
}
```

**CompensatorDetail:**
```typescript
interface CompensatorDetailProps {
  compensator: Compensator;
  onBack: () => void;
}
```

**Header:**
```typescript
interface HeaderProps {
  onSearch?: (query: string) => void;
  alerts?: Alert[];
  onLogout: () => void;
  onNavigateHome?: () => void;
  showHomeButton?: boolean;
}
```

**Sidebar:**
```typescript
interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  alertCount?: number;
  className?: string;
}
```

---

## ⚡ PERFORMANCE & OPTIMISATION

### Optimisations Implémentées
1. **useMemo** pour filtrage/tri de listes
2. **useCallback** pour callbacks stables
3. **Intervalle contrôlé** (2s update, pas plus)
4. **Cleanup des intervals** dans useEffect
5. **Lazy loading** (pages/components on-demand possible)
6. **Skeleton loading** pendant transitions
7. **Animations GPU-accelerated** (transform, opacity)
8. **will-change** sur éléments animés critiques

### Bonnes Pratiques
- Éviter re-renders inutiles
- Limiter nombre d'alertes (max 10)
- Limiter historique (50 points max)
- Débounce sur recherche (recommandé)
- Conditional rendering intelligent

---

## 📝 CONVENTIONS CODE

### Naming
- **Composants:** PascalCase (`CompensatorDetail.tsx`)
- **Hooks:** camelCase avec prefix `use` (`useRealtimeData.ts`)
- **Types:** PascalCase (`ProductionLine`, `Sensor`)
- **Constantes:** SCREAMING_SNAKE_CASE ou camelCase
- **Fichiers utils:** camelCase (`mockData.ts`, `utils.ts`)

### Import Order
```typescript
1. React imports
2. Third-party libraries (lucide, recharts...)
3. Local components (./components/...)
4. Local hooks (./hooks/...)
5. Types (./types/...)
6. Utils (./lib/...)
7. Assets (images, logos...)
8. Styles
```

### TypeScript
- **Strictement typé** partout
- Interfaces pour props
- Types pour états et données
- Éviter `any`
- Utiliser `unknown` si vraiment besoin

### Tailwind
- **Pas de classes font/weight/size** sauf demandé explicitement
- Utiliser tokens CSS variables pour couleurs
- Responsive mobile-first
- Composition avec `cn()` de utils

---

## 🎨 EXEMPLES DE CODE CLÉS

### Indicateur de Risque Coloré
```typescript
const getRiskColor = (level: RiskLevel) => {
  switch (level) {
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
  }
};
```

### Barre de Progression Capteur
```tsx
<div className="w-full bg-gray-200 rounded-full h-2">
  <div
    className={cn(
      "h-2 rounded-full transition-all duration-500",
      sensor.status === 'error' ? "bg-red-500" :
      sensor.status === 'warning' ? "bg-orange-500" :
      "bg-green-500"
    )}
    style={{ width: `${Math.min((sensor.value / sensor.threshold) * 100, 100)}%` }}
  />
</div>
```

### Card Compensateur avec Hover
```tsx
<Card className="hover-lift cursor-pointer transition-all duration-300 hover:shadow-xl">
  <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h3>{compensator.name}</h3>
      <Badge className={getRiskColor(compensator.riskLevel)}>
        {getRiskLabel(compensator.riskLevel)}
      </Badge>
    </div>
    <RiskGradientIndicator value={compensator.riskScore} />
  </CardContent>
</Card>
```

### Toast Notification
```typescript
import { toast } from 'sonner@2.0.3';

// Success
toast.success('Intervention enregistrée avec succès');

// Error
toast.error('Erreur lors de la mise à jour');

// Warning
toast.warning('Seuil critique dépassé');

// Info
toast.info('Nouvelle alerte reçue');
```

---

## 🎯 CHECKLIST IMPLÉMENTATION

### ✅ Complété
- [x] Types TypeScript complets (12 capteurs)
- [x] Données mockées (5 lignes, 13 compensateurs)
- [x] Hooks temps réel (2s update)
- [x] Page login split-screen avec animations Motion
- [x] Dashboard avec filtrage et recherche
- [x] Détail ligne avec liste compensateurs
- [x] Détail compensateur avec 4 onglets
- [x] Système d'alertes temps réel
- [x] Header avec logo OCP et drop shadows
- [x] Sidebar navigation
- [x] Indicateurs visuels de risque (gradient, jauges)
- [x] Graphiques temps réel (Recharts)
- [x] Animations Motion sur login et header
- [x] Effets CSS premium (PREMIUM_EFFECTS.md)
- [x] Design responsive
- [x] Palette couleurs OCP
- [x] Floating Action Button
- [x] Toasts notifications (Sonner)
- [x] Loading states (skeleton)
- [x] 12 paramètres par compensateur intégrés partout

### 🎨 Design Elements
- [x] Logo OCP avec animations interactives
- [x] Drop shadows 3 couches sur logo
- [x] Dégradés verts OCP partout
- [x] Hover effects sur tous éléments cliquables
- [x] Slide-in animations page login
- [x] Scale animations sur boutons
- [x] Pulse animations sur indicateurs live
- [x] Liquid glass, aurora, neon effects disponibles

### 📊 Fonctionnalités
- [x] Vue d'ensemble (dashboard)
- [x] Vue compensateurs globale
- [x] Vue alertes
- [x] Vue capteurs (catalogue)
- [x] Interventions view
- [x] Auto-refresh 2s
- [x] Recherche globale
- [x] Filtres multi-critères
- [x] Navigation breadcrumb
- [x] Temps relatifs (il y a 5 min...)

---

## 🚀 ÉVOLUTIONS FUTURES POSSIBLES

### Phase 2 (Backend Supabase)
- Authentification réelle
- Base de données PostgreSQL
- Real-time subscriptions
- Historique persisté
- Gestion utilisateurs
- Permissions/rôles

### Phase 3 (Fonctionnalités avancées)
- Export PDF rapports
- Notifications push
- Alertes email/SMS
- Prédictions ML (maintenance prédictive)
- Comparaison lignes
- Analytics avancés
- Dashboards personnalisables

### Phase 4 (Mobile Native)
- App React Native
- Mode offline
- Notifications natives
- Scan QR codes compensateurs
- Géolocalisation techniciens

---

## 📚 DOCUMENTATION RÉFÉRENCE

### Fichiers Clés à Consulter
- `/types/index.ts` - Tous les types
- `/lib/mockData.ts` - Structure données
- `/hooks/useRealtimeData.ts` - Logique temps réel
- `/styles/globals.css` - Design tokens et animations
- `/PREMIUM_EFFECTS.md` - Guide effets visuels
- `/App.tsx` - Architecture navigation

### Librairies Documentation
- **React:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org
- **Tailwind CSS v4:** https://tailwindcss.com
- **Shadcn/ui:** https://ui.shadcn.com
- **Lucide Icons:** https://lucide.dev
- **Recharts:** https://recharts.org
- **Motion (Framer Motion):** https://motion.dev
- **Sonner:** https://sonner.emilkowal.ski

---

## 💡 CONSEILS UTILISATION DE CE PROMPT

### Pour Continuer le Développement
1. **Copier ce fichier** dans votre projet
2. **Référencer les sections** pertinentes selon vos besoins
3. **Utiliser avec un AI assistant** pour générer nouveau code cohérent
4. **Maintenir à jour** au fur et à mesure des évolutions

### Pour Onboarding Développeurs
1. Lire les sections "Description Générale" et "Objectifs"
2. Étudier le "Modèle de Données"
3. Comprendre l'"Architecture Technique"
4. Explorer les composants un par un

### Pour Designers
1. Sections "Identité Visuelle OCP"
2. "Animations & Effets Premium"
3. "Design System"
4. Consulter `/PREMIUM_EFFECTS.md`

### Pour Product Owners
1. "Objectifs UX & Fonctionnels"
2. "Navigation & Vues"
3. "Checklist Implémentation"
4. "Évolutions Futures"

---

## 🎯 PROMPT D'UTILISATION AVEC AI

### Prompt Court (Quick Start)
```
Génère un composant pour PRISK (plateforme monitoring industriel OCP).
Utilise les types de /types/index.ts, la palette verte OCP (#00843D),
les animations Motion, et respecte les 12 paramètres par compensateur.
```

### Prompt Complet (Nouveau Feature)
```
Je travaille sur PRISK, une application de monitoring industriel pour OCP
(Groupe OCP - phosphate). L'app utilise React + TypeScript + Tailwind + Shadcn/ui.

Couleurs: Vert OCP #00843D, #006B32, #005A29
Animations: Motion (Framer Motion)
Architecture: Dashboard → Lignes → Compensateurs (12 capteurs chacun)

Données temps réel avec hooks useRealtimeProductionLines (2s update).

Voici la structure du projet:
[Copier structure fichiers]

Voici les types:
[Copier types/index.ts]

Tâche: [Décrire votre besoin]

Respecte:
- Pas de classes font-size/weight Tailwind sauf demandé
- Animations Motion sur éléments interactifs
- Palette verte OCP partout
- Types strictement respectés
```

---

## 📞 CONTACT & SUPPORT

**Projet:** PRISK - Plateforme de Risque Industriel  
**Client:** Groupe OCP  
**Email Support:** support@ocp.ma (mock)  
**Version:** 1.0.0  
**Statut:** ✅ Système opérationnel

---

**Dernière mise à jour:** Novembre 2024  
**Document maintenu par:** L'équipe de développement PRISK

---

## 🏁 CONCLUSION

Ce document décrit **l'intégralité de l'architecture, du design, et des fonctionnalités** de la plateforme PRISK. Il peut être utilisé comme:

1. **Documentation technique** complète
2. **Prompt AI** pour génération de code cohérent
3. **Guide onboarding** pour nouveaux développeurs
4. **Référence design system** pour designers
5. **Spécifications produit** pour product managers

La plateforme PRISK représente un système de monitoring industriel moderne, avec une expérience utilisateur soignée, des animations fluides, et une architecture scalable prête pour une évolution backend.

---

🚀 **Built with excellence for Groupe OCP** 🌱
