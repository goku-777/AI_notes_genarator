import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, LogOut, Settings, User as UserIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

interface TopbarProps {
  onOpenMobileSidebar: () => void;
}

export const Topbar = ({ onOpenMobileSidebar }: TopbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/history?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <header className="glass sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-[var(--color-silver-soft)] px-4 sm:px-6">
      <button
        onClick={onOpenMobileSidebar}
        className="rounded-full p-2 text-[var(--color-charcoal)] hover:bg-black/5 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-silver)]" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search meetings, notes, transcripts..."
          className="h-10 w-full rounded-full border border-[var(--color-silver-soft)] bg-white/70 pl-10 pr-4 text-sm placeholder:text-[var(--color-silver)] focus:border-[var(--color-accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          className="relative rounded-full p-2.5 text-[var(--color-charcoal)] transition-colors hover:bg-black/5"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((p) => !p)}
            className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 transition-colors hover:bg-black/5"
          >
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-charcoal)] text-xs font-semibold text-white">
                {initials}
              </div>
            )}
            <ChevronDown className="hidden h-4 w-4 text-[var(--color-silver)] sm:block" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="glass absolute right-0 mt-2 w-56 rounded-[var(--radius-lg)] bg-white/95 p-2 shadow-[var(--shadow-glass-lg)]"
              >
                <div className="border-b border-[var(--color-silver-soft)] px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-[var(--color-charcoal)]">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-[var(--color-silver)]">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-[var(--color-charcoal)] hover:bg-black/5"
                >
                  <UserIcon className="h-4 w-4" /> Profile
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-[var(--color-charcoal)] hover:bg-black/5"
                >
                  <Settings className="h-4 w-4" /> Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-[var(--color-danger)] hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
