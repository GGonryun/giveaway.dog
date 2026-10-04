import { richTextPreviewStyles } from '@/lib/rich-text-styles';
import { cn } from '@giveaway/ui-utils/utils';

interface RichTextPreviewProps {
  content?: string | null;
  className?: string;
}

export function MinimalTipTapPreview({
  content,
  className
}: RichTextPreviewProps) {
  if (!content) return null;

  return (
    <div
      className={cn(richTextPreviewStyles, className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
