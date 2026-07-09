import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, Calendar, AlertCircle } from 'lucide-react';
import { notesService } from '@/services/notesService';
import type { Meeting, Notes } from '@/types';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { getErrorMessage } from '@/services/apiClient';

const SharedNotesPage = () => {
  const { token } = useParams<{ token: string }>();
  const [notes, setNotes] = useState<Notes | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    notesService
      .getShared(token)
      .then(({ data }) => {
        setNotes(data.data!.notes);
        setMeeting(data.data!.meeting);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [token]);

  if (isLoading) return <FullPageSpinner />;

  if (error || !notes || !meeting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-surface-soft)] p-6 text-center">
        <AlertCircle className="mb-4 h-10 w-10 text-[var(--color-danger)]" />
        <h1 className="text-xl font-bold text-[var(--color-charcoal)]">Note not found</h1>
        <p className="mt-2 text-sm text-[var(--color-silver)]">
          This shared link is invalid or has been revoked.
        </p>
        <Link to="/" className="mt-6 text-sm font-semibold text-[var(--color-accent)] hover:underline">
          Go to AI Notes Generator
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-soft)] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-charcoal)]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-[var(--color-charcoal)]">AI Notes Generator</span>
        </Link>

        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">{meeting.title}</h1>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-silver)]">
            <Calendar className="h-4 w-4" />
            {new Date(meeting.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <div className="mt-6 whitespace-pre-line border-t border-[var(--color-silver-soft)] pt-6 text-sm leading-relaxed text-[var(--color-graphite)]">
            {notes.noteContent}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-silver)]">
          Shared via{' '}
          <Link to="/" className="font-semibold text-[var(--color-accent)] hover:underline">
            AI Notes Generator
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SharedNotesPage;
