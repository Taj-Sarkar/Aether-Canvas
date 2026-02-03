'use client';
import React, { useState, useEffect } from 'react';
import { Icons } from './ui/Icons';
import './SettingsModal.css';
import { getAuthHeaders } from '../services/authService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadApiKeyStatus();
    }
  }, [isOpen]);

  const loadApiKeyStatus = async () => {
    try {
      const response = await fetch('/api/settings/api-key', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.hasKey) {
        setHasExistingKey(true);
        setMaskedKey(data.maskedKey || '••••••••••••••••');
      } else {
        setHasExistingKey(false);
        setMaskedKey('');
      }
    } catch (error) {
      console.error('Failed to load API key status:', error);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() && !hasExistingKey) {
      setMessage({ type: 'error', text: 'Please enter an API key' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/api-key', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'API key saved successfully!' });
        setHasExistingKey(true);
        setMaskedKey(data.maskedKey);
        setApiKey('');
        setIsEditing(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save API key' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your API key? This will disable AI features.')) {
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/api-key', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'API key removed successfully' });
        setHasExistingKey(false);
        setMaskedKey('');
        setApiKey('');
        setIsEditing(false);
        
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to remove API key' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setApiKey('');
    setIsEditing(false);
    setMessage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <div className="settings-modal-title">
            <Icons.Settings size={24} />
            <h2>Settings</h2>
          </div>
          <button className="settings-close-btn" onClick={onClose}>
            <Icons.X size={20} />
          </button>
        </div>

        <div className="settings-modal-body">
          <div className="settings-section">
            <div className="settings-section-header">
              <h3>AI API Configuration</h3>
              <p className="settings-section-description">
                Manage your Gemini API key for AI-powered features
              </p>
            </div>

            <div className="api-key-container">
              <label className="settings-label">
                Gemini API Key
                <span className="settings-label-badge">Required for AI features</span>
              </label>

              {!isEditing && hasExistingKey ? (
                <div className="api-key-display">
                  <div className="masked-key">
                    <Icons.Lock size={16} />
                    <span>{maskedKey}</span>
                  </div>
                  <div className="api-key-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => setIsEditing(true)}
                    >
                      <Icons.Edit size={16} />
                      Update
                    </button>
                    <button 
                      className="btn-danger"
                      onClick={handleRemove}
                      disabled={isSaving}
                    >
                      <Icons.Trash size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="api-key-input-container">
                  <input
                    type="password"
                    className="settings-input"
                    placeholder="Enter your Gemini API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={isSaving}
                  />
                  <div className="api-key-actions">
                    <button 
                      className="btn-primary"
                      onClick={handleSave}
                      disabled={isSaving || !apiKey.trim()}
                    >
                      {isSaving ? (
                        <>
                          <div className="spinner" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Icons.Check size={16} />
                          Save
                        </>
                      )}
                    </button>
                    {hasExistingKey && (
                      <button 
                        className="btn-secondary"
                        onClick={handleCancel}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              {message && (
                <div className={`settings-message ${message.type}`}>
                  {message.type === 'success' ? (
                    <Icons.Check size={16} />
                  ) : (
                    <Icons.AlertCircle size={16} />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <div className="settings-disclaimer">
                <Icons.AlertTriangle size={16} />
                <div>
                  <strong>Security Notice:</strong>
                  <p>
                    Your API key is encrypted and stored securely on the server. 
                    It is never exposed to the client or logged. 
                    You can obtain a free API key from{' '}
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Google AI Studio
                    </a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
