import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../../stores/uiStore';
import { X, Command, Keyboard } from 'lucide-react';

export function ShortcutsModal() {
  const { shortcutsOpen, toggleShortcuts } = useUiStore();
  const navigate = useNavigate();

  useEffect(() => {
    let lastKey = '';
    let timeoutId: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

      // Escape closes modal
      if (e.key === 'Escape' && shortcutsOpen) {
        toggleShortcuts();
        return;
      }

      // Ignore other shortcuts when typing in inputs
      if (isInput) return;

      // "?" or Shift + "/" opens shortcuts
      if (e.key === '?') {
        e.preventDefault();
        toggleShortcuts();
        return;
      }

      // Two-key chord navigation: "g" followed by a letter
      const key = e.key.toLowerCase();
      if (lastKey === 'g') {
        lastKey = '';
        clearTimeout(timeoutId);
        switch (key) {
          case 'i':
            e.preventDefault();
            navigate('/inbox');
            break;
          case 't':
            e.preventDefault();
            navigate('/today');
            break;
          case 'u':
            e.preventDefault();
            navigate('/upcoming');
            break;
          case 'c':
            e.preventDefault();
            navigate('/calendar');
            break;
          case 'k':
            e.preventDefault();
            navigate('/kanban');
            break;
          case 'f':
            e.preventDefault();
            navigate('/focus');
            break;
          case 'a':
            e.preventDefault();
            navigate('/analytics');
            break;
          case 's':
            e.preventDefault();
            navigate('/settings');
            break;
          default:
            break;
        }
        return;
      }

      if (key === 'g') {
        lastKey = 'g';
        timeoutId = setTimeout(() => {
          lastKey = '';
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [shortcutsOpen, toggleShortcuts, navigate]);

  if (!shortcutsOpen) return null;

  const shortcutSections = [
    {
      title: 'Global Actions',
      shortcuts: [
        { keys: ['Ctrl', 'K'], label: 'Open global search' },
        { keys: ['/'], label: 'Open global search' },
        { keys: ['?'], label: 'Toggle keyboard shortcuts' },
        { keys: ['Esc'], label: 'Close open modal or drawer' },
      ],
    },
    {
      title: 'Navigation Chords',
      shortcuts: [
        { keys: ['G', 'I'], label: 'Go to Inbox' },
        { keys: ['G', 'T'], label: 'Go to Today' },
        { keys: ['G', 'U'], label: 'Go to Upcoming' },
        { keys: ['G', 'C'], label: 'Go to Calendar' },
        { keys: ['G', 'K'], label: 'Go to Kanban Board' },
        { keys: ['G', 'F'], label: 'Go to Focus Mode' },
        { keys: ['G', 'A'], label: 'Go to Analytics' },
        { keys: ['G', 'S'], label: 'Go to Settings' },
      ],
    },
    {
      title: 'Task Management',
      shortcuts: [
        { keys: ['Enter'], label: 'Save task in quick add' },
        { keys: ['Ctrl', 'Enter'], label: 'Save and create another' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={toggleShortcuts}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Keyboard Shortcuts</h2>
              <p className="text-xs text-slate-400">Power through your tasks without touching your mouse</p>
            </div>
          </div>
          <button
            onClick={toggleShortcuts}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {shortcutSections.map((sec) => (
            <div key={sec.title} className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {sec.title}
              </h3>
              <div className="space-y-2">
                {sec.shortcuts.map((sc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-slate-800/40 border border-slate-800"
                  >
                    <span className="text-slate-300">{sc.label}</span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-0.5 text-[11px] font-semibold text-slate-300 bg-slate-800 border border-slate-700 rounded shadow-xs"
                        >
                          {k === 'Ctrl' ? (
                            <span className="flex items-center gap-0.5">
                              <Command className="w-2.5 h-2.5 inline" /> / Ctrl
                            </span>
                          ) : (
                            k
                          )}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-400">?</kbd> anywhere to open</span>
          <span>Press <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-400">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
