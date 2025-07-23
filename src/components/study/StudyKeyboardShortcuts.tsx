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
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span>Flip card / Show answer</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>I got it right</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">Y</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>I got it wrong</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">N</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Skip card</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">→</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Previous card</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs">←</kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Toggle help</span>
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-muted rounded text-xs">?</kbd>
            <span className="text-muted-foreground">or</span>
            <kbd className="px-2 py-1 bg-muted rounded text-xs">H</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
