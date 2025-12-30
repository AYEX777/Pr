#!/usr/bin/env python3
"""
Script de prédiction ML pour PRISK - Modèle XGBoost
Charge le modèle et effectue une prédiction à partir de 2 paramètres : Pression et Température
"""

import sys
import os
import joblib
import pandas as pd
import numpy as np

def main():
    # Vérifier qu'on a exactement 7 arguments (en plus du nom du script)
    # [P, T, Vit_P, Vit_T, Instab_P, Ratio_PT, Corr_PT]
    if len(sys.argv) != 8:
        print("ERROR: 7 arguments requis: P T Vit_P Vit_T Instab_P Ratio_PT Corr_PT", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Récupérer les 7 arguments
        P = float(sys.argv[1])  # Pression actuelle
        T = float(sys.argv[2])  # Température actuelle
        Vit_P = float(sys.argv[3])  # Vitesse de variation de la Pression
        Vit_T = float(sys.argv[4])  # Vitesse de variation de la Température
        Instab_P = float(sys.argv[5])  # Instabilité de la Pression
        Ratio_PT = float(sys.argv[6])  # Ratio Pression/Température
        Corr_PT = float(sys.argv[7])  # Corrélation Pression-Température
        
        # Chemin vers le modèle (relatif au script)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(script_dir, 'modele_booste_final.pkl')
        
        # Vérifier que le fichier modèle existe
        if not os.path.exists(model_path):
            print(f"ERROR: Modèle non trouvé à {model_path}", file=sys.stderr)
            sys.exit(1)
        
        # Charger le modèle avec joblib
        try:
            model = joblib.load(model_path)
        except Exception as e:
            print(f"ERROR: Impossible de charger le modèle - {str(e)}", file=sys.stderr)
            sys.exit(1)
        
        # Préparer les données pour la prédiction
        # Créer un DataFrame avec les 7 features
        features_data = {
            'P': [P],
            'T': [T],
            'Vit_P': [Vit_P],
            'Vit_T': [Vit_T],
            'Instab_P': [Instab_P],
            'Ratio_PT': [Ratio_PT],
            'Corr_PT': [Corr_PT]
        }
        
        # Créer un DataFrame pandas
        features_df = pd.DataFrame(features_data)
        
        # Effectuer la prédiction
        try:
            # Si le modèle est un classificateur, utiliser predict_proba
            # Sinon, utiliser predict
            if hasattr(model, 'predict_proba'):
                # Pour un classificateur, on prend la probabilité de la classe positive
                prediction = model.predict_proba(features_df)[0]
                # Si c'est un array multi-classe, prendre la probabilité de la classe la plus élevée
                if len(prediction) > 1:
                    result = float(np.max(prediction))
                else:
                    result = float(prediction[0])
            else:
                # Pour un régresseur ou modèle de scoring
                prediction = model.predict(features_df)
                # Si le modèle retourne un array, prendre le premier élément
                if hasattr(prediction, '__iter__') and not isinstance(prediction, str):
                    result = float(prediction[0])
                else:
                    result = float(prediction)
        except Exception as e:
            # Si l'erreur vient du format des colonnes, essayer avec un array numpy
            try:
                features_array = np.array([[P, T, Vit_P, Vit_T, Instab_P, Ratio_PT, Corr_PT]])
                if hasattr(model, 'predict_proba'):
                    prediction = model.predict_proba(features_array)[0]
                    result = float(np.max(prediction)) if len(prediction) > 1 else float(prediction[0])
                else:
                    prediction = model.predict(features_array)
                    result = float(prediction[0]) if hasattr(prediction, '__iter__') and not isinstance(prediction, str) else float(prediction)
            except Exception as e2:
                print(f"ERROR: Erreur lors de la prédiction - {str(e2)}", file=sys.stderr)
                sys.exit(1)
        
        # S'assurer que le résultat est entre 0 et 1
        result = max(0.0, min(1.0, result))
        
        # Imprimer uniquement le résultat (score entre 0 et 1)
        print(f"{result:.6f}", end='')
        
    except ValueError as e:
        print(f"ERROR: Arguments invalides - {str(e)}", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError as e:
        print(f"ERROR: Fichier non trouvé - {str(e)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Erreur lors de la prédiction - {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()

