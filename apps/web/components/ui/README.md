# Rich text preview (`MinimalTipTapPreview`)

`MinimalTipTapPreview` (`minimal-tiptap-preview.tsx`) shows HTML that a host wrote in the rich text editor (`minimal-tiptap-editor.tsx`). The HTML comes from the database, and a host can send any HTML to the save procedures without using the editor. So the component never puts the HTML into the page as it is: it sanitises it first with `sanitizeRichText` from `lib/sanitize-html.ts`.

## What it renders

- If `content` is `undefined`, `null` or an empty string, it renders nothing.
- Otherwise it renders a `div` with the rich text styles (`richTextPreviewStyles` from `lib/rich-text-styles.ts`) and the optional `className`. The `div` holds the sanitised HTML.

## What the sanitiser keeps

`sanitizeRichText` uses [DOMPurify](https://github.com/cure53/DOMPurify) through `isomorphic-dompurify`, which works in the browser and during server rendering. It keeps only the markup that the editor can produce:

| Kind              | Allowed                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| Blocks            | `p`, `h1` to `h6`, `ul`, `ol`, `li`, `pre`, `blockquote`, `hr`, `br`          |
| Inline formatting | `strong`, `b`, `em`, `i`, `u`, `s`, `code`                                    |
| Links             | `a` with a safe `href` (see below)                                            |
| Attributes        | `href`, `target` and `rel` on links, `start` on `ol`, and `style` (see below) |

- **Alignment:** a `style` attribute is kept only when it is exactly one `text-align` of `left`, `center`, `right` or `justify`. It is rewritten as `text-align: <value>;`. Any other style is removed, so a host cannot position text over the page (for example `position: fixed`) or load an image through CSS.
- **Links:** an `href` is kept when it is a relative URL or uses a protocol that cannot run a script, such as `https:`, `http:`, `mailto:` or `tel:` (DOMPurify's default list). Every link with an `href` opens in a new tab with `target="_blank"` and `rel="noopener noreferrer nofollow"`, whatever the HTML says. A link without an `href` loses its `target` and `rel`.
- **Text:** the text is kept and escaped, so `1 < 2` becomes `1 &lt; 2`.

## What the sanitiser removes

- **Event handler attributes**, such as `onerror`, `onclick`, `onload` and `onfocus`.
- **Unsafe URLs:** `javascript:`, `data:` and `vbscript:` URLs. The link stays, without its `href`.
- **Elements with everything inside them:** `script`, `iframe`, `style`, `svg`, `math`, `template`, `noscript`, `audio` and `video`.
- **Empty elements:** `img`, `input`, `object`, `embed`, `link`, `meta` and `base`.
- **Any other element outside the allowlist,** such as `div`, `span`, `form` and `button`: the element is removed and its text is kept.
- **Attributes outside the allowlist,** including `class`, `id`, `title`, and `data-*` and `aria-*` attributes. Without `class`, a host cannot use the site's own Tailwind classes to cover the page.

The markup that the editor produces comes out unchanged, so giveaways look the same as before.

If DOMPurify cannot run (it has no DOM), `sanitizeRichText` throws instead of returning the HTML unsanitised. A broken server bundle then shows an error instead of unsafe markup.

## Where the HTML is sanitised

1. **When it is shown:** `MinimalTipTapPreview` sanitises every time it renders, on the server and in the browser. This covers every caller:
   - the giveaway description (`components/sweepstakes/giveaway-participation-card.tsx`)
   - the custom terms (`components/sweepstakes/terms-modal.tsx`)
   - the task description of the media submission task (`lib/task/components/public-sweepstakes/task-actions/lib/form/submit-media.tsx`)

   Giveaways saved before this change are made safe here too.

2. **When it is saved:** `applySweepstakesChanges` in `procedures/sweepstakes/shared.ts` calls `sanitizeSweepstakesInput`. It sanitises `setup.description` and, for custom terms, `terms.text` before the giveaway is stored. Both the publish and the update procedures go through it. Values that are not strings are passed on unchanged, and the database rejects them.

Template terms are not sanitised, because `terms-modal.tsx` renders them as React text and not as HTML.

## Package

`lib/sanitize-html.ts` is in the `@giveaway/util-html` package (see `docs/monorepo/package-map.json`). Both the UI packages and the server packages can import a `util` package, so the component and the procedure share one sanitiser.

## Changing the allowlist

If you add an editor extension that produces new markup (for example images or tables), the sanitiser removes that markup until you allow it. To allow it:

1. Add the tags and the attributes to `RICH_TEXT_CONFIG` in `lib/sanitize-html.ts`. Allow only what the extension produces. Never allow event handlers, `class` or free `style`.
2. Add test cases to `lib/__tests__/sanitize-html.test.ts`: the new markup is kept, and unsafe variants of it are removed.
3. Update the snapshots and the visual references (see below).

## Tests

| Test                                                                                                           | What it checks                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/__tests__/sanitize-html.test.ts`                                                                          | The full allowlist: what is kept, what is removed, the link and alignment rules, that the hooks do not leak to other DOMPurify users, and the error without a DOM |
| `__tests__/minimal-tiptap-preview.test.tsx`                                                                    | The component removes handlers, scripts, frames, styles, classes and `javascript:` links, and keeps alignment and safe links                                      |
| `__tests__/minimal-tiptap-preview.snapshot.test.tsx`                                                           | Snapshots of editor markup (unchanged) and of unsafe markup after sanitising                                                                                      |
| `__tests__/minimal-tiptap-preview.visual.test.tsx`                                                             | Screenshots in the light and the dark theme of editor markup and of unsafe markup after sanitising                                                                |
| `components/sweepstakes/__tests__/giveaway-participation-card.test.tsx`, `terms-modal.test.tsx`                | The description and the custom terms are sanitised where participants see them                                                                                    |
| `procedures/sweepstakes/__tests__/shared.test.ts`, `publish-sweepstakes.test.ts`, `update-sweepstakes.test.ts` | Publish and update store the sanitised description and custom terms                                                                                               |
| `apps/web-e2e/src/rich-text.spec.ts`                                                                           | On a deployment, a public giveaway page renders on the server (with JavaScript off) and its description holds no unsafe markup                                    |

## Not covered here

The site does not send a Content-Security-Policy yet. That is tracked in GGonryun/giveaway.dog#225.
