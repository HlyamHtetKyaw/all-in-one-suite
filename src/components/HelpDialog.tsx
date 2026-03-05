import { X } from 'lucide-react';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

export default function HelpDialog({ isOpen, onClose, title, content }: HelpDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="rounded-[2.5rem] border border-white/15 bg-white/6 backdrop-blur-3xl p-6 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg hover:bg-white/15 transition-all duration-300"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
          <div className="text-sm text-white/80 space-y-3 leading-relaxed">
            {content}
          </div>
        </div>
      </div>
    </>
  );
}
