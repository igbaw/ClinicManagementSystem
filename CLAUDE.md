# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Clinic Management System** for Indonesian healthcare providers, built with Next.js 16 and Supabase. The system handles patient registration, appointments, medical records (SOAP format), prescriptions, billing, inventory, and integrates with Indonesian healthcare systems (BPJS, SATUSEHAT).

## Commands

All commands should be run from the `Apps/web` directory:

```bash
cd Apps/web
```

### Development
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing Individual Features
The system has no automated tests yet. Manual testing workflow is documented in `LAUNCH_CHECKLIST.md`.

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript 5 (strict mode)
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Auth**: Supabase Auth with session-based authentication
- **Styling**: Tailwind CSS v4 with custom design system + shadcn/ui components
- **UI Components**: shadcn/ui (14 components) with Radix UI primitives
- **State**: React Hook Form + Zod for forms; Zustand for global state (minimal use)
- **Icons**: Lucide React
- **External APIs**: BPJS VClaim, SATUSEHAT, Midtrans (payment)

### Project Structure

```
Apps/web/src/
├── app/
│   ├── (auth)/              # Auth routes (login)
│   ├── (dashboard)/         # Protected routes - all main features
│   │   ├── appointments/    # Appointment scheduling
│   │   ├── patients/        # Patient registration & search
│   │   ├── medical-records/ # SOAP format medical records
│   │   ├── prescriptions/   # Prescription management
│   │   ├── billing/         # Billing & payments
│   │   ├── inventory/       # Medication inventory
│   │   ├── bpjs/           # BPJS eligibility & SEP creation
│   │   ├── queue/          # Queue management system
│   │   ├── walk-in/        # Walk-in patient registration
│   │   └── reports/        # Revenue & operational reports
│   ├── api/                # API routes (mostly for client-side fetching)
│   └── globals.css         # Design system styles & CSS variables
├── components/
│   ├── ui/                 # Reusable UI components (Button, Card, Badge)
│   ├── layout/             # Sidebar, Header
│   └── [feature]/          # Feature-specific components
├── lib/
│   ├── supabase/           # Supabase client (client.ts, server.ts)
│   ├── api/                # External API integrations (bpjs, satusehat, midtrans)
│   └── utils.ts            # cn() utility for class merging
└── config/
    └── clinic.ts           # Clinic configuration (hours, slots, etc.)
```

### Authentication & Authorization

- **Authentication**: Server-side session validation in `(dashboard)/layout.tsx`
- **Client**: Use `createClient()` from `@/lib/supabase/client`
- **Server Components/Actions**: Use `createServerClient()` from `@/lib/supabase/server`
- **Session Check**: All dashboard routes auto-redirect to `/login` if unauthenticated
- **User Bootstrap**: First login auto-creates user record with 'admin' role

### Database

- **Location**: `Apps/web/supabase/migrations/`
- **Migrations**: 14 migration files covering schema, RLS policies, ICD-10 codes, queue system
- **Key Tables**: users, patients, appointments, medical_records, prescriptions, medications, billings, payments, icd10_codes, queue_items
- **Apply Migrations**: Run SQL files in Supabase Dashboard → SQL Editor (in order)

### Supabase Client Pattern

**Server Components & API Routes:**
```typescript
import { createServerClient } from '@/lib/supabase/server';
const supabase = await createServerClient();
```

**Client Components:**
```typescript
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
```

Never mix these - server client uses cookies(), client uses browser storage.

## Design System (shadcn/ui + Custom)

Complete design system using **shadcn/ui components** integrated with Bali-inspired colors. Full documentation in `DESIGN_SYSTEM_IMPLEMENTATION.md`.

**Colors:**
- Primary: Navy Blue (#3B82F6 → #1E3A8A) with gradient
- Secondary: Turquoise (#06B6D4 → #164E63)
- Semantic: Success (green), Warning (amber), Destructive (red)
- Muted: Slate grays for secondary text and borders

**shadcn/ui Components** (`@/components/ui`):

*Form Components:*
- `Input`: Text input with focus ring and error states
- `Label`: Accessible form labels (Radix UI)
- `Textarea`: Multi-line text input
- `Select`: Dropdown with Radix UI primitives (SelectTrigger, SelectContent, SelectItem)

*Data Display:*
- `Table`: Responsive tables (TableHeader, TableBody, TableRow, TableHead, TableCell)
- `Card`: Container with hover effects (CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- `Badge`: Status indicators (6 variants: primary, secondary, success, warning, error, gray)
- `Separator`: Visual dividers (Radix UI)

*Interactive:*
- `Button`: 5 variants, 3 sizes, loading state, `asChild` prop for Link integration
- `Dialog`: Modals with Radix UI (DialogTrigger, DialogContent, DialogHeader, DialogTitle)
- `Dropdown Menu`: Context menus with Radix UI
- `Toast` + `Toaster`: Global notification system

**Usage Examples:**
```typescript
// Form with shadcn components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

<div className="space-y-2">
  <Label htmlFor="name">Full Name *</Label>
  <Input id="name" {...register('name')} />
  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
</div>

// Button with Link (asChild prop)
<Button variant="primary" asChild>
  <Link href="/patients/new">Register Patient</Link>
</Button>

// Table with data
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell><Badge variant="success">Active</Badge></TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// Utility for class merging
import { cn } from '@/lib/utils';
```

## Important Patterns

### Forms
Use React Hook Form + Zod for validation:
```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

### API Routes
Located in `app/api/` - return `NextResponse.json()`. Used for:
- BPJS external API calls (requires server-side secrets)
- PDF generation
- Complex data aggregations

### Medical Records
- **Format**: SOAP (Subjective, Objective, Assessment, Plan)
- **ICD-10**: Search from `icd10_codes` table seeded via migration
- **Diagnosis**: Supports both ICD-10 code selection and free-text diagnosis

### BPJS Integration
- **Config**: Requires `BPJS_CONS_ID`, `BPJS_SECRET_KEY`, `BPJS_USER_KEY` in `.env.local`
- **PPK Code**: Set `NEXT_PUBLIC_BPJS_PPK_CODE` for facility identifier
- **API Wrapper**: `src/lib/api/bpjs/` contains signature generation and API calls
- **Features**: Eligibility check, SEP (Surat Eligibilitas Peserta) creation

### Queue System
- **Types**: Walk-in and Appointment-based
- **Queue Number**: Auto-generated per day (resets daily)
- **Status Flow**: waiting → in_progress → completed/cancelled
- **Check-in**: `/api/checkin/booking` for appointments

### Clinic Configuration
Edit `Apps/web/src/config/clinic.ts` to change:
- Operating hours (24-hour format)
- Break times
- Operating days (0=Sunday, 6=Saturday)
- Appointment slot duration (minutes)
- Clinic info (name, address, phone)

## Environment Variables

Required in `Apps/web/.env.local`:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# BPJS Integration (Optional - for BPJS features)
BPJS_CONS_ID=your_cons_id
BPJS_SECRET_KEY=your_secret_key
BPJS_USER_KEY=your_user_key
NEXT_PUBLIC_BPJS_PPK_CODE=your_ppk_code

# Payment (Optional - for Midtrans integration)
MIDTRANS_SERVER_KEY=your_server_key
MIDTRANS_CLIENT_KEY=your_client_key
```

## Common Development Tasks

### Adding New Features to Existing Pages
1. Check the route structure in `app/(dashboard)/[feature]/`
2. UI components go in `components/[feature]/`
3. **Use shadcn/ui components** from `components/ui/` (Input, Label, Button, Table, Card, etc.)
4. Database queries use Supabase client (server or client based on context)
5. Form validation uses Zod schemas + React Hook Form
6. **Always use Button component** instead of hardcoded button classes
7. **Always use Table component** for data tables instead of raw HTML
8. **Always use Input + Label** for form fields instead of raw HTML inputs

### Working with Database
1. Create migration file in `Apps/web/supabase/migrations/`
2. Name format: `YYYYMMDDHHMMSS_description.sql`
3. Include both schema changes and RLS policies
4. Test locally, then apply in production via Supabase Dashboard

### Adding API Routes
1. Create `route.ts` in `app/api/[endpoint]/`
2. Export named functions: GET, POST, PUT, DELETE
3. Use `createServerClient()` for database access
4. Return `NextResponse.json(data)` or `NextResponse.json({ error }, { status })`

### Styling Guidelines
- **Use shadcn/ui components** for all UI elements (Button, Input, Table, Card, etc.)
- Use Tailwind utility classes for layout and spacing
- Follow existing component patterns in `components/ui/`
- Use `cn()` utility for conditional classes
- Respect design system colors (primary-*, secondary-*, success, warning, destructive)
- Use semantic color variables (text-destructive, bg-muted, border-input, etc.)
- Add animations with existing keyframes (fadeIn, slideInBottom, scaleIn)
- **Never hardcode button styles** - always use `<Button>` component
- **Never use raw HTML forms** - use Input, Label, Textarea components
- **Never use raw HTML tables** - use Table component with all primitives

## Known Issues & Limitations

1. **No automated tests** - Manual testing required
2. **Mobile navigation** - Sidebar hidden on mobile, hamburger menu not implemented
3. **BPJS sandbox** - Requires valid credentials from Indonesian BPJS
4. **File uploads** - Storage buckets configured but document attachment UI incomplete
5. **Next.js 16** - Uses latest features; requires Node.js 18.17+
6. **Font loading in build** - Google Fonts may fail in offline/sandboxed builds (not a production issue)

## Additional Documentation

- `DESIGN_SYSTEM_IMPLEMENTATION.md` - **shadcn/ui integration guide**, component usage, Vercel design principles
- `LAUNCH_CHECKLIST.md` - Complete testing workflow and deployment readiness
- `Documents/tech_architecture.md` - Detailed technical architecture
- `Documents/detailed_features.md` - Feature specifications
- `Documents/indonesian_user_manual.md` - End-user guide (Bahasa Indonesia)
- `Documents/deployment_guide.md` - Vercel deployment instructions
- `components.json` - shadcn/ui configuration file

## Component Quick Reference

**Forms:**
```typescript
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

<Label htmlFor="field">Label *</Label>
<Input id="field" {...register('field')} />
<Textarea rows={3} {...register('notes')} />
<Button variant="primary" type="submit">Save</Button>
```

**Tables:**
```typescript
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Cards:**
```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

**Buttons:**
```typescript
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Regular button
<Button variant="primary" onClick={handleClick}>Click</Button>

// With Link (asChild)
<Button variant="success" asChild>
  <Link href="/path">Navigate</Link>
</Button>

// With loading
<Button variant="primary" isLoading={isSubmitting}>Save</Button>
```
