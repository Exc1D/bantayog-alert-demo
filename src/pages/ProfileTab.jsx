import { useState, useEffect } from 'react';
import { useMapPanel } from '../contexts/MapPanelContext';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AvatarUpload from '../components/Profile/AvatarUpload';
import SettingsGroup from '../components/Profile/SettingsGroup';
import { compressImage } from '../utils/imageCompression';

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0
        ${value ? 'bg-resolved' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
          ${value ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

export default function ProfileTab() {
  const { setMapMode } = useMapPanel();
  useEffect(() => setMapMode('hidden'), [setMapMode]);

  const navigate = useNavigate();
  const { user, userProfile, signOut, isAdmin, updateProfilePicture } = useAuthContext();
  const { isDark, toggleTheme } = useTheme();
  const [uploading, setUploading] = useState(false);

  async function handleAvatarUpload(file) {
    if (uploading) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      await updateProfilePicture(compressed);
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-app-bg">
      <div className="flex flex-col gap-3 p-4">
        {/* User card */}
        <div className="bg-surface shadow-card rounded-xl p-4">
          <div className="flex items-center gap-4">
            <AvatarUpload
              name={userProfile?.displayName}
              photoUrl={userProfile?.photoURL}
              onUpload={handleAvatarUpload}
              uploading={uploading}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary truncate">
                {userProfile?.displayName ?? user?.email}
              </p>
              <p className="text-xs text-text-tertiary mt-0.5 truncate">{user?.email}</p>
              {userProfile?.role && (
                <span
                  className="inline-block mt-1.5 bg-urgent/10 border border-urgent/20
                                  px-2 py-0.5 rounded text-[10px] font-bold text-urgent capitalize"
                >
                  {userProfile.role}
                </span>
              )}
            </div>
            <span className="text-text-tertiary text-lg">›</span>
          </div>
        </div>

        {/* Admin shortcut — admins only */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="bg-shell rounded-xl p-4 flex items-center justify-between text-left"
          >
            <div>
              <p className="text-sm font-bold text-white">Admin dashboard</p>
              <p className="text-xs text-white/50 mt-0.5">Manage and dispatch reports</p>
            </div>
            <span className="bg-urgent text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              Open
            </span>
          </button>
        )}

        {/* Account */}
        <SettingsGroup
          items={[
            { label: 'Edit profile', href: '/profile/edit' },
            { label: 'Change password', href: '/profile/password' },
            { label: 'My reports', href: '/profile/reports' },
          ]}
        />

        {/* Preferences */}
        <SettingsGroup
          items={[
            { label: 'Notifications', rightLabel: 'Coming soon' },
            {
              label: 'Dark mode',
              rightElement: <Toggle value={isDark} onChange={toggleTheme} />,
            },
            {
              label: 'Language',
              rightLabel: 'English',
              href: '/profile/language',
            },
          ]}
        />

        {/* Legal */}
        <SettingsGroup
          items={[
            { label: 'Privacy settings', href: '/profile/privacy' },
            { label: 'About Bantayog Alert', href: '/profile/about' },
          ]}
        />

        {/* Danger zone */}
        <SettingsGroup
          items={[
            {
              label: 'Sign out',
              destructive: true,
              onPress: handleSignOut,
            },
            {
              label: 'Delete account',
              destructive: true,
              onPress: () => {
                if (window.confirm('Delete your account? This cannot be undone.')) {
                  // deleteAccount() — Phase 4 if needed
                }
              },
            },
          ]}
        />
      </div>
    </div>
  );
}
