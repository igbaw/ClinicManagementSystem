/**
 * Clinic Settings Configuration
 * 
 * Modify these settings to match your clinic's operating hours
 */

export const clinicSettings = {
  // Operating hours (24-hour format)
  hours: {
    start: 17, // 5:00 PM (17:00)
    end: 22,   // 10:00 PM (22:00)
  },

  // Break times (set to null if no breaks)
  breaks: null as { start: number; end: number } | null, // No break time for evening clinic
  // Example with break:
  // breaks: {
  //   start: 19, // 7:00 PM
  //   end: 20,   // 8:00 PM
  // },

  // Operating days (0 = Sunday, 6 = Saturday)
  operatingDays: [0, 1, 2, 3, 4, 5, 6], // All days
  // Example: Monday-Friday only = [1, 2, 3, 4, 5]

  // Appointment slot duration in minutes
  slotDuration: 15,

  // Timezone
  timezone: "Asia/Jakarta",

  // Clinic information
  info: {
    name: "Klinik THT",
    address: "Alamat Klinik",
    phone: "021-XXXXXXXX",
  },
};

/**
 * Generate time slots based on clinic hours
 */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const { hours, breaks, slotDuration } = clinicSettings;

  for (let h = hours.start; h < hours.end; h++) {
    for (let m = 0; m < 60; m += slotDuration) {
      // Skip if in break time
      if (breaks) {
        const currentHour = h + m / 60;
        if (currentHour >= breaks.start && currentHour < breaks.end) {
          continue;
        }
      }

      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  return slots;
}

/**
 * Check if a given date is within operating days
 */
export function isOperatingDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return clinicSettings.operatingDays.includes(dayOfWeek);
}

/**
 * Get formatted clinic hours string
 */
export function getClinicHoursString(): string {
  const { hours, breaks } = clinicSettings;
  const start = `${String(hours.start).padStart(2, "0")}:00`;
  const end = `${String(hours.end).padStart(2, "0")}:00`;
  
  let hoursStr = `${start} - ${end}`;
  
  if (breaks) {
    const breakStart = `${String(breaks.start).padStart(2, "0")}:00`;
    const breakEnd = `${String(breaks.end).padStart(2, "0")}:00`;
    hoursStr += ` (Istirahat: ${breakStart}-${breakEnd})`;
  }
  
  return hoursStr;
}

/**
 * Get operating days string
 */
export function getOperatingDaysString(): string {
  const { operatingDays } = clinicSettings;
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  
  if (operatingDays.length === 7) {
    return "Setiap Hari";
  }
  
  return operatingDays.map(day => days[day]).join(", ");
}
