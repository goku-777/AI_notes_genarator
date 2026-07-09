import { useState } from 'react';
import { Check, Trash2, Calendar, User } from 'lucide-react';
import type { ActionItem, ActionItemStatus } from '@/types';
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge';
import { actionItemService } from '@/services/actionItemService';
import { getErrorMessage } from '@/services/apiClient';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActionItemCardProps {
  item: ActionItem;
  onUpdated: (item: ActionItem) => void;
  onDeleted: (id: string) => void;
}

export const ActionItemCard = ({ item, onUpdated, onDeleted }: ActionItemCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleComplete = async () => {
    const nextStatus: ActionItemStatus = item.status === 'completed' ? 'pending' : 'completed';
    setIsUpdating(true);
    try {
      const { data } = await actionItemService.update(item._id, { status: nextStatus });
      onUpdated(data.data!.actionItem);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await actionItemService.delete(item._id);
      onDeleted(item._id);
      toast.success('Action item deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const isCompleted = item.status === 'completed';

  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-silver-soft)] bg-white/60 p-4 transition-colors hover:bg-white">
      <button
        onClick={toggleComplete}
        disabled={isUpdating}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          isCompleted
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
            : 'border-[var(--color-silver-soft)] hover:border-[var(--color-accent)]'
        )}
      >
        {isCompleted && <Check className="h-3 w-3" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium text-[var(--color-charcoal)]', isCompleted && 'text-[var(--color-silver)] line-through')}>
          {item.task}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant={statusToBadgeVariant[item.priority]}>{item.priority}</Badge>
          {item.assignee && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-silver)]">
              <User className="h-3 w-3" /> {item.assignee}
            </span>
          )}
          {item.deadline && (
            <span className="flex items-center gap-1 text-xs text-[var(--color-silver)]">
              <Calendar className="h-3 w-3" /> {format(new Date(item.deadline), 'MMM d')}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={handleDelete}
        className="shrink-0 rounded-full p-1.5 text-[var(--color-silver)] hover:bg-red-50 hover:text-[var(--color-danger)]"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};
