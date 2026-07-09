import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, FileText, MoreVertical } from 'lucide-react';
import type { Meeting } from '@/types';
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge';
import { format } from 'date-fns';

interface MeetingCardProps {
  meeting: Meeting;
  onMenuClick?: (e: React.MouseEvent) => void;
}

export const MeetingCard = ({ meeting, onMenuClick }: MeetingCardProps) => {
  return (
    <motion.div whileHover={{ y: -2 }} className="glass-card group relative p-5">
      <Link to={`/meetings/${meeting._id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)]">
            <FileText className="h-5 w-5 text-[var(--color-accent)]" />
          </div>
          <Badge variant={statusToBadgeVariant[meeting.status]}>{meeting.status}</Badge>
        </div>

        <h3 className="mt-4 line-clamp-1 font-bold text-[var(--color-charcoal)]">
          {meeting.title}
        </h3>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-silver)]">
          <Calendar className="h-3.5 w-3.5" />
          {format(new Date(meeting.date), 'MMM d, yyyy')}
        </div>

        {meeting.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {meeting.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-[var(--color-graphite)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>

      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="absolute right-3 top-3 rounded-full p-1.5 text-[var(--color-silver)] opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
};
