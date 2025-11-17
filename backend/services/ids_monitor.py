from scapy.all import sniff, IP, TCP, UDP, ICMP, Raw
import random
import datetime
import pandas as pd
from joblib import load
import json
import os
import threading
import time
import psutil

# Set paths relative to the script's directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(SCRIPT_DIR, "ids_logs.json")
MODEL_PATH = os.path.join(SCRIPT_DIR, "nids_model_balanced.joblib")

# Load the trained model
model = load(MODEL_PATH)

# Predefined feature names (used during training)
FEATURES = [
    "source_port", "destination_port", "bytes_sent", "bytes_received", "frequency",
    "protocol_ICMP", "protocol_TCP", "protocol_UDP"
]

# Store frequency of (src_ip + dst_port)
freq_map = {}

class IDSMonitor:
    def __init__(self):
        self.is_monitoring = False
        self.packets_processed = 0
        self.alerts_generated = 0
        self.start_time = time.time()
        self.monitor_thread = None
        self.model_loaded = True  # Since model is loaded at module level

    def get_status(self):
        """Get current status of IDS monitor"""
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        memory_usage = memory.percent

        return {
            'is_monitoring': self.is_monitoring,
            'model_loaded': self.model_loaded,
            'stats': {
                'packets_processed': self.packets_processed,
                'alerts_generated': self.alerts_generated,
                'system_health': 100 - max(cpu_usage, memory_usage),  # Simple health calculation
                'cpu_usage': cpu_usage,
                'memory_usage': memory_usage,
                'uptime': time.time() - self.start_time
            }
        }

    def start_monitoring(self):
        """Start the IDS monitoring in a separate thread"""
        if not self.is_monitoring:
            self.is_monitoring = True
            self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
            self.monitor_thread.start()

    def stop_monitoring(self):
        """Stop the IDS monitoring"""
        self.is_monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)

    def _monitor_loop(self):
        """Main monitoring loop"""
        print("🔍 IDS started. Sniffing real network traffic... Press Ctrl+C to stop.")
        try:
            sniff(filter="ip", prn=self._process_packet, store=0, stop_filter=lambda x: not self.is_monitoring)
        except Exception as e:
            print(f"Monitoring stopped: {e}")
        finally:
            self.is_monitoring = False

    def _process_packet(self, packet):
        """Process individual packets"""
        if IP in packet:
            self.packets_processed += 1
            features = extract_features(packet)
            prediction = predict_and_log(features)
            if prediction == 1:  # Assuming 1 is malicious
                self.alerts_generated += 1
        return None  # Required for scapy prn callback

    def get_recent_logs(self, limit=50):
        """Get recent IDS logs"""
        try:
            if not os.path.exists(LOG_FILE):
                return []

            with open(LOG_FILE, "r") as f:
                lines = f.readlines()

            logs = []
            for line in reversed(lines[-limit:]):
                try:
                    log_entry = json.loads(line.strip())
                    logs.append(log_entry)
                except json.JSONDecodeError:
                    continue

            return logs
        except Exception as e:
            print(f"Error reading logs: {e}")
            return []

    def get_logs_by_ip(self, ip_address, limit=20):
        """Get IDS logs for specific IP address"""
        try:
            if not os.path.exists(LOG_FILE):
                return []

            with open(LOG_FILE, "r") as f:
                lines = f.readlines()

            logs = []
            for line in reversed(lines):
                try:
                    log_entry = json.loads(line.strip())
                    if log_entry.get('source_ip') == ip_address or log_entry.get('destination_ip') == ip_address:
                        logs.append(log_entry)
                        if len(logs) >= limit:
                            break
                except json.JSONDecodeError:
                    continue

            return logs
        except Exception as e:
            print(f"Error reading logs by IP: {e}")
            return []

    def get_alerts_summary(self):
        """Get IDS alerts summary"""
        try:
            logs = self.get_recent_logs(limit=1000)  # Get last 1000 logs for summary

            alerts = {
                'total_alerts': 0,
                'malicious_detections': 0,
                'http_traffic_alerts': 0,
                'recent_alerts': []
            }

            for log in logs:
                detection = log.get('detection', '')
                if 'Malicious' in detection or 'Alert' in detection:
                    alerts['total_alerts'] += 1
                    if 'Malicious IP detected' in detection:
                        alerts['malicious_detections'] += 1
                    elif 'Unsecured HTTP traffic' in detection:
                        alerts['http_traffic_alerts'] += 1

                    # Add to recent alerts (last 10)
                    if len(alerts['recent_alerts']) < 10:
                        alerts['recent_alerts'].append(log)

            return alerts
        except Exception as e:
            print(f"Error getting alerts summary: {e}")
            return {
                'total_alerts': 0,
                'malicious_detections': 0,
                'http_traffic_alerts': 0,
                'recent_alerts': []
            }


def extract_features(packet):
    protocol = "OTHER"
    src_port = dst_port = 0
    pkt_len = len(packet)

    if TCP in packet:
        protocol = "TCP"
        src_port = packet[TCP].sport
        dst_port = packet[TCP].dport
    elif UDP in packet:
        protocol = "UDP"
        src_port = packet[UDP].sport
        dst_port = packet[UDP].dport
    elif ICMP in packet:
        protocol = "ICMP"
        src_port = dst_port = 0

    key = f"{packet[IP].src}:{dst_port}"
    freq_map[key] = freq_map.get(key, 0) + 1

    return {
        "source_ip": packet[IP].src,
        "destination_ip": packet[IP].dst,
        "source_port": src_port,
        "destination_port": dst_port,
        "protocol": protocol,
        "bytes_sent": pkt_len,
        "bytes_received": random.randint(100, 12000),
        "frequency": freq_map[key],
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "http_flag": detect_http(packet)
    }


def detect_http(packet):
    if TCP in packet and Raw in packet:
        payload = packet[Raw].load
        if b"HTTP" in payload or b"Host:" in payload:
            if b"https" not in payload.lower():
                return True  # HTTP, not HTTPS
    return False


def predict_and_log(packet_data):
    # Encode protocol manually
    protocol = packet_data["protocol"]
    packet_data["protocol_ICMP"] = 1 if protocol == "ICMP" else 0
    packet_data["protocol_TCP"] = 1 if protocol == "TCP" else 0
    packet_data["protocol_UDP"] = 1 if protocol == "UDP" else 0

    # Extract features for model
    input_data = [[
        packet_data["source_port"],
        packet_data["destination_port"],
        packet_data["bytes_sent"],
        packet_data["bytes_received"],
        packet_data["frequency"],
        packet_data["protocol_ICMP"],
        packet_data["protocol_TCP"],
        packet_data["protocol_UDP"]
    ]]

    df = pd.DataFrame(input_data, columns=FEATURES)
    prediction = model.predict(df)[0]

    is_http = packet_data.get("http_flag", False)
    if is_http:
        detection = "⚠  Unsecured HTTP traffic detected"
        status = detection
    else:
        detection = "Secure" if prediction == 0 else "Malicious IP detected (ML model)"
        status = "✅ Secure" if prediction == 0 else "⚠  Alert: Malicious"

    # Determine alert level and status based on detection
    alert_level = "normal"
    status = "allowed"
    ml_prediction = prediction
    http_traffic = packet_data.get("http_flag", False)

    if "Malicious" in detection:
        alert_level = "alert"
        status = "blocked"
    elif "Unsecured HTTP" in detection:
        alert_level = "warning"
        status = "suspicious"

    log = {
        "timestamp": packet_data["timestamp"],
        "source_ip": packet_data["source_ip"],
        "destination_ip": packet_data["destination_ip"],
        "protocol": packet_data["protocol"],
        "detection": detection,
        "alert_level": alert_level,
        "status": status,
        "ml_prediction": int(ml_prediction),  # Convert numpy int64 to int
        "http_traffic": http_traffic,
        "packet_size": int(packet_data["bytes_sent"]),  # Convert to int
        "frequency": int(packet_data["frequency"])  # Convert to int
    }

    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(log) + "\n")

    print(f"[{packet_data['timestamp']}] {status} traffic from {packet_data['source_ip']} to {packet_data['destination_ip']}")

    return prediction


def process_packet(packet):
    if IP in packet:
        features = extract_features(packet)
        predict_and_log(features)


if __name__ == "__main__":
    print("🔍 IDS started. Sniffing real network traffic... Press Ctrl+C to stop.")
    sniff(filter="ip", prn=process_packet, store=0)