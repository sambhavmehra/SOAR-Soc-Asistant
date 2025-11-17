import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const BulkActions = ({ selectedCount, onBulkAction, onClearSelection }) => {
  const [bulkActionType, setBulkActionType] = useState('');
  const [assignee, setAssignee] = useState('');
  const [showAssigneeSelect, setShowAssigneeSelect] = useState(false);

  const bulkActionOptions = [
    { value: '', label: 'Select Action' },
    { value: 'acknowledge', label: 'Acknowledge Selected' },
    { value: 'assign', label: 'Assign Selected' },
    { value: 'escalate', label: 'Escalate Selected' },
    { value: 'resolve', label: 'Mark as Resolved' },
    { value: 'close', label: 'Close Selected' },
    { value: 'export', label: 'Export Selected' }
  ];

  const assigneeOptions = [
    { value: '', label: 'Select Assignee' },
    { value: 'sarah-chen', label: 'Sarah Chen' },
    { value: 'mike-rodriguez', label: 'Mike Rodriguez' },
    { value: 'alex-kim', label: 'Alex Kim' },
    { value: 'emma-davis', label: 'Emma Davis' },
    { value: 'unassigned', label: 'Unassigned' }
  ];

  const handleActionChange = (action) => {
    setBulkActionType(action);
    if (action === 'assign') {
      setShowAssigneeSelect(true);
    } else {
      setShowAssigneeSelect(false);
      setAssignee('');
    }
  };

  const handleExecuteAction = () => {
    if (!bulkActionType) return;

    if (bulkActionType === 'assign' && !assignee) {
      alert('Please select an assignee');
      return;
    }

    onBulkAction(bulkActionType, assignee);
    setBulkActionType('');
    setAssignee('');
    setShowAssigneeSelect(false);
  };

  if (selectedCount === 0) return null;

  return (
    <div className="bg-card rounded-lg border border-border shadow-elevation-1 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Icon name="CheckSquare" size={20} className="text-accent" />
            <span className="font-medium text-foreground">
              {selectedCount} alert{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            iconName="X"
            iconSize={14}
          >
            Clear Selection
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Select
              options={bulkActionOptions}
              value={bulkActionType}
              onChange={handleActionChange}
              placeholder="Select Action"
              className="w-48"
            />

            {showAssigneeSelect && (
              <Select
                options={assigneeOptions}
                value={assignee}
                onChange={setAssignee}
                placeholder="Select Assignee"
                className="w-40"
              />
            )}

            <Button
              variant="default"
              size="sm"
              onClick={handleExecuteAction}
              disabled={!bulkActionType || (bulkActionType === 'assign' && !assignee)}
              iconName="Play"
              iconSize={14}
            >
              Execute
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction('acknowledge')}
          iconName="Check"
          iconSize={14}
        >
          Acknowledge All
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction('escalate')}
          iconName="AlertTriangle"
          iconSize={14}
        >
          Escalate All
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction('resolve')}
          iconName="CheckCircle"
          iconSize={14}
        >
          Resolve All
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction('export')}
          iconName="Download"
          iconSize={14}
        >
          Export Selected
        </Button>
      </div>
    </div>
  );
};

export default BulkActions;