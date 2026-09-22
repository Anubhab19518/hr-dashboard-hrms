'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { ClipboardCheck, Plus, RefreshCw } from '@/components/atoms/icons';
import {
  AttendanceService,
  AttendanceStatsCards,
  AttendanceLogTable,
  ManualAttendanceDialog,
  type AttendanceLog,
  type AttendanceDailySummary,
} from '@/features/attendance';

export default function AttendancePage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [summary, setSummary] = useState<AttendanceDailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [statusFilter, setStatusFilter] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [logsData, summaryData] = await Promise.all([
        AttendanceService.getLogs({
          date: selectedDate || undefined,
          status: statusFilter || undefined,
        }),
        AttendanceService.getDailySummary(selectedDate || undefined),
      ]);
      setLogs(Array.isArray(logsData) ? logsData : []);
      setSummary(summaryData);
    } catch {
      setLogs([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, statusFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleManualPunchSuccess = (newLog: AttendanceLog) => {
    setLogs((prev) => [newLog, ...prev]);
    void fetchData();
  };

  return (
    <div>
      {/* ClickUp-style Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'hsl(var(--color-success) / 0.12)',
              color: 'hsl(var(--color-success))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ClipboardCheck size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Attendance & Time Tracking
            </h1>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                marginTop: '2px',
              }}
            >
              Real-time biometric, GPS geofence, and kiosk punch logs across all operating
              facilities
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsManualModalOpen(true)}
          leftIcon={<Plus size={16} strokeWidth={2} />}
        >
          Manual Punch Override
        </Button>
      </div>

      {/* KPI Cards */}
      <AttendanceStatsCards summary={summary} />

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div style={{ width: '180px' }}>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            height: '42px',
            padding: '0 var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid hsl(var(--border-base))',
            backgroundColor: 'hsl(var(--bg-secondary))',
            color: 'hsl(var(--text-primary))',
            fontSize: 'var(--font-size-sm)',
            outline: 'none',
          }}
        >
          <option value="">All Statuses</option>
          <option value="PRESENT">Present</option>
          <option value="LATE">Late Arrival</option>
          <option value="HALF_DAY">Half Day</option>
          <option value="OVERTIME">Overtime</option>
          <option value="EARLY_EXIT">Early Exit</option>
        </select>

        <Button variant="outline" size="md" onClick={() => void fetchData()} disabled={isLoading}>
          <RefreshCw
            size={14}
            strokeWidth={1.75}
            className={isLoading ? 'animate-spin' : ''}
            style={{ marginRight: 'var(--space-2)' }}
          />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Table */}
      <AttendanceLogTable logs={logs} isLoading={isLoading} />

      {/* Manual Attendance Modal */}
      <ManualAttendanceDialog
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={handleManualPunchSuccess}
      />
    </div>
  );
}
