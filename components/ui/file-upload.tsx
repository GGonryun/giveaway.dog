'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UploadCloud, Trash2, ZoomIn, X } from 'lucide-react';
import { useFileProvider } from '@/components/hooks/use-file-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  onUpload?: (url: string) => void;
  isDemo?: boolean;
  initialUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'wide';
  className?: string;
  fillPreview?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  isDemo,
  initialUrl,
  size = 'md',
  className = '',
  fillPreview = false
}) => {
  const [preview, setPreview] = useState<string | null>(initialUrl || null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileProvider = useFileProvider(isDemo);

  const isCustomSize = typeof size === 'number';

  const getSizeClasses = (): string => {
    if (isCustomSize) return '';
    switch (size) {
      case 'sm':
        return 'w-20 h-20';
      case 'md':
        return 'w-40 h-40';
      case 'lg':
        return 'w-60 h-60';
      case 'wide':
        return 'w-full h-40';
      default:
        return 'w-full h-full';
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    if (!fillPreview || !aspectRatio) return {};

    return {
      width: '100%',
      aspectRatio: aspectRatio.toString()
    };
  };

  const sizeClasses = getSizeClasses();

  useEffect(() => {
    if (fillPreview && initialUrl && !aspectRatio) {
      const img = new Image();
      img.onload = () => {
        setAspectRatio(img.width / img.height);
      };
      img.src = initialUrl;
    }
  }, [fillPreview, initialUrl, aspectRatio]);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      alert('Only JPEG, PNG, and GIF files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB.');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    if (fillPreview) {
      const img = new Image();
      img.onload = () => {
        setAspectRatio(img.width / img.height);
      };
      img.src = objectUrl;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(0);
    try {
      const { url } = await fileProvider.upload(file, setProgress);
      if (onUpload) onUpload(url);
    } catch (e) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    // TODO: save a delete event for files on remove
    setPreview(null);
    setProgress(0);
    setAspectRatio(null);
    if (onUpload) onUpload('');
  };
  return (
    <>
      <div className={cn('flex flex-col items-center gap-2 w-full', className)}>
        {preview ? (
          <div
            className={cn('relative mb-2', fillPreview ? '' : sizeClasses)}
            style={fillPreview ? getSizeStyles() : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="object-cover w-full h-full rounded-lg border shadow-sm"
            />
            <div className="absolute top-1 right-1 flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 border-2 border-black bg-white/90 hover:bg-white"
                onClick={() => setShowFullscreen(true)}
                aria-label="View fullscreen"
              >
                <ZoomIn strokeWidth={3} className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 border-2 border-black bg-white/90 hover:bg-white"
                onClick={handleRemove}
                aria-label="Remove file"
              >
                <Trash2 strokeWidth={3} className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              `flex flex-col items-center justify-center border-2 border-dashed rounded-lg w-full cursor-pointer transition-colors bg-white hover:bg-gray-50 dark:bg-input/30 dark:hover:bg-input/40 p-2`,
              uploading ? 'opacity-50 pointer-events-none' : '',
              sizeClasses
            )}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud className="w-8 h-8 text-gray-400 mb-2 px-2" />
            <Typography.Text className="font-medium text-center">
              Drag and drop files here
            </Typography.Text>
            <Typography.Caption className="mt-1 text-center">
              Up to 5MB. Accepts JPEG, PNG, GIF.
            </Typography.Caption>
          </div>
        )}
        <Input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          className="hidden"
          onChange={handleInputChange}
          disabled={uploading}
        />
        {uploading && (
          <div className="w-full mt-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 bg-chart-3 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <Typography.Caption>Uploading...</Typography.Caption>
          </div>
        )}
      </div>

      {showFullscreen &&
        preview &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setShowFullscreen(false)}
          >
            <div className="relative max-w-[90vw] max-h-[90vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Fullscreen preview"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 h-10 w-10 border-2 border-white bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setShowFullscreen(false)}
                aria-label="Close fullscreen"
              >
                <X strokeWidth={3} className="h-6 w-6" />
              </Button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
