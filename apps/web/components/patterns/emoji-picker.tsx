'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

interface EmojiPickerComponentProps {
  value: string;
  onEmojiSelect: (emoji: string) => void;
  placeholder?: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function EmojiPickerComponent({
  value,
  onEmojiSelect,
  placeholder,
  className = '',
  title = 'Choose an emoji',
  description = 'Click the button to pick an emoji'
}: EmojiPickerComponentProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiSelect = (emojiData: any) => {
    onEmojiSelect(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-12 h-12 p-0 border-2 border-dashed border-muted-foreground/25"
          >
            {value ? (
              <span className="text-3xl">{value}</span>
            ) : (
              placeholder || <Smile className="h-8 w-8 text-muted-foreground" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <EmojiPicker
            onEmojiClick={handleEmojiSelect}
            autoFocusSearch={false}
            previewConfig={{
              showPreview: false
            }}
          />
        </PopoverContent>
      </Popover>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
