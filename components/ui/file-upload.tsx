'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import {
  useFileProvider,
  FileProviderType
} from '@/components/hooks/use-file-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Typography } from '@/components/ui/typography';

export interface FileUploadProps {
  onUpload?: (url: string) => void;
  initialUrl?: string;
  providerType?: FileProviderType;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  initialUrl,
  providerType = 'mock'
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl || null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileProvider = useFileProvider(providerType);

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
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB.');
      return;
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
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
    setFile(null);
    setPreview(null);
    setProgress(0);
    if (onUpload) onUpload('');
  };
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {preview ? (
        <div className="relative w-40 h-40 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="object-cover w-full h-full rounded-lg border"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute top-1 right-1 p-1 h-7 w-7 min-w-0 min-h-0 rounded-full shadow"
            onClick={handleRemove}
            aria-label="Remove file"
          >
            <X className="w-4 h-4 text-gray-600" />
          </Button>
        </div>
      ) : (
        <div
          className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg w-full h-40 cursor-pointer transition-colors hover:bg-gray-50 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
          <Typography.Text className="font-medium text-gray-700">
            Drag and drop files here
          </Typography.Text>
          <Typography.Caption className="mt-1">
            You can upload 1 file up to 2MB. Accepted JPEG, PNG, GIF.
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
  );
};
