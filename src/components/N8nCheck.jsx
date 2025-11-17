import React, { useState, useEffect } from 'react';
import { pingN8n } from '../services/n8n';

const N8nCheck = () => {
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    const checkN8n = async () => {
      try {
        const result = await pingN8n();
        setStatus(result.ok ? 'Connected' : 'Not connected');
      } catch (error) {
        setStatus(`Error: ${error.message}`);
      }
    };

    checkN8n();
  }, []);

  return (
    <div>
      <h2>N8n Connection Check</h2>
      <p>Status: {status}</p>
    </div>
  );
};

export default N8nCheck;
