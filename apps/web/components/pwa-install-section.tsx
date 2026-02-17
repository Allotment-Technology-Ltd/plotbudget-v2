'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function getIsIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: boolean }).MSStream;
}

type DeferredPrompt = { prompt: () => Promise<{ outcome: string }> };

/**
 * Always-visible PWA install section for the Settings "Get the app" tab.
 * Shows instructions and an Install button so the tab always has an actionable way to add PLOT to the home screen.
 */
export function PwaInstallSection() {
  const [mounted, setMounted] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPrompt | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsStandalone(getIsStandalone());
    setIsIOS(getIsIOS());
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as DeferredPrompt);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
    } finally {
      setInstalling(false);
    }
  };

  if (!mounted) {
    return (
      <div className="rounded-lg border border-border bg-card p-4" data-testid="pwa-install-section">
        <p className="text-sm text-muted-foreground">Checking your device…</p>
      </div>
    );
  }

  if (isStandalone) {
    return (
      <div className="rounded-lg border border-border bg-card p-4" data-testid="pwa-install-section">
        <p className="text-sm font-medium text-foreground">You’re using the app</p>
        <p className="text-sm text-muted-foreground mt-1">
          Open PLOT from your home screen or app drawer for the best experience.
        </p>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 space-y-3" data-testid="pwa-install-section">
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

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3" data-testid="pwa-install-section">
      <p className="text-sm font-medium text-foreground">Add PLOT to your home screen</p>
      {deferredPrompt ? (
        <>
          <p className="text-sm text-muted-foreground">
            Install PLOT for quick access and an app-like experience.
          </p>
          <Button
            className="w-full sm:w-auto"
            onClick={handleInstall}
            disabled={installing}
            aria-busy={installing}
          >
            {installing ? 'Opening…' : 'Add to home screen'}
          </Button>
        </>
      ) : (
        <div className="text-sm text-muted-foreground space-y-3">
          <p className="font-medium text-foreground">Install from your browser</p>
          <p><strong>On desktop (Chrome, Edge, etc.):</strong> Look for the <strong>install icon</strong> in the <strong>URL bar</strong> (right side — often a plus-in-a-frame or computer-with-plus). Click it and choose <strong>Install</strong>. If you don’t see it, open the 3 dots menu (⋮) and look for <strong>Install PLOT</strong> or <strong>Install app</strong>.</p>
          <p><strong>On your phone — Chrome:</strong> Tap the <strong>3 dots</strong> (⋮) in the top or bottom right → <strong>Add to Home screen</strong> or <strong>Install app</strong> → tap <strong>Install</strong>.</p>
          <p><strong>On your phone — DuckDuckGo:</strong> Tap the <strong>3 dots</strong> (⋮) → look for <strong>Add to Home screen</strong> or <strong>Install</strong> and follow the prompt.</p>
          <p><strong>On your phone — other browsers:</strong> Open the menu (often 3 dots or 3 lines) and look for <strong>Add to Home screen</strong>, <strong>Install app</strong>, or <strong>Install</strong>.</p>
        </div>
      )}
    </div>
  );
}
