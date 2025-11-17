import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';

const SECURITY_TOPICS = [
  'General Security',
  'Malware Investigation',
  'Phishing Analysis',
  'Network Anomaly',
  'Intrusion Detection',
  'Vulnerability Assessment',
  'Data Breach',
  'Access Control',
  'Incident Response',
  'Threat Intelligence'
];

const NewConversationModal = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('General Security');
  const [initialMessage, setInitialMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onCreate(title.trim(), topic, initialMessage.trim());
      setTitle('');
      setTopic('General Security');
      setInitialMessage('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Start New Investigation</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Investigation Title</label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter investigation title"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Security Topic</label>
            <Select
              value={topic}
              onChange={setTopic}
              options={SECURITY_TOPICS.map(t => ({ value: t, label: t }))}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Initial Message (Optional)</label>
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Enter initial message..."
              className="w-full p-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Investigation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConversationModal;
