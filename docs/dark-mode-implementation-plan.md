# Dark Mode Implementation Plan

## Current Status

### What Already Exists ✅
- **next-themes** package (v0.4.6) already installed in dependencies
- **Complete dark mode color scheme** defined in `app/globals.css` (lines 158-230)
- **Custom `.dark` variant** configured in Tailwind (line 5 of globals.css)
- **User settings infrastructure** at `/account` page with tab-based interface
- **localStorage pattern** already established in codebase

### What's Missing ❌
- No ThemeProvider wrapper around the app
- No mechanism to apply `.dark` class to HTML element
- No user-facing theme toggle component
- No settings UI for theme selection
- Theme preference not persisted to localStorage

## CSS Discrepancy Found

### Platform Brand Colors Not Defined in Dark Mode

The following platform-specific colors are defined in `:root` (light mode) but missing from `.dark`:

```css
/* Missing from .dark section: */
--steam-1 through --steam-5
--discord-1 through --discord-3
--twitch-1
--kick-1
```

**Recommendation:** These are brand colors and should probably stay consistent across themes. However, if you want dark mode versions, you should add them to the `.dark` section (after line 220).

## Implementation Steps

### Step 1: Create Theme Provider Component
**File:** `components/theme/theme-provider.tsx`

```typescript
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

**Purpose:**
- Wraps next-themes ThemeProvider for client-side theme management
- Enables theme switching and persistence to localStorage
- Provides useTheme hook to all child components

### Step 2: Update Root Layout
**File:** `app/layout.tsx`

**Changes needed:**
1. Add `suppressHydrationWarning` to `<html>` element
2. Wrap app content with ThemeProvider
3. Configure theme settings:
   - `attribute="class"` - applies theme via class on html element
   - `defaultTheme="system"` - defaults to system preference
   - `enableSystem={true}` - enables system theme detection
   - `storageKey="giveaway-theme"` - localStorage key for persistence

**Example:**
```tsx
<html lang="en" suppressHydrationWarning>
  <body>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="giveaway-theme"
      disableTransitionOnChange
    >
      <SessionProvider>
        {/* existing content */}
      </SessionProvider>
    </ThemeProvider>
  </body>
</html>
```

### Step 3: Create Theme Toggle Component
**File:** `components/theme/theme-toggle.tsx`

**Component requirements:**
- Use `useTheme()` hook from next-themes
- Provide 3 options: "light", "dark", "system"
- Use existing shadcn/ui components (RadioGroup recommended)
- Display current selection
- Handle theme changes via `setTheme()` function

**UI Options:**
- **Option A:** RadioGroup with 3 radio buttons (recommended for settings page)
- **Option B:** Select dropdown (compact alternative)
- **Option C:** Toggle buttons with icons (visual alternative)

**Example structure:**
```tsx
'use client'

import { useTheme } from 'next-themes'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Choose how the app looks on this device
        </p>
      </div>

      <RadioGroup value={theme} onValueChange={setTheme}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="light" id="light" />
          <Label htmlFor="light">Light</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="dark" id="dark" />
          <Label htmlFor="dark">Dark</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="system" id="system" />
          <Label htmlFor="system">System</Label>
        </div>
      </RadioGroup>
    </div>
  )
}
```

### Step 4: Add Appearance Tab to User Settings
**File:** `components/account/page.tsx`

**Changes needed:**
1. Add new tab option "Appearance" to the tabs array
2. Add tab content that renders ThemeToggle component
3. Follow existing tab pattern in the component

**Tab structure to add:**
```tsx
{
  value: "appearance",
  label: "Appearance",
  content: <ThemeToggle />
}
```

### Step 5: (Optional) Add Quick Theme Toggle to Header
**File:** Consider adding to main navigation/header

**Component:** `components/theme/theme-toggle-icon.tsx`

**Purpose:**
- Quick access to theme switching without going to settings
- Icon-based toggle (sun/moon icon)
- Can use DropdownMenu for compact 3-option selector

## Technical Details

### How next-themes Works
1. Reads initial theme from localStorage (key: `giveaway-theme`)
2. Falls back to system preference if no saved theme
3. Applies theme by adding `.dark` class to `<html>` element
4. Saves theme preference to localStorage on change
5. Automatically handles system theme changes

### Theme Persistence
- **Storage:** localStorage (machine-local, as required)
- **Key:** `giveaway-theme` (configurable in ThemeProvider)
- **Values:** `"light"`, `"dark"`, or `"system"`
- **Scope:** Per-browser, per-device (not synced to user account)

### No Configuration Changes Needed
- ✅ Tailwind v4 inline approach already in use
- ✅ No tailwind.config.ts needed
- ✅ Dark mode colors already comprehensive
- ✅ Custom `.dark` variant already configured

### Hydration Handling
- `suppressHydrationWarning` on `<html>` prevents React warnings
- `disableTransitionOnChange` prevents flash during initial render
- next-themes handles SSR/CSR mismatch automatically

## Files to Create

1. **`components/theme/theme-provider.tsx`**
   - Theme provider wrapper component
   - ~15 lines of code

2. **`components/theme/theme-toggle.tsx`**
   - Theme selection UI for settings page
   - ~50-70 lines of code

3. **`components/theme/theme-toggle-icon.tsx`** (optional)
   - Quick toggle for header/navigation
   - ~40-50 lines of code

## Files to Modify

1. **`app/layout.tsx`**
   - Add ThemeProvider wrapper
   - Add suppressHydrationWarning to html element
   - ~5 line changes

2. **`components/account/page.tsx`**
   - Add "Appearance" tab
   - Import and render ThemeToggle
   - ~10-15 line changes

3. **`app/globals.css`** (optional)
   - Add dark mode versions of platform brand colors if desired
   - Lines 88-104 colors could be duplicated in .dark section

## Testing Checklist

After implementation, verify:

- [ ] Theme toggles between light, dark, and system
- [ ] Theme persists after page reload
- [ ] System theme option respects OS preference
- [ ] No flash of wrong theme on page load
- [ ] All color variables work in both themes
- [ ] Sidebar colors update correctly
- [ ] Chart colors update correctly
- [ ] Platform colors (Steam, Discord, etc.) look good in dark mode
- [ ] Mobile responsive theme toggle
- [ ] Settings page appearance tab works
- [ ] localStorage contains correct theme value

## Expected Behavior

### Light Mode
- Clean, bright interface
- Uses colors from `:root` section (lines 41-156)
- Background: `oklch(0.994 0 0)` (near white)
- Foreground: `oklch(0 0 0)` (black)

### Dark Mode
- Dark, comfortable interface for low-light environments
- Uses colors from `.dark` section (lines 158-230)
- Background: `oklch(0.1344 0 0)` (very dark gray)
- Foreground: `oklch(0.9845 0.0011 247.8583)` (near white with slight blue tint)

### System Mode
- Automatically matches OS theme preference
- Updates when user changes OS theme
- No manual intervention needed

## Future Enhancements (Out of Scope)

- User account-synced theme preference (currently machine-local only)
- Per-page theme overrides
- Custom theme colors
- High contrast mode
- Automatic theme switching based on time of day

## Additional Notes

### Brand Colors in Dark Mode
Currently, Steam, Discord, Twitch, and Kick brand colors are only defined in light mode. These are typically kept consistent across themes to maintain brand recognition. If you want different shades for dark mode, add them to the `.dark` section.

### CSS Custom Properties
The color system uses OKLCH color space, which provides:
- Better perceptual uniformity than HSL
- More vibrant colors
- Better lightness control
- Future-proof for wide gamut displays

### Migration Path
Since the CSS already has dark mode colors defined, this is a **non-breaking change**. The app will continue to work in light mode until users explicitly switch themes.
