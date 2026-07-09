import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-surface-soft)] px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-charcoal)]">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-7xl font-bold tracking-tight text-[var(--color-charcoal)]">404</h1>
        <p className="mt-3 text-lg font-semibold text-[var(--color-charcoal)]">Page not found</p>
        <p className="mt-2 max-w-sm text-sm text-[var(--color-silver)]">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <Link to="/" className="mt-8 inline-block">
          <Button leftIcon={<Home className="h-4 w-4" />}>Back to home</Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
