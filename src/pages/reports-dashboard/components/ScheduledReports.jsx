import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ScheduleReportModal from './ScheduleReportModal';
import backendService from '../../../services/backend';

const ScheduledReports = () => {
  const [scheduledReports, setScheduledReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    fetchScheduledTasks();
  }, []);

  const fetchScheduledTasks = async () => {
    try {
      setLoading(true);
      const response = await backendService.getScheduledTasks();
      if (response.success) {
        setScheduledReports(response.tasks || []);
      } else {
        setError('Failed to load scheduled tasks');
      }
    } catch (err) {
      console.error('Error fetching scheduled tasks:', err);
      setError('Failed to load scheduled tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (taskId) => {
    try {
      const task = scheduledReports.find(t => t.id === taskId);
      if (!task) return;

      let result;
      if (task.status === 'active') {
        result = await backendService.pauseScheduledTask(taskId);
      } else {
        result = await backendService.resumeScheduledTask(taskId);
      }

      if (result.success) {
        // Refresh the tasks list
        await fetchScheduledTasks();
      } else {
        console.error('Failed to update task status:', result.error);
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this scheduled task?')) {
      return;
    }

    try {
      const result = await backendService.deleteScheduledTask(taskId);
      if (result.success) {
        // Refresh the tasks list
        await fetchScheduledTasks();
      } else {
        console.error('Failed to delete task:', result.error);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-success';
      case 'paused': return 'text-warning';
      case 'error': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return 'Play';
      case 'paused': return 'Pause';
      case 'error': return 'AlertCircle';
      default: return 'Clock';
    }
  };

  const handleAddSchedule = () => {
    setShowScheduleModal(true);
  };

  const handleScheduleCreated = (newTask) => {
    // Refresh the scheduled tasks list
    fetchScheduledTasks();
  };

  const handleEdit = (id) => {
    alert(`Edit functionality for task ${id} will be implemented`);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <span className="ml-2">Loading scheduled tasks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-center text-error">
          <Icon name="AlertCircle" size={48} className="mx-auto mb-4" />
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={fetchScheduledTasks}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <Icon name="Calendar" size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Scheduled Reports</h2>
              <p className="text-sm text-muted-foreground">Automated report generation and delivery</p>
            </div>
          </div>
          <Button
            variant="default"
            iconName="Plus"
            iconPosition="left"
            onClick={handleAddSchedule}
          >
            Add Schedule
          </Button>
        </div>
      <div className="divide-y divide-border">
        {scheduledReports.length === 0 ? (
          <div className="p-6 text-center">
            <Icon name="Calendar" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No scheduled tasks</h3>
            <p className="text-muted-foreground mb-4">
              Create automated reports and investigations to run on a schedule
            </p>
            <Button
              variant="outline"
              iconName="Plus"
              iconPosition="left"
              onClick={handleAddSchedule}
            >
              Create First Schedule
            </Button>
          </div>
        ) : (
          scheduledReports.map((task) => (
            <div key={task.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-foreground">{task.name}</h3>
                    <div className="flex items-center space-x-1">
                      <Icon
                        name={getStatusIcon(task.status)}
                        size={14}
                        className={getStatusColor(task.status)}
                      />
                      <span className={`text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status?.charAt(0)?.toUpperCase() + task.status?.slice(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{task.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="text-foreground font-medium capitalize">{task.type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Schedule:</span>
                      <p className="text-foreground font-medium">
                        {task.schedule?.type === 'cron' ?
                          `Cron: ${task.schedule?.expression}` :
                          task.schedule?.type || 'Not set'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Run:</span>
                      <p className="text-foreground font-medium">
                        {task.last_run ? new Date(task.last_run).toLocaleString() : 'Never'}
                      </p>
                    </div>
                  </div>

                  {task.last_result && (
                    <div className="mt-3">
                      <span className="text-sm text-muted-foreground">Last Result:</span>
                      <p className={`text-sm mt-1 ${task.last_result.success ? 'text-success' : 'text-error'}`}>
                        {task.last_result.message}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    iconName="Edit3"
                    iconSize={16}
                    onClick={() => handleEdit(task.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    iconName={task.status === 'active' ? 'Pause' : 'Play'}
                    iconSize={16}
                    onClick={() => handleToggleStatus(task.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    iconName="Trash2"
                    iconSize={16}
                    className="text-error hover:text-error"
                    onClick={() => handleDelete(task.id)}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    <ScheduleReportModal
      isOpen={showScheduleModal}
      onClose={() => setShowScheduleModal(false)}
      onScheduleCreated={handleScheduleCreated}
    />
    </>
  );
};

export default ScheduledReports;
