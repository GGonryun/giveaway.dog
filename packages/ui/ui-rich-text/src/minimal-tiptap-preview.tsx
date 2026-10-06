import { richTextPreviewStyles } from './rich-text-styles';
import { cn } from '@giveaway/ui-utils/utils';
import { html } from '@giveaway/util-html/html';

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
      dangerouslySetInnerHTML={{ __html: html.sanitize(content) }}
    />
  );
}
