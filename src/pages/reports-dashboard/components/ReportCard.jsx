import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReportCard = ({ report, onGenerate, onPreview, onDownload }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'generating': return 'text-warning';
      case 'failed': return 'text-error';
      case 'scheduled': return 'text-accent';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'CheckCircle';
      case 'generating': return 'Clock';
      case 'failed': return 'XCircle';
      case 'scheduled': return 'Calendar';
      default: return 'FileText';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-elevation-2 transition-hover">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name={report?.icon} size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{report?.title}</h3>
            <p className="text-sm text-muted-foreground">{report?.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Icon 
            name={getStatusIcon(report?.status)} 
            size={16} 
            className={getStatusColor(report?.status)} 
          />
          <span className={`text-xs font-medium ${getStatusColor(report?.status)}`}>
            {report?.status?.charAt(0)?.toUpperCase() + report?.status?.slice(1)}
          </span>
        </div>
      </div>
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last Generated:</span>
          <span className="text-foreground">{report?.lastGenerated}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Size:</span>
          <span className="text-foreground">{report?.size}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Format:</span>
          <span className="text-foreground">{report?.format}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {report?.status === 'completed' && (
          <>
            <Button
              variant="outline"
              size="sm"
              iconName="Eye"
              iconPosition="left"
              onClick={() => onPreview(report)}
            >
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Download"
              iconPosition="left"
              onClick={() => onDownload(report)}
            >
              Download
            </Button>
          </>
        )}
        {report?.status !== 'generating' && (
          <Button
            variant="default"
            size="sm"
            iconName="Play"
            iconPosition="left"
            onClick={() => onGenerate(report)}
          >
            Generate
          </Button>
        )}
        {report?.status === 'generating' && (
          <Button
            variant="ghost"
            size="sm"
            disabled
            iconName="Loader2"
            iconPosition="left"
          >
            Generating...
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReportCard;