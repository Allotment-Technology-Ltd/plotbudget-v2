'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const STORAGE_KEY = 'plot-pwa-prompt-dismissed';

function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function getIsIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: boolean }).MSStream;
}

function getCanShowInstallPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  return 'BeforeInstallPromptEvent' in window || getIsIOS();
}

function getInstallPromptMessage(isIOS: boolean, hasDeferredPrompt: boolean): string {
  if (isIOS) {
    return 'Tap the Share button and then "Add to Home Screen" to open PLOT from your home screen.';
  }
  if (hasDeferredPrompt) {
    return 'Install PLOT for a quicker launch and an app-like experience.';
  }
  return "Tap your browser's 3 dots (⋮) → Add to Home screen → Install to add PLOT to your phone.";
}

export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<{ outcome: string }> } | null>(null);

  useEffect(() => {
    if (getIsStandalone()) return;
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (dismissed === 'true') return;
    } catch (e) {
      console.warn('[PwaInstallPrompt] sessionStorage read failed (e.g. private mode or quota)', e);
    }
    queueMicrotask(() => {
      setIsIOS(getIsIOS());
      setVisible(getCanShowInstallPrompt());
    });
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> });
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('[PwaInstallPrompt] sessionStorage write failed (e.g. private mode or quota)', e);
    }
    setVisible(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setVisible(false);
      try {
        sessionStorage.setItem(STORAGE_KEY, 'true');
      } catch (e) {
        console.warn('[PwaInstallPrompt] sessionStorage write failed (e.g. private mode or quota)', e);
      }
    }
  };

  if (!visible) return null;

  return (
    <div
      className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      data-testid="pwa-install-prompt"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Use PLOT as an app</p>
        <p className="text-sm text-muted-foreground">
          {getInstallPromptMessage(isIOS, deferredPrompt !== null)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!isIOS && deferredPrompt && (
          <Button className="h-9 px-4 text-sm" onClick={handleInstall}>
            Install
          </Button>
        )}
        <Button
          variant="ghost"
          className="h-8 w-8 shrink-0 p-0"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
