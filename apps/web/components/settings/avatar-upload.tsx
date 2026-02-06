'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { uploadAvatar } from '@/lib/actions/avatar-actions';
import { toast } from 'sonner';
import { Loader2, Upload, User } from 'lucide-react';
import { pixelateAndPaletteSwap } from '@/lib/utils/avatar-processor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
}

export function AvatarUpload({ currentAvatarUrl }: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl ?? null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setIsProcessing(true);
    e.target.value = '';

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageDataUrl = event.target?.result as string;
        if (!imageDataUrl) {
          setIsProcessing(false);
          toast.error('Failed to read image');
          return;
        }

        const processedDataUrl = await pixelateAndPaletteSwap(imageDataUrl);
        setPreviewUrl(processedDataUrl);

        const blob = await (await fetch(processedDataUrl)).blob();
        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.webp');

        const result = await uploadAvatar(formData);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        if (result.avatarUrl) {
          setPreviewUrl(result.avatarUrl);
          toast.success('Avatar updated!');
        }
      };
      reader.onerror = () => {
        setIsProcessing(false);
        toast.error('Failed to read image');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Failed to process avatar');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative inline-block">
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
          <Avatar className="h-20 w-20 shrink-0 rounded-full border border-border">
            {previewUrl ? (
              <AvatarImage
                src={previewUrl}
                alt="Avatar"
                className="avatar-pixelated object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="h-10 w-10" aria-hidden />
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2 min-w-0">
            <p className="text-sm text-muted-foreground">
              Upload a photo for a subtle pixel-style avatar. Max 5MB, JPG/PNG/GIF/WebP.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Choose avatar image"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="mr-2 h-4 w-4" aria-hidden />
              )}
              {isProcessing ? 'Processing…' : 'Upload image'}
            </Button>
          </div>
        </div>
        {isProcessing && (
          <div
            className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg"
            aria-live="polite"
            aria-busy="true"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
