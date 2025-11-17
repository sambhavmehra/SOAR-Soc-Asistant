import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const AdminDashboard = () => {
  const { user, role } = useSelector(state => state.auth);
  const navigate = useNavigate();

  if (!user || role !== 'admin') {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Security Incidents</h2>
            <p className="text-gray-600">Manage and monitor security incidents</p>
            <Button
              onClick={() => navigate('/alerts-dashboard')}
              className="mt-4"
            >
              View Incidents
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Reports</h2>
            <p className="text-gray-600">Generate and view security reports</p>
            <Button
              onClick={() => navigate('/reports-dashboard')}
              className="mt-4"
            >
              View Reports
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <p className="text-gray-600">Configure system settings</p>
            <Button
              onClick={() => navigate('/settings-dashboard')}
              className="mt-4"
            >
              Open Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
