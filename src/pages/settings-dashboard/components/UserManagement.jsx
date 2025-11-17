import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const UserManagement = () => {
  const [users, setUsers] = useState([
    {
      id: 'user-1',
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
      role: 'SOC Analyst',
      permissions: ['view_alerts', 'investigate_incidents', 'update_cases'],
      status: 'active',
      lastLogin: '2025-09-15T13:30:00Z',
      avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
      department: 'Security Operations'
    },
    {
      id: 'user-2',
      name: 'Michael Rodriguez',
      email: 'michael.rodriguez@company.com',
      role: 'Security Engineer',
      permissions: ['view_alerts', 'investigate_incidents', 'update_cases', 'manage_integrations', 'configure_rules'],
      status: 'active',
      lastLogin: '2025-09-15T14:15:00Z',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      department: 'Security Engineering'
    },
    {
      id: 'user-3',
      name: 'Emily Johnson',
      email: 'emily.johnson@company.com',
      role: 'SOC Manager',
      permissions: ['view_alerts', 'investigate_incidents', 'update_cases', 'manage_integrations', 'configure_rules', 'manage_users', 'view_reports'],
      status: 'active',
      lastLogin: '2025-09-15T12:45:00Z',
      avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
      department: 'Security Operations'
    },
    {
      id: 'user-4',
      name: 'David Kim',
      email: 'david.kim@company.com',
      role: 'Incident Responder',
      permissions: ['view_alerts', 'investigate_incidents', 'update_cases', 'isolate_endpoints'],
      status: 'inactive',
      lastLogin: '2025-09-13T16:20:00Z',
      avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
      department: 'Incident Response'
    }
  ]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isInviting, setIsInviting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const roles = [
    { value: 'SOC Analyst', label: 'SOC Analyst' },
    { value: 'Security Engineer', label: 'Security Engineer' },
    { value: 'SOC Manager', label: 'SOC Manager' },
    { value: 'Incident Responder', label: 'Incident Responder' },
    { value: 'Security Administrator', label: 'Security Administrator' },
    { value: 'Compliance Officer', label: 'Compliance Officer' }
  ];

  const departments = [
    { value: 'Security Operations', label: 'Security Operations' },
    { value: 'Security Engineering', label: 'Security Engineering' },
    { value: 'Incident Response', label: 'Incident Response' },
    { value: 'Compliance', label: 'Compliance' },
    { value: 'IT Operations', label: 'IT Operations' }
  ];

  const allPermissions = [
    { id: 'view_alerts', label: 'View Alerts', description: 'Access to security alerts and notifications' },
    { id: 'investigate_incidents', label: 'Investigate Incidents', description: 'Perform incident investigation and analysis' },
    { id: 'update_cases', label: 'Update Cases', description: 'Modify incident cases and add notes' },
    { id: 'manage_integrations', label: 'Manage Integrations', description: 'Configure security tool integrations' },
    { id: 'configure_rules', label: 'Configure Rules', description: 'Create and modify automation rules' },
    { id: 'manage_users', label: 'Manage Users', description: 'Add, edit, and remove user accounts' },
    { id: 'view_reports', label: 'View Reports', description: 'Access security reports and analytics' },
    { id: 'isolate_endpoints', label: 'Isolate Endpoints', description: 'Perform endpoint isolation actions' },
    { id: 'block_ips', label: 'Block IP Addresses', description: 'Block malicious IP addresses' },
    { id: 'system_admin', label: 'System Administration', description: 'Full system administration access' }
  ];

  const getRolePermissions = (role) => {
    const rolePermissionMap = {
      'SOC Analyst': ['view_alerts', 'investigate_incidents', 'update_cases'],
      'Security Engineer': ['view_alerts', 'investigate_incidents', 'update_cases', 'manage_integrations', 'configure_rules'],
      'SOC Manager': ['view_alerts', 'investigate_incidents', 'update_cases', 'manage_integrations', 'configure_rules', 'manage_users', 'view_reports'],
      'Incident Responder': ['view_alerts', 'investigate_incidents', 'update_cases', 'isolate_endpoints', 'block_ips'],
      'Security Administrator': ['view_alerts', 'investigate_incidents', 'update_cases', 'manage_integrations', 'configure_rules', 'manage_users', 'view_reports', 'system_admin'],
      'Compliance Officer': ['view_alerts', 'view_reports', 'update_cases']
    };
    return rolePermissionMap?.[role] || [];
  };

  const handleInviteUser = () => {
    setSelectedUser({
      id: `user-${Date.now()}`,
      name: '',
      email: '',
      role: 'SOC Analyst',
      permissions: getRolePermissions('SOC Analyst'),
      status: 'pending',
      lastLogin: null,
      avatar: '',
      department: 'Security Operations'
    });
    setIsInviting(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser({ ...user });
    setIsEditing(true);
  };

  const handleSaveUser = () => {
    if (selectedUser) {
      if (isInviting) {
        setUsers(prev => [...prev, { ...selectedUser, status: 'pending' }]);
      } else {
        setUsers(prev => prev?.map(user => 
          user?.id === selectedUser?.id ? selectedUser : user
        ));
      }
    }
    setIsInviting(false);
    setIsEditing(false);
    setSelectedUser(null);
  };

  const handleToggleUserStatus = (userId) => {
    setUsers(prev => prev?.map(user => 
      user?.id === userId 
        ? { ...user, status: user?.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
  };

  const formatLastLogin = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date?.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-success';
      case 'inactive': return 'text-muted-foreground';
      case 'pending': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'active': return 'bg-success/10';
      case 'inactive': return 'bg-muted/30';
      case 'pending': return 'bg-warning/10';
      default: return 'bg-muted/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">User Management</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage team members, roles, and permissions
          </p>
        </div>
        <Button 
          variant="default" 
          iconName="UserPlus" 
          iconPosition="left"
          onClick={handleInviteUser}
        >
          Invite User
        </Button>
      </div>
      {/* Users List */}
      <div className="space-y-4">
        {users?.map((user) => (
          <div key={user?.id} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user?.avatar} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="User" size={24} className="text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-foreground">{user?.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBgColor(user?.status)} ${getStatusColor(user?.status)} capitalize`}>
                      {user?.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                  
                  <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Icon name="Briefcase" size={14} />
                      <span>{user?.role}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Icon name="Building" size={14} />
                      <span>{user?.department}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Icon name="Clock" size={14} />
                      <span>Last login: {formatLastLogin(user?.lastLogin)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={user?.status === 'active' ? "outline" : "default"}
                  size="sm"
                  iconName={user?.status === 'active' ? "UserX" : "UserCheck"}
                  onClick={() => handleToggleUserStatus(user?.id)}
                >
                  {user?.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Edit"
                  onClick={() => handleEditUser(user)}
                >
                  Edit
                </Button>
              </div>
            </div>

            {/* Permissions */}
            <div className="mt-4 p-4 bg-muted/20 rounded border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Permissions ({user?.permissions?.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {user?.permissions?.map((permission) => {
                  const permissionInfo = allPermissions?.find(p => p?.id === permission);
                  return (
                    <span key={permission} className="px-2 py-1 text-xs bg-accent/10 text-accent rounded">
                      {permissionInfo?.label || permission}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* User Invite/Edit Modal */}
      {(isInviting || isEditing) && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {isInviting ? 'Invite New User' : 'Edit User'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                iconName="X"
                onClick={() => {
                  setIsInviting(false);
                  setIsEditing(false);
                  setSelectedUser(null);
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="Enter full name"
                  value={selectedUser?.name}
                  onChange={(e) => setSelectedUser(prev => ({
                    ...prev,
                    name: e?.target?.value
                  }))}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="user@company.com"
                  value={selectedUser?.email}
                  onChange={(e) => setSelectedUser(prev => ({
                    ...prev,
                    email: e?.target?.value
                  }))}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  label="Role"
                  options={roles}
                  value={selectedUser?.role}
                  onChange={(value) => setSelectedUser(prev => ({
                    ...prev,
                    role: value,
                    permissions: getRolePermissions(value)
                  }))}
                />
                <Select
                  label="Department"
                  options={departments}
                  value={selectedUser?.department}
                  onChange={(value) => setSelectedUser(prev => ({
                    ...prev,
                    department: value
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Permissions
                </label>
                <div className="grid md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {allPermissions?.map((permission) => (
                    <div key={permission?.id} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={permission?.id}
                        checked={selectedUser?.permissions?.includes(permission?.id)}
                        onChange={(e) => {
                          const checked = e?.target?.checked;
                          setSelectedUser(prev => ({
                            ...prev,
                            permissions: checked
                              ? [...prev?.permissions, permission?.id]
                              : prev?.permissions?.filter(p => p !== permission?.id)
                          }));
                        }}
                        className="mt-1 w-4 h-4 text-accent bg-input border-border rounded focus:ring-accent focus:ring-2"
                      />
                      <div className="flex-1">
                        <label htmlFor={permission?.id} className="text-sm font-medium text-foreground cursor-pointer">
                          {permission?.label}
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {permission?.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setIsInviting(false);
                  setIsEditing(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSaveUser}
                iconName={isInviting ? "Send" : "Save"}
                iconPosition="left"
                disabled={!selectedUser?.name || !selectedUser?.email}
              >
                {isInviting ? 'Send Invitation' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;