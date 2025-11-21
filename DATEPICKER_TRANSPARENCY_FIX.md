# DatePicker Component - Transparency Issue Analysis & Fix

## 🔍 Problem Analysis

**Issue**: When clicking on the DatePicker, the calendar popover appears but is **transparent/invisible** - you can't see or interact with the month/year navigation.

**Root Causes**:

1. **CSS Variable Mismatch**: The `--popover` CSS variable is set to white (`0 0% 100%`) but the text color `--popover-foreground` is also very dark, making contrast issues possible.

2. **Missing `bg-popover` Styling**: The `PopoverContent` has `bg-popover` class which should apply the background, but the calendar might not be rendering correctly due to z-index or stacking context issues.

3. **Z-index Issue**: The popover has `z-50` but nested elements might have competing z-index values.

4. **Color Contrast**: The navigation buttons and calendar header might have opacity issues making them invisible.

---

## 📍 Affected Files

### 1. **`src/components/ui/popover.tsx`** - Popover Container
- Uses `z-50` for z-index
- Uses `bg-popover p-4` for styling
- Animations work but content might be hidden

### 2. **`src/components/ui/calendar.tsx`** - Calendar Component
- Navigation buttons have `opacity-50 hover:opacity-100` - might be too faint
- Caption label styling might be missing color
- Uses `bg-popover rounded-md border` but might not render properly

### 3. **`src/components/ui/date-picker.tsx`** - DatePicker Container
- Popover trigger and content are properly configured
- Issue is in the rendering of nested components

### 4. **`src/app/globals.css`** - CSS Variables
- `--popover: 0 0% 100%` (white)
- `--popover-foreground: 222 47% 11%` (very dark) - should be OK
- No specific calendar styling

---

## 🔧 Fixes

### Fix 1: Update Calendar Component with Better Styling

**File**: `src/components/ui/calendar.tsx`

```typescript
"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-3 bg-white rounded-md border border-gray-200 shadow-md",
        className
      )}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-semibold text-gray-900", // FIXED: Added color
        nav: "space-x-1 flex items-center",
        nav_button:
          "h-7 w-7 bg-white p-0 opacity-100 hover:opacity-100 hover:bg-gray-100 inline-flex items-center justify-center rounded-md border border-gray-300", // FIXED: opacity and colors
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-gray-700 rounded-md w-9 font-normal text-[0.8rem]", // FIXED: Added color
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative",
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          "hover:bg-blue-100 text-gray-900 rounded-md inline-flex items-center justify-center" // FIXED: Added color and hover
        ),
        day_selected:
          "bg-blue-600 text-white hover:bg-blue-700 hover:text-white", // FIXED: Proper colors
        day_today: "bg-blue-100 text-blue-900 font-semibold",
        day_outside: "text-gray-400 opacity-50",
        day_disabled: "text-gray-300 opacity-50 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-blue-100 aria-selected:text-blue-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
```

### Fix 2: Update PopoverContent with Better Z-index and Styling

**File**: `src/components/ui/popover.tsx`

```typescript
"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-[9999] w-auto rounded-md border border-gray-200 bg-white p-4 text-gray-900 shadow-lg outline-none", // FIXED: z-index, colors, shadow
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
```

### Fix 3: Update DatePicker with Better Styling

**File**: `src/components/ui/date-picker.tsx`

```typescript
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  disabled,
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          className={cn(
            "w-full justify-between text-left font-normal",
            !value && "text-gray-500",
            className
          )}
        >
          {value ? (
            <span className="text-gray-900">{format(value, "d MMMM yyyy")}</span>
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className="h-4 w-4 opacity-100" /> {/* FIXED: opacity */}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date: Date | undefined) => {
            onChange?.(date ?? undefined);
            if (date) setOpen(false);
          }}
          disabled={(date: Date) => {
            if (disabled) return true;
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
```

---

## 🎯 Summary of Changes

### Calendar Component (`calendar.tsx`)

| Element | Before | After |
|---------|--------|-------|
| **Container** | `bg-popover` | `bg-white` |
| **Caption Label** | No color | `text-gray-900` |
| **Nav Buttons** | `opacity-50` | `opacity-100` |
| **Nav Button Background** | `bg-transparent` | `bg-white hover:bg-gray-100` |
| **Nav Button Border** | `border-transparent` | `border-gray-300` |
| **Head Cell** | `text-muted-foreground` | `text-gray-700` |
| **Day (default)** | No explicit color | `text-gray-900` |
| **Day (selected)** | `bg-primary` | `bg-blue-600` |
| **Day (today)** | `bg-accent` | `bg-blue-100` |
| **Day (disabled)** | `opacity-50` | `opacity-50 cursor-not-allowed` |

### PopoverContent (`popover.tsx`)

| Property | Before | After |
|----------|--------|-------|
| **Z-index** | `z-50` | `z-[9999]` |
| **Background** | `bg-popover` | `bg-white` |
| **Text Color** | `text-popover-foreground` | `text-gray-900` |
| **Border Color** | Default CSS var | `border-gray-200` |
| **Shadow** | `shadow-md` | `shadow-lg` |
| **Border** | Default CSS var | Explicit `border-gray-200` |

### DatePicker (`date-picker.tsx`)

| Element | Before | After |
|---------|--------|-------|
| **Icon Opacity** | `opacity-50` | `opacity-100` |
| **Placeholder Color** | `text-muted-foreground` | `text-gray-500` |
| **Selected Text Color** | Default | `text-gray-900` |

---

## 🚀 Implementation Steps

1. **Update Calendar Component**:
   ```bash
   # Replace calendar.tsx with the fixed version
   ```

2. **Update Popover Component**:
   ```bash
   # Replace popover.tsx with the fixed version
   ```

3. **Update DatePicker Component**:
   ```bash
   # Replace date-picker.tsx with the fixed version
   ```

4. **Test the Changes**:
   ```bash
   # Run dev server
   npm run dev

   # Navigate to medical records page
   # Try clicking on "Tanggal Kontrol" field
   # Verify calendar is now visible and interactive
   ```

---

## ✅ Expected Results After Fix

- ✅ Calendar popover is **fully visible** with white background
- ✅ Month/year navigation buttons are **clearly visible** and **clickable**
- ✅ Calendar dates are **readable** with proper contrast
- ✅ Selected date is **highlighted** in blue
- ✅ Hover effects **work** on dates and buttons
- ✅ Calendar **appears above** other elements (proper z-index)
- ✅ No more transparency issues

---

## 🎨 Why This Works

1. **Explicit Colors**: Instead of relying on CSS variables (`--popover`, `--popover-foreground`), we use explicit colors (`bg-white`, `text-gray-900`)

2. **Better Contrast**: Navigation buttons now have proper background colors and borders, making them visible

3. **Higher Z-index**: Changed from `z-50` to `z-[9999]` to ensure popover appears above all content

4. **Proper Shadow**: Enhanced shadow (`shadow-lg` instead of `shadow-md`) for better visual separation

5. **No Opacity Issues**: Removed opacity constraints on navigation elements so they're fully visible

---

## 📝 Alternative Solution (If CSS Variables Needed)

If you prefer to keep using CSS variables, update `globals.css`:

```css
@layer base {
  :root {
    /* ... existing variables ... */
    --popover: 0 0% 100%;                    /* Keep white */
    --popover-foreground: 222 47% 11%;       /* Keep dark text */
    --calendar-bg: 0 0% 100%;                /* Add calendar-specific */
    --calendar-border: 215 16% 87%;          /* Add calendar-specific */
    --calendar-button-opacity: 1;            /* Add button opacity */
  }
}
```

Then use in components:
```typescript
className={cn(
  "p-3 bg-popover rounded-md border",
  className
)}
```

---

## 🐛 Prevention Tips

1. **Test popover components** in isolation before integration
2. **Verify color contrast** using accessibility tools
3. **Check z-index stacking** context when using popover overlays
4. **Test on different screen sizes** and browsers
5. **Use explicit colors** instead of relying on CSS variables for critical UI elements

---

**Status**: Ready to implement
**Difficulty**: Easy
**Estimated Fix Time**: 5 minutes

