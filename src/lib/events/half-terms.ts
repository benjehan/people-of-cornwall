export interface HalfTermPeriod {
  name: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface HalfTermYear {
  academic_year: string;
  periods: HalfTermPeriod[];
}

/**
 * Cornwall Council school holiday dates for community & voluntary-controlled schools.
 * Source: https://www.cornwall.gov.uk/schools-and-education/schools-and-colleges/school-term-dates-and-inset-days/
 * Update annually when Cornwall Council publishes new term dates.
 */
export const HALF_TERM_DATA: HalfTermYear[] = [
  {
    academic_year: "2025-2026",
    periods: [
      { name: "October Half Term", start: "2025-10-27", end: "2025-10-31" },
      { name: "Christmas Holidays", start: "2025-12-22", end: "2026-01-02" },
      { name: "February Half Term", start: "2026-02-16", end: "2026-02-20" },
      { name: "Easter Holidays", start: "2026-04-03", end: "2026-04-17" },
      { name: "May Half Term", start: "2026-05-25", end: "2026-05-29" },
      { name: "Summer Holidays", start: "2026-07-24", end: "2026-09-02" },
    ],
  },
  {
    academic_year: "2026-2027",
    periods: [
      { name: "October Half Term", start: "2026-10-26", end: "2026-10-30" },
      { name: "Christmas Holidays", start: "2026-12-21", end: "2027-01-01" },
      { name: "February Half Term", start: "2027-02-15", end: "2027-02-19" },
      { name: "Easter Holidays", start: "2027-03-26", end: "2027-04-09" },
      { name: "May Half Term", start: "2027-05-31", end: "2027-06-04" },
      { name: "Summer Holidays", start: "2027-07-26", end: "2027-09-01" },
    ],
  },
];

/**
 * Check if a given date falls within any school holiday period.
 * Returns the period if it does, null otherwise.
 */
export function getHalfTermForDate(date: Date): HalfTermPeriod | null {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  for (const year of HALF_TERM_DATA) {
    for (const period of year.periods) {
      if (dateStr >= period.start && dateStr <= period.end) {
        return period;
      }
    }
  }
  return null;
}
