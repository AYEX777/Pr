# Configuration Mobile PRISK - Résumé

## ✅ Ce qui a été configuré

### 1. Capacitor Installé
- ✅ `@capacitor/core`
- ✅ `@capacitor/cli`
- ✅ `@capacitor/android`
- ✅ `@capacitor/local-notifications`

### 2. Service de Notifications
- ✅ `src/services/pushNotificationService.ts` créé
- ✅ Support des notifications locales avec vibration
- ✅ Détection automatique des alertes critiques

### 3. Intégration dans l'Application
- ✅ Logique d'alerte intégrée dans `App.tsx`
- ✅ Détection des nouvelles alertes critiques
- ✅ Notifications automatiques avec vibration

### 4. Configuration Android
- ✅ Projet Android créé dans `frontend/android/`
- ✅ Capacitor configuré (`capacitor.config.ts`)
- ✅ Build configuré pour générer l'APK

## 🚀 Prochaines Étapes

### Pour Générer l'APK :

1. **Construire le frontend** :
   ```bash
   cd frontend
   npm run build
   ```

2. **Synchroniser avec Android** :
   ```bash
   npx cap sync android
   ```

3. **Ouvrir dans Android Studio** :
   ```bash
   npx cap open android
   ```

4. **Dans Android Studio** :
   - Attendez que Gradle se synchronise
   - Menu : **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - L'APK sera dans : `android/app/build/outputs/apk/debug/app-debug.apk`

### Pour Tester sur un Appareil :

1. Activez le **Mode développeur** sur votre téléphone Android
2. Activez le **Débogage USB**
3. Connectez votre téléphone via USB
4. Dans Android Studio, cliquez sur **Run** (▶️)
5. Sélectionnez votre appareil

## 📱 Fonctionnalités Mobile

### Notifications
- ✅ Notifications locales pour les alertes critiques
- ✅ Vibration automatique
- ✅ Son de notification
- ✅ Icône personnalisée (vert PRISK)

### Détection d'Alertes
- ✅ Surveillance automatique toutes les 5 secondes
- ✅ Détection des nouvelles alertes critiques
- ✅ Notification immédiate avec vibration
- ✅ Évite les doublons (une notification par alerte)

## 📝 Fichiers Créés/Modifiés

### Nouveaux Fichiers
- `frontend/src/services/pushNotificationService.ts` - Service de notifications
- `frontend/capacitor.config.ts` - Configuration Capacitor
- `frontend/ANDROID_SETUP.md` - Guide détaillé Android
- `frontend/android/` - Projet Android natif

### Fichiers Modifiés
- `frontend/package.json` - Dépendances Capacitor ajoutées
- `frontend/src/App.tsx` - Logique d'alerte intégrée
- `frontend/src/main.tsx` - Initialisation Capacitor
- `frontend/vite.config.ts` - Build dir changé en `dist`

## 🔧 Commandes Utiles

```bash
# Synchroniser après chaque modification
npm run build && npx cap sync android

# Ouvrir Android Studio
npx cap open android

# Mettre à jour les plugins
npx cap update android

# Copier les fichiers web
npx cap copy android
```

## 📚 Documentation

Pour plus de détails, consultez :
- `ANDROID_SETUP.md` - Guide complet de configuration Android
- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Documentation Local Notifications](https://capacitorjs.com/docs/apis/local-notifications)

## ⚠️ Notes Importantes

1. **Permissions** : Les notifications nécessitent la permission sur Android. L'application demande automatiquement la permission au premier lancement.

2. **Icône de Notification** : Par défaut, l'icône est `ic_stat_icon_config_sample`. Vous pouvez la remplacer dans `android/app/src/main/res/drawable/`.

3. **Build** : N'oubliez pas de faire `npm run build` avant chaque `npx cap sync android` pour que les modifications soient prises en compte.

4. **API Backend** : Assurez-vous que le backend est accessible depuis l'appareil mobile (utilisez l'IP locale de votre machine au lieu de `localhost`).


