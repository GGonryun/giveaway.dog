export const richTextStyles = [
  'prose prose-sm max-w-none',
  '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6',
  '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5',
  '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4',
  '[&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-3',
  '[&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-3',
  '[&_li]:my-1',
  '[&_p]:min-h-[1.5em] [&_p]:leading-relaxed',
  '[&_strong]:font-bold [&_em]:italic [&_s]:line-through',
  '[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm',
  '[&_hr]:my-6 [&_hr]:border-t',
  '[&_br]:block',
  '[&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80'
].join(' ');

export const richTextEditorStyles = [
  richTextStyles,
  'min-h-[200px] p-4 border-0 focus:outline-none'
].join(' ');

export const richTextPreviewStyles = [
  richTextStyles,
  'text-sm sm:text-base',
  '[&_a]:break-all'
].join(' ');
