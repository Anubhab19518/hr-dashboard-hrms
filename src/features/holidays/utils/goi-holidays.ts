import { HolidayType } from '../types/holiday.types';

export interface GoiHolidayDefinition {
  name: string;
  holidayDate: string; // YYYY-MM-DD
  holidayType: HolidayType;
  isPaid: boolean;
  isOptional: boolean;
  description: string;
}

/**
 * Returns standard Indian Government (GOI) Gazetted & National public holidays for a specified year.
 */
export function getStandardGoiHolidays(year: number): GoiHolidayDefinition[] {
  return [
    {
      name: 'Republic Day',
      holidayDate: `${year}-01-26`,
      holidayType: HolidayType.NATIONAL,
      isPaid: true,
      isOptional: false,
      description: 'National Public Holiday (Republic Day of India)',
    },
    {
      name: 'Maha Shivratri',
      holidayDate: `${year}-03-04`,
      holidayType: HolidayType.OPTIONAL,
      isPaid: true,
      isOptional: true,
      description: 'Restricted / Optional Holiday',
    },
    {
      name: 'Holi',
      holidayDate: `${year}-03-25`,
      holidayType: HolidayType.REGIONAL,
      isPaid: true,
      isOptional: false,
      description: 'Festival of Colours',
    },
    {
      name: 'Good Friday',
      holidayDate: `${year}-04-03`,
      holidayType: HolidayType.NATIONAL,
      isPaid: true,
      isOptional: false,
      description: 'National Public Holiday',
    },
    {
      name: 'Dr. B.R. Ambedkar Jayanti',
      holidayDate: `${year}-04-14`,
      holidayType: HolidayType.REGIONAL,
      isPaid: true,
      isOptional: false,
      description: 'Ambedkar Jayanti',
    },
    {
      name: 'Mahavir Jayanti',
      holidayDate: `${year}-04-20`,
      holidayType: HolidayType.REGIONAL,
      isPaid: true,
      isOptional: false,
      description: 'Mahavir Jayanti',
    },
    {
      name: 'May Day / Labour Day',
      holidayDate: `${year}-05-01`,
      holidayType: HolidayType.REGIONAL,
      isPaid: true,
      isOptional: false,
      description: 'International Workers Day',
    },
    {
      name: 'Buddha Purnima',
      holidayDate: `${year}-05-12`,
      holidayType: HolidayType.REGIONAL,
      isPaid: true,
      isOptional: false,
      description: 'Buddha Jayanti / Purnima',
    },
    {
      name: 'Eid-ul-Adha (Bakrid)',
      holidayDate: `${year}-06-17`,
      holidayType: HolidayType.NATIONAL,
      isPaid: true,
      isOptional: false,
      description: 'Gazetted Holiday',
    },
    {
      name: 'Muharram',
      holidayDate: `${year}-07-17`,
      holidayType: HolidayType.REGIONAL,
      isPaid: true,
      isOptional: false,
      description: 'Muharram',
    },
    {
      name: 'Independence Day',
      holidayDate: `${year}-08-15`,
      holidayType: HolidayType.NATIONAL,
      isPaid: true,
      isOptional: false,
      description: 'National Public Holiday (Independence Day of India)',
    },
    {
      name: 'Raksha Bandhan',
      holidayDate: `${year}-08-28`,
      holidayType: HolidayType.OPTIONAL,
      isPaid: true,
      isOptional: true,
      description: 'Optional / Restricted Holiday',
    },
    {
      name: 'Janmashtami',
      holidayDate: `${year}-09-04`,
      holidayType: HolidayType.REGIONAL,
      isPaid: true,
      isOptional: false,
      description: 'Shri Krishna Janmashtami',
    },
    {
      name: 'Eid-e-Milad (Milad-un-Nabi)',
      holidayDate: `${year}-09-17`,
      holidayType: HolidayType.REGIONAL,
      isPaid: true,
      isOptional: false,
      description: 'Gazetted Holiday',
    },
    {
      name: 'Mahatma Gandhi Jayanti',
      holidayDate: `${year}-10-02`,
      holidayType: HolidayType.NATIONAL,
      isPaid: true,
      isOptional: false,
      description: 'National Public Holiday (Birth Anniversary of Mahatma Gandhi)',
    },
    {
      name: 'Dussehra (Vijayadashami)',
      holidayDate: `${year}-10-20`,
      holidayType: HolidayType.REGIONAL,
      isPaid: true,
      isOptional: false,
      description: 'Vijayadashami',
    },
    {
      name: 'Diwali (Deepavali)',
      holidayDate: `${year}-11-09`,
      holidayType: HolidayType.NATIONAL,
      isPaid: true,
      isOptional: false,
      description: 'Festival of Lights (Deepavali)',
    },
    {
      name: 'Guru Nanak Jayanti',
      holidayDate: `${year}-11-25`,
      holidayType: HolidayType.REGIONAL,
      isPaid: true,
      isOptional: false,
      description: 'Prakash Utsav',
    },
    {
      name: 'Christmas Day',
      holidayDate: `${year}-12-25`,
      holidayType: HolidayType.NATIONAL,
      isPaid: true,
      isOptional: false,
      description: 'National Public Holiday (Christmas)',
    },
  ];
}
