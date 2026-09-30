import { describe, it, expect } from 'vitest';
import { getStandardGoiHolidays } from '../utils/goi-holidays';
import { HolidayType } from '../types/holiday.types';

describe('GOI Standard Holidays Utility', () => {
  it('generates standard gazetted and national holidays for a given year', () => {
    const list2026 = getStandardGoiHolidays(2026);
    expect(list2026.length).toBeGreaterThan(10);

    const republicDay = list2026.find((h) => h.name === 'Republic Day');
    expect(republicDay).toBeDefined();
    expect(republicDay?.holidayDate).toBe('2026-01-26');
    expect(republicDay?.holidayType).toBe(HolidayType.NATIONAL);
    expect(republicDay?.isPaid).toBe(true);

    const independenceDay = list2026.find((h) => h.name === 'Independence Day');
    expect(independenceDay?.holidayDate).toBe('2026-08-15');

    const gandhiJayanti = list2026.find((h) => h.name === 'Mahatma Gandhi Jayanti');
    expect(gandhiJayanti?.holidayDate).toBe('2026-10-02');
  });

  it('correctly adapts year parameter for holiday dates', () => {
    const list2030 = getStandardGoiHolidays(2030);
    const xmas = list2030.find((h) => h.name === 'Christmas Day');
    expect(xmas?.holidayDate).toBe('2030-12-25');
  });
});
