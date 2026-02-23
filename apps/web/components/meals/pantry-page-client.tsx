'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  usePantryList,
  useCreatePantryItem,
  useDeletePantryItem,
  useBarcodeLookup,
  type BarcodeLookupResult,
} from '@/hooks/use-meals';
import { useDevice } from '@/hooks/use-device';
import { getCameraPermissionDeniedCopy } from '@/lib/camera-permission-copy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Trash2, Barcode, Camera, Upload, ArrowLeft } from 'lucide-react';

export function PantryPageClient() {
  const { deviceType } = useDevice();
  const { data: items, isLoading, error } = usePantryList();
  const createItem = useCreatePantryItem();
  const deleteItem = useDeletePantryItem();
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeLookup = useBarcodeLookup();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanMode, setScanMode] = useState<'choice' | 'camera'>('choice');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraRetryTrigger, setCameraRetryTrigger] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const allItems = items ?? [];
  const uniqueLocations = Array.from(new Set(allItems.map((i) => i.location).filter(Boolean))).sort();
  const filtered =
    locationFilter === 'all'
      ? allItems
      : allItems.filter((i) => i.location === locationFilter);
  const byLocation = uniqueLocations.map((loc) => ({
    location: loc,
    label: loc,
    items: filtered.filter((i) => i.location === loc),
  }));

  const addItem = () => {
    const name = newName.trim();
    if (!name) return;
    const loc = newLocation.trim() || 'pantry';
    const qty = newQty.trim() ? parseFloat(newQty.replace(/,/g, '.')) : undefined;
    createItem.mutate(
      {
        name,
        quantity_value: qty != null && !Number.isNaN(qty) ? qty : undefined,
        quantity_unit: newUnit.trim() || undefined,
        location: loc,
      },
      {
        onSuccess: () => {
          setNewName('');
          setNewQty('');
          setNewUnit('');
        },
      }
    );
  };

  const handleBarcodeLookup = () => {
    const code = barcodeInput.trim();
    if (!code) return;
    barcodeLookup.mutate(code, {
      onSuccess: (result) => {
        if (result.found) {
          if (result.name) setNewName(result.name);
          if (result.quantity_value != null) setNewQty(String(result.quantity_value));
          if (result.quantity_unit) setNewUnit(result.quantity_unit);
          setBarcodeInput('');
        }
      },
    });
  };

  const applyBarcodeResult = useCallback(
    (result: BarcodeLookupResult) => {
      if (result.found) {
        if (result.name) setNewName(result.name);
        if (result.quantity_value != null) setNewQty(String(result.quantity_value));
        if (result.quantity_unit) setNewUnit(result.quantity_unit);
      }
      setScanDialogOpen(false);
      setScanMode('choice');
      setCameraError(null);
    },
    []
  );

  const handleBarcodeImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const BarcodeDetector = typeof window !== 'undefined' ? (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector : undefined;
    if (!BarcodeDetector) {
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const detector = new (BarcodeDetector as new () => { detect: (img: ImageBitmap) => Promise<Array<{ rawValue: string }>> })();
      const codes = await detector.detect(bitmap);
      bitmap.close();
      const first = codes[0];
      if (first?.rawValue) {
        barcodeLookup.mutate(first.rawValue, {
          onSuccess: applyBarcodeResult,
        });
      }
    } catch {
      // Decode failed or API not supported
    }
  };

  // Attach camera stream to video when in camera mode; clean up on close or mode change
  useEffect(() => {
    if (!scanDialogOpen || scanMode !== 'camera') {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }
    setCameraError(null);
    let stream: MediaStream | null = null;
    const videoEl = videoRef.current;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        stream = s;
        streamRef.current = s;
        setCameraError(null);
        const v = videoRef.current ?? videoEl;
        if (v) {
          v.srcObject = s;
          v.play().catch(() => {});
        }
      })
      .catch(() => {
        setCameraError('camera_denied');
      });
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (streamRef.current === stream) streamRef.current = null;
    };
  }, [scanDialogOpen, scanMode, cameraRetryTrigger]);

  const handleUseCamera = () => {
    setCameraError(null);
    const BarcodeDetector = typeof window !== 'undefined' ? (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector : undefined;
    if (!BarcodeDetector) {
      setCameraError('Barcode scanning from camera is not supported in this browser. Try Upload photo.');
      return;
    }
    setScanMode('camera');
  };

  const handleCaptureFromCamera = async () => {
    const video = videoRef.current;
    const BarcodeDetector = typeof window !== 'undefined' ? (window as unknown as { BarcodeDetector?: unknown }).BarcodeDetector : undefined;
    if (!video || !BarcodeDetector || video.readyState < 2) return;
    setCapturing(true);
    try {
      if (!canvasRef.current) canvasRef.current = document.createElement('canvas');
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const bitmap = await createImageBitmap(canvas);
      const detector = new (BarcodeDetector as new () => { detect: (img: ImageBitmap) => Promise<Array<{ rawValue: string }>> })();
      const codes = await detector.detect(bitmap);
      bitmap.close();
      const first = codes[0];
      if (first?.rawValue) {
        barcodeLookup.mutate(first.rawValue, {
          onSuccess: applyBarcodeResult,
        });
      }
    } catch {
      setCameraError('Could not read barcode. Try again or use Upload photo.');
    } finally {
      setCapturing(false);
    }
  };

  const handleScanDialogOpenChange = (open: boolean) => {
    if (!open) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setScanMode('choice');
      setCameraError(null);
      setCameraRetryTrigger(0);
    }
    setScanDialogOpen(open);
  };

  const handleCameraTryAgain = () => {
    setCameraError(null);
    setCameraRetryTrigger((n) => n + 1);
  };

  const handleUploadPhoto = () => {
    setScanDialogOpen(false);
    setScanMode('choice');
    setCameraError(null);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const formatQty = (item: { quantity_value: number | null; quantity_unit: string | null }) => {
    if (item.quantity_value != null && item.quantity_unit) return `${item.quantity_value} ${item.quantity_unit}`;
    if (item.quantity_value != null) return String(item.quantity_value);
    return null;
  };

  if (error) {
    return (
      <p className="text-destructive" data-testid="pantry-error">
        {error.message}
      </p>
    );
  }

  return (
    <div className="space-y-6" data-testid="pantry-page">
      <div>
        <h1 className="font-heading text-2xl uppercase tracking-widest text-foreground">
          Pantry
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          What you have in the fridge, cupboard or pantry. Used when planning meals and when you mark a meal as cooked.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3" data-testid="pantry-barcode">
        <h2 className="font-heading text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Add by barcode
        </h2>
        <p className="text-sm text-muted-foreground">
          Scan with a barcode scanner, enter the number, or upload a photo of the barcode. We look up the product name (and quantity if available) from Open Food Facts.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Barcode number"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBarcodeLookup()}
            className="w-40 font-mono"
            data-testid="pantry-barcode-input"
            aria-label="Barcode number"
          />
          <Button
            type="button"
            variant="outline"
            className="gap-1 text-sm py-1.5 px-2"
            onClick={handleBarcodeLookup}
            disabled={!barcodeInput.trim() || barcodeLookup.isPending}
            data-testid="pantry-barcode-lookup"
          >
            <Barcode className="h-4 w-4" />
            {barcodeLookup.isPending ? 'Looking up…' : 'Look up'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBarcodeImage}
            aria-label="Upload barcode image"
          />
          <Button
            type="button"
            variant="outline"
            className="gap-1 text-sm py-1.5 px-2"
            onClick={() => setScanDialogOpen(true)}
            data-testid="pantry-barcode-scan-image"
          >
            <Camera className="h-4 w-4" />
            Scan from image
          </Button>
          <Dialog open={scanDialogOpen} onOpenChange={handleScanDialogOpenChange}>
            <DialogContent className="max-w-sm" aria-describedby="scan-dialog-desc">
              <DialogHeader>
                <DialogTitle className="font-heading text-lg uppercase tracking-wider">
                  Scan barcode
                </DialogTitle>
                <DialogDescription id="scan-dialog-desc">
                  Use your phone camera to point at a barcode, or upload a photo.
                </DialogDescription>
              </DialogHeader>
              {scanMode === 'choice' ? (
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 justify-start"
                    onClick={handleUseCamera}
                    data-testid="pantry-barcode-use-camera"
                  >
                    <Camera className="h-4 w-4" />
                    Use camera
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 justify-start"
                    onClick={handleUploadPhoto}
                    data-testid="pantry-barcode-upload-photo"
                  >
                    <Upload className="h-4 w-4" />
                    Upload photo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="relative rounded-lg overflow-hidden bg-muted aspect-[4/3] max-h-[50vh]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      aria-label="Camera preview for barcode"
                    />
                  </div>
                  {cameraError === 'camera_denied' && (() => {
                    const copy = getCameraPermissionDeniedCopy(deviceType);
                    return (
                      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3" role="alert">
                        <p className="text-sm font-medium text-foreground">
                          {copy.lead}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {copy.alternative}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {copy.steps}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCameraTryAgain}
                            data-testid="pantry-barcode-camera-try-again"
                          >
                            Try again
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                  {cameraError && cameraError !== 'camera_denied' && (
                    <p className="text-sm text-destructive" role="alert">
                      {cameraError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setScanMode('choice')}
                      data-testid="pantry-barcode-camera-back"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="gap-1 flex-1"
                      onClick={handleCaptureFromCamera}
                      disabled={capturing}
                      data-testid="pantry-barcode-camera-capture"
                    >
                      <Camera className="h-4 w-4" />
                      {capturing ? 'Scanning…' : 'Capture'}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
        {barcodeLookup.data && !barcodeLookup.data.found && barcodeLookup.isSuccess && (
          <p className="text-sm text-muted-foreground" data-testid="pantry-barcode-not-found">
            No product found for this barcode. You can still add the item by typing the name below.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Receipt scan (upload or paste to add multiple items at once) is planned for a future update.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" data-testid="pantry-add">
        <Input
          placeholder="Item name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          className="min-w-[140px] max-w-xs"
          data-testid="pantry-new-name"
          aria-label="Item name"
        />
        <Input
          placeholder="Qty"
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
          className="w-20"
          data-testid="pantry-new-qty"
          aria-label="Quantity"
        />
        <Input
          placeholder="Unit"
          value={newUnit}
          onChange={(e) => setNewUnit(e.target.value)}
          className="w-24"
          data-testid="pantry-new-unit"
          aria-label="Unit (e.g. g, ml)"
        />
        <div className="flex items-center gap-1">
          <Input
            list="pantry-location-list"
            placeholder="Location (e.g. Fridge, Cupboard above sink)"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            className="min-w-[160px] max-w-xs"
            data-testid="pantry-new-location"
            aria-label="Where you store it"
          />
          <datalist id="pantry-location-list">
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc} />
            ))}
            <option value="pantry" />
            <option value="Fridge" />
            <option value="Cupboard" />
            <option value="Freezer" />
          </datalist>
        </div>
        <Button
          onClick={addItem}
          disabled={!newName.trim() || createItem.isPending}
          data-testid="pantry-add-button"
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          variant={locationFilter === 'all' ? 'primary' : 'outline'}
          className="text-sm py-1.5 px-2"
          onClick={() => setLocationFilter('all')}
        >
          All
        </Button>
        {uniqueLocations.map((loc) => (
          <Button
            key={loc}
            type="button"
            variant={locationFilter === loc ? 'primary' : 'outline'}
            className="text-sm py-1.5 px-2"
            onClick={() => setLocationFilter(loc)}
          >
            {loc}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm" data-testid="pantry-loading">
          Loading…
        </p>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground"
          data-testid="pantry-empty"
        >
          <p>
            {locationFilter === 'all'
              ? 'Your pantry list is empty.'
              : `No items in ${locationFilter}.`}
          </p>
          <p className="mt-1 text-sm">
            Add items above. When you add a recipe to your meal plan, we’ll show if you already have something in stock (check amounts are still accurate).
          </p>
        </div>
      ) : (
        <ul className="space-y-4" data-testid="pantry-list">
          {byLocation.map(
            ({ location, label, items: locItems }) =>
              locItems.length > 0 && (
                <li key={location}>
                  <h2 className="font-heading text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    {label}
                  </h2>
                  <ul className="space-y-2">
                    {locItems.map((item) => {
                      const qtyStr = formatQty(item);
                      return (
                        <li
                          key={item.id}
                          className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2"
                          data-testid={`pantry-item-${item.id}`}
                        >
                          <span className="flex-1 text-foreground">
                            {item.name}
                            {qtyStr && (
                              <span className="ml-2 text-muted-foreground text-sm">
                                {qtyStr}
                              </span>
                            )}
                          </span>
                          <Button
                            variant="ghost"
                            className="text-sm py-1.5 px-2"
                            onClick={() => deleteItem.mutate(item.id)}
                            disabled={deleteItem.isPending}
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              )
          )}
        </ul>
      )}
    </div>
  );
}
