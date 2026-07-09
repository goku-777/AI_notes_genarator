import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Mic,
  FileText,
  CheckCircle2,
  Zap,
  Share2,
  Search,
  Download,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const features = [
  {
    icon: Mic,
    title: 'Record or upload',
    description: 'Capture meetings live in your browser or upload existing recordings in MP3, MP4, WAV, AAC, or M4A.',
  },
  {
    icon: FileText,
    title: 'Accurate transcripts',
    description: 'Whisper-powered speech-to-text turns every recording into an editable, searchable transcript.',
  },
  {
    icon: Zap,
    title: 'AI-generated summaries',
    description: 'Get a structured overview, key decisions, action items, risks, and next steps in seconds.',
  },
  {
    icon: CheckCircle2,
    title: 'Action items that stick',
    description: 'Every task the AI finds becomes a trackable item you can assign, prioritize, and check off.',
  },
  {
    icon: Share2,
    title: 'Share in one click',
    description: 'Generate a public link or email your notes directly to teammates who missed the call.',
  },
  {
    icon: Download,
    title: 'Export anywhere',
    description: 'Download your notes as PDF, Word, plain text, or Markdown whenever you need them.',
  },
];

const faqs = [
  {
    q: 'What file formats can I upload?',
    a: 'AI Notes Generator accepts MP3, MP4, WAV, AAC, and M4A audio and video files, or you can record directly in your browser.',
  },
  {
    q: 'How accurate are the transcripts?',
    a: 'Transcripts are generated using OpenAI Whisper, one of the most accurate speech-to-text models available, and you can always edit the result manually.',
  },
  {
    q: 'Is my meeting data private?',
    a: 'Yes. Your recordings and notes are tied to your account and are never shared unless you generate a share link yourself.',
  },
  {
    q: 'Can I export my notes?',
    a: 'Yes — every note can be exported as PDF, DOCX, TXT, or Markdown with one click.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes, AI Notes Generator is free to use with unlimited meetings, transcripts, and AI summaries.',
  },
];

const LandingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[var(--color-surface-soft)]">
      {/* Navbar */}
      <header className="glass sticky top-0 z-50 border-b border-[var(--color-silver-soft)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-charcoal)]">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--color-charcoal)]">AI Notes Generator</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-[var(--color-graphite)] hover:text-[var(--color-charcoal)]">Features</a>
            <a href="#screenshots" className="text-sm font-medium text-[var(--color-graphite)] hover:text-[var(--color-charcoal)]">Product</a>
            <a href="#pricing" className="text-sm font-medium text-[var(--color-graphite)] hover:text-[var(--color-charcoal)]">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-[var(--color-graphite)] hover:text-[var(--color-charcoal)]">FAQ</a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>

          <button onClick={() => setIsMobileMenuOpen((p) => !p)} className="md:hidden">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="border-t border-[var(--color-silver-soft)] bg-white px-6 py-4 md:hidden"
          >
            <div className="flex flex-col gap-4">
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium">Features</a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium">Pricing</a>
              <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium">FAQ</a>
              <Link to="/login" className="text-sm font-medium">Log in</Link>
              <Link to="/register"><Button size="sm" className="w-full">Get started free</Button></Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 text-center sm:pt-28">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[var(--color-accent)]/[0.06] blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mx-auto inline-flex items-center gap-2 rounded-full border border-[var(--color-silver-soft)] bg-white px-4 py-1.5 text-xs font-semibold text-[var(--color-graphite)] shadow-[var(--shadow-glass-sm)]"
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          Powered by Gemini &amp; Whisper
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10 mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-[var(--color-charcoal)] sm:text-6xl"
        >
          Every meeting,<br />perfectly summarized.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 mx-auto mt-5 max-w-xl text-lg text-[var(--color-silver)]"
        >
          Upload or record any meeting. AI Notes Generator transcribes it, summarizes
          it, and pulls out every action item — so you never take notes again.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative z-10 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link to="/register">
            <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Get started — it's free
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline">See how it works</Button>
          </a>
        </motion.div>
      </section>

      {/* Product preview / screenshot */}
      <section id="screenshots" className="px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card mx-auto max-w-5xl overflow-hidden p-2"
        >
          <div className="rounded-[var(--radius-md)] bg-[var(--color-charcoal)] p-8 sm:p-12">
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { label: 'Total Meetings', value: '128' },
                { label: 'AI Summaries', value: '124' },
                { label: 'Action Items', value: '342' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[var(--radius-lg)] bg-white/5 p-6 text-left">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="mt-1 text-sm text-white/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold text-[var(--color-charcoal)] sm:text-4xl">
              Everything you need, nothing you don't
            </h2>
            <p className="mt-3 text-[var(--color-silver)]">
              From recording to a polished, shareable summary — in minutes.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="glass-card p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)]">
                  <feature.icon className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <h3 className="font-bold text-[var(--color-charcoal)]">{feature.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-silver)]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 pb-24">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-10 text-center">
            <h2 className="text-3xl font-bold text-[var(--color-charcoal)]">Simple, free pricing</h2>
            <p className="mt-3 text-[var(--color-silver)]">No credit card. No limits on meetings.</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card border-2 border-[var(--color-accent)] p-8 text-center"
          >
            <p className="text-sm font-semibold text-[var(--color-accent)]">FREE FOREVER</p>
            <p className="mt-2 text-5xl font-bold text-[var(--color-charcoal)]">$0</p>
            <ul className="mt-6 space-y-3 text-left text-sm text-[var(--color-graphite)]">
              {[
                'Unlimited meetings & recordings',
                'AI transcripts via Whisper',
                'AI summaries via Gemini',
                'PDF, DOCX, TXT, Markdown export',
                'Shareable note links',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/register" className="mt-8 block">
              <Button className="w-full" size="lg">Get started free</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 pb-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-[var(--color-charcoal)]">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={faq.q} className="glass-card overflow-hidden p-0">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold text-[var(--color-charcoal)]">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[var(--color-silver)] transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-5 pb-5 text-sm text-[var(--color-silver)]"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-silver-soft)] px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-charcoal)]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-[var(--color-charcoal)]">AI Notes Generator</span>
          </div>
          <p className="text-xs text-[var(--color-silver)]">
            © {new Date().getFullYear()} AI Notes Generator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
