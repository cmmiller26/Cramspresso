interface StudyKeyboardShortcutsProps {
  isVisible: boolean;
}

export function StudyKeyboardShortcuts({
  isVisible,
}: StudyKeyboardShortcutsProps) {
  if (!isVisible) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <h3 className="font-semibold mb-3">Keyboard Shortcuts</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> - Flip card
        </div>
        <div>
          <kbd className="px-2 py-1 bg-muted rounded">Y</kbd> - Yes
        </div>
        <div>
          <kbd className="px-2 py-1 bg-muted rounded">N</kbd> - No
        </div>
        <div>
          <kbd className="px-2 py-1 bg-muted rounded">→</kbd> - Skip
        </div>
        <div>
          <kbd className="px-2 py-1 bg-muted rounded">←</kbd> - Redo
        </div>
        <div>
          <kbd className="px-2 py-1 bg-muted rounded">S</kbd> - Shuffle
        </div>
        <div>
          <kbd className="px-2 py-1 bg-muted rounded">R</kbd> - Restart
        </div>
        <div>
          <kbd className="px-2 py-1 bg-muted rounded">H</kbd> - Help
        </div>
      </div>
    </div>
  );
}
