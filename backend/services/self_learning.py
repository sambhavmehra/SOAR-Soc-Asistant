import logging
import json
import os
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'self_learning_model.joblib')
DATA_PATH = os.path.join(os.path.dirname(__file__), 'incident_data.json')

class SelfLearningService:
    def __init__(self):
        self.model = None
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                logger.info("Self-learning model loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load model: {str(e)}")
                self.model = None
        else:
            logger.info("No existing model found. A new model will be trained.")

    def save_model(self):
        try:
            joblib.dump(self.model, MODEL_PATH)
            logger.info("Self-learning model saved successfully.")
        except Exception as e:
            logger.error(f"Failed to save model: {str(e)}")

    def add_incident_data(self, incident):
        data = []
        if os.path.exists(DATA_PATH):
            try:
                with open(DATA_PATH, 'r') as f:
                    data = json.load(f)
            except Exception as e:
                logger.error(f"Failed to load incident data: {str(e)}")

        data.append(incident)
        try:
            with open(DATA_PATH, 'w') as f:
                json.dump(data, f, indent=2)
            logger.info("Incident data added for self-learning.")
        except Exception as e:
            logger.error(f"Failed to save incident data: {str(e)}")

    def train_model(self):
        if not os.path.exists(DATA_PATH):
            logger.warning("No incident data available for training.")
            return False

        try:
            with open(DATA_PATH, 'r') as f:
                data = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load incident data for training: {str(e)}")
            return False

        if len(data) < 10:
            logger.warning("Not enough data to train the model. Need at least 10 samples.")
            return False

        # Prepare features and labels
        X = []
        y = []
        for incident in data:
            features = self.extract_features(incident)
            label = incident.get('severity', 'Medium')
            X.append(features)
            y.append(label)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        clf = RandomForestClassifier(n_estimators=100, random_state=42)
        clf.fit(X_train, y_train)

        y_pred = clf.predict(X_test)
        report = classification_report(y_test, y_pred)
        logger.info(f"Training completed. Classification report:\n{report}")

        self.model = clf
        self.save_model()
        return True

    def extract_features(self, incident):
        # Example feature extraction: convert categorical to numeric, use risk score, etc.
        features = []
        risk_score = float(incident.get('riskscore', 5))
        features.append(risk_score)

        # Encode attackType as numeric (simple example)
        attack_type = incident.get('attacktype', '').lower()
        attack_type_map = {
            'sql injection': 1,
            'phishing': 2,
            'ddos': 3,
            'malware': 4,
            'ransomware': 5,
            'unknown': 0
        }
        features.append(attack_type_map.get(attack_type, 0))

        # Encode status
        status = incident.get('status', '').lower()
        status_map = {
            'open': 1,
            'investigating': 2,
            'resolved': 3,
            'closed': 4,
            'unknown': 0
        }
        features.append(status_map.get(status, 0))

        return features

    def predict_severity(self, incident):
        if not self.model:
            logger.warning("Model not trained yet.")
            return 'Medium'

        features = self.extract_features(incident)
        prediction = self.model.predict([features])[0]
        logger.info(f"Predicted severity: {prediction}")
        return prediction
