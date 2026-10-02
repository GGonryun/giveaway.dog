import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

export namespace html {
  export function toMarkdown(htmlContent: string): string {
    const markdown = turndownService.turndown(htmlContent);
    return markdown.replace(/\n{3,}/g, '\n\n').trim();
  }
}
