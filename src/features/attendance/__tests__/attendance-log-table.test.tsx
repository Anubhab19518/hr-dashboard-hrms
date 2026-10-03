import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttendanceLogTable } from '../components/attendance-log-table';
import type { AttendanceLog } from '../types/attendance.types';

describe('AttendanceLogTable Component', () => {
  it('renders empty state when no logs exist and not loading', () => {
    render(<AttendanceLogTable logs={[]} isLoading={false} />);
    expect(screen.getByText(/No attendance punches found/i)).toBeInTheDocument();
  });

  it('renders multi-company disambiguation details and site location addresses', () => {
    const mockLogs: AttendanceLog[] = [
      {
        id: 'log-1',
        employeeId: 'emp-101',
        attendanceDate: '2026-10-03',
        status: 'PRESENT',
        checkInTime: '2026-10-03T09:00:00Z',
        checkOutTime: null,
        source: 'MOBILE_APP',
        faceMatchScore: 0.98,
        checkInLatitude: 28.5355,
        checkInLongitude: 77.391,
        employee: {
          id: 'emp-101',
          employeeCode: 'EMP-DEL-01',
          name: 'Rajesh Kumar',
          company: { id: 'comp-1', name: 'Apex Logistics Ltd', code: 'APEX' },
          jobRole: { id: 'role-1', name: 'Fleet Dispatcher', code: 'FD' },
          department: { id: 'dept-1', name: 'Operations', code: 'OPS' },
        },
        location: {
          siteId: 'site-1',
          siteName: 'Noida Central Hub',
          siteCode: 'NOI-01',
          address: 'Plot 45, Sector 62, Noida, UP 201309',
          city: 'Noida',
          state: 'Uttar Pradesh',
          latitude: 28.5355,
          longitude: 77.391,
          h3Index: null,
        },
      },
      {
        id: 'log-2',
        employeeId: 'emp-102',
        attendanceDate: '2026-10-03',
        status: 'LATE',
        checkInTime: '2026-10-03T10:15:00Z',
        checkOutTime: '2026-10-03T18:30:00Z',
        source: 'KIOSK',
        faceMatchScore: 95,
        employeeName: 'Rajesh Kumar',
        employeeCode: 'EMP-MUM-09',
        companyName: 'Zenith Security Services',
        jobRoleName: 'Shift Supervisor',
        siteName: 'Andheri Warehouse B',
        siteAddress: 'Building 12, MIDC, Andheri East, Mumbai',
        isWithinGeofence: true,
      },
    ];

    render(<AttendanceLogTable logs={mockLogs} />);

    // 1. Employee 1 Disambiguation
    expect(screen.getAllByText('Rajesh Kumar').length).toBe(2);
    expect(screen.getByText(/Apex Logistics Ltd/i)).toBeInTheDocument();
    expect(screen.getByText(/Fleet Dispatcher/i)).toBeInTheDocument();
    expect(screen.getByText('EMP-DEL-01')).toBeInTheDocument();

    // 2. Employee 2 Disambiguation
    expect(screen.getByText(/Zenith Security Services/i)).toBeInTheDocument();
    expect(screen.getByText(/Shift Supervisor/i)).toBeInTheDocument();
    expect(screen.getByText('EMP-MUM-09')).toBeInTheDocument();

    // 3. Site & Location addresses
    expect(screen.getByText('Noida Central Hub')).toBeInTheDocument();
    expect(screen.getByText('Plot 45, Sector 62, Noida, UP 201309')).toBeInTheDocument();
    expect(screen.getByText('Andheri Warehouse B')).toBeInTheDocument();
    expect(screen.getByText('Building 12, MIDC, Andheri East, Mumbai')).toBeInTheDocument();

    // 4. Active Check In vs Check Out events
    expect(screen.getByText(/● Check In/i)).toBeInTheDocument();
    expect(screen.getByText(/● Check Out/i)).toBeInTheDocument();

    // 5. Geofence & Badges
    expect(screen.getByText(/In Bounds/i)).toBeInTheDocument();
    expect(screen.getByText(/Late Arrival/i)).toBeInTheDocument();
  });
});
