# Guide de Configuration Android pour PRISK

Ce guide vous explique comment configurer et générer l'APK Android de l'application PRISK.

## Prérequis

1. **Android Studio** : Téléchargez et installez [Android Studio](https://developer.android.com/studio)
2. **JDK** : Java Development Kit 17 ou supérieur (inclus avec Android Studio)
3. **Android SDK** : Installé via Android Studio
4. **Gradle** : Géré automatiquement par Android Studio

## Configuration Initiale

### 1. Synchroniser Capacitor

Après chaque modification du code frontend, vous devez synchroniser avec Android :

```bash
cd frontend
npm run build
npx cap sync android
```

### 2. Ouvrir le projet dans Android Studio

```bash
cd frontend
npx cap open android
```

Cela ouvrira automatiquement Android Studio avec le projet Android.

## Configuration des Notifications

### Permissions Android

Les permissions pour les notifications sont déjà configurées dans `android/app/src/main/AndroidManifest.xml`.

### Icône de Notification

1. Créez une icône de notification (24x24dp) au format PNG
2. Placez-la dans `android/app/src/main/res/drawable/ic_stat_icon_config_sample.png`
3. Ou modifiez le nom dans `capacitor.config.ts` si vous utilisez une autre icône

## Génération de l'APK

### Option 1 : APK de Débogage (Debug)

1. Ouvrez Android Studio
2. Menu : **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. L'APK sera généré dans : `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2 : APK de Production (Release)

1. **Générer une clé de signature** (première fois uniquement) :
   ```bash
   keytool -genkey -v -keystore prisk-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias prisk
   ```

2. **Configurer le fichier de signature** :
   - Créez `android/key.properties` :
   ```properties
   storePassword=VOTRE_MOT_DE_PASSE
   keyPassword=VOTRE_MOT_DE_PASSE
   keyAlias=prisk
   storeFile=../prisk-release-key.jks
   ```

3. **Modifier `android/app/build.gradle`** :
   ```gradle
   ...
   android {
       ...
       signingConfigs {
           release {
               if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                   def keystorePropertiesFile = rootProject.file("key.properties")
                   def keystoreProperties = new Properties()
                   keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
                   
                   storeFile file(keystoreProperties['storeFile'])
                   storePassword keystoreProperties['storePassword']
                   keyAlias keystoreProperties['keyAlias']
                   keyPassword keystoreProperties['keyPassword']
               }
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

4. **Générer l'APK de release** :
   - Dans Android Studio : **Build** → **Generate Signed Bundle / APK**
   - Sélectionnez **APK**
   - Choisissez votre keystore
   - L'APK sera généré dans : `android/app/build/outputs/apk/release/app-release.apk`

## Configuration du Build Gradle

Le fichier `android/app/build.gradle` est déjà configuré avec :
- Min SDK : 22 (Android 5.1)
- Target SDK : 34 (Android 14)
- Compile SDK : 34

## Test sur un Appareil

### Via USB (Débogage USB)

1. Activez le **Mode développeur** sur votre appareil Android
2. Activez le **Débogage USB**
3. Connectez votre appareil via USB
4. Dans Android Studio, cliquez sur **Run** (▶️)
5. Sélectionnez votre appareil et lancez l'application

### Via Émulateur

1. Dans Android Studio : **Tools** → **Device Manager**
2. Créez un nouvel appareil virtuel (AVD)
3. Lancez l'émulateur
4. Cliquez sur **Run** dans Android Studio

## Commandes Utiles

```bash
# Synchroniser les modifications avec Android
npx cap sync android

# Ouvrir Android Studio
npx cap open android

# Copier les fichiers web vers Android
npx cap copy android

# Mettre à jour les plugins Capacitor
npx cap update android
```

## Dépannage

### Erreur : "SDK location not found"
- Ouvrez Android Studio
- **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**
- Notez le chemin du SDK
- Créez `android/local.properties` :
  ```properties
  sdk.dir=C:\\Users\\VOTRE_USER\\AppData\\Local\\Android\\Sdk
  ```

### Erreur : "Gradle sync failed"
- Dans Android Studio : **File** → **Invalidate Caches / Restart**
- Ou exécutez : `cd android && ./gradlew clean`

### Notifications ne fonctionnent pas
- Vérifiez que les permissions sont accordées dans les paramètres Android
- Vérifiez que l'icône de notification existe dans `res/drawable/`
- Vérifiez les logs : `adb logcat | grep -i notification`

## Structure du Projet Android

```
frontend/
├── android/                    # Projet Android natif
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── AndroidManifest.xml
│   │   │       ├── java/      # Code Java/Kotlin (si nécessaire)
│   │   │       └── res/       # Ressources (icônes, etc.)
│   │   └── build.gradle
│   └── build.gradle
├── capacitor.config.ts        # Configuration Capacitor
└── src/
    └── services/
        └── pushNotificationService.ts  # Service de notifications
```

## Support

Pour plus d'informations :
- [Documentation Capacitor](https://capacitorjs.com/docs)
- [Documentation Android](https://developer.android.com/docs)


