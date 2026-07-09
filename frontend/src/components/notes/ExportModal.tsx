import { useState } from 'react';
import { FileText, FileType, FileCode, File as FileIcon, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { exportService } from '@/services/exportSearchService';
import type { ExportFormat } from '@/services/exportSearchService';
import { getErrorMessage } from '@/services/apiClient';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  fileName: string;
}

const formats: { format: ExportFormat; label: string; description: string; icon: typeof FileText }[] = [
  { format: 'pdf', label: 'PDF', description: 'Best for printing & sharing', icon: FileIcon },
  { format: 'docx', label: 'Word (.docx)', description: 'Editable in Microsoft Word', icon: FileType },
  { format: 'txt', label: 'Plain Text', description: 'Simple, universal format', icon: FileCode },
  { format: 'md', label: 'Markdown', description: 'For developers & note apps', icon: FileText },
];

export const ExportModal = ({ isOpen, onClose, meetingId, fileName }: ExportModalProps) => {
  const [downloadingFormat, setDownloadingFormat] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setDownloadingFormat(format);
    try {
      await exportService.download(meetingId, format, fileName);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Notes">
      <div className="grid grid-cols-2 gap-3">
        {formats.map((item) => (
          <button
            key={item.format}
            onClick={() => handleExport(item.format)}
            disabled={downloadingFormat !== null}
            className="flex flex-col items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-silver-soft)] bg-white/60 p-4 text-left transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] disabled:opacity-50"
          >
            <div className="flex w-full items-center justify-between">
              <item.icon className="h-5 w-5 text-[var(--color-accent)]" />
              {downloadingFormat === item.format ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
              ) : (
                <Download className="h-3.5 w-3.5 text-[var(--color-silver)]" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-charcoal)]">{item.label}</p>
              <p className="text-xs text-[var(--color-silver)]">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
};
