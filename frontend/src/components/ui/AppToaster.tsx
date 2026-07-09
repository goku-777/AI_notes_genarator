import { Toaster } from 'react-hot-toast';

export const AppToaster = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 3500,
      style: {
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(16px)',
        color: '#1E1E1E',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.5)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        fontSize: '14px',
        fontWeight: 500,
        padding: '12px 16px',
      },
      success: {
        iconTheme: { primary: '#4F46E5', secondary: '#fff' },
      },
      error: {
        iconTheme: { primary: '#DC2626', secondary: '#fff' },
      },
    }}
  />
);
