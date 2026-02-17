'use client';

import { Button } from '@/components/ui/button';
import { usePwaInstallSection } from '@/hooks/use-pwa-install-section';

const SECTION_CLASS = 'rounded-lg border border-border bg-card p-4';
const SECTION_TESTID = 'pwa-install-section';

function PwaInstallLoading() {
  return (
    <div className={SECTION_CLASS} data-testid={SECTION_TESTID}>
      <p className="text-sm text-muted-foreground">Checking your device…</p>
    </div>
  );
}

function PwaInstallStandalone() {
  return (
    <div className={SECTION_CLASS} data-testid={SECTION_TESTID}>
      <p className="text-sm font-medium text-foreground">You’re using the app</p>
      <p className="text-sm text-muted-foreground mt-1">
        Open PLOT from your home screen or app drawer for the best experience.
      </p>
    </div>
  );
}

function PwaInstallIosInstructions() {
  return (
    <div className={`${SECTION_CLASS} space-y-3`} data-testid={SECTION_TESTID}>
      <p className="text-sm font-medium text-foreground">Add PLOT to your home screen</p>
      <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-2">
        <li>Tap the <strong>Share</strong> button (square with an arrow) at the bottom of Safari.</li>
        <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
        <li>Tap <strong>Add</strong> in the top right.</li>
      </ol>
      <p className="text-sm text-muted-foreground">
        You’ll see a PLOT icon on your home screen. Tap it to open the app.
      </p>
    </div>
  );
}

function PwaInstallWithPrompt({
  onInstall,
  installing,
}: {
  onInstall: () => void;
  installing: boolean;
}) {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        Install PLOT for quick access and an app-like experience.
      </p>
      <Button
        className="w-full sm:w-auto"
        onClick={onInstall}
        disabled={installing}
        aria-busy={installing}
      >
        {installing ? 'Opening…' : 'Add to home screen'}
      </Button>
    </>
  );
}

function PwaInstallManualInstructions() {
  return (
    <div className="text-sm text-muted-foreground space-y-3">
      <p className="font-medium text-foreground">Install from your browser</p>
      <p><strong>On desktop (Chrome, Edge, etc.):</strong> Look for the <strong>install icon</strong> in the <strong>URL bar</strong> (right side — often a plus-in-a-frame or computer-with-plus). Click it and choose <strong>Install</strong>. If you don’t see it, open the 3 dots menu (⋮) and look for <strong>Install PLOT</strong> or <strong>Install app</strong>.</p>
      <p><strong>On your phone — Chrome:</strong> Tap the <strong>3 dots</strong> (⋮) in the top or bottom right → <strong>Add to Home screen</strong> or <strong>Install app</strong> → tap <strong>Install</strong>.</p>
      <p><strong>On your phone — DuckDuckGo:</strong> Tap the <strong>3 dots</strong> (⋮) → look for <strong>Add to Home screen</strong> or <strong>Install</strong> and follow the prompt.</p>
      <p><strong>On your phone — other browsers:</strong> Open the menu (often 3 dots or 3 lines) and look for <strong>Add to Home screen</strong>, <strong>Install app</strong>, or <strong>Install</strong>.</p>
    </div>
  );
}

/**
 * Always-visible PWA install section for the Settings "Get the app" tab.
 * Shows instructions and an Install button so the tab always has an actionable way to add PLOT to the home screen.
 */
export function PwaInstallSection() {
  const { mounted, isStandalone, isIOS, deferredPrompt, installing, handleInstall } = usePwaInstallSection();

  if (!mounted) return <PwaInstallLoading />;
  if (isStandalone) return <PwaInstallStandalone />;
  if (isIOS) return <PwaInstallIosInstructions />;

  return (
    <div className={`${SECTION_CLASS} space-y-3`} data-testid={SECTION_TESTID}>
      <p className="text-sm font-medium text-foreground">Add PLOT to your home screen</p>
      {deferredPrompt ? (
        <PwaInstallWithPrompt onInstall={handleInstall} installing={installing} />
      ) : (
        <PwaInstallManualInstructions />
      )}
    </div>
  );
}
