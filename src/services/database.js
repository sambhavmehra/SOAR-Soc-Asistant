// Database service using IndexedDB for persistent storage
class DatabaseService {
  constructor() {
    this.dbName = 'SoarSOCAssistantDB';
    this.version = 1;
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Database error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create incidents store
        if (!db.objectStoreNames.contains('incidents')) {
          const incidentsStore = db.createObjectStore('incidents', { keyPath: 'id', autoIncrement: true });
          incidentsStore.createIndex('eventid', 'eventid', { unique: true });
          incidentsStore.createIndex('timestamp', 'timestamp', { unique: false });
          incidentsStore.createIndex('severity', 'severity', { unique: false });
          incidentsStore.createIndex('status', 'status', { unique: false });
        }

        // Create aiReports store
        if (!db.objectStoreNames.contains('aiReports')) {
          const aiReportsStore = db.createObjectStore('aiReports', { keyPath: 'id', autoIncrement: true });
          aiReportsStore.createIndex('generatedAt', 'generatedAt', { unique: false });
          aiReportsStore.createIndex('type', 'type', { unique: false });
        }

        // Create reports store
        if (!db.objectStoreNames.contains('reports')) {
          const reportsStore = db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
          reportsStore.createIndex('type', 'type', { unique: false });
          reportsStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  // Incidents operations
  async addIncident(incident) {
    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['incidents'], 'readwrite');
      const store = transaction.objectStore('incidents');

      const request = store.add({
        ...incident,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      request.onsuccess = () => resolve({ success: true, id: request.result });
      request.onerror = () => reject({ success: false, error: request.error });
    });
  }

  async getIncidents() {
    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['incidents'], 'readonly');
      const store = transaction.objectStore('incidents');
      const request = store.getAll();

      request.onsuccess = () => resolve({ success: true, data: request.result });
      request.onerror = () => reject({ success: false, error: request.error });
    });
  }

  async updateIncident(id, updates) {
    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['incidents'], 'readwrite');
      const store = transaction.objectStore('incidents');

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const incident = getRequest.result;
        if (incident) {
          const updatedIncident = {
            ...incident,
            ...updates,
            updatedAt: new Date().toISOString()
          };
          const updateRequest = store.put(updatedIncident);
          updateRequest.onsuccess = () => resolve({ success: true });
          updateRequest.onerror = () => reject({ success: false, error: updateRequest.error });
        } else {
          reject({ success: false, error: 'Incident not found' });
        }
      };
      getRequest.onerror = () => reject({ success: false, error: getRequest.error });
    });
  }

  // AI Reports operations
  async addAIReport(report) {
    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['aiReports'], 'readwrite');
      const store = transaction.objectStore('aiReports');

      const request = store.add({
        ...report,
        createdAt: new Date().toISOString()
      });

      request.onsuccess = () => resolve({ success: true, id: request.result });
      request.onerror = () => reject({ success: false, error: request.error });
    });
  }

  async getAIReports() {
    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['aiReports'], 'readonly');
      const store = transaction.objectStore('aiReports');
      const request = store.getAll();

      request.onsuccess = () => resolve({ success: true, data: request.result });
      request.onerror = () => reject({ success: false, error: request.error });
    });
  }

  // Reports operations
  async addReport(report) {
    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['reports'], 'readwrite');
      const store = transaction.objectStore('reports');

      const request = store.add({
        ...report,
        createdAt: new Date().toISOString()
      });

      request.onsuccess = () => resolve({ success: true, id: request.result });
      request.onerror = () => reject({ success: false, error: request.error });
    });
  }

  async getReports() {
    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['reports'], 'readonly');
      const store = transaction.objectStore('reports');
      const request = store.getAll();

      request.onsuccess = () => resolve({ success: true, data: request.result });
      request.onerror = () => reject({ success: false, error: request.error });
    });
  }

  async updateReport(id, updates) {
    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['reports'], 'readwrite');
      const store = transaction.objectStore('reports');

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const report = getRequest.result;
        if (report) {
          const updatedReport = {
            ...report,
            ...updates,
            updatedAt: new Date().toISOString()
          };
          const updateRequest = store.put(updatedReport);
          updateRequest.onsuccess = () => resolve({ success: true });
          updateRequest.onerror = () => reject({ success: false, error: updateRequest.error });
        } else {
          reject({ success: false, error: 'Report not found' });
        }
      };
      getRequest.onerror = () => reject({ success: false, error: getRequest.error });
    });
  }

  // Bulk operations
  async bulkAddIncidents(incidents) {
    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['incidents'], 'readwrite');
      const store = transaction.objectStore('incidents');

      let successCount = 0;
      let errorCount = 0;

      incidents.forEach(incident => {
        const request = store.add({
          ...incident,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        request.onsuccess = () => successCount++;
        request.onerror = () => errorCount++;
      });

      transaction.oncomplete = () => resolve({
        success: true,
        added: successCount,
        errors: errorCount
      });
      transaction.onerror = () => reject({
        success: false,
        error: transaction.error
      });
    });
  }

  // Clear all data
  async clearAll() {
    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['incidents', 'aiReports', 'reports'], 'readwrite');

      ['incidents', 'aiReports', 'reports'].forEach(storeName => {
        const store = transaction.objectStore(storeName);
        store.clear();
      });

      transaction.oncomplete = () => resolve({ success: true });
      transaction.onerror = () => reject({ success: false, error: transaction.error });
    });
  }
}

// Export singleton instance
const databaseService = new DatabaseService();
export default databaseService;
