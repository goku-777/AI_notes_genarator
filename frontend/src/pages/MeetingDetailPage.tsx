import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  FileText,
  ListChecks,
  StickyNote,
  Download,
  Share2,
  Loader2,
  Wand2,
  Save,
  Edit3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useMeetingDetail } from '@/hooks/useMeetingDetail';
import { Card, CardSkeleton } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusToBadgeVariant } from '@/components/ui/Badge';
import { AudioPlayer } from '@/components/recording/AudioPlayer';
import { ActionItemCard } from '@/components/notes/ActionItemCard';
import { ExportModal } from '@/components/notes/ExportModal';
import { ShareModal } from '@/components/notes/ShareModal';
import { transcriptService } from '@/services/transcriptService';
import { summaryService } from '@/services/summaryService';
import { notesService } from '@/services/notesService';
import { getErrorMessage } from '@/services/apiClient';
import type { ActionItem } from '@/types';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'transcript' | 'summary' | 'notes';

const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
  { key: 'overview', label: 'Overview', icon: Sparkles },
  { key: 'transcript', label: 'Transcript', icon: FileText },
  { key: 'summary', label: 'Summary', icon: ListChecks },
  { key: 'notes', label: 'Notes', icon: StickyNote },
];

const MeetingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { detail, isLoading, refetch } = useMeetingDetail(id);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Transcript editing
  const [transcriptDraft, setTranscriptDraft] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [isSavingTranscript, setIsSavingTranscript] = useState(false);

  // Notes editing (autosave)
  const [notesDraft, setNotesDraft] = useState('');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (detail?.transcript) setTranscriptDraft(detail.transcript.transcriptText);
    if (detail?.notes) setNotesDraft(detail.notes.noteContent);
  }, [detail]);

  // Fetch action items when summary exists
  useEffect(() => {
    if (detail?.summary) {
      summaryService.get(id!).then(({ data }) => {
        setActionItems(data.data!.actionItems);
      });
    }
  }, [detail?.summary, id]);

  // Autosave notes (debounced)
  useEffect(() => {
    if (!detail?.notes || notesDraft === detail.notes.noteContent) return;
    const timeout = setTimeout(async () => {
      setIsSavingNotes(true);
      try {
        await notesService.update(id!, notesDraft);
      } catch {
        // Silent fail for autosave; manual save button covers the rest
      } finally {
        setIsSavingNotes(false);
      }
    }, 1500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notesDraft]);

  const handleGenerateTranscript = async () => {
    setIsGeneratingTranscript(true);
    try {
      await transcriptService.generate(id!);
      toast.success('Transcript generated!');
      await refetch();
      setActiveTab('transcript');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsGeneratingTranscript(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      await summaryService.generate(id!);
      toast.success('AI summary generated!');
      await refetch();
      setActiveTab('summary');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSaveTranscript = async () => {
    setIsSavingTranscript(true);
    try {
      await transcriptService.update(id!, transcriptDraft);
      toast.success('Transcript saved');
      setIsEditingTranscript(false);
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSavingTranscript(false);
    }
  };

  const handleManualSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await notesService.update(id!, notesDraft);
      toast.success('Notes saved');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!detail) {
    return (
      <Card className="py-14 text-center">
        <p className="text-[var(--color-silver)]">Meeting not found.</p>
        <Link to="/dashboard" className="mt-4 inline-block">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </Card>
    );
  }

  const { meeting, recording, transcript, summary, notes } = detail;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-[var(--color-silver)] hover:text-[var(--color-charcoal)]"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">{meeting.title}</h1>
              <Badge variant={statusToBadgeVariant[meeting.status]}>{meeting.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-[var(--color-silver)]">
              {new Date(meeting.date).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {notes && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" leftIcon={<Share2 className="h-4 w-4" />} onClick={() => setIsShareOpen(true)}>
                Share
              </Button>
              <Button variant="dark" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => setIsExportOpen(true)}>
                Export
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Audio player */}
      {recording && <AudioPlayer src={recording.filePath} />}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-[var(--radius-md)] bg-black/[0.03] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-white text-[var(--color-charcoal)] shadow-[var(--shadow-glass-sm)]'
                : 'text-[var(--color-silver)] hover:text-[var(--color-charcoal)]'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {!recording && (
              <Card className="text-center text-sm text-[var(--color-silver)]">
                No recording attached to this meeting yet.
              </Card>
            )}
            {recording && !transcript && (
              <Card className="flex flex-col items-center py-10 text-center">
                <FileText className="mb-3 h-8 w-8 text-[var(--color-accent)]" />
                <h3 className="font-bold text-[var(--color-charcoal)]">Generate a transcript</h3>
                <p className="mt-1 max-w-sm text-sm text-[var(--color-silver)]">
                  Convert this recording into text using AI speech recognition.
                </p>
                <Button
                  className="mt-5"
                  leftIcon={<Wand2 className="h-4 w-4" />}
                  isLoading={isGeneratingTranscript}
                  onClick={handleGenerateTranscript}
                >
                  Generate Transcript
                </Button>
              </Card>
            )}
            {transcript && !summary && (
              <Card className="flex flex-col items-center py-10 text-center">
                <Sparkles className="mb-3 h-8 w-8 text-[var(--color-accent)]" />
                <h3 className="font-bold text-[var(--color-charcoal)]">Generate AI Summary</h3>
                <p className="mt-1 max-w-sm text-sm text-[var(--color-silver)]">
                  Extract key points, decisions, and action items from the transcript.
                </p>
                <Button
                  className="mt-5"
                  leftIcon={<Wand2 className="h-4 w-4" />}
                  isLoading={isGeneratingSummary}
                  onClick={handleGenerateSummary}
                >
                  Generate Summary
                </Button>
              </Card>
            )}
            {summary && (
              <Card>
                <h3 className="font-bold text-[var(--color-charcoal)]">Meeting Overview</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-[var(--color-graphite)]">
                  {summary.meetingOverview}
                </p>
                {summary.keywords.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {summary.keywords.map((kw) => (
                      <Badge key={kw} variant="accent">{kw}</Badge>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <Card>
            {!transcript ? (
              <div className="py-10 text-center text-sm text-[var(--color-silver)]">
                No transcript yet. Generate one from the Overview tab.
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-[var(--color-charcoal)]">Transcript</h3>
                  {!isEditingTranscript ? (
                    <Button variant="outline" size="sm" leftIcon={<Edit3 className="h-3.5 w-3.5" />} onClick={() => setIsEditingTranscript(true)}>
                      Edit
                    </Button>
                  ) : (
                    <Button size="sm" leftIcon={<Save className="h-3.5 w-3.5" />} isLoading={isSavingTranscript} onClick={handleSaveTranscript}>
                      Save
                    </Button>
                  )}
                </div>
                {isEditingTranscript ? (
                  <textarea
                    value={transcriptDraft}
                    onChange={(e) => setTranscriptDraft(e.target.value)}
                    rows={16}
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-silver-soft)] bg-white/70 p-4 text-sm leading-relaxed text-[var(--color-graphite)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                  />
                ) : (
                  <p className="scrollbar-thin max-h-[500px] overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-[var(--color-graphite)]">
                    {transcript.transcriptText}
                  </p>
                )}
              </>
            )}
          </Card>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-4">
            {!summary ? (
              <Card className="py-10 text-center text-sm text-[var(--color-silver)]">
                No summary yet. Generate one from the Overview tab.
              </Card>
            ) : (
              <>
                {[
                  { title: 'Key Discussion Points', items: summary.keyDiscussionPoints },
                  { title: 'Important Decisions', items: summary.importantDecisions },
                  { title: 'Next Steps', items: summary.nextSteps },
                  { title: 'Risks', items: summary.risks },
                  { title: 'Highlights', items: summary.highlights },
                ]
                  .filter((section) => section.items.length > 0)
                  .map((section) => (
                    <Card key={section.title}>
                      <h3 className="font-bold text-[var(--color-charcoal)]">{section.title}</h3>
                      <ul className="mt-3 space-y-2">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex gap-2.5 text-sm text-[var(--color-graphite)]">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}

                {actionItems.length > 0 && (
                  <Card>
                    <h3 className="font-bold text-[var(--color-charcoal)]">Action Items</h3>
                    <div className="mt-3 space-y-2">
                      {actionItems.map((item) => (
                        <ActionItemCard
                          key={item._id}
                          item={item}
                          onUpdated={(updated) =>
                            setActionItems((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
                          }
                          onDeleted={(deletedId) =>
                            setActionItems((prev) => prev.filter((p) => p._id !== deletedId))
                          }
                        />
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <Card>
            {!notes ? (
              <div className="py-10 text-center text-sm text-[var(--color-silver)]">
                Notes are generated automatically once you create an AI summary.
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-[var(--color-charcoal)]">Notes</h3>
                  <div className="flex items-center gap-3">
                    {isSavingNotes && (
                      <span className="flex items-center gap-1.5 text-xs text-[var(--color-silver)]">
                        <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                      </span>
                    )}
                    <Button size="sm" leftIcon={<Save className="h-3.5 w-3.5" />} onClick={handleManualSaveNotes}>
                      Save
                    </Button>
                  </div>
                </div>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={18}
                  placeholder="Write or edit your meeting notes (Markdown supported)..."
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-silver-soft)] bg-white/70 p-4 font-mono text-sm leading-relaxed text-[var(--color-graphite)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-soft)]"
                />
                <p className="mt-2 text-xs text-[var(--color-silver)]">
                  Markdown supported. Changes save automatically, or click Save.
                </p>
              </>
            )}
          </Card>
        )}
      </motion.div>

      {notes && (
        <>
          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            meetingId={id!}
            fileName={meeting.title}
          />
          <ShareModal
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            meetingId={id!}
            existingShareToken={notes.shareToken}
          />
        </>
      )}
    </div>
  );
};

export default MeetingDetailPage;
