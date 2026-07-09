import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Upload,
  Mic,
  History,
  User as UserIcon,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload Recording', icon: Upload },
  { to: '/record', label: 'Live Recording', icon: Mic },
  { to: '/history', label: 'Meeting History', icon: History },
  { to: '/profile', label: 'Profile', icon: UserIcon },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar = ({ isMobileOpen, onCloseMobile }: SidebarProps) => {
  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-6 py-7">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-charcoal)]">
          <Sparkles className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-[var(--color-charcoal)]">
          AI Notes
        </span>
        <button
          onClick={onCloseMobile}
          className="ml-auto rounded-full p-1.5 text-[var(--color-silver)] hover:bg-black/5 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[var(--color-charcoal)] text-white shadow-[var(--shadow-glass-sm)]'
                  : 'text-[var(--color-graphite)] hover:bg-black/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-[var(--radius-md)] bg-[var(--color-charcoal)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="m-4 rounded-[var(--radius-lg)] bg-[var(--color-accent-soft)] p-4">
        <p className="text-xs font-semibold text-[var(--color-accent-strong)]">Free Plan</p>
        <p className="mt-1 text-xs text-[var(--color-graphite)]">
          Unlimited meetings & AI summaries, on us.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="glass hidden h-screen w-72 shrink-0 border-r border-[var(--color-silver-soft)] lg:sticky lg:top-0 lg:block">
        {content}
      </aside>

      {/* Mobile sidebar (slide-in) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
            className="glass relative z-50 h-full w-72 bg-white/95"
          >
            {content}
          </motion.aside>
        </div>
      )}
    </>
  );
};
