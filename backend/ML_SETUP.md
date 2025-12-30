# Configuration du Modèle Machine Learning

## 📋 Prérequis

### 1. Installation de Python
- Python 3.8 ou supérieur est requis
- Vérifier l'installation : `python --version` (Windows) ou `python3 --version` (Linux/Mac)

### 2. Installation des dépendances Python

```bash
# Depuis le dossier backend/
pip install -r requirements.txt
```

Ou manuellement :
```bash
pip install scikit-learn numpy pandas joblib
```

## 📁 Structure des fichiers

```
backend/
├── src/
│   ├── ml/
│   │   ├── predict.py              # Script Python de prédiction
│   │   └── modele_booste_final.pkl # Modèle ML (à placer ici)
│   └── services/
│       └── mlService.ts            # Service Node.js pour appeler le script Python
```

## 🔧 Configuration

### 1. Placer le modèle ML
Copiez votre fichier `modele_booste_final.pkl` dans le dossier `backend/src/ml/`

### 2. Vérifier les permissions
Sur Linux/Mac, rendre le script Python exécutable :
```bash
chmod +x backend/src/ml/predict.py
```

### 3. Tester le script Python
```bash
# Depuis le dossier backend/
python src/ml/predict.py 8.9 92 8.5 94
# Devrait afficher un nombre entre 0 et 1
```

## 🧪 Test du service ML

### Test manuel du script Python
```bash
cd backend
python src/ml/predict.py 8.9 92 8.5 94
```

### Test via Node.js
Le service sera automatiquement testé lors des appels à l'API `/api/lines`

## 📊 Format des données

Le modèle attend 4 paramètres dans cet ordre :
1. **Pression** (bar) - Exemple: 8.9
2. **Température** (°C) - Exemple: 92
3. **Vibration** (mm/s) - Exemple: 8.5
4. **Niveau/Extension** (%) - Exemple: 94

Le modèle retourne un **score de risque entre 0 et 1**.

## 🔍 Dépannage

### Erreur "Python not found"
- Windows : Vérifier que Python est dans le PATH
- Linux/Mac : Utiliser `python3` au lieu de `python`

### Erreur "Modèle non trouvé"
- Vérifier que `modele_booste_final.pkl` est dans `backend/src/ml/`
- Vérifier les permissions de lecture du fichier

### Erreur "Module not found"
- Réinstaller les dépendances : `pip install -r requirements.txt`
- Vérifier l'environnement Python utilisé

### Erreur lors de la prédiction
- Vérifier que le modèle est compatible avec scikit-learn
- Vérifier le format des données d'entrée (4 nombres)

## 📝 Notes

- Le service ML est optionnel : en cas d'erreur, l'API retourne les valeurs de la base de données
- Les scores sont automatiquement limités entre 0 et 1
- Le niveau de risque est calculé automatiquement à partir du score :
  - `critical` : score >= 0.85
  - `high` : score >= 0.65
  - `medium` : score >= 0.35
  - `low` : score < 0.35



