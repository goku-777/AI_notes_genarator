import { useState } from 'react';
import { Bell, Moon, Sun, Globe } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
}

const Toggle = ({ checked, onChange }: ToggleProps) => (
  <button
    onClick={onChange}
    className={cn(
      'relative h-6 w-11 rounded-full transition-colors',
      checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-silver-soft)]'
    )}
  >
    <span
      className={cn(
        'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
        checked ? 'translate-x-5.5' : 'translate-x-0.5'
      )}
    />
  </button>
);

const SettingsPage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoTranscribe, setAutoTranscribe] = useState(true);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-silver)]">
          Customize your AI Notes Generator experience.
        </p>
      </div>

      <Card>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose how AI Notes Generator looks to you.</CardDescription>
        <div className="mt-5 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-silver-soft)] p-4">
          <div className="flex items-center gap-3">
            {isDarkMode ? <Moon className="h-4.5 w-4.5 text-[var(--color-charcoal)]" /> : <Sun className="h-4.5 w-4.5 text-[var(--color-charcoal)]" />}
            <div>
              <p className="text-sm font-semibold text-[var(--color-charcoal)]">Dark mode</p>
              <p className="text-xs text-[var(--color-silver)]">
                {isDarkMode ? 'Currently enabled' : 'Coming soon — currently in preview'}
              </p>
            </div>
          </div>
          <Toggle checked={isDarkMode} onChange={() => setIsDarkMode((p) => !p)} />
        </div>
      </Card>

      <Card>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage how you receive updates.</CardDescription>
        <div className="mt-5 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-silver-soft)] p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-4.5 w-4.5 text-[var(--color-charcoal)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-charcoal)]">Email notifications</p>
              <p className="text-xs text-[var(--color-silver)]">Get notified when summaries are ready</p>
            </div>
          </div>
          <Toggle checked={emailNotifications} onChange={() => setEmailNotifications((p) => !p)} />
        </div>
      </Card>

      <Card>
        <CardTitle>AI Preferences</CardTitle>
        <CardDescription>Control how AI processes your recordings.</CardDescription>
        <div className="mt-5 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-silver-soft)] p-4">
          <div className="flex items-center gap-3">
            <Globe className="h-4.5 w-4.5 text-[var(--color-charcoal)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-charcoal)]">Auto-transcribe uploads</p>
              <p className="text-xs text-[var(--color-silver)]">Automatically generate transcripts after upload</p>
            </div>
          </div>
          <Toggle checked={autoTranscribe} onChange={() => setAutoTranscribe((p) => !p)} />
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
