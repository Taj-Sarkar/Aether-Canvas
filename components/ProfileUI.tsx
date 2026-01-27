import React from 'react';
import { Icons } from './ui/Icons';
import './ProfileStyles.css';

export interface ProfileViewProps {
  onClose: () => void;
  onSave: () => void;
  name: string;
  bio: string;
  banner: string;
  email: string;
  isEditingBanner: boolean;
  setName: (val: string) => void;
  setBio: (val: string) => void;
  setBanner: (val: string) => void;
  toggleBannerEdit: () => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  bannerPresets: string[];
}

export const ProfileUI: React.FC<ProfileViewProps> = ({
  onClose,
  onSave,
  name,
  bio,
  banner,
  email,
  isEditingBanner,
  setName,
  setBio,
  setBanner,
  toggleBannerEdit,
  onBannerUpload,
  bannerPresets
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Fixed Header / Close */}
        <div className="profile-top-actions">
           <button className="icon-btn-glass" onClick={onClose}>
              <Icons.X size={20} />
           </button>
        </div>

        <div className="profile-scroll-area">
            {/* Banner Section */}
            <div className="banner-wrapper">
                <div 
                    className="banner-image" 
                    style={{ backgroundImage: banner }}
                ></div>
                <div className="banner-overlay"></div>
                
                <button className={`banner-toggle-btn ${isEditingBanner ? 'active' : ''}`} onClick={toggleBannerEdit}>
                    <Icons.Image size={16} />
                    <span>{isEditingBanner ? 'Done Editing' : 'Edit Cover'}</span>
                </button>
            </div>

            {/* Banner Picker (Collapsible) */}
            <div className={`banner-picker-section ${isEditingBanner ? 'open' : ''}`}>
                <div className="picker-grid">
                    <label className="picker-item upload">
                        <input type="file" accept="image/*" onChange={onBannerUpload} />
                        <Icons.Upload size={20} />
                        <span>Upload</span>
                    </label>
                    {bannerPresets.map((b, i) => (
                        <div 
                            key={i} 
                            className={`picker-item ${banner === b ? 'selected' : ''}`}
                            style={{ background: b }}
                            onClick={() => setBanner(b)}
                        />
                    ))}
                </div>
            </div>

            {/* Main Content Info */}
            <div className="profile-body">
                <div className="avatar-section">
                    <div className="avatar-ring">
                        <div className="avatar-xl">
                            {name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>

                <div className="form-grid">
                    {/* Name Input */}
                    <div className="input-group full-width">
                        <label>Display Name</label>
                        <div className="profile-input-wrapper">
                            <Icons.User size={18} className="input-icon" />
                            <input 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>

                    {/* Email Input (Read Only) */}
                    <div className="input-group full-width">
                        <label>Email Address</label>
                        <div className="profile-input-wrapper disabled">
                            <Icons.Mail size={18} className="input-icon" />
                            <input value={email} disabled />
                            <span className="badge">Private</span>
                        </div>
                    </div>

                    {/* Bio Input */}
                    <div className="input-group full-width">
                        <label>Bio / About</label>
                        <div className="profile-input-wrapper textarea-wrapper">
                            <Icons.FileText size={18} className="input-icon top" />
                            <textarea 
                                value={bio} 
                                onChange={e => setBio(e.target.value)} 
                                placeholder="Write a short bio..."
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Bottom Padding for scroll */}
            <div style={{ height: '100px' }}></div>
        </div>

        {/* Fixed Footer */}
        <div className="profile-footer">
            <button className="btn-text" onClick={onClose}>Discard</button>
            <button className="btn-primary-glow" onClick={onSave}>
                <Icons.Check size={16} />
                Save Changes
            </button>
        </div>

      </div>
    </div>
  );
};