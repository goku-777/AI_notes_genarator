import { useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Lock, User as UserIcon, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/userService';
import { getErrorMessage } from '@/services/apiClient';
import { tokenStorage } from '@/services/apiClient';

const ProfilePage = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const { data } = await userService.updateProfile({ name });
      setUser(data.data!.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPicture(true);
    try {
      const { data } = await userService.updateProfilePicture(file);
      setUser(data.data!.user);
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setIsSavingPassword(true);
    try {
      await userService.updatePassword({ currentPassword, newPassword });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userService.deleteAccount();
      tokenStorage.clear();
      toast.success('Account deleted');
      navigate('/');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setIsDeleting(false);
    }
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">Profile</h1>
        <p className="mt-1 text-sm text-[var(--color-silver)]">
          Manage your personal information and account settings.
        </p>
      </div>

      {/* Profile picture */}
      <Card>
        <div className="flex items-center gap-5">
          <div className="relative">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-charcoal)] text-xl font-bold text-white">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPicture}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-[var(--shadow-glow-accent)]"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePictureChange}
            />
          </div>
          <div>
            <p className="font-bold text-[var(--color-charcoal)]">{user?.name}</p>
            <p className="text-sm text-[var(--color-silver)]">{user?.email}</p>
          </div>
        </div>
      </Card>

      {/* Update name */}
      <Card>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your display name.</CardDescription>
        <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
          <Input label="Full name" leftIcon={<UserIcon className="h-4 w-4" />} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" value={user?.email || ''} disabled className="opacity-60" />
          <Button type="submit" isLoading={isSavingProfile}>Save changes</Button>
        </form>
      </Card>

      {/* Update password */}
      <Card>
        <CardTitle>Password</CardTitle>
        <CardDescription>Update your account password.</CardDescription>
        <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
          <Input
            type="password"
            label="Current password"
            leftIcon={<Lock className="h-4 w-4" />}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            label="New password"
            leftIcon={<Lock className="h-4 w-4" />}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Button type="submit" isLoading={isSavingPassword}>Update password</Button>
        </form>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-100">
        <CardTitle className="text-[var(--color-danger)]">Danger Zone</CardTitle>
        <CardDescription>Permanently delete your account and all associated data.</CardDescription>
        <Button
          variant="danger"
          className="mt-5"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={() => setIsDeleteOpen(true)}
        >
          Delete account
        </Button>
      </Card>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete your account?"
        description="This action is permanent and cannot be undone. All your meetings, notes, and data will be lost."
        confirmLabel="Delete account"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProfilePage;
