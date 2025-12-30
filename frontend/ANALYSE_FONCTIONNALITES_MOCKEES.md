# 📊 Rapport d'Analyse : Fonctionnalités Mockées vs Réelles

**Date :** $(date)  
**Projet :** PRISK - Système de Surveillance Industrielle  
**Objectif :** Identifier toutes les fonctionnalités frontend encore statiques/mockées

---

## ✅ FONCTIONNALITÉS CONNECTÉES À L'API (100% Réelles)

### 1. **Graphiques et Historique** ✅
- **`ParameterHistoryPage.tsx`** : 
  - ✅ Utilise `getParameterHistory()` depuis l'API
  - ✅ Données réelles de `sensor_readings`
  - ✅ Rafraîchissement automatique toutes les 30 secondes
  - ✅ Statistiques calculées depuis les vraies données

- **`HistoricalDataView.tsx`** :
  - ✅ Utilise `getComparativeHistory()` depuis l'API
  - ✅ Graphiques comparatifs basés sur données réelles
  - ⚠️ **PROBLÈME** : Utilise `mockProductionLines` comme fallback par défaut

### 2. **Temps Restant (TBE)** ✅
- **`Dashboard.tsx`** :
  - ✅ Affiche `line.tbeMinutes` calculé par le backend
  - ✅ Le backend calcule le TBE via `mlService.calculateTBE()`
  - ✅ Affichage conditionnel : "État Stable" si TBE non applicable

### 3. **Indicateurs de Performance (KPIs)** ⚠️ PARTIELLEMENT RÉEL
- **`ReportsView.tsx`** :
  - ✅ Utilise `getReportsSummary()` pour le résumé
  - ✅ Utilise `getProductionReport()`, `getAlertsDistribution()`, `getInterventionsTypes()`, `getAvailabilityReport()`
  - ❌ **PROBLÈME** : Certaines valeurs sont hardcodées :
    - Disponibilité : `96.8%` (ligne 96)
    - Autres KPIs peuvent être statiques

### 4. **Profil Utilisateur** ⚠️ PARTIELLEMENT RÉEL
- **`ProfileView.tsx`** :
  - ✅ Utilise `getCurrentUser()` pour récupérer les données utilisateur
  - ✅ Utilise `getCurrentUserStats()` pour les statistiques
  - ✅ Utilise `updateCurrentUserProfile()` pour la mise à jour
  - ❌ **PROBLÈME** : Certains champs sont hardcodés :
    - `phone: '+212 6 12 34 56 78'` (ligne 40, 71)
    - `location: 'Khouribga'` (ligne 41, 72)
    - `badge: 'OP-2547'` (ligne 44, 75)
    - `department: 'Surveillance Industrielle'` (ligne 42, 73)

### 5. **Actions d'Intervention** ✅
- **`InterventionsView.tsx`** :
  - ✅ Utilise `createIntervention()` - POST fonctionnel
  - ✅ Utilise `fetchInterventions()` - GET fonctionnel
  - ✅ Utilise `updateInterventionStatus()` - PATCH fonctionnel
  - ⚠️ **PROBLÈME** : Utilise `mockProductionLines` pour afficher la liste des lignes dans le formulaire (ligne 14, 251, 382)

### 6. **Gestion des Utilisateurs** ✅
- **`UsersView.tsx`** :
  - ✅ Utilise `fetchUsers()` - GET fonctionnel
  - ✅ Utilise `createUser()` - POST fonctionnel
  - ✅ Utilise `deleteUser()` - DELETE fonctionnel
  - ✅ Utilise `updateUserRole()` - PATCH fonctionnel

### 7. **Gestion des Alertes** ✅
- **`AlertsView.tsx`** :
  - ✅ Utilise `fetchAlerts()` depuis l'API
  - ✅ Utilise `acknowledgeAlert()` - PATCH fonctionnel
  - ✅ Affichage des alertes réelles depuis PostgreSQL

### 8. **Gestion des Capteurs** ✅
- **`SensorsView.tsx`** :
  - ✅ Utilise `getLineSensorThresholds()` pour récupérer les métadonnées
  - ✅ Affiche les données réelles des capteurs depuis les lignes

### 9. **Gestion des Seuils** ✅
- **`ThresholdsView.tsx`** :
  - ✅ Utilise `getLineSensorThresholds()` pour charger les seuils
  - ✅ Utilise `updateSensorThresholdsConfig()` pour mettre à jour
  - ⚠️ **PROBLÈME** : Utilise `mockProductionLines` comme fallback (ligne 22)

---

## ❌ FONCTIONNALITÉS ENCORE MOCKÉES

### 1. **Real-time Feedback** ❌
- **`useRealtimeData.ts`** :
  - ❌ **TOUS les hooks retournent des données mockées** :
    - `useRealtimeProductionLines()` : Simule des variations aléatoires (lignes 16-66)
    - `useRealtimeAlerts()` : Génère des alertes mockées (lignes 78-118)
    - `useRealtimeSensor()` : Retourne le sensor initial sans modification (ligne 122)
    - `useRealtimeHistory()` : Retourne un tableau vide `[]` (ligne 126)
    - `useRealtimeCompensator()` : Retourne le compensator initial (ligne 130)
    - `useRealtimeProductionLine()` : Retourne la ligne initiale (ligne 134)

- **`App.tsx`** :
  - ✅ Utilise `setInterval` pour rafraîchir toutes les 5 secondes (polling)
  - ⚠️ **PROBLÈME** : Pas de WebSocket, seulement du polling HTTP

- **`LineRiskDetailView.tsx`** :
  - ⚠️ Tente d'utiliser Socket.io (lignes 38-74) mais :
    - Le serveur backend n'a probablement pas Socket.io configuré
    - Fallback sur polling toutes les 5 secondes (ligne 117)

### 2. **Affichage des 7 Variables ML** ❌
- **Aucun composant n'affiche les 7 features du modèle ML** :
  - ❌ `Vit_P` (Vitesse de variation Pression)
  - ❌ `Vit_T` (Vitesse de variation Température)
  - ❌ `Instab_P` (Instabilité Pression)
  - ❌ `Ratio_PT` (Ratio Pression/Température)
  - ❌ `Corr_PT` (Corrélation Pression-Température)
  - ✅ `P` (Pression) et `T` (Température) sont affichés

- **`LineRiskDetailView.tsx`** :
  - Affiche les paramètres de base mais pas les features calculées

### 3. **Notifications Toast pour Alertes Critiques** ⚠️ PARTIELLEMENT
- **`App.tsx`** :
  - ✅ Affiche des toasts pour les erreurs/confirmations
  - ❌ **MANQUE** : Notification automatique quand une nouvelle alerte critique est créée par le backend
  - Le backend crée automatiquement des alertes si `mlScore > 0.85` mais le frontend ne les détecte pas en temps réel

### 4. **Composants Utilisant mockProductionLines** ⚠️
- **`HistoricalDataView.tsx`** (ligne 31, 38) : Fallback par défaut
- **`InterventionsView.tsx`** (ligne 14, 251, 382) : Pour afficher les lignes dans le formulaire
- **`ThresholdsView.tsx`** (ligne 22) : Fallback par défaut

### 5. **HistoryView** ❌
- **`HistoryView.tsx`** :
  - ❌ Utilise `mockHistory` (ligne 33) - données complètement mockées
  - ❌ N'utilise pas l'API `getGeneralHistory()`

### 6. **CompensatorDetail** ❌
- **`CompensatorDetail.tsx`** :
  - ❌ Utilise `useRealtimeHistory()` qui retourne un tableau vide (lignes 26-28)
  - ❌ Les graphiques d'historique sont vides

---

## 📋 LISTE DES COMPOSANTS À CONNECTER À L'API

### Priorité HAUTE 🔴

1. **`useRealtimeData.ts`** - Remplacer tous les hooks mockés par des appels API réels
   - Implémenter WebSocket ou polling efficace
   - Connecter `useRealtimeHistory()` à `getParameterHistory()`

2. **`HistoryView.tsx`** - Remplacer `mockHistory` par `getGeneralHistory()`
   - Utiliser l'API `/api/history` avec filtres

3. **`CompensatorDetail.tsx`** - Connecter les graphiques à l'API
   - Utiliser `getParameterHistory()` pour chaque capteur

4. **Notifications Toast pour Alertes Critiques** - Détecter les nouvelles alertes
   - Comparer les alertes reçues avec les précédentes
   - Afficher un toast si nouvelle alerte critique

### Priorité MOYENNE 🟡

5. **`HistoricalDataView.tsx`** - Remplacer le fallback `mockProductionLines`
   - Charger les lignes depuis l'API au démarrage

6. **`InterventionsView.tsx`** - Remplacer `mockProductionLines` dans le formulaire
   - Charger les lignes depuis `fetchDashboardData()`

7. **`ThresholdsView.tsx`** - Remplacer le fallback `mockProductionLines`
   - Charger les lignes depuis l'API

8. **`ProfileView.tsx`** - Remplacer les champs hardcodés
   - Utiliser les vraies données de `getCurrentUser()` (phone, location, badge, department)

9. **`ReportsView.tsx`** - Remplacer les valeurs hardcodées
   - Calculer la disponibilité depuis les vraies données
   - Utiliser les KPIs réels de l'API

### Priorité BASSE 🟢

10. **Affichage des 7 Variables ML** - Créer un composant pour afficher les features
    - Afficher `Vit_P`, `Vit_T`, `Instab_P`, `Ratio_PT`, `Corr_PT`
    - Peut être dans `LineRiskDetailView.tsx` ou un nouveau composant

11. **WebSocket pour Real-time** - Remplacer le polling par WebSocket
    - Configurer Socket.io côté backend
    - Implémenter les événements `risk_score_updated`, `alert_created`, etc.

---

## 🔧 ACTIONS RECOMMANDÉES

### Phase 1 : Corrections Immédiates
1. ✅ Remplacer `mockHistory` dans `HistoryView.tsx` par `getGeneralHistory()`
2. ✅ Connecter `CompensatorDetail.tsx` à l'API pour les graphiques
3. ✅ Remplacer les fallbacks `mockProductionLines` par des appels API
4. ✅ Remplacer les champs hardcodés dans `ProfileView.tsx`

### Phase 2 : Améliorations Real-time
5. ✅ Implémenter la détection de nouvelles alertes critiques avec toast
6. ✅ Connecter `useRealtimeHistory()` à l'API
7. ✅ Remplacer les hooks mockés dans `useRealtimeData.ts`

### Phase 3 : Features Avancées
8. ✅ Afficher les 7 variables ML dans l'interface
9. ✅ Implémenter WebSocket pour un vrai temps réel
10. ✅ Calculer les KPIs réels dans `ReportsView.tsx`

---

## 📊 RÉSUMÉ STATISTIQUE

- **Fonctionnalités 100% Réelles** : 6/15 (40%)
- **Fonctionnalités Partiellement Réelles** : 5/15 (33%)
- **Fonctionnalités Mockées** : 4/15 (27%)

**Taux de Complétion Global** : ~73% réel, 27% mocké

---

## 🎯 OBJECTIF FINAL

Pour atteindre **100% réel**, il faut :
1. Éliminer tous les usages de `mockProductionLines`, `mockHistory`, `mockData`
2. Connecter tous les hooks de `useRealtimeData.ts` à l'API
3. Remplacer tous les fallbacks hardcodés par des appels API
4. Implémenter WebSocket pour le vrai temps réel
5. Afficher toutes les features ML calculées par le backend


