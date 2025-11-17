import axios from 'axios';
import { getGoogleToken } from './googleAuth';

class GoogleSheetsService {
  constructor() {
    this.apiKey = import.meta.env?.VITE_GOOGLE_SHEETS_API_KEY;
    this.spreadsheetId = import.meta.env?.VITE_GOOGLE_SHEETS_ID || '1P988HAfB1GGLmNqXv6cnA35EBbgvJSViQrE3EnU-Y9o';
    this.sheetName = import.meta.env?.VITE_GOOGLE_SHEETS_TAB || 'Sheet1';
    this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    
    console.log('GoogleSheetsService initialized with:');
    console.log('- API Key:', this.apiKey ? 'Set' : 'Not set');
    console.log('- Spreadsheet ID:', this.spreadsheetId);
    console.log('- Sheet Name:', this.sheetName);
  }

  /**
   * Initialize the spreadsheet with headers
   */
  async initializeSheet() {
    console.log('Initializing Google Sheet with headers...');
    try {
      const headers = [
        'Timestamp',
        'Event ID', 
        'Severity',
        'Source IP',
        'Destination IP',
        'Attack Type',
        'Status',
        'Action Taken'
      ];
      
      console.log('Headers to initialize:', headers);

      const response = await axios?.put(
        `${this.baseUrl}/${this.spreadsheetId}/values/${this.sheetName}!A1:H1`,
        {
          values: [headers]
        },
        {
          params: {
            key: this.apiKey,
            valueInputOption: 'RAW'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Sheet initialization successful:', response?.data);
      return {
        success: true,
        data: response?.data
      };
    } catch (error) {
      console.error('Google Sheets initialization error:', error);
      console.error('Error details:', error?.response?.data?.error || error.message);
      return {
        success: false,
        error: error?.response?.data?.error?.message || 'Failed to initialize sheet'
      };
    }
  }

  /**
   * Add a new security incident to the Google Sheet
   * @param {Object} incident - Security incident data
   * @returns {Object} Response from Google Sheets API
   */
  async addSecurityIncident(incident) {
    console.log('Adding security incident to Google Sheet:', incident);
    try {
      const timestamp = new Date()?.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const eventId = incident?.eventId || `INC-${new Date()?.toISOString()?.split('T')?.[0]?.replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000))?.padStart(3, '0')}`;

      const rowData = [
        timestamp,
        eventId,
        incident?.severity || 'Medium',
        incident?.sourceIp || 'Unknown',
        incident?.destinationIp || 'Unknown', 
        incident?.attackType || 'Unknown',
        incident?.status || 'Investigating',
        incident?.actionTaken || 'Alert Sent'
      ];
      
      console.log('Row data to add:', rowData);

      // Get current row count to append to next available row
      console.log('Getting current row count...');
      const rangeResponse = await axios?.get(
        `${this.baseUrl}/${this.spreadsheetId}/values/${this.sheetName}`,
        {
          params: {
            key: this.apiKey
          }
        }
      );
      
      console.log('Current sheet data:', rangeResponse?.data);

      const currentRows = rangeResponse?.data?.values?.length || 1;
      const nextRow = currentRows + 1;
      console.log(`Adding incident to row ${nextRow}`);

      const response = await axios?.put(
        `${this.baseUrl}/${this.spreadsheetId}/values/${this.sheetName}!A${nextRow}:H${nextRow}`,
        {
          values: [rowData]
        },
        {
          params: {
            key: this.apiKey,
            valueInputOption: 'RAW'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Incident added successfully:', response?.data);
      return {
        success: true,
        data: {
          ...response?.data,
          incident: {
            timestamp,
            eventId,
            severity: incident?.severity,
            sourceIp: incident?.sourceIp,
            destinationIp: incident?.destinationIp,
            attackType: incident?.attackType,
            status: incident?.status,
            actionTaken: incident?.actionTaken
          }
        }
      };
    } catch (error) {
      console.error('Google Sheets add incident error:', error);
      console.error('Error details:', error?.response?.data?.error || error.message);
      return {
        success: false,
        error: error?.response?.data?.error?.message || 'Failed to add incident to sheet'
      };
    }
  }

  /**
   * Get all security incidents from the Google Sheet
   * @returns {Array} Array of security incidents
   */
  async getSecurityIncidents() {
    console.log('Fetching security incidents from public CSV URL...');
    try {
      const csvUrl = 'https://docs.google.com/spreadsheets/d/1P988HAfB1GGLmNqXv6cnA35EBbgvJSViQrE3EnU-Y9o/export?format=csv';
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV data: ${response.status} ${response.statusText}`);
      }
      const csvText = await response.text();

      // Parse CSV text
      const lines = csvText.trim().split('\n');
      if (lines.length <= 1) {
        console.log('No incident data found in CSV (only headers or empty)');
        return {
          success: true,
          data: []
        };
      }

      const headerRow = lines[0].split(',');
      console.log('Headers from CSV:', headerRow);

      const incidents = lines.slice(1).map(line => {
        const values = line.split(',');
        const incident = {};
        headerRow.forEach((header, index) => {
          incident[header.toLowerCase().replace(/\s+/g, '')] = values[index] || '';
        });
        return incident;
      });

      console.log(`Processed ${incidents.length} incidents from CSV:`, incidents);

      return {
        success: true,
        data: incidents
      };
    } catch (error) {
      console.error('CSV fetch get incidents error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch incidents from CSV'
      };
    }
  }

  /**
   * Update incident status in Google Sheet
   * @param {string} eventId - Event ID to update
   * @param {string} newStatus - New status
   * @param {string} actionTaken - Action taken
   * @returns {Object} Update response
   */
  async updateIncidentStatus(eventId, newStatus, actionTaken) {
    console.log(`Updating incident ${eventId} with status: ${newStatus}, action: ${actionTaken}`);
    try {
      // First, get all incidents to find the row
      console.log('Fetching all incidents to locate the target row...');
      const incidents = await this.getSecurityIncidents();
      
      if (!incidents?.success) {
        console.error('Failed to fetch incidents for update:', incidents.error);
        return incidents;
      }

      const incidentIndex = incidents?.data?.findIndex(
        incident => incident?.eventid === eventId
      );
      
      console.log(`Incident index for ${eventId}: ${incidentIndex}`);

      if (incidentIndex === -1) {
        console.error(`Incident with ID ${eventId} not found`);
        return {
          success: false,
          error: 'Incident not found'
        };
      }

      // Update the specific cells (row index + 2 to account for header and 0-based indexing)
      const rowNumber = incidentIndex + 2;
      console.log(`Updating row ${rowNumber} with new status and action`);
      
      const updateResponse = await axios?.put(
        `${this.baseUrl}/${this.spreadsheetId}/values/${this.sheetName}!G${rowNumber}:H${rowNumber}`,
        {
          values: [[newStatus, actionTaken]]
        },
        {
          params: {
            key: this.apiKey,
            valueInputOption: 'RAW'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Update response:', updateResponse?.data);

      return {
        success: true,
        data: updateResponse?.data
      };
    } catch (error) {
      console.error('Google Sheets update error:', error);
      console.error('Error details:', error?.response?.data?.error || error.message);
      return {
        success: false,
        error: error?.response?.data?.error?.message || 'Failed to update incident'
      };
    }
  }

  /**
   * Bulk add multiple incidents
   * @param {Array} incidents - Array of incident objects
   * @returns {Object} Bulk add response
   */
  async bulkAddIncidents(incidents) {
    console.log(`Bulk adding ${incidents?.length} incidents to Google Sheet`);
    try {
      const rows = incidents?.map(incident => {
        const timestamp = incident?.timestamp || new Date()?.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        const eventId = incident?.eventId || `INC-${new Date()?.toISOString()?.split('T')?.[0]?.replace(/-/g, '')}-${String(Math.floor(Math.random() * 1000))?.padStart(3, '0')}`;

        return [
          timestamp,
          eventId,
          incident?.severity || 'Medium',
          incident?.sourceIp || 'Unknown',
          incident?.destinationIp || 'Unknown',
          incident?.attackType || 'Unknown',
          incident?.status || 'Investigating',
          incident?.actionTaken || 'Alert Sent'
        ];
      });
      
      console.log('Prepared rows for bulk add:', rows);

      // Get current row count
      console.log('Getting current row count...');
      const rangeResponse = await axios?.get(
        `${this.baseUrl}/${this.spreadsheetId}/values/${this.sheetName}`,
        {
          params: {
            key: this.apiKey
          }
        }
      );

      const currentRows = rangeResponse?.data?.values?.length || 1;
      const startRow = currentRows + 1;
      const endRow = startRow + rows?.length - 1;
      
      console.log(`Adding incidents to rows ${startRow}-${endRow}`);

      const response = await axios?.put(
        `${this.baseUrl}/${this.spreadsheetId}/values/${this.sheetName}!A${startRow}:H${endRow}`,
        {
          values: rows
        },
        {
          params: {
            key: this.apiKey,
            valueInputOption: 'RAW'
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Bulk add response:', response?.data);

      return {
        success: true,
        data: {
          ...response?.data,
          addedCount: rows?.length
        }
      };
    } catch (error) {
      console.error('Google Sheets bulk add error:', error);
      console.error('Error details:', error?.response?.data?.error || error.message);
      return {
        success: false,
        error: error?.response?.data?.error?.message || 'Failed to bulk add incidents'
      };
    }
  }
}

export default new GoogleSheetsService();