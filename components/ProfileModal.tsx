import React, { useState, useEffect } from 'react';
import { ProfileUI } from './ProfileUI';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string; banner?: string; bio?: string };
  onUpdateUser: (data: { name: string; bio: string; banner: string }) => void;
}

const BANNER_PRESETS = [
    'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
    'linear-gradient(135deg, #0cebeb, #20e3b2, #29ffc6)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'url(https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1000&q=80)',
    'url(https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1000&q=80)',
    'url(https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=1000&q=80)'
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdateUser }) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [banner, setBanner] = useState(user.banner || BANNER_PRESETS[0]);
  const [isEditingBanner, setIsEditingBanner] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setName(user.name);
        setBio(user.bio || '');
        setBanner(user.banner || BANNER_PRESETS[0]);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateUser({ name, bio, banner });
    onClose();
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setBanner(`url(${ev.target?.result})`);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <ProfileUI
      onClose={onClose}
      onSave={handleSave}
      
      name={name}
      bio={bio}
      banner={banner}
      email={user.email}
      
      isEditingBanner={isEditingBanner}
      
      setName={setName}
      setBio={setBio}
      setBanner={setBanner}
      toggleBannerEdit={() => setIsEditingBanner(!isEditingBanner)}
      onBannerUpload={handleBannerUpload}
      
      bannerPresets={BANNER_PRESETS}
    />
  );
};
