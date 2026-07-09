import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';

/**
 * Generates a PDF buffer from markdown-ish note content.
 * Performs lightweight markdown parsing (headings, bullets) since
 * pdfkit has no native markdown renderer.
 */
export const generatePdfBuffer = (title: string, content: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.font('Helvetica-Bold').fontSize(22).fillColor('#1E1E1E').text(title, { align: 'left' });
      doc.moveDown(1);

      const lines = content.split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          doc.moveDown(0.5);
          return;
        }
        if (trimmed.startsWith('### ')) {
          doc.font('Helvetica-Bold').fontSize(13).fillColor('#1E1E1E').text(trimmed.replace('### ', ''));
        } else if (trimmed.startsWith('## ')) {
          doc.font('Helvetica-Bold').fontSize(15).fillColor('#1E1E1E').text(trimmed.replace('## ', ''));
        } else if (trimmed.startsWith('# ')) {
          doc.font('Helvetica-Bold').fontSize(18).fillColor('#1E1E1E').text(trimmed.replace('# ', ''));
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          doc.font('Helvetica').fontSize(11).fillColor('#333333').text(`•  ${trimmed.slice(2)}`, {
            indent: 15,
          });
        } else {
          doc.font('Helvetica').fontSize(11).fillColor('#333333').text(trimmed);
        }
        doc.moveDown(0.3);
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates a DOCX buffer from markdown-ish note content using the `docx` library.
 */
export const generateDocxBuffer = async (title: string, content: string): Promise<Buffer> => {
  const lines = content.split('\n');
  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
    }),
  ];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push(new Paragraph({ text: '' }));
      return;
    }
    if (trimmed.startsWith('### ')) {
      paragraphs.push(new Paragraph({ text: trimmed.replace('### ', ''), heading: HeadingLevel.HEADING_3 }));
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push(new Paragraph({ text: trimmed.replace('## ', ''), heading: HeadingLevel.HEADING_2 }));
    } else if (trimmed.startsWith('# ')) {
      paragraphs.push(new Paragraph({ text: trimmed.replace('# ', ''), heading: HeadingLevel.HEADING_1 }));
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.slice(2),
          bullet: { level: 0 },
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(trimmed)],
        })
      );
    }
  });

  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }],
  });

  return Packer.toBuffer(doc);
};

/**
 * Returns plain text export (markdown formatting characters stripped where trivial).
 */
export const generateTxtBuffer = (title: string, content: string): Buffer => {
  const text = `${title}\n${'='.repeat(title.length)}\n\n${content
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '• ')}`;
  return Buffer.from(text, 'utf-8');
};

/**
 * Returns raw markdown export (content is already markdown; just prefix the title).
 */
export const generateMarkdownBuffer = (title: string, content: string): Buffer => {
  const text = `# ${title}\n\n${content}`;
  return Buffer.from(text, 'utf-8');
};
