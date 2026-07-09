import { useState } from 'react';
import { Link2, Copy, Check, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { notesService } from '@/services/notesService';
import { getErrorMessage } from '@/services/apiClient';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  existingShareToken?: string;
}

export const ShareModal = ({ isOpen, onClose, meetingId, existingShareToken }: ShareModalProps) => {
  const [shareUrl, setShareUrl] = useState<string | null>(
    existingShareToken ? `${window.location.origin}/shared/${existingShareToken}` : null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const { data } = await notesService.generateShareLink(meetingId);
      setShareUrl(data.data!.shareUrl);
      toast.success('Share link generated!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleEmailShare = async () => {
    if (!recipientEmail) {
      toast.error('Please enter a recipient email');
      return;
    }
    setIsSendingEmail(true);
    try {
      const { data } = await notesService.emailShareLink(meetingId, recipientEmail);
      setShareUrl(data.data!.shareUrl);
      toast.success(`Notes shared with ${recipientEmail}`);
      setRecipientEmail('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Notes">
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--color-charcoal)]">Public link</p>
          {shareUrl ? (
            <div className="flex items-center gap-2">
              <div className="flex h-11 flex-1 items-center gap-2 truncate rounded-[var(--radius-md)] border border-[var(--color-silver-soft)] bg-[var(--color-surface-soft)] px-3.5 text-sm text-[var(--color-graphite)]">
                <Link2 className="h-4 w-4 shrink-0 text-[var(--color-silver)]" />
                <span className="truncate">{shareUrl}</span>
              </div>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {isCopied ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              leftIcon={isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              onClick={handleGenerateLink}
              disabled={isGenerating}
            >
              Generate share link
            </Button>
          )}
        </div>

        <div className="border-t border-[var(--color-silver-soft)] pt-5">
          <p className="mb-2 text-sm font-medium text-[var(--color-charcoal)]">Email to someone</p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="dark"
              isLoading={isSendingEmail}
              leftIcon={!isSendingEmail ? <Mail className="h-4 w-4" /> : undefined}
              onClick={handleEmailShare}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
