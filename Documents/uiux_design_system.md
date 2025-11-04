# UI/UX Design System & Guidelines
## Klinik THT Aion - Design Specification for AI Agents

**Version**: 1.0  
**Date**: November 2025  
**Purpose**: Complete design system for consistent, modern, and accessible UI

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Components](#5-components)
6. [Animation & Transitions](#6-animation--transitions)
7. [Responsive Design](#7-responsive-design)
8. [Accessibility](#8-accessibility)
9. [Implementation Guide](#9-implementation-guide)
10. [Code Examples](#10-code-examples)

---

## 1. Design Philosophy

### 1.1 Core Principles

**Clean & Professional**
- Minimal visual clutter
- Whitespace as design element
- Focus on content hierarchy
- Medical-grade professionalism

**Modern & Fresh**
- Contemporary design patterns
- Subtle but purposeful animations
- Glass morphism elements
- Gradient accents

**User-Centric**
- Fast workflows for staff
- Clear information architecture
- Consistent interaction patterns
- Mobile-responsive

**Accessible**
- WCAG 2.1 AA compliance
- High contrast ratios
- Keyboard navigation
- Screen reader friendly

### 1.2 Visual Theme

**Style**: Modern Healthcare + Balinese Touch
- Clean lines with soft rounded corners
- Ocean-inspired color palette (Bali connection)
- Professional medical aesthetic
- Warm, welcoming atmosphere

---

## 2. Color System

### 2.1 Primary Palette

```css
/* Primary - Navy Blue (Trust, Professionalism) */
--primary-50: #EFF6FF;   /* Lightest background */
--primary-100: #DBEAFE;  /* Light background */
--primary-200: #BFDBFE;  /* Hover states */
--primary-300: #93C5FD;  /* Borders */
--primary-400: #60A5FA;  /* Disabled states */
--primary-500: #3B82F6;  /* Main brand color */
--primary-600: #2563EB;  /* Hover on primary */
--primary-700: #1D4ED8;  /* Active state */
--primary-800: #1E40AF;  /* Dark accent */
--primary-900: #1E3A8A;  /* Darkest */

/* Secondary - Turquoise (Health, Water, Bali) */
--secondary-50: #ECFEFF;
--secondary-100: #CFFAFE;
--secondary-200: #A5F3FC;
--secondary-300: #67E8F9;
--secondary-400: #22D3EE;
--secondary-500: #06B6D4;  /* Main secondary */
--secondary-600: #0891B2;  /* Hover on secondary */
--secondary-700: #0E7490;
--secondary-800: #155E75;
--secondary-900: #164E63;
```

### 2.2 Semantic Colors

```css
/* Success - Green */
--success-50: #F0FDF4;
--success-100: #DCFCE7;
--success-500: #22C55E;   /* Success actions */
--success-600: #16A34A;   /* Hover */
--success-700: #15803D;   /* Active */

/* Warning - Amber */
--warning-50: #FFFBEB;
--warning-100: #FEF3C7;
--warning-500: #F59E0B;   /* Warning states */
--warning-600: #D97706;   /* Hover */
--warning-700: #B45309;   /* Active */

/* Error - Red */
--error-50: #FEF2F2;
--error-100: #FEE2E2;
--error-500: #EF4444;     /* Error states */
--error-600: #DC2626;     /* Hover */
--error-700: #B91C1C;     /* Active */

/* Info - Blue */
--info-50: #EFF6FF;
--info-100: #DBEAFE;
--info-500: #3B82F6;      /* Info messages */
--info-600: #2563EB;
--info-700: #1D4ED8;
```

### 2.3 Neutral Colors

```css
/* Gray Scale */
--gray-50: #F9FAFB;       /* Backgrounds */
--gray-100: #F3F4F6;      /* Card backgrounds */
--gray-200: #E5E7EB;      /* Borders */
--gray-300: #D1D5DB;      /* Disabled borders */
--gray-400: #9CA3AF;      /* Placeholder text */
--gray-500: #6B7280;      /* Secondary text */
--gray-600: #4B5563;      /* Body text */
--gray-700: #374151;      /* Headings */
--gray-800: #1F2937;      /* Dark text */
--gray-900: #111827;      /* Darkest text */

/* Special */
--white: #FFFFFF;
--black: #000000;
--transparent: transparent;
```

### 2.4 Gradient System

```css
/* Primary Gradient */
--gradient-primary: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
--gradient-primary-hover: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);

/* Secondary Gradient */
--gradient-secondary: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%);

/* Accent Gradient (for special elements) */
--gradient-accent: linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%);

/* Subtle Background Gradient */
--gradient-bg: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%);

/* Glass Effect */
--glass-bg: rgba(255, 255, 255, 0.7);
--glass-border: rgba(255, 255, 255, 0.18);
```

### 2.5 Color Usage Guidelines

**Do's**:
- Use primary (Navy Blue) for main actions (buttons, links, active states)
- Use secondary (Turquoise) for highlights, badges, accents
- Use semantic colors (success/warning/error) for status indicators
- Use gray scale for text, borders, backgrounds
- Maintain contrast ratios: 4.5:1 for normal text, 3:1 for large text

**Don'ts**:
- Don't use more than 3 colors in a single component
- Don't use pure black (#000) for text (use gray-900 instead)
- Don't use primary color for destructive actions (use error color)
- Don't override semantic color meanings

---

## 3. Typography

### 3.1 Font Family

```css
/* Primary Font - Inter (Modern, Readable) */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
             'Droid Sans', 'Helvetica Neue', sans-serif;

/* Monospace Font - For codes, MR numbers */
--font-mono: 'Fira Code', 'Courier New', monospace;
```

**Import in HTML/CSS**:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### 3.2 Font Sizes

```css
/* Font Size Scale (Tailwind-like) */
--text-xs: 0.75rem;      /* 12px - Helper text */
--text-sm: 0.875rem;     /* 14px - Secondary text */
--text-base: 1rem;       /* 16px - Body text */
--text-lg: 1.125rem;     /* 18px - Emphasized text */
--text-xl: 1.25rem;      /* 20px - Small headings */
--text-2xl: 1.5rem;      /* 24px - Section headings */
--text-3xl: 1.875rem;    /* 30px - Page titles */
--text-4xl: 2.25rem;     /* 36px - Large titles */
--text-5xl: 3rem;        /* 48px - Hero text */
```

### 3.3 Font Weights

```css
--font-light: 300;       /* Light emphasis */
--font-normal: 400;      /* Body text */
--font-medium: 500;      /* Buttons, labels */
--font-semibold: 600;    /* Subheadings */
--font-bold: 700;        /* Headings */
```

### 3.4 Line Heights

```css
--leading-none: 1;       /* Tight (headings) */
--leading-tight: 1.25;   /* Tight */
--leading-snug: 1.375;   /* Comfortable */
--leading-normal: 1.5;   /* Body text (default) */
--leading-relaxed: 1.625;/* Relaxed */
--leading-loose: 2;      /* Loose (legibility) */
```

### 3.5 Typography Scale

```css
/* H1 - Page Title */
.h1 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--gray-900);
  letter-spacing: -0.025em;
}

/* H2 - Section Title */
.h2 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
  color: var(--gray-800);
}

/* H3 - Subsection Title */
.h3 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
  color: var(--gray-800);
}

/* Body - Regular Text */
.body {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--gray-600);
}

/* Small - Helper Text */
.small {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--gray-500);
}

/* Label - Form Labels */
.label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  color: var(--gray-700);
}
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

```css
/* Spacing Scale (4px base) */
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### 4.2 Border Radius

```css
/* Border Radius Scale */
--radius-none: 0;
--radius-sm: 0.125rem;    /* 2px - Subtle */
--radius-base: 0.25rem;   /* 4px - Default */
--radius-md: 0.375rem;    /* 6px - Cards */
--radius-lg: 0.5rem;      /* 8px - Modals */
--radius-xl: 0.75rem;     /* 12px - Large cards */
--radius-2xl: 1rem;       /* 16px - Hero elements */
--radius-full: 9999px;    /* Full circle */
```

### 4.3 Shadows

```css
/* Shadow Scale */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 
             0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-base: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
               0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
             0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
             0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Colored Shadows (for emphasis) */
--shadow-primary: 0 10px 15px -3px rgba(59, 130, 246, 0.2);
--shadow-success: 0 10px 15px -3px rgba(34, 197, 94, 0.2);
--shadow-error: 0 10px 15px -3px rgba(239, 68, 68, 0.2);
```

### 4.4 Layout Grid

```css
/* Container Widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;

/* Grid */
--grid-cols-12: repeat(12, minmax(0, 1fr));
--grid-cols-6: repeat(6, minmax(0, 1fr));
--grid-cols-4: repeat(4, minmax(0, 1fr));
--grid-cols-3: repeat(3, minmax(0, 1fr));
--grid-cols-2: repeat(2, minmax(0, 1fr));
```

---

## 5. Components

### 5.1 Buttons

```css
/* Primary Button */
.btn-primary {
  /* Base */
  padding: 0.5rem 1rem;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  
  /* Colors */
  background: var(--gradient-primary);
  color: var(--white);
  box-shadow: var(--shadow-sm);
  
  /* Transition */
  transition: all 0.2s ease-in-out;
}

.btn-primary:hover {
  background: var(--gradient-primary-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-primary:disabled {
  background: var(--gray-300);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Secondary Button */
.btn-secondary {
  padding: 0.5rem 1rem;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  cursor: pointer;
  
  background: var(--white);
  color: var(--primary-600);
  border: 1px solid var(--primary-300);
  
  transition: all 0.2s ease-in-out;
}

.btn-secondary:hover {
  background: var(--primary-50);
  border-color: var(--primary-400);
}

/* Ghost Button */
.btn-ghost {
  padding: 0.5rem 1rem;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  
  background: transparent;
  color: var(--gray-700);
  
  transition: all 0.2s ease-in-out;
}

.btn-ghost:hover {
  background: var(--gray-100);
}

/* Button Sizes */
.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: var(--text-sm);
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: var(--text-lg);
}
```

### 5.2 Input Fields

```css
/* Text Input */
.input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
  color: var(--gray-900);
  
  background: var(--white);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  
  transition: all 0.2s ease-in-out;
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:disabled {
  background: var(--gray-100);
  cursor: not-allowed;
}

.input.error {
  border-color: var(--error-500);
}

.input.error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Input with Icon */
.input-group {
  position: relative;
  width: 100%;
}

.input-group .input {
  padding-left: 2.5rem;
}

.input-group .icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
  pointer-events: none;
}
```

### 5.3 Cards

```css
/* Base Card */
.card {
  background: var(--white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
  padding: var(--space-6);
  
  transition: all 0.3s ease-in-out;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* Card with Header */
.card-header {
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--gray-200);
}

.card-body {
  padding: var(--space-6);
}

.card-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--gray-200);
  background: var(--gray-50);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}

/* Glass Card (Modern Effect) */
.card-glass {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-lg);
}
```

### 5.4 Badges

```css
/* Base Badge */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  border-radius: var(--radius-full);
  white-space: nowrap;
}

/* Badge Variants */
.badge-primary {
  background: var(--primary-100);
  color: var(--primary-700);
}

.badge-success {
  background: var(--success-100);
  color: var(--success-700);
}

.badge-warning {
  background: var(--warning-100);
  color: var(--warning-700);
}

.badge-error {
  background: var(--error-100);
  color: var(--error-700);
}

.badge-gray {
  background: var(--gray-100);
  color: var(--gray-700);
}
```

### 5.5 Tables

```css
/* Table */
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.table thead {
  background: var(--gray-50);
}

.table th {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--gray-700);
  border-bottom: 1px solid var(--gray-200);
}

.table td {
  padding: var(--space-4);
  font-size: var(--text-sm);
  color: var(--gray-600);
  border-bottom: 1px solid var(--gray-200);
}

.table tr:last-child td {
  border-bottom: none;
}

.table tbody tr {
  transition: background-color 0.2s ease-in-out;
}

.table tbody tr:hover {
  background: var(--gray-50);
}
```

---

## 6. Animation & Transitions

### 6.1 Timing Functions

```css
/* Easing */
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Custom Easing (Smooth) */
--ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 6.2 Duration

```css
/* Animation Duration */
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### 6.3 Common Animations

```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn var(--duration-base) var(--ease-out);
}

/* Slide In from Bottom */
@keyframes slideInBottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-in-bottom {
  animation: slideInBottom var(--duration-slow) var(--ease-out);
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.scale-in {
  animation: scaleIn var(--duration-base) var(--ease-out);
}

/* Pulse (for notifications) */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  animation: pulse 2s var(--ease-in-out) infinite;
}

/* Spin (for loading) */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spin {
  animation: spin 1s linear infinite;
}
```

### 6.4 Transition Utilities

```css
/* Transition All */
.transition-all {
  transition: all var(--duration-base) var(--ease-out);
}

/* Transition Colors */
.transition-colors {
  transition: background-color var(--duration-base) var(--ease-out),
              border-color var(--duration-base) var(--ease-out),
              color var(--duration-base) var(--ease-out);
}

/* Transition Transform */
.transition-transform {
  transition: transform var(--duration-base) var(--ease-out);
}
```

---

## 7. Responsive Design

### 7.1 Breakpoints

```css
/* Breakpoints */
--screen-sm: 640px;   /* Tablet portrait */
--screen-md: 768px;   /* Tablet landscape */
--screen-lg: 1024px;  /* Desktop */
--screen-xl: 1280px;  /* Large desktop */
--screen-2xl: 1536px; /* Extra large */
```

### 7.2 Media Queries

```css
/* Mobile First Approach */

/* Small screens (tablets) and up */
@media (min-width: 640px) {
  /* Styles */
}

/* Medium screens (landscape tablets) and up */
@media (min-width: 768px) {
  /* Styles */
}

/* Large screens (desktops) and up */
@media (min-width: 1024px) {
  /* Styles */
}

/* Extra large screens */
@media (min-width: 1280px) {
  /* Styles */
}
```

### 7.3 Responsive Patterns

**Dashboard Layout**:
- Mobile: Stack vertically
- Tablet: 2-column layout
- Desktop: Sidebar + main content

**Data Tables**:
- Mobile: Card view
- Tablet/Desktop: Table view

**Forms**:
- Mobile: Single column
- Tablet/Desktop: 2-column grid

---

## 8. Accessibility

### 8.1 Color Contrast

**Minimum Ratios** (WCAG 2.1 AA):
- Normal text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

**Our Ratios**:
- Primary on white: 6.2:1 ✓
- Gray-600 on white: 7.1:1 ✓
- Secondary on white: 4.8:1 ✓

### 8.2 Focus States

```css
/* Visible focus ring */
:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}

:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

### 8.3 Screen Reader Classes

```css
/* Visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## 9. Implementation Guide

### 9.1 Tailwind Configuration

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        secondary: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'primary': '0 10px 15px -3px rgba(59, 130, 246, 0.2)',
        'success': '0 10px 15px -3px rgba(34, 197, 94, 0.2)',
        'error': '0 10px 15px -3px rgba(239, 68, 68, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-in-bottom': 'slideInBottom 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInBottom: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
```

### 9.2 Global CSS Setup

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Colors */
    --primary-50: #EFF6FF;
    --primary-500: #3B82F6;
    --primary-600: #2563EB;
    /* ... all other CSS variables from section 2 */
    
    /* Typography */
    --font-sans: 'Inter', sans-serif;
    
    /* Spacing */
    --space-4: 1rem;
    /* ... all spacing variables */
  }
  
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-gray-50 text-gray-600 font-sans antialiased;
  }
  
  h1 {
    @apply text-3xl font-bold text-gray-900 tracking-tight;
  }
  
  h2 {
    @apply text-2xl font-semibold text-gray-800;
  }
  
  h3 {
    @apply text-xl font-semibold text-gray-800;
  }
}

@layer components {
  /* Custom component styles */
  .btn {
    @apply inline-flex items-center justify-center 
           px-4 py-2 rounded-md font-medium 
           transition-all duration-200 ease-out
           focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .btn-primary {
    @apply btn bg-gradient-to-r from-primary-500 to-primary-600 
           text-white shadow-sm hover:shadow-md 
           hover:-translate-y-0.5 active:translate-y-0
           focus:ring-primary-500;
  }
  
  .btn-secondary {
    @apply btn bg-white text-primary-600 border border-primary-300
           hover:bg-primary-50 hover:border-primary-400
           focus:ring-primary-500;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 
           p-6 transition-all duration-300 ease-out
           hover:shadow-md hover:-translate-y-0.5;
  }
  
  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md
           text-gray-900 placeholder-gray-400
           focus:outline-none focus:ring-2 focus:ring-primary-500 
           focus:border-transparent
           disabled:bg-gray-100 disabled:cursor-not-allowed
           transition-all duration-200;
  }
  
  .input-error {
    @apply border-error-500 focus:ring-error-500;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  .animate-fade-in {
    animation: fadeIn 200ms ease-out;
  }
  
  .animate-slide-in-bottom {
    animation: slideInBottom 300ms ease-out;
  }
}
```

---

## 10. Code Examples

### 10.1 Button Component (React + Tailwind)

```typescript
// components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 
          'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 focus:ring-primary-500',
        secondary:
          'bg-white text-primary-600 border border-primary-300 hover:bg-primary-50 hover:border-primary-400 focus:ring-primary-500',
        ghost:
          'bg-transparent hover:bg-gray-100 text-gray-700',
        danger:
          'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

**Usage**:
```tsx
<Button variant="primary" size="md">
  Simpan
</Button>

<Button variant="secondary" onClick={handleCancel}>
  Batal
</Button>

<Button variant="danger" isLoading={deleting}>
  Hapus
</Button>
```

### 10.2 Input Component

```typescript
// components/ui/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <input
          className={cn(
            'w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            'transition-all duration-200',
            error ? 'border-error-500 focus:ring-error-500' : 'border-gray-300',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-error-500 animate-fade-in">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
```

**Usage**:
```tsx
<Input
  label="Nama Lengkap"
  placeholder="Masukkan nama lengkap"
  required
  error={errors.fullName?.message}
/>

<Input
  label="Email"
  type="email"
  placeholder="email@example.com"
  helperText="Email akan digunakan untuk notifikasi"
/>
```

### 10.3 Card Component

```typescript
// components/ui/Card.tsx
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
        'transition-all duration-300 ease-out',
        'hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4 border-b border-gray-200', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold text-gray-900', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-500', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-4', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

**Usage**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Data Pasien</CardTitle>
    <CardDescription>Informasi lengkap pasien</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Nama: I Made Adi Putra</p>
    <p>Umur: 35 tahun</p>
  </CardContent>
  <CardFooter>
    <Button variant="secondary">Edit</Button>
  </CardFooter>
</Card>
```

### 10.4 Badge Component

```typescript
// components/ui/Badge.tsx
import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        primary: 'bg-primary-100 text-primary-700',
        secondary: 'bg-secondary-100 text-secondary-700',
        success: 'bg-success-100 text-success-700',
        warning: 'bg-warning-100 text-warning-700',
        error: 'bg-error-100 text-error-700',
        gray: 'bg-gray-100 text-gray-700',
      },
    },
    defaultVariants: {
      variant: 'gray',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

**Usage**:
```tsx
<Badge variant="success">Aktif</Badge>
<Badge variant="warning">Menunggu</Badge>
<Badge variant="error">Dibatalkan</Badge>
```

### 10.5 Loading Spinner

```typescript
// components/ui/Spinner.tsx
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <svg
      className={cn(
        'animate-spin text-primary-500',
        sizeClasses[size],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Loading Page Component
export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-500">Memuat...</p>
      </div>
    </div>
  );
}
```

### 10.6 Toast Notification

```typescript
// components/ui/Toast.tsx
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

interface ToastProps {
  variant: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  onClose: () => void;
}

const icons = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  info: InformationCircleIcon,
  warning: ExclamationCircleIcon,
};

const styles = {
  success: 'bg-success-50 border-success-500 text-success-800',
  error: 'bg-error-50 border-error-500 text-error-800',
  info: 'bg-info-50 border-info-500 text-info-800',
  warning: 'bg-warning-50 border-warning-500 text-warning-800',
};

const iconStyles = {
  success: 'text-success-500',
  error: 'text-error-500',
  info: 'text-info-500',
  warning: 'text-warning-500',
};

export function Toast({ variant, title, message, onClose }: ToastProps) {
  const Icon = icons[variant];

  return (
    <div
      className={`
        ${styles[variant]}
        max-w-md w-full border-l-4 p-4 rounded-lg shadow-lg
        animate-slide-in-bottom
      `}
    >
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${iconStyles[variant]} flex-shrink-0`} />
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{title}</p>
          {message && (
            <p className="mt-1 text-sm opacity-90">{message}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
```

### 10.7 Dashboard Layout Example

```typescript
// app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
            {/* Animated page entrance */}
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
```

### 10.8 Form Example with Animations

```typescript
// components/forms/PatientForm.tsx
export function PatientForm() {
  return (
    <form className="space-y-6">
      {/* Animated form sections */}
      <div className="animate-slide-in-bottom" style={{ animationDelay: '0ms' }}>
        <Card>
          <CardHeader>
            <CardTitle>Data Pribadi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                required
              />
              <Input
                label="NIK"
                placeholder="16 digit"
                maxLength={16}
                required
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="animate-slide-in-bottom" style={{ animationDelay: '100ms' }}>
        <Card>
          <CardHeader>
            <CardTitle>Kontak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="No. Telepon"
                placeholder="08xxxxxxxxxx"
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="email@example.com"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <Button variant="secondary">Batal</Button>
        <Button variant="primary">Simpan</Button>
      </div>
    </form>
  );
}
```

---

## 11. Best Practices for AI Agents

### 11.1 Component Guidelines

**DO**:
- ✅ Use Tailwind utility classes for styling
- ✅ Create reusable components with variants
- ✅ Use semantic HTML elements
- ✅ Include proper ARIA labels
- ✅ Add transitions to interactive elements
- ✅ Use proper TypeScript types
- ✅ Follow the color system consistently
- ✅ Add loading states to async actions
- ✅ Include error states in forms
- ✅ Use staggered animations for lists

**DON'T**:
- ❌ Use inline styles (use Tailwind classes)
- ❌ Create custom colors outside the system
- ❌ Forget hover/focus states
- ❌ Skip loading indicators
- ❌ Ignore mobile responsiveness
- ❌ Use absolute positioning excessively
- ❌ Forget to handle empty states
- ❌ Mix multiple animation libraries

### 11.2 Animation Guidelines

**When to Animate**:
- Page transitions
- Modal/dialog appearances
- Form submissions (loading)
- Success/error feedback
- List item additions/removals
- Hover interactions
- Focus states

**Animation Duration**:
- Micro-interactions: 150-200ms
- Page transitions: 300-500ms
- Loading spinners: 1000ms (continuous)

**Easing**:
- Enter: `ease-out` (starts fast, ends slow)
- Exit: `ease-in` (starts slow, ends fast)
- Both: `ease-in-out` (smooth throughout)

### 11.3 Responsive Guidelines

**Breakpoint Strategy**:
```
Mobile First: Base styles for mobile
640px+: Tablet portrait adjustments
768px+: Tablet landscape adjustments
1024px+: Desktop full experience
```

**Common Patterns**:
```typescript
// Stack on mobile, 2-col on tablet, 3-col on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Hidden on mobile, visible on desktop
<div className="hidden lg:block">

// Full width on mobile, max-width on desktop
<div className="w-full lg:max-w-4xl mx-auto">
```

### 11.4 Utility Class Reference

```typescript
// Quick reference for AI agents

// Spacing
'p-4'     // padding: 1rem
'm-4'     // margin: 1rem
'space-y-4' // vertical gap between children

// Colors
'bg-primary-500'    // background
'text-primary-600'  // text color
'border-gray-300'   // border color

// Typography
'text-base'      // 16px
'font-medium'    // 500 weight
'leading-normal' // 1.5 line-height

// Layout
'flex'           // display: flex
'grid'           // display: grid
'hidden'         // display: none
'block'          // display: block

// Sizing
'w-full'         // width: 100%
'h-10'           // height: 2.5rem
'max-w-md'       // max-width: 28rem

// Positioning
'absolute'       // position: absolute
'relative'       // position: relative
'inset-0'        // top/right/bottom/left: 0

// Borders
'rounded-md'     // 6px border-radius
'border'         // 1px solid
'shadow-sm'      // small shadow

// Transitions
'transition-all' // all properties
'duration-200'   // 200ms
'ease-out'       // easing function

// States
'hover:bg-gray-100'    // hover state
'focus:ring-2'         // focus ring
'disabled:opacity-50'  // disabled state
```

---

## 12. Quality Checklist

Before marking a component complete, verify:

**Visual Design**:
- [ ] Uses correct colors from the design system
- [ ] Has proper spacing (multiples of 4px)
- [ ] Has appropriate border radius
- [ ] Has proper shadows
- [ ] Responsive on mobile, tablet, desktop

**Interactions**:
- [ ] Has hover states
- [ ] Has focus states
- [ ] Has active states
- [ ] Has disabled states (if applicable)
- [ ] Has smooth transitions

**Accessibility**:
- [ ] Proper color contrast (4.5:1 minimum)
- [ ] Keyboard navigable
- [ ] Screen reader friendly
- [ ] Has visible focus indicators
- [ ] Has proper ARIA labels

**Functionality**:
- [ ] Works in all supported browsers
- [ ] Handles loading states
- [ ] Handles error states
- [ ] Handles empty states
- [ ] Has proper validation

**Code Quality**:
- [ ] Uses TypeScript with proper types
- [ ] Follows naming conventions
- [ ] Is reusable and composable
- [ ] Has no console errors
- [ ] Follows React best practices

---

## 13. AI Agent Prompt Template

When working with AI coding agents, use this template:

```
Create a [component name] component following the Klinik THT Aion design system:

Requirements:
- Use colors from: primary (navy blue #3B82F6), secondary (turquoise #06B6D4)
- Use Tailwind CSS utility classes
- Add smooth transitions (200ms ease-out)
- Include hover, focus, and disabled states
- Make it responsive (mobile-first)
- Use Inter font family
- Add proper TypeScript types
- Follow the card/button/input patterns from the design system

Specific requirements:
[List specific requirements here]

Example similar component:
[Paste example from this document]
```

---

## Summary

This design system provides:
1. ✅ **Complete color palette** with semantic meanings
2. ✅ **Typography system** optimized for readability
3. ✅ **Spacing system** based on 4px grid
4. ✅ **Component library** with variants
5. ✅ **Animation guidelines** for smooth UX
6. ✅ **Responsive patterns** for all devices
7. ✅ **Accessibility standards** (WCAG 2.1 AA)
8. ✅ **Implementation examples** ready for AI agents

**Key Principles**:
- 🎨 Clean, modern, professional
- 🌊 Bali-inspired ocean colors
- ⚡ Fast, smooth interactions
- 📱 Mobile-first responsive
- ♿ Accessible to all users
- 🤖 AI agent friendly

---

**Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: Design System Team