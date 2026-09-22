'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Card, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { Modal } from '@/components/molecules/modal';
import { EmptyState } from '@/components/molecules/empty-state';
import { OrganizationService } from '../services/organization.service';
import type { Department, Company } from '../types/organization.types';
import type { CreateDepartmentInput } from '../schemas/organization.schema';

export function DepartmentList() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateDepartmentInput>({
    name: '',
    code: '',
    companyId: '',
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [deptsData, companiesData] = await Promise.all([
        OrganizationService.getDepartments(),
        OrganizationService.getCompanies(),
      ]);
      setDepartments(Array.isArray(deptsData) ? deptsData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      if (companiesData && companiesData.length > 0 && companiesData[0]) {
        setFormData((prev) => ({ ...prev, companyId: companiesData[0]!.id }));
      }
    } catch {
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await OrganizationService.createDepartment(formData);
      setDepartments((prev) => [...prev, created]);
      setIsModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create department';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
            }}
          >
            Departments & Divisions
          </h2>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'hsl(var(--text-muted))' }}>
            Organizational hierarchy units for reporting, payroll cost centers, and teams
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          + Add Department
        </Button>
      </div>

      {isLoading ? (
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            color: 'hsl(var(--text-muted))',
          }}
        >
          Loading departments...
        </div>
      ) : departments.length === 0 ? (
        <Card variant="subtle">
          <CardContent style={{ padding: 'var(--space-8)' }}>
            <EmptyState
              title="No departments found"
              description="Create functional departments such as Operations, Engineering, Human Resources, or Sales."
              actionLabel="Add Department"
              onAction={() => setIsModalOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {departments.map((dept) => (
            <Card key={dept.id} variant="subtle">
              <CardContent style={{ padding: 'var(--space-5)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 700,
                        color: 'hsl(var(--text-primary))',
                      }}
                    >
                      {dept.name}
                    </h3>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                      }}
                    >
                      CODE: {dept.code}
                    </span>
                  </div>
                  <Badge variant={dept.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {dept.status}
                  </Badge>
                </div>
                {dept.companyName && (
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-secondary))',
                      marginTop: 'var(--space-2)',
                    }}
                  >
                    Company: {dept.companyName}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Department"
        description="Add a new functional team or cost center division"
      >
        <form
          onSubmit={handleCreate}
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
                Department Name *
              </label>
              <Input
                placeholder="Operations & Logistics"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                required
              />
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
                Dept Code *
              </label>
              <Input
                placeholder="DEP-OPS"
                value={formData.code}
                onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                required
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
              Company Entity *
            </label>
            <select
              value={formData.companyId}
              onChange={(e) => setFormData((p) => ({ ...p, companyId: e.target.value }))}
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
              required
            >
              {companies.length === 0 && <option value="default">Default Company</option>}
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
              {isSubmitting ? 'Saving...' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
