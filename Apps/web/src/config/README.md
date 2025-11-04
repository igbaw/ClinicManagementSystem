# Clinic Configuration Guide

## Overview

The `clinic.ts` file contains all configurable settings for your clinic's operating hours, appointment slots, and general information.

## Current Configuration

Your clinic is currently configured for **evening hours**:

- **Operating Hours**: 17:00 - 22:00 (5:00 PM - 10:00 PM)
- **Break Time**: None
- **Operating Days**: All days (7 days a week)
- **Appointment Slot Duration**: 15 minutes

## How to Modify Settings

### 1. Change Operating Hours

Edit the `hours` section in `clinic.ts`:

```typescript
hours: {
  start: 17, // Start time (24-hour format)
  end: 22,   // End time (24-hour format)
}
```

**Examples:**
- Morning clinic (8 AM - 12 PM): `start: 8, end: 12`
- Afternoon clinic (1 PM - 6 PM): `start: 13, end: 18`
- Full day (8 AM - 8 PM): `start: 8, end: 20`

### 2. Add/Remove Break Times

To add a break period:

```typescript
breaks: {
  start: 19, // Break start (7:00 PM)
  end: 20,   // Break end (8:00 PM)
}
```

To remove breaks (current setting):

```typescript
breaks: null,
```

### 3. Set Operating Days

Modify the `operatingDays` array (0 = Sunday, 6 = Saturday):

```typescript
operatingDays: [0, 1, 2, 3, 4, 5, 6], // All days
```

**Examples:**
- Monday-Friday only: `[1, 2, 3, 4, 5]`
- Monday-Saturday: `[1, 2, 3, 4, 5, 6]`
- Tuesday, Thursday, Saturday: `[2, 4, 6]`

### 4. Change Slot Duration

Modify the `slotDuration` value (in minutes):

```typescript
slotDuration: 15, // 15-minute slots
```

**Common values:**
- 10 minutes: `slotDuration: 10`
- 15 minutes: `slotDuration: 15`
- 20 minutes: `slotDuration: 20`
- 30 minutes: `slotDuration: 30`

### 5. Update Clinic Information

Edit the `info` section:

```typescript
info: {
  name: "Your Clinic Name",
  address: "Your Clinic Address",
  phone: "Your Phone Number",
}
```

## How It Works

The configuration automatically:
- Generates available time slots based on your hours
- Excludes break times from available slots
- Shows clinic hours in the appointment form
- Validates appointments against your operating hours

## After Making Changes

1. Save the `clinic.ts` file
2. Restart your development server (if running)
3. The new settings will be applied immediately

## Examples

### Example 1: Traditional Clinic (Morning & Afternoon)

```typescript
hours: {
  start: 8,
  end: 17,  // 5:00 PM
},
breaks: {
  start: 12,
  end: 13,  // 1-hour lunch break
},
operatingDays: [1, 2, 3, 4, 5, 6], // Monday-Saturday
slotDuration: 15,
```

Result: Slots from 8:00 AM - 5:00 PM with 12:00 PM - 1:00 PM break

### Example 2: Evening Clinic (Current)

```typescript
hours: {
  start: 17, // 5:00 PM
  end: 22,   // 10:00 PM
},
breaks: null,
operatingDays: [0, 1, 2, 3, 4, 5, 6], // All days
slotDuration: 15,
```

Result: Slots from 5:00 PM - 10:00 PM every day, no breaks

### Example 3: Weekend-Only Clinic

```typescript
hours: {
  start: 9,
  end: 18,
},
breaks: {
  start: 13,
  end: 14,
},
operatingDays: [0, 6], // Sunday and Saturday only
slotDuration: 20,
```

Result: Saturday-Sunday only, 9:00 AM - 6:00 PM with lunch break, 20-minute slots

## Troubleshooting

- **No slots appearing**: Check that `hours.end` is greater than `hours.start`
- **Wrong times showing**: Ensure you're using 24-hour format (0-23)
- **Break time not working**: Make sure `breaks` values are between your start and end hours
