'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { ClipboardCheck, Plus, RefreshCw, Clock, ArrowRight } from '@/components/atoms/icons';
import {
  AttendanceService,
  AttendanceStatsCards,
  AttendanceLogTable,
  ManualAttendanceDialog,
  EarlyCheckoutRequestsView,
  useEarlyCheckoutBadgeWatcher,
  type AttendanceLog,
  type AttendanceDailySummary,
} from '@/features/attendance';

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'early-checkout'>('logs');
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [summary, setSummary] = useState<AttendanceDailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [statusFilter, setStatusFilter] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const { pendingCount } = useEarlyCheckoutBadgeWatcher({ pollIntervalMs: 30000 });

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
    if (activeTab === 'logs') {
      void fetchData();
    }
  }, [fetchData, activeTab]);

  const handleManualPunchSuccess = (newLog: AttendanceLog) => {
    setLogs((prev) => [newLog, ...prev]);
    void fetchData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* 1. Header with View Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor:
                activeTab === 'early-checkout'
                  ? 'hsl(var(--color-warning) / 0.12)'
                  : 'hsl(var(--color-success) / 0.12)',
              color:
                activeTab === 'early-checkout'
                  ? 'hsl(var(--color-warning))'
                  : 'hsl(var(--color-success))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {activeTab === 'early-checkout' ? (
              <Clock size={22} strokeWidth={2} />
            ) : (
              <ClipboardCheck size={22} strokeWidth={1.75} />
            )}
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
                margin: 0,
              }}
            >
              {activeTab === 'early-checkout'
                ? 'Review and authorize employee early departure and punch-out approval requests'
                : 'Real-time biometric, GPS geofence, and kiosk punch logs across all operating facilities'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {activeTab === 'logs' && (
            <Button
              variant="primary"
              onClick={() => setIsManualModalOpen(true)}
              leftIcon={<Plus size={16} strokeWidth={2} />}
            >
              Manual Punch Override
            </Button>
          )}
        </div>
      </div>

      {/* 2. Primary Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          borderBottom: '1px solid hsl(var(--border-subtle))',
          paddingBottom: 'var(--space-2)',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: activeTab === 'logs' ? 700 : 500,
            cursor: 'pointer',
            border:
              activeTab === 'logs'
                ? '1px solid hsl(var(--color-brand-accent))'
                : '1px solid transparent',
            backgroundColor:
              activeTab === 'logs' ? 'hsl(var(--color-brand-accent) / 0.1)' : 'transparent',
            color:
              activeTab === 'logs'
                ? 'hsl(var(--color-brand-accent))'
                : 'hsl(var(--text-secondary))',
            transition: 'all var(--transition-fast)',
          }}
        >
          <ClipboardCheck size={16} />
          <span>Live Punch Logs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('early-checkout')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: activeTab === 'early-checkout' ? 700 : 500,
            cursor: 'pointer',
            border:
              activeTab === 'early-checkout'
                ? '1px solid hsl(var(--color-brand-accent))'
                : '1px solid transparent',
            backgroundColor:
              activeTab === 'early-checkout'
                ? 'hsl(var(--color-brand-accent) / 0.1)'
                : 'transparent',
            color:
              activeTab === 'early-checkout'
                ? 'hsl(var(--color-brand-accent))'
                : 'hsl(var(--text-secondary))',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Clock size={16} />
          <span>Early Check-Out Requests</span>
          {pendingCount > 0 && (
            <span
              style={{
                backgroundColor: 'hsl(var(--color-warning))',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                marginLeft: '4px',
              }}
            >
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. Conditional Tab Content */}
      {activeTab === 'early-checkout' ? (
        <EarlyCheckoutRequestsView />
      ) : (
        <>
          {/* Pending Requests Alert Banner */}
          {pendingCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'hsl(var(--color-warning) / 0.1)',
                border: '1px solid hsl(var(--color-warning) / 0.3)',
                color: 'hsl(var(--text-primary))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Clock size={18} style={{ color: 'hsl(var(--color-warning))' }} />
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
                  {pendingCount} employee{pendingCount > 1 ? 's have' : ' has'} requested early
                  punch-out approval today.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('early-checkout')}
                rightIcon={<ArrowRight size={13} />}
                style={{
                  backgroundColor: 'hsl(var(--bg-surface))',
                  borderColor: 'hsl(var(--color-warning) / 0.5)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                }}
              >
                Review Requests
              </Button>
            </div>
          )}

          {/* KPI Cards */}
          <AttendanceStatsCards summary={summary} logs={logs} />

          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 'var(--space-3)',
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

            <Button
              variant="outline"
              size="md"
              onClick={() => void fetchData()}
              disabled={isLoading}
            >
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
        </>
      )}
    </div>
  );
}
