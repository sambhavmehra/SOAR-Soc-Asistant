import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateEmail, updatePassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { setLoading, setError, logout } from '../store/slices/authSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Icon from '../components/AppIcon';
import Header from '../components/ui/Header';
import Sidebar from '../components/ui/Sidebar';

const Profile = () => {
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role, loading, error } = useSelector(state => state.auth);

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      await updateEmail(auth.currentUser, newEmail);
      alert('Email updated successfully');
      setNewEmail('');
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      await updatePassword(auth.currentUser, newPassword);
      alert('Password updated successfully');
      setNewPassword('');
      setCurrentPassword('');
    } catch (error) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      dispatch(setError(error.message));
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const getUserInitials = (email) => {
    if (!email) return 'U';
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (userRole) => {
    switch (userRole) {
      case 'admin': return 'bg-error text-error-foreground';
      case 'analyst': return 'bg-accent text-accent-foreground';
      case 'operator': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMenuOpen={isSidebarOpen}
      />
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className={`pt-16 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        <div className="p-6">
          <div className="max-w-2xl mx-auto bg-card rounded-lg border border-border shadow-elevation-2 p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-2xl mx-auto mb-4">
            {getUserInitials(user.email)}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Security Profile</h1>
          <p className="text-muted-foreground">Manage your security operations account</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-muted/30 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Icon name="Mail" size={20} className="text-accent" />
              <h3 className="text-lg font-semibold text-foreground">Account Information</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <p className="text-foreground font-medium">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Security Role</label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRoleBadgeColor(role)}`}>
                    {role?.toUpperCase() || 'Admin'}
                  </span>
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" title="Active Status" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                <p className="text-success font-medium flex items-center space-x-2">
                  <Icon name="CheckCircle" size={16} />
                  <span>Active & Verified</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Icon name="Shield" size={20} className="text-accent" />
              <h3 className="text-lg font-semibold text-foreground">Security Clearance</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Clearance Level</label>
                <p className="text-foreground font-medium">
                  {role === 'admin' ? 'Level 5 - Full Access' :
                   role === 'analyst' ? 'Level 3 - Analysis Access' :
                   role === 'operator' ? 'Level 2 - Operations Access' :
                   'Level 1 - Basic Access'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                <p className="text-foreground font-medium">
                  {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Session Status</label>
                <p className="text-success font-medium flex items-center space-x-2">
                  <Icon name="Lock" size={16} />
                  <span>Secure Session Active</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleUpdateEmail}>
            <h3 className="text-lg font-medium mb-2">Update Email</h3>
            <Input
              type="email"
              placeholder="New Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading} className="mt-2 w-full">
              Update Email
            </Button>
          </form>

          <form onSubmit={handleUpdatePassword}>
            <h3 className="text-lg font-medium mb-2">Update Password</h3>
            <Input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="mt-2"
            />
            <Button type="submit" disabled={loading} className="mt-2 w-full">
              Update Password
            </Button>
          </form>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <Button onClick={handleLogout} variant="destructive" className="w-full">
            Logout
          </Button>
        </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
