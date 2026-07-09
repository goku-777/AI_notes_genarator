import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload,
  Mic,
  FileText,
  Sparkles as SparklesIcon,
  ListChecks,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useMeetings } from '@/hooks/useMeetings';
import { Card, CardSkeleton } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MeetingCard } from '@/components/dashboard/MeetingCard';

const statCards = [
  { key: 'totalMeetings', label: 'Total Meetings', icon: Calendar, color: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' },
  { key: 'totalNotes', label: 'Total Notes', icon: FileText, color: 'bg-amber-50 text-[var(--color-warning)]' },
  { key: 'totalSummaries', label: 'AI Summaries', icon: SparklesIcon, color: 'bg-violet-50 text-violet-600' },
  { key: 'pendingActionItems', label: 'Pending Action Items', icon: ListChecks, color: 'bg-green-50 text-[var(--color-success)]' },
] as const;

const DashboardPage = () => {
  const { user } = useAuth();
  const { stats, isLoading: statsLoading } = useDashboardStats();
  const { meetings, isLoading: meetingsLoading } = useMeetings({ limit: 6, sortBy: 'createdAt', order: 'desc' });

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)] sm:text-3xl">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-[var(--color-silver)]">
            Here's what's happening with your meetings.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/upload">
            <Button variant="outline" leftIcon={<Upload className="h-4 w-4" />}>
              Upload
            </Button>
          </Link>
          <Link to="/record">
            <Button leftIcon={<Mic className="h-4 w-4" />}>Record</Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {statsLoading ? (
              <CardSkeleton />
            ) : (
              <Card className="p-5">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-[var(--color-charcoal)]">
                  {stats?.[stat.key] ?? 0}
                </p>
                <p className="mt-1 text-xs text-[var(--color-silver)]">{stat.label}</p>
              </Card>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent meetings */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-charcoal)]">Recent Meetings</h2>
          <Link
            to="/history"
            className="flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)] hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {meetingsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <Card className="flex flex-col items-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
              <Calendar className="h-6 w-6 text-[var(--color-accent)]" />
            </div>
            <h3 className="font-bold text-[var(--color-charcoal)]">No meetings yet</h3>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-silver)]">
              Upload a recording or start a live recording to generate your first AI-powered notes.
            </p>
            <div className="mt-5 flex gap-3">
              <Link to="/upload">
                <Button variant="outline" size="sm">Upload Recording</Button>
              </Link>
              <Link to="/record">
                <Button size="sm">Start Recording</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meetings.map((meeting) => (
              <MeetingCard key={meeting._id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
