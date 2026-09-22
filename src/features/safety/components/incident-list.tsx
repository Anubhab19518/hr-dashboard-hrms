'use client';

import { useState, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { Modal } from '@/components/molecules/modal';
import { EmptyState } from '@/components/molecules/empty-state';
import { Plus } from '@/components/atoms/icons';
import { SafetyService } from '../services/safety.service';
import type { SafetyIncident, IncidentSeverity, IncidentStatus } from '../types/safety.types';
import type { ReportIncidentInput } from '../schemas/safety.schema';

interface IncidentListProps {
  incidents: readonly SafetyIncident[];
  onRefresh: () => void;
}

export function IncidentList({ incidents, onRefresh }: IncidentListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ReportIncidentInput>({
    title: '',
    description: '',
    severity: 'MEDIUM',
    siteId: '',
  });

  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive">Critical</Badge>;
      case 'HIGH':
        return <Badge variant="destructive">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">Medium</Badge>;
      case 'LOW':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'REPORTED':
        return <Badge variant="warning">Reported</Badge>;
      case 'INVESTIGATING':
        return <Badge variant="primary">Investigating</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">Resolved</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleReport = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await SafetyService.reportIncident(formData);
      setIsModalOpen(false);
      setFormData({ title: '', description: '', severity: 'MEDIUM', siteId: '' });
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to report incident';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: IncidentStatus) => {
    try {
      await SafetyService.updateIncidentStatus(id, newStatus);
      onRefresh();
    } catch {
      // Refresh list
      onRefresh();
    }
  };

  return (
    <div>
      <Card variant="subtle">
        <CardHeader
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <CardTitle>Safety Incidents & Hazard Log</CardTitle>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                marginTop: 'var(--space-1)',
              }}
            >
              Workplace health, environmental hazards, and site compliance incidents
            </div>
          </div>
          <Button size="sm" variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} strokeWidth={1.75} style={{ marginRight: 'var(--space-1)' }} />
            Report Incident
          </Button>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <EmptyState
              title="No incidents reported"
              description="Zero open safety hazards or site incidents logged."
              actionLabel="Report Incident"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'hsl(var(--bg-secondary))',
                    border: '1px solid hsl(var(--border-subtle))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {getSeverityBadge(incident.severity)}
                      <h4
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 700,
                          color: 'hsl(var(--text-primary))',
                        }}
                      >
                        {incident.title}
                      </h4>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {getStatusBadge(incident.status)}
                      {incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(incident.id, 'RESOLVED')}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-secondary))',
                      margin: 0,
                    }}
                  >
                    {incident.description}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 'var(--space-4)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      marginTop: 'var(--space-1)',
                      borderTop: '1px solid hsl(var(--border-subtle) / 0.5)',
                      paddingTop: 'var(--space-2)',
                    }}
                  >
                    {incident.siteName && <span>Site: {incident.siteName}</span>}
                    {incident.reportedByName && <span>Reported By: {incident.reportedByName}</span>}
                    <span>Reported At: {new Date(incident.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Incident Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Report Safety Incident"
        description="Log an environmental hazard, injury, or safety compliance violation."
      >
        <form
          onSubmit={handleReport}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
        >
          {error && (
            <div
              style={{
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                marginBottom: 'var(--space-1)',
              }}
            >
              Incident Title *
            </label>
            <Input
              placeholder="e.g. Chemical spill near loading dock 3"
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-1)',
                }}
              >
                Severity Level *
              </label>
              <select
                value={formData.severity}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, severity: e.target.value as IncidentSeverity }))
                }
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border-base))',
                  backgroundColor: 'hsl(var(--bg-secondary))',
                  color: 'hsl(var(--text-primary))',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <option value="LOW">Low - Minor notice</option>
                <option value="MEDIUM">Medium - Attention needed</option>
                <option value="HIGH">High - Urgent hazard</option>
                <option value="CRITICAL">Critical - Life safety risk</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-1)',
                }}
              >
                Site / Location
              </label>
              <Input
                placeholder="e.g. North Facility"
                value={formData.siteId ?? ''}
                onChange={(e) => setFormData((p) => ({ ...p, siteId: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                marginBottom: 'var(--space-1)',
              }}
            >
              Detailed Description *
            </label>
            <textarea
              placeholder="Describe the incident, involved personnel, immediate containment measures taken..."
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              required
              rows={4}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-base))',
                backgroundColor: 'hsl(var(--bg-secondary))',
                color: 'hsl(var(--text-primary))',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-3)',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Reporting...' : 'Submit Incident'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
