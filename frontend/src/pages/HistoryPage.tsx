import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Trash2, RotateCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMeetings } from '@/hooks/useMeetings';
import { Card, CardSkeleton } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MeetingCard } from '@/components/dashboard/MeetingCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { meetingService } from '@/services/meetingService';
import { getErrorMessage } from '@/services/apiClient';
import type { MeetingStatus } from '@/types';

const statusOptions: { value: MeetingStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'processing', label: 'Processing' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const HistoryPage = () => {
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [showTrash, setShowTrash] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { meetings, isLoading, params, setParams, refetch } = useMeetings({
    search: searchParams.get('search') || undefined,
    sortBy: 'createdAt',
    order: 'desc',
    limit: 50,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((p) => ({ ...p, search: searchInput || undefined }));
  };

  const handleStatusChange = (status: string) => {
    setParams((p) => ({ ...p, status: (status || undefined) as MeetingStatus | undefined }));
  };

  const handleSortChange = (value: string) => {
    const [sortBy, order] = value.split(':');
    setParams((p) => ({ ...p, sortBy, order: order as 'asc' | 'desc' }));
  };

  const toggleTrashView = () => {
    setShowTrash((prev) => {
      const next = !prev;
      setParams((p) => ({ ...p, includeDeleted: next }));
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await meetingService.delete(deleteTarget);
      toast.success('Meeting moved to trash');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await meetingService.restore(id);
      toast.success('Meeting restored');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const visibleMeetings = showTrash ? meetings.filter((m) => m.isDeleted) : meetings.filter((m) => !m.isDeleted);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">Meeting History</h1>
          <p className="mt-1 text-sm text-[var(--color-silver)]">
            {showTrash ? 'Deleted meetings — restore or permanently remove them.' : 'Browse, search, and manage all your meetings.'}
          </p>
        </div>
        <Button
          variant={showTrash ? 'dark' : 'outline'}
          size="sm"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={toggleTrashView}
        >
          {showTrash ? 'Back to meetings' : 'View trash'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-silver)]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, transcript, or summary..."
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-silver-soft)] bg-white/70 pl-10 pr-9 text-sm placeholder:text-[var(--color-silver)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setParams((p) => ({ ...p, search: undefined }));
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-silver)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-[var(--color-silver)]" />
          <select
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-10 rounded-[var(--radius-md)] border border-[var(--color-silver-soft)] bg-white/70 px-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            onChange={(e) => handleSortChange(e.target.value)}
            defaultValue="createdAt:desc"
            className="h-10 rounded-[var(--radius-md)] border border-[var(--color-silver-soft)] bg-white/70 px-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="title:asc">Title A-Z</option>
            <option value="title:desc">Title Z-A</option>
          </select>
        </div>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : visibleMeetings.length === 0 ? (
        <Card className="py-14 text-center text-sm text-[var(--color-silver)]">
          {showTrash ? 'Trash is empty.' : 'No meetings found matching your filters.'}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleMeetings.map((meeting) =>
            showTrash ? (
              <div key={meeting._id} className="glass-card p-5">
                <h3 className="line-clamp-1 font-bold text-[var(--color-charcoal)]">{meeting.title}</h3>
                <p className="mt-1 text-xs text-[var(--color-silver)]">
                  Deleted {meeting.deletedAt ? new Date(meeting.deletedAt).toLocaleDateString() : ''}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                  onClick={() => handleRestore(meeting._id)}
                >
                  Restore
                </Button>
              </div>
            ) : (
              <MeetingCard
                key={meeting._id}
                meeting={meeting}
                onMenuClick={(e) => {
                  e.preventDefault();
                  setDeleteTarget(meeting._id);
                }}
              />
            )
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Move to trash?"
        description="This meeting will be moved to trash. You can restore it later from the trash view."
        confirmLabel="Move to trash"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default HistoryPage;
