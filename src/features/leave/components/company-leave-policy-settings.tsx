'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/card';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import { Input } from '@/components/atoms/input';
import { Modal } from '@/components/molecules/modal';
import {
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Edit2,
  Building2,
  Trash2,
  Sparkles,
  FileText,
  Clock,
  ShieldCheck,
} from '@/components/atoms/icons';
import { LeaveService } from '../services/leave.service';
import {
  AccrualType,
  type LeavePolicy,
  type LeavePolicyAssignment,
  type LeaveType,
} from '../types/leave.types';

interface CompanyLeavePolicySettingsProps {
  companyId: string;
  companyName?: string;
}

interface CustomQuotaRow {
  leaveTypeId: string;
  quotaDays: number;
  accrualType: AccrualType;
}

export function CompanyLeavePolicySettings({
  companyId,
  companyName,
}: CompanyLeavePolicySettingsProps) {
  const currentYear = new Date().getFullYear();
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [persistedAssignments, setPersistedAssignments] = useState<LeavePolicyAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Modal: Use Workspace Policy State
  const [isUseWorkspaceModalOpen, setIsUseWorkspaceModalOpen] = useState(false);
  const [selectedWorkspacePolicyId, setSelectedWorkspacePolicyId] = useState<string>('');
  const [workspaceEffectiveFrom, setWorkspaceEffectiveFrom] = useState<string>(
    `${currentYear}-01-01`,
  );
  const [workspaceEffectiveTo, setWorkspaceEffectiveTo] = useState<string>(`${currentYear}-12-31`);
  const [autoProvisionWorkspace, setAutoProvisionWorkspace] = useState(true);

  // 2. Modal: Create Custom Company Policy State
  const [isCreateCustomModalOpen, setIsCreateCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customEffectiveFrom, setCustomEffectiveFrom] = useState(`${currentYear}-01-01`);
  const [customEffectiveTo, setCustomEffectiveTo] = useState(`${currentYear}-12-31`);
  const [customQuotas, setCustomQuotas] = useState<CustomQuotaRow[]>([]);
  const [autoProvisionCustom, setAutoProvisionCustom] = useState(true);

  // 3. Modal: Edit Custom Company Policy State
  const [isEditCustomModalOpen, setIsEditCustomModalOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEffectiveFrom, setEditEffectiveFrom] = useState(`${currentYear}-01-01`);
  const [editEffectiveTo, setEditEffectiveTo] = useState(`${currentYear}-12-31`);
  const [editQuotas, setEditQuotas] = useState<CustomQuotaRow[]>([]);

  // 4. Modal: Deactivate & Delete Confirmation States
  const [deactivatingTarget, setDeactivatingTarget] = useState<{
    policyId: string;
    policyName: string;
    assignmentId?: string;
    isCustom?: boolean;
  } | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<{
    policyId: string;
    policyName: string;
  } | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Submission helpers
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load cached assignments from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`hrms_company_leave_policy_${companyId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPersistedAssignments(parsed);
        } else if (parsed && typeof parsed === 'object') {
          setPersistedAssignments([parsed]);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [companyId]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [policiesList, typesList] = await Promise.all([
        LeaveService.getPolicies(true),
        LeaveService.getLeaveTypes(false),
      ]);

      // Enrich policies with assignments if missing
      const enrichedPolicies = await Promise.all(
        (Array.isArray(policiesList) ? policiesList : []).map(async (pol) => {
          const rawAssignments =
            pol.assignments ||
            (pol as unknown as Record<string, unknown>).policyAssignments ||
            (pol as unknown as Record<string, unknown>).policy_assignments ||
            [];
          if (!Array.isArray(rawAssignments) || rawAssignments.length === 0) {
            try {
              const extraAss = await LeaveService.getPolicyAssignments(pol.id);
              if (extraAss && extraAss.length > 0) {
                return { ...pol, assignments: extraAss };
              }
            } catch {
              // Silently continue
            }
          }
          return pol;
        }),
      );

      setPolicies(enrichedPolicies);
      setLeaveTypes(Array.isArray(typesList) ? typesList : []);

      // Default selected workspace policy for modal
      const workspacePolicies = enrichedPolicies.filter(
        (p) => !p.companyId && !p.isCustomCompanyPolicy,
      );
      if (workspacePolicies.length > 0 && !selectedWorkspacePolicyId) {
        setSelectedWorkspacePolicyId(workspacePolicies[0]?.id || '');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load company leave settings';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspacePolicyId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Extract all company assignments from loaded policies + persisted cache
  const companyAssignments = useMemo(() => {
    const list: Array<
      LeavePolicyAssignment & {
        policyName: string;
        policy: LeavePolicy;
        isCustom: boolean;
      }
    > = [];
    const seenIds = new Set<string>();
    const targetCompanyId = String(companyId || '')
      .trim()
      .toLowerCase();

    // 1. From API policies
    policies.forEach((pol) => {
      const polName = String(pol.name || '').toLowerCase();
      const isCustomPolicy =
        Boolean(pol.isCustomCompanyPolicy) ||
        (Boolean(pol.companyId) &&
          String(pol.companyId).trim().toLowerCase() === targetCompanyId) ||
        polName.includes('custom') ||
        (Boolean(companyName) && polName.includes(String(companyName).toLowerCase()));

      const rawAssignments =
        pol.assignments ||
        (pol as unknown as Record<string, unknown>).policyAssignments ||
        (pol as unknown as Record<string, unknown>).policy_assignments ||
        [];

      if (Array.isArray(rawAssignments) && rawAssignments.length > 0) {
        rawAssignments.forEach((ass: unknown) => {
          const a = ass as Record<string, unknown>;
          const rawCompId =
            a.companyId ||
            a.company_id ||
            a.clientId ||
            a.client_id ||
            (a.company as Record<string, unknown>)?.id ||
            (a.client as Record<string, unknown>)?.id ||
            pol.companyId;

          const matchComp = rawCompId
            ? String(rawCompId).trim().toLowerCase() === targetCompanyId
            : isCustomPolicy;

          if (matchComp) {
            const assId = String(a.id || `${pol.id}-${rawCompId}`);
            if (!seenIds.has(assId)) {
              seenIds.add(assId);
              list.push({
                id: assId,
                policyId: String(a.policyId || a.policy_id || pol.id),
                companyId: String(rawCompId || companyId),
                effectiveFrom: String(a.effectiveFrom || a.effective_from || pol.effectiveFrom),
                effectiveTo: a.effectiveTo
                  ? String(a.effectiveTo)
                  : a.effective_to
                    ? String(a.effective_to)
                    : pol.effectiveTo || null,
                createdAt: a.createdAt
                  ? String(a.createdAt)
                  : a.created_at
                    ? String(a.created_at)
                    : undefined,
                policyName: pol.name,
                policy: pol,
                isCustom: isCustomPolicy,
              });
            }
          }
        });
      } else if (isCustomPolicy) {
        // Custom policy directly scoped to this company
        const assId = `custom-ass-${pol.id}`;
        if (!seenIds.has(assId)) {
          seenIds.add(assId);
          list.push({
            id: assId,
            policyId: pol.id,
            companyId,
            effectiveFrom: pol.effectiveFrom,
            effectiveTo: pol.effectiveTo || null,
            createdAt: pol.createdAt,
            policyName: pol.name,
            policy: pol,
            isCustom: true,
          });
        }
      }
    });

    // 2. From Persisted Local Assignments
    persistedAssignments.forEach((ass) => {
      const assCompId = String(ass.companyId || '')
        .trim()
        .toLowerCase();
      if (assCompId === targetCompanyId && !seenIds.has(ass.id)) {
        const matchingPolicy = policies.find((p) => p.id === ass.policyId) || {
          id: ass.policyId,
          name: 'Assigned Leave Policy',
          effectiveFrom: ass.effectiveFrom,
          effectiveTo: ass.effectiveTo || null,
          isActive: true,
        };
        const polName = String(matchingPolicy.name || '').toLowerCase();
        const isCustom =
          Boolean(matchingPolicy.isCustomCompanyPolicy) ||
          String(matchingPolicy.companyId || '')
            .trim()
            .toLowerCase() === targetCompanyId ||
          polName.includes('custom') ||
          (Boolean(companyName) && polName.includes(String(companyName).toLowerCase()));

        seenIds.add(ass.id);
        list.push({
          ...ass,
          policyName: matchingPolicy.name,
          policy: matchingPolicy,
          isCustom,
        });
      }
    });

    return list.sort(
      (a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime(),
    );
  }, [policies, companyId, persistedAssignments, companyName]);

  // Determine currently active assignment
  const activeAssignment = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (
      companyAssignments.find(
        (a) => a.effectiveFrom <= today && (!a.effectiveTo || a.effectiveTo >= today),
      ) ||
      companyAssignments[0] ||
      null
    );
  }, [companyAssignments]);

  const activePolicy = useMemo(() => {
    if (activeAssignment?.policy) return activeAssignment.policy;
    if (activeAssignment?.policyId) {
      return policies.find((p) => p.id === activeAssignment.policyId) || null;
    }
    return null;
  }, [activeAssignment, policies]);

  const isCurrentPolicyCustom = useMemo(() => {
    if (!activePolicy) return false;
    const targetCompId = String(companyId || '')
      .trim()
      .toLowerCase();
    const polName = String(activePolicy.name || '').toLowerCase();
    return (
      Boolean(activePolicy.isCustomCompanyPolicy) ||
      Boolean(activeAssignment?.isCustom) ||
      String(activePolicy.companyId || '')
        .trim()
        .toLowerCase() === targetCompId ||
      polName.includes('custom') ||
      (Boolean(companyName) && polName.includes(String(companyName).toLowerCase()))
    );
  }, [activePolicy, activeAssignment, companyId, companyName]);

  // Available Workspace Policies for selection
  const availableWorkspacePolicies = useMemo(() => {
    return policies.filter((p) => !p.companyId && !p.isCustomCompanyPolicy && p.isActive !== false);
  }, [policies]);

  const previewWorkspacePolicy = useMemo(() => {
    return availableWorkspacePolicies.find((p) => p.id === selectedWorkspacePolicyId) || null;
  }, [availableWorkspacePolicies, selectedWorkspacePolicyId]);

  // Helper: Persist assignment
  const saveAssignmentToCache = (newAssignment: LeavePolicyAssignment) => {
    const updated = [
      newAssignment,
      ...persistedAssignments.filter((a) => a.id !== newAssignment.id),
    ];
    setPersistedAssignments(updated);
    try {
      localStorage.setItem(`hrms_company_leave_policy_${companyId}`, JSON.stringify(updated));
    } catch {
      // Ignore localStorage quota errors
    }
  };

  // -------------------------------------------------------------
  // HANDLER: 1. Use Workspace Policy
  // -------------------------------------------------------------
  const handleOpenUseWorkspaceModal = () => {
    if (availableWorkspacePolicies.length > 0) {
      setSelectedWorkspacePolicyId(availableWorkspacePolicies[0]?.id || '');
    }
    setWorkspaceEffectiveFrom(`${currentYear}-01-01`);
    setWorkspaceEffectiveTo(`${currentYear}-12-31`);
    setAutoProvisionWorkspace(true);
    setFormError(null);
    setIsUseWorkspaceModalOpen(true);
  };

  const handleUseWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspacePolicyId) {
      setFormError('Please select a workspace policy template');
      return;
    }
    if (!workspaceEffectiveFrom) {
      setFormError('Effective from date is required');
      return;
    }
    if (workspaceEffectiveTo && new Date(workspaceEffectiveFrom) > new Date(workspaceEffectiveTo)) {
      setFormError('Effective to date cannot be earlier than effective from date');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const res = await LeaveService.assignPolicy(selectedWorkspacePolicyId, {
        companyId,
        effectiveFrom: workspaceEffectiveFrom,
        effectiveTo: workspaceEffectiveTo || undefined,
      });

      const newAssignment: LeavePolicyAssignment = {
        id: res?.id || `ass-${Date.now()}`,
        policyId: selectedWorkspacePolicyId,
        companyId,
        effectiveFrom: workspaceEffectiveFrom,
        effectiveTo: workspaceEffectiveTo || null,
        createdAt: new Date().toISOString(),
      };
      saveAssignmentToCache(newAssignment);

      // Automated balance provisioning
      if (autoProvisionWorkspace && previewWorkspacePolicy) {
        setIsProvisioning(true);
        try {
          const provRes = await LeaveService.provisionCompanyEmployeeBalances(
            companyId,
            previewWorkspacePolicy,
            currentYear,
          );
          setSuccessMessage(
            `Successfully assigned workspace policy "${previewWorkspacePolicy.name}" to ${
              companyName || 'this company'
            }. Provisioned balances for ${provRes.employeeCount} deployed employees.`,
          );
        } catch {
          setSuccessMessage(
            `Successfully assigned workspace policy to ${companyName || 'this company'}.`,
          );
        } finally {
          setIsProvisioning(false);
        }
      } else {
        setSuccessMessage(
          `Successfully assigned workspace policy to ${companyName || 'this company'}.`,
        );
      }

      setIsUseWorkspaceModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign workspace policy';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLER: 2. Create Custom Company Policy
  // -------------------------------------------------------------
  const handleOpenCreateCustomModal = () => {
    setCustomName(`${companyName || 'Company'} Custom Leave Policy ${currentYear}`);
    setCustomDescription(
      `Dedicated leave policy and quotas for employees deployed at ${companyName || 'this company'}.`,
    );
    setCustomEffectiveFrom(`${currentYear}-01-01`);
    setCustomEffectiveTo(`${currentYear}-12-31`);
    setAutoProvisionCustom(true);

    if (leaveTypes.length > 0) {
      setCustomQuotas(
        leaveTypes.map((lt) => ({
          leaveTypeId: lt.id,
          quotaDays: lt.code === 'CL' ? 12 : lt.code === 'SL' ? 10 : lt.code === 'EL' ? 18 : 12,
          accrualType: lt.code === 'EL' ? AccrualType.MONTHLY : AccrualType.UPFRONT,
        })),
      );
    } else {
      setCustomQuotas([]);
    }

    setFormError(null);
    setIsCreateCustomModalOpen(true);
  };

  const handleAddCustomQuota = () => {
    const first = leaveTypes[0];
    if (!first) return;
    setCustomQuotas((prev) => [
      ...prev,
      {
        leaveTypeId: first.id,
        quotaDays: 12,
        accrualType: AccrualType.UPFRONT,
      },
    ]);
  };

  const handleCreateCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setFormError('Policy name is required');
      return;
    }
    if (customQuotas.length === 0) {
      setFormError('Policy must have at least one leave quota defined');
      return;
    }
    if (customEffectiveTo && new Date(customEffectiveFrom) > new Date(customEffectiveTo)) {
      setFormError('Effective to date cannot be earlier than effective from date');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      // 1. Create custom company-scoped policy
      const createdPolicy = await LeaveService.createPolicy({
        name: customName.trim(),
        description: customDescription.trim() || undefined,
        effectiveFrom: customEffectiveFrom,
        effectiveTo: customEffectiveTo || undefined,
        companyId,
        isCustomCompanyPolicy: true,
        entitlements: customQuotas.map((q) => ({
          leaveTypeId: q.leaveTypeId,
          annualQuota: Number(q.quotaDays),
          quotaDays: Number(q.quotaDays),
          accrualType: q.accrualType,
        })),
      });

      // 2. Assign directly to company
      const assRes = await LeaveService.assignPolicy(createdPolicy.id, {
        companyId,
        effectiveFrom: customEffectiveFrom,
        effectiveTo: customEffectiveTo || undefined,
      });

      const newAssignment: LeavePolicyAssignment = {
        id: assRes?.id || `ass-${Date.now()}`,
        policyId: createdPolicy.id,
        companyId,
        effectiveFrom: customEffectiveFrom,
        effectiveTo: customEffectiveTo || null,
        createdAt: new Date().toISOString(),
      };
      saveAssignmentToCache(newAssignment);

      // 3. Automated balance provisioning
      if (autoProvisionCustom) {
        setIsProvisioning(true);
        try {
          const provRes = await LeaveService.provisionCompanyEmployeeBalances(
            companyId,
            createdPolicy,
            currentYear,
          );
          setSuccessMessage(
            `Custom policy "${createdPolicy.name}" created and assigned. Balances provisioned for ${provRes.employeeCount} active employees.`,
          );
        } catch {
          setSuccessMessage(
            `Custom policy "${createdPolicy.name}" created and assigned to ${companyName || 'this company'}.`,
          );
        } finally {
          setIsProvisioning(false);
        }
      } else {
        setSuccessMessage(
          `Custom policy "${createdPolicy.name}" created and assigned to ${companyName || 'this company'}.`,
        );
      }

      setIsCreateCustomModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create custom company policy';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLER: 3. Edit Custom Company Policy
  // -------------------------------------------------------------
  const handleOpenEditCustomModal = () => {
    if (!activePolicy) return;
    setEditingPolicyId(activePolicy.id);
    setEditName(activePolicy.name);
    setEditDescription(activePolicy.description || '');
    setEditEffectiveFrom(activePolicy.effectiveFrom);
    setEditEffectiveTo(activePolicy.effectiveTo || `${currentYear}-12-31`);

    const existingEntitlements =
      activePolicy.entitlements ||
      ((activePolicy as unknown as Record<string, unknown>)
        ?.policyEntitlements as typeof activePolicy.entitlements) ||
      [];

    if (existingEntitlements.length > 0) {
      setEditQuotas(
        existingEntitlements.map((e) => ({
          leaveTypeId: e.leaveTypeId,
          quotaDays: e.annualQuota ?? e.quotaDays ?? 0,
          accrualType: e.accrualType || AccrualType.UPFRONT,
        })),
      );
    } else {
      setEditQuotas(
        leaveTypes.map((lt) => ({
          leaveTypeId: lt.id,
          quotaDays: 12,
          accrualType: AccrualType.UPFRONT,
        })),
      );
    }

    setFormError(null);
    setIsEditCustomModalOpen(true);
  };

  const handleEditCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setFormError('Policy name is required');
      return;
    }
    if (editQuotas.length === 0) {
      setFormError('Policy must have at least one leave quota defined');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const updated = await LeaveService.updatePolicy(editingPolicyId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        effectiveFrom: editEffectiveFrom,
        effectiveTo: editEffectiveTo || undefined,
        companyId,
        isCustomCompanyPolicy: true,
        entitlements: editQuotas.map((q) => ({
          leaveTypeId: q.leaveTypeId,
          annualQuota: Number(q.quotaDays),
          quotaDays: Number(q.quotaDays),
          accrualType: q.accrualType,
        })),
      });

      setSuccessMessage(`Successfully updated custom policy "${updated.name}".`);
      setIsEditCustomModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update custom policy';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLER: 4. Manual Re-Sync Balances for Deployed Employees
  // -------------------------------------------------------------
  const handleReSyncBalances = async () => {
    if (!activePolicy) return;
    setIsProvisioning(true);
    setSuccessMessage(null);
    try {
      const res = await LeaveService.provisionCompanyEmployeeBalances(
        companyId,
        activePolicy,
        currentYear,
      );
      setSuccessMessage(
        `Leave balances re-synced successfully for ${res.employeeCount} active deployed employees.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sync employee balances';
      setError(msg);
    } finally {
      setIsProvisioning(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLER: 5. Deactivate / Unassign Policy
  // -------------------------------------------------------------
  const handleConfirmDeactivate = async () => {
    if (!deactivatingTarget) return;
    setIsDeactivating(true);
    setFormError(null);
    try {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

      // 1. Update persisted assignments in localStorage for this company
      const key = `hrms_company_leave_policy_${companyId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const list = JSON.parse(saved) as LeavePolicyAssignment[];
          const updated = list.map((a) => {
            if (
              (deactivatingTarget.assignmentId && a.id === deactivatingTarget.assignmentId) ||
              a.policyId === deactivatingTarget.policyId
            ) {
              return { ...a, effectiveTo: yesterday };
            }
            return a;
          });
          localStorage.setItem(key, JSON.stringify(updated));
          setPersistedAssignments(updated);
        } catch {
          // Ignore
        }
      }

      // 2. If it is custom policy, set policy effectiveTo as well
      if (deactivatingTarget.isCustom) {
        try {
          await LeaveService.updatePolicy(deactivatingTarget.policyId, {
            effectiveTo: yesterday,
            companyId,
            isCustomCompanyPolicy: true,
          });
        } catch {
          // Ignore
        }
      }

      setSuccessMessage(
        `Leave policy "${deactivatingTarget.policyName}" has been deactivated for ${
          companyName || 'this company'
        }. Historical records remain intact.`,
      );
      setDeactivatingTarget(null);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate leave policy';
      setError(msg);
    } finally {
      setIsDeactivating(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLER: 6. Permanently Delete Custom Company Policy
  // -------------------------------------------------------------
  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    setIsDeleting(true);
    setFormError(null);
    try {
      // 1. Call API to delete policy
      await LeaveService.deletePolicy(deletingTarget.policyId).catch(() => {});

      // 2. Remove from persisted localStorage
      const key = `hrms_company_leave_policy_${companyId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const list = JSON.parse(saved) as LeavePolicyAssignment[];
          const updated = list.filter((a) => a.policyId !== deletingTarget.policyId);
          localStorage.setItem(key, JSON.stringify(updated));
          setPersistedAssignments(updated);
        } catch {
          // Ignore
        }
      }

      // 3. Remove from local policies state
      setPolicies((prev) => prev.filter((p) => p.id !== deletingTarget.policyId));

      setSuccessMessage(`Custom policy "${deletingTarget.policyName}" was deleted.`);
      setDeletingTarget(null);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete custom leave policy';
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          padding: 'var(--space-8)',
          textAlign: 'center',
          color: 'hsl(var(--text-muted))',
          fontSize: 'var(--font-size-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <RefreshCw size={16} className="animate-spin" />
        <span>Loading company leave policy settings...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Notifications */}
      {successMessage && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-success) / 0.1)',
            color: 'hsl(var(--color-success))',
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'currentColor',
              fontWeight: 700,
            }}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'hsl(var(--color-danger) / 0.1)',
            color: 'hsl(var(--color-danger))',
            fontSize: 'var(--font-size-xs)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Header & Actions Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 700,
              color: 'hsl(var(--text-primary))',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <Calendar size={18} style={{ color: 'hsl(var(--primary-color))' }} />
            Company Leave Policy & Quotas
          </h3>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-secondary))',
              margin: '2px 0 0 0',
            }}
          >
            Manage annual leave entitlements and quota accrual rules applied to employees deployed
            at <strong>{companyName || 'this company'}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={() => void fetchData()} disabled={isLoading}>
            <RefreshCw size={13} style={{ marginRight: '4px' }} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenUseWorkspaceModal}
            disabled={availableWorkspacePolicies.length === 0}
            title="Assign a standard workspace policy template"
          >
            <Layers size={13} style={{ marginRight: '4px' }} />
            Use Workspace Policy
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateCustomModal}
            title="Create custom company-scoped policy"
          >
            <Plus size={13} style={{ marginRight: '4px' }} />
            Create Custom Company Policy
          </Button>
        </div>
      </div>

      {/* 2. Active Policy Hero Card */}
      {activePolicy ? (
        <Card
          style={{
            borderColor: 'hsl(var(--primary-color) / 0.3)',
            backgroundColor: 'hsl(var(--primary-color) / 0.02)',
          }}
        >
          <CardHeader style={{ paddingBottom: 'var(--space-3)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginBottom: '4px',
                  }}
                >
                  <Badge variant={isCurrentPolicyCustom ? 'primary' : 'secondary'}>
                    {isCurrentPolicyCustom ? 'Custom Company Policy' : 'Workspace Policy'}
                  </Badge>
                  <Badge variant="success">Active</Badge>
                </div>

                <CardTitle
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 700,
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  {activePolicy.name}
                </CardTitle>

                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-muted))',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>
                    Effective Period:{' '}
                    <strong>{activeAssignment?.effectiveFrom || activePolicy.effectiveFrom}</strong>{' '}
                    to{' '}
                    <strong>
                      {activeAssignment?.effectiveTo || activePolicy.effectiveTo || 'Indefinite'}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Scope:{' '}
                    <strong>
                      {isCurrentPolicyCustom
                        ? `Dedicated to ${companyName || 'Company'}`
                        : 'Global Workspace Template'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons on Active Card */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReSyncBalances}
                  disabled={isProvisioning}
                  title="Re-sync and provision leave balances for active company employees"
                >
                  <Sparkles
                    size={13}
                    style={{ marginRight: '4px' }}
                    className={isProvisioning ? 'animate-spin' : ''}
                  />
                  {isProvisioning ? 'Syncing...' : 'Re-sync Balances'}
                </Button>

                {isCurrentPolicyCustom && (
                  <Button variant="outline" size="sm" onClick={handleOpenEditCustomModal}>
                    <Edit2 size={13} style={{ marginRight: '4px' }} />
                    Edit Custom Policy
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={handleOpenUseWorkspaceModal}>
                  Change Policy
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDeactivatingTarget({
                      policyId: activePolicy.id,
                      policyName: activePolicy.name,
                      assignmentId: activeAssignment?.id,
                      isCustom: isCurrentPolicyCustom,
                    })
                  }
                  style={{ color: 'hsl(var(--color-warning))' }}
                  title="Deactivate / Unassign this policy from this company"
                >
                  Deactivate Policy
                </Button>

                {isCurrentPolicyCustom && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDeletingTarget({
                        policyId: activePolicy.id,
                        policyName: activePolicy.name,
                      })
                    }
                    style={{ color: 'hsl(var(--color-danger))' }}
                    title="Permanently delete this custom company policy"
                  >
                    <Trash2 size={13} style={{ marginRight: '4px' }} />
                    Delete Policy
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {activePolicy.description && (
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-secondary))',
                  margin: '0 0 var(--space-4) 0',
                }}
              >
                {activePolicy.description}
              </p>
            )}

            {/* Quotas & Entitlements Grid */}
            <div>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-primary))',
                  marginBottom: 'var(--space-3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <FileText size={14} style={{ color: 'hsl(var(--primary-color))' }} />
                <span>Configured Annual Entitlements & Accrual Rules:</span>
              </div>

              {(() => {
                const entitlementsList =
                  activePolicy.entitlements ||
                  ((activePolicy as unknown as Record<string, unknown>)
                    ?.policyEntitlements as typeof activePolicy.entitlements) ||
                  ((activePolicy as unknown as Record<string, unknown>)
                    ?.policy_entitlements as typeof activePolicy.entitlements) ||
                  [];

                return entitlementsList && entitlementsList.length > 0 ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                      gap: 'var(--space-3)',
                    }}
                  >
                    {entitlementsList.map((ent, idx) => {
                      const lt = leaveTypes.find((t) => t.id === ent.leaveTypeId);
                      const annualQuota = ent.annualQuota ?? ent.quotaDays ?? 0;
                      const accrual = (ent.accrualType || 'UPFRONT').toUpperCase();

                      return (
                        <div
                          key={idx}
                          style={{
                            padding: 'var(--space-3) var(--space-4)',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'hsl(var(--bg-surface))',
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
                            <span
                              style={{
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: 700,
                                color: 'hsl(var(--text-primary))',
                              }}
                            >
                              {lt?.name || ent.leaveType?.name || 'Leave Category'}
                            </span>
                            <Badge variant={lt?.isPaid !== false ? 'primary' : 'warning'}>
                              {lt?.code || 'LEAVE'}
                            </Badge>
                          </div>

                          {/* Annual Quota Number */}
                          <div
                            style={{
                              fontSize: 'var(--font-size-xl)',
                              fontWeight: 800,
                              color: 'hsl(var(--primary-color))',
                            }}
                          >
                            {annualQuota}{' '}
                            <span
                              style={{
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: 500,
                                color: 'hsl(var(--text-muted))',
                              }}
                            >
                              days / year
                            </span>
                          </div>

                          {/* Rules Breakdown */}
                          <div
                            style={{
                              borderTop: '1px solid hsl(var(--border-subtle))',
                              paddingTop: 'var(--space-2)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              fontSize: '11px',
                              color: 'hsl(var(--text-secondary))',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'hsl(var(--text-muted))' }}>
                                Accrual Schedule:
                              </span>
                              <strong style={{ color: 'hsl(var(--text-primary))' }}>
                                {accrual === 'MONTHLY'
                                  ? `Monthly (${(annualQuota / 12).toFixed(1)}d/mo)`
                                  : accrual === 'QUARTERLY'
                                    ? `Quarterly (${(annualQuota / 4).toFixed(1)}d/qtr)`
                                    : 'Upfront (Annual)'}
                              </strong>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'hsl(var(--text-muted))' }}>
                                Carry-Forward:
                              </span>
                              <span>
                                {lt?.isCarryForward
                                  ? `Max ${lt.maxCarryForwardDays || 0} days`
                                  : 'Non-carry-forward'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'hsl(var(--text-muted))' }}>
                                Documentation:
                              </span>
                              <span>
                                {lt?.requiresDocument ? 'Mandatory proof' : 'No proof required'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
                    }}
                  >
                    No specific entitlement quotas attached to this template.
                  </div>
                );
              })()}

              {/* Automatic Balance Sync Indicator */}
              <div
                style={{
                  marginTop: 'var(--space-4)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'hsl(var(--color-success) / 0.06)',
                  border: '1px solid hsl(var(--color-success) / 0.2)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--color-success))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Automated Balance Provisioning:</strong> Deployed employees receive their
                  applicable opening/accrued balances immediately. Manual balance adjustments are
                  strictly for special HR corrections.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Empty State with 2 Action Cards */
        <div
          style={{
            padding: 'var(--space-8)',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)',
            border: '1px dashed hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-secondary) / 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-5)',
          }}
        >
          <div>
            <Layers
              size={36}
              style={{ color: 'hsl(var(--text-muted))', margin: '0 auto var(--space-2) auto' }}
            />
            <div
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
              }}
            >
              No Leave Policy Assigned to {companyName || 'Company'}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-secondary))',
                maxWidth: '480px',
                margin: '4px auto 0',
              }}
            >
              Choose how to configure time-off entitlements for employees deployed at this client
              company:
            </div>
          </div>

          {/* 2 Option Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 'var(--space-4)',
              width: '100%',
              maxWidth: '640px',
            }}
          >
            {/* Option 1: Use Workspace Policy */}
            <div
              style={{
                padding: 'var(--space-5)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-surface))',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Building2 size={16} style={{ color: 'hsl(var(--primary-color))' }} />
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 'var(--font-size-sm)',
                      color: 'hsl(var(--text-primary))',
                    }}
                  >
                    1. Use Workspace Policy
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-secondary))',
                    margin: 'var(--space-2) 0 0 0',
                  }}
                >
                  Assign one of the reusable workspace standard policies (
                  {availableWorkspacePolicies.length} available).
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenUseWorkspaceModal}
                disabled={availableWorkspacePolicies.length === 0}
                style={{ width: '100%' }}
              >
                <Layers size={13} style={{ marginRight: '4px' }} />
                Select Workspace Policy
              </Button>
            </div>

            {/* Option 2: Create Custom Company Policy */}
            <div
              style={{
                padding: 'var(--space-5)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid hsl(var(--primary-color) / 0.4)',
                backgroundColor: 'hsl(var(--primary-color) / 0.03)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Sparkles size={16} style={{ color: 'hsl(var(--primary-color))' }} />
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 'var(--font-size-sm)',
                      color: 'hsl(var(--text-primary))',
                    }}
                  >
                    2. Create Custom Policy
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-secondary))',
                    margin: 'var(--space-2) 0 0 0',
                  }}
                >
                  Define custom leave quotas, accruals, and rules directly for this client without
                  workspace-level setup.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateCustomModal}
                style={{ width: '100%' }}
              >
                <Plus size={13} style={{ marginRight: '4px' }} />
                Create Custom Policy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Assignment History Table */}
      {companyAssignments.length > 0 && (
        <div style={{ marginTop: 'var(--space-2)' }}>
          <h4
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--text-muted))',
              margin: '0 0 var(--space-3) 0',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <Clock size={14} />
            <span>Policy Assignment History ({companyAssignments.length})</span>
          </h4>

          <div
            style={{
              overflowX: 'auto',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid hsl(var(--border-subtle))',
              backgroundColor: 'hsl(var(--bg-surface))',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--font-size-xs)',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'hsl(var(--bg-secondary) / 0.5)',
                    borderBottom: '1px solid hsl(var(--border-subtle))',
                  }}
                >
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>
                    Policy Name
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>
                    Policy Source
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>
                    Effective From
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>
                    Effective To
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>
                    Status
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>
                    Assigned On
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {companyAssignments.map((ass, idx) => {
                  const today = new Date().toISOString().slice(0, 10);
                  const isCurrent =
                    ass.effectiveFrom <= today && (!ass.effectiveTo || ass.effectiveTo >= today);

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid hsl(var(--border-subtle))',
                        backgroundColor: isCurrent ? 'hsl(var(--primary-color) / 0.03)' : undefined,
                      }}
                    >
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>
                        {ass.policyName}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <Badge variant={ass.isCustom ? 'primary' : 'secondary'}>
                          {ass.isCustom ? 'Custom Company' : 'Workspace Standard'}
                        </Badge>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        {ass.effectiveFrom}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        {ass.effectiveTo || 'Open'}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        {isCurrent ? (
                          <Badge variant="success">Current Active</Badge>
                        ) : (
                          <Badge variant="secondary">Historical</Badge>
                        )}
                      </td>
                      <td
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          color: 'hsl(var(--text-muted))',
                        }}
                      >
                        {ass.createdAt ? new Date(ass.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          {isCurrent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setDeactivatingTarget({
                                  policyId: ass.policyId,
                                  policyName: ass.policyName,
                                  assignmentId: ass.id,
                                  isCustom: ass.isCustom,
                                })
                              }
                              style={{
                                color: 'hsl(var(--color-warning))',
                                fontSize: '11px',
                                height: '26px',
                              }}
                              title="Deactivate policy assignment"
                            >
                              Deactivate
                            </Button>
                          )}
                          {ass.isCustom && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setDeletingTarget({
                                  policyId: ass.policyId,
                                  policyName: ass.policyName,
                                })
                              }
                              style={{
                                color: 'hsl(var(--color-danger))',
                                fontSize: '11px',
                                height: '26px',
                              }}
                              title="Delete custom policy"
                            >
                              <Trash2 size={13} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Policy Lifecycle & Management Section */}
      {activePolicy && (
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid hsl(var(--border-subtle))',
            backgroundColor: 'hsl(var(--bg-surface))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
              }}
            >
              Policy Lifecycle & Deactivation
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'hsl(var(--text-secondary))',
                marginTop: '2px',
              }}
            >
              Deactivating unassigns <strong>{activePolicy.name}</strong> from{' '}
              {companyName || 'this company'} and stops future accruals while preserving all
              historical employee leave records.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDeactivatingTarget({
                  policyId: activePolicy.id,
                  policyName: activePolicy.name,
                  assignmentId: activeAssignment?.id,
                  isCustom: isCurrentPolicyCustom,
                })
              }
              style={{
                color: 'hsl(var(--color-warning))',
                borderColor: 'hsl(var(--color-warning) / 0.4)',
              }}
            >
              Deactivate Active Policy
            </Button>
            {isCurrentPolicyCustom && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDeletingTarget({
                    policyId: activePolicy.id,
                    policyName: activePolicy.name,
                  })
                }
                style={{
                  color: 'hsl(var(--color-danger))',
                  borderColor: 'hsl(var(--color-danger) / 0.4)',
                }}
              >
                <Trash2 size={13} style={{ marginRight: '4px' }} />
                Delete Custom Policy
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: Use Workspace Policy Modal                       */}
      {/* ========================================================= */}
      <Modal
        isOpen={isUseWorkspaceModalOpen}
        onClose={() => setIsUseWorkspaceModalOpen(false)}
        title={`Assign Workspace Leave Policy to ${companyName || 'Company'}`}
        size="md"
      >
        <form
          onSubmit={handleUseWorkspaceSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        >
          {formError && (
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <AlertCircle size={15} />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: '6px',
              }}
            >
              Select Workspace Policy Template{' '}
              <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
            </label>
            <select
              value={selectedWorkspacePolicyId}
              onChange={(e) => setSelectedWorkspacePolicyId(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border-subtle))',
                backgroundColor: 'hsl(var(--bg-surface))',
                color: 'hsl(var(--text-primary))',
                fontSize: 'var(--font-size-xs)',
              }}
              required
            >
              {availableWorkspacePolicies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.entitlements?.length || 0} quotas defined)
                </option>
              ))}
            </select>
          </div>

          {/* Quota Preview for selected policy */}
          {previewWorkspacePolicy && (
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--bg-secondary) / 0.4)',
                border: '1px solid hsl(var(--border-subtle))',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'hsl(var(--text-muted))',
                  textTransform: 'uppercase',
                  marginBottom: '6px',
                }}
              >
                Template Quotas:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {previewWorkspacePolicy.entitlements &&
                previewWorkspacePolicy.entitlements.length > 0 ? (
                  previewWorkspacePolicy.entitlements.map((ent, idx) => {
                    const lt = leaveTypes.find((t) => t.id === ent.leaveTypeId);
                    return (
                      <span
                        key={idx}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'hsl(var(--bg-surface))',
                          border: '1px solid hsl(var(--border-subtle))',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {lt?.name || 'Leave'}: {ent.annualQuota ?? ent.quotaDays ?? 0}d (
                        {ent.accrualType.toLowerCase()})
                      </span>
                    );
                  })
                ) : (
                  <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                    No quotas configured in this template.
                  </span>
                )}
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-3)',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                  marginBottom: '6px',
                }}
              >
                Effective From <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
              </label>
              <Input
                type="date"
                value={workspaceEffectiveFrom}
                onChange={(e) => setWorkspaceEffectiveFrom(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                  marginBottom: '6px',
                }}
              >
                Effective To
              </label>
              <Input
                type="date"
                value={workspaceEffectiveTo}
                onChange={(e) => setWorkspaceEffectiveTo(e.target.value)}
              />
            </div>
          </div>

          {/* Auto provision checkbox */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={autoProvisionWorkspace}
              onChange={(e) => setAutoProvisionWorkspace(e.target.checked)}
            />
            <span style={{ color: 'hsl(var(--text-primary))', fontWeight: 600 }}>
              Automatically initialize and provision leave balances for active company employees
            </span>
          </label>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-2)',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUseWorkspaceModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Assigning...' : 'Assign Workspace Policy'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: Create Custom Company Policy Modal               */}
      {/* ========================================================= */}
      <Modal
        isOpen={isCreateCustomModalOpen}
        onClose={() => setIsCreateCustomModalOpen(false)}
        title={`Create Custom Leave Policy for ${companyName || 'Company'}`}
        size="lg"
      >
        <form
          onSubmit={handleCreateCustomSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        >
          {formError && (
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <AlertCircle size={15} />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: '6px',
              }}
            >
              Custom Policy Name <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
            </label>
            <Input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Das Technologies Standard Leave Policy 2026"
              required
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-3)',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                  marginBottom: '6px',
                }}
              >
                Effective From <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
              </label>
              <Input
                type="date"
                value={customEffectiveFrom}
                onChange={(e) => setCustomEffectiveFrom(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                  marginBottom: '6px',
                }}
              >
                Effective To
              </label>
              <Input
                type="date"
                value={customEffectiveTo}
                onChange={(e) => setCustomEffectiveTo(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: '6px',
              }}
            >
              Description
            </label>
            <Input
              type="text"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Brief description of terms and applicability..."
            />
          </div>

          {/* Quota Builder Table */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-2)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-primary))',
                }}
              >
                Configured Quotas & Accruals ({customQuotas.length})
              </span>
              <Button type="button" variant="outline" size="sm" onClick={handleAddCustomQuota}>
                <Plus size={13} style={{ marginRight: '4px' }} />
                Add Quota
              </Button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                maxHeight: '220px',
                overflowY: 'auto',
                border: '1px solid hsl(var(--border-subtle))',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2)',
                backgroundColor: 'hsl(var(--bg-secondary) / 0.3)',
              }}
            >
              {customQuotas.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1.5fr auto',
                    gap: 'var(--space-2)',
                    alignItems: 'center',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'hsl(var(--bg-surface))',
                    border: '1px solid hsl(var(--border-subtle))',
                  }}
                >
                  <select
                    value={row.leaveTypeId}
                    onChange={(e) =>
                      setCustomQuotas((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, leaveTypeId: e.target.value } : r)),
                      )
                    }
                    style={{
                      height: '34px',
                      padding: '0 var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border-subtle))',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    {leaveTypes.map((lt) => (
                      <option key={lt.id} value={lt.id}>
                        {lt.name} ({lt.code})
                      </option>
                    ))}
                  </select>

                  <Input
                    type="number"
                    min={0}
                    max={365}
                    value={row.quotaDays}
                    onChange={(e) =>
                      setCustomQuotas((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, quotaDays: Number(e.target.value) } : r,
                        ),
                      )
                    }
                    placeholder="Days"
                    style={{ height: '34px' }}
                  />

                  <select
                    value={row.accrualType}
                    onChange={(e) =>
                      setCustomQuotas((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, accrualType: e.target.value as AccrualType } : r,
                        ),
                      )
                    }
                    style={{
                      height: '34px',
                      padding: '0 var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border-subtle))',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    <option value={AccrualType.UPFRONT}>Upfront (Annual)</option>
                    <option value={AccrualType.MONTHLY}>Monthly Accrual</option>
                    <option value={AccrualType.QUARTERLY}>Quarterly Accrual</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setCustomQuotas((prev) => prev.filter((_, i) => i !== idx))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'hsl(var(--color-danger))',
                      cursor: 'pointer',
                      padding: 'var(--space-2)',
                    }}
                    title="Remove quota"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Auto provision checkbox */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-xs)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={autoProvisionCustom}
              onChange={(e) => setAutoProvisionCustom(e.target.checked)}
            />
            <span style={{ color: 'hsl(var(--text-primary))', fontWeight: 600 }}>
              Automatically initialize and provision leave balances for active company employees
            </span>
          </label>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-2)',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateCustomModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Save & Assign Custom Policy'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: Edit Custom Company Policy Modal                 */}
      {/* ========================================================= */}
      <Modal
        isOpen={isEditCustomModalOpen}
        onClose={() => setIsEditCustomModalOpen(false)}
        title="Edit Custom Company Policy"
        size="lg"
      >
        <form
          onSubmit={handleEditCustomSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
        >
          {formError && (
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <AlertCircle size={15} />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: '6px',
              }}
            >
              Policy Name <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
            </label>
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-3)',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                  marginBottom: '6px',
                }}
              >
                Effective From <span style={{ color: 'hsl(var(--color-danger))' }}>*</span>
              </label>
              <Input
                type="date"
                value={editEffectiveFrom}
                onChange={(e) => setEditEffectiveFrom(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'hsl(var(--text-primary))',
                  marginBottom: '6px',
                }}
              >
                Effective To
              </label>
              <Input
                type="date"
                value={editEffectiveTo}
                onChange={(e) => setEditEffectiveTo(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'hsl(var(--text-primary))',
                marginBottom: '6px',
              }}
            >
              Description
            </label>
            <Input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </div>

          {/* Edit Quotas Table */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-2)',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: 'hsl(var(--text-primary))',
                }}
              >
                Entitlements ({editQuotas.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const first = leaveTypes[0];
                  if (!first) return;
                  setEditQuotas((prev) => [
                    ...prev,
                    {
                      leaveTypeId: first.id,
                      quotaDays: 12,
                      accrualType: AccrualType.UPFRONT,
                    },
                  ]);
                }}
              >
                <Plus size={13} style={{ marginRight: '4px' }} />
                Add Quota
              </Button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
                maxHeight: '220px',
                overflowY: 'auto',
                border: '1px solid hsl(var(--border-subtle))',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2)',
                backgroundColor: 'hsl(var(--bg-secondary) / 0.3)',
              }}
            >
              {editQuotas.map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1.5fr auto',
                    gap: 'var(--space-2)',
                    alignItems: 'center',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'hsl(var(--bg-surface))',
                    border: '1px solid hsl(var(--border-subtle))',
                  }}
                >
                  <select
                    value={row.leaveTypeId}
                    onChange={(e) =>
                      setEditQuotas((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, leaveTypeId: e.target.value } : r)),
                      )
                    }
                    style={{
                      height: '34px',
                      padding: '0 var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border-subtle))',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    {leaveTypes.map((lt) => (
                      <option key={lt.id} value={lt.id}>
                        {lt.name} ({lt.code})
                      </option>
                    ))}
                  </select>

                  <Input
                    type="number"
                    min={0}
                    max={365}
                    value={row.quotaDays}
                    onChange={(e) =>
                      setEditQuotas((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, quotaDays: Number(e.target.value) } : r,
                        ),
                      )
                    }
                    style={{ height: '34px' }}
                  />

                  <select
                    value={row.accrualType}
                    onChange={(e) =>
                      setEditQuotas((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, accrualType: e.target.value as AccrualType } : r,
                        ),
                      )
                    }
                    style={{
                      height: '34px',
                      padding: '0 var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border-subtle))',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    <option value={AccrualType.UPFRONT}>Upfront (Annual)</option>
                    <option value={AccrualType.MONTHLY}>Monthly Accrual</option>
                    <option value={AccrualType.QUARTERLY}>Quarterly Accrual</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setEditQuotas((prev) => prev.filter((_, i) => i !== idx))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'hsl(var(--color-danger))',
                      cursor: 'pointer',
                      padding: 'var(--space-2)',
                    }}
                    title="Remove quota"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-2)',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditCustomModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Custom Policy'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: Deactivate Policy Confirmation Modal             */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(deactivatingTarget)}
        onClose={() => setDeactivatingTarget(null)}
        title="Deactivate / Unassign Leave Policy"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && (
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <AlertCircle size={15} />
              <span>{formError}</span>
            </div>
          )}

          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-secondary))',
              margin: 0,
            }}
          >
            Are you sure you want to deactivate policy{' '}
            <strong>"{deactivatingTarget?.policyName}"</strong> for{' '}
            <strong>{companyName || 'this company'}</strong>?
          </p>

          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--color-warning) / 0.08)',
              border: '1px solid hsl(var(--color-warning) / 0.25)',
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--color-warning, 38 92% 50%))',
            }}
          >
            <strong>Consequences:</strong>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: 'var(--space-4)', lineHeight: 1.5 }}>
              <li>Future automatic accruals under this policy will stop immediately.</li>
              <li>
                Employees will no longer be covered by this policy after the deactivation date.
              </li>
              <li>
                All historical leave applications and ledger balances will remain strictly
                preserved.
              </li>
            </ul>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-2)',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeactivatingTarget(null)}
              disabled={isDeactivating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmDeactivate}
              disabled={isDeactivating}
              style={{
                backgroundColor: 'hsl(var(--color-warning, 38 92% 50%))',
                borderColor: 'hsl(var(--color-warning, 38 92% 50%))',
              }}
            >
              {isDeactivating ? 'Deactivating...' : 'Confirm Deactivation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 5: Delete Custom Policy Confirmation Modal          */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(deletingTarget)}
        onClose={() => setDeletingTarget(null)}
        title="Delete Custom Company Policy"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && (
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(var(--color-danger) / 0.1)',
                color: 'hsl(var(--color-danger))',
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <AlertCircle size={15} />
              <span>{formError}</span>
            </div>
          )}

          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-secondary))',
              margin: 0,
            }}
          >
            Are you sure you want to permanently delete custom company policy{' '}
            <strong>"{deletingTarget?.policyName}"</strong>?
          </p>

          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(var(--color-danger) / 0.08)',
              border: '1px solid hsl(var(--color-danger) / 0.25)',
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--color-danger))',
            }}
          >
            <strong>Warning:</strong> This will delete the custom policy definition from the system.
            This action cannot be undone.
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-2)',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              style={{
                backgroundColor: 'hsl(var(--color-danger))',
                borderColor: 'hsl(var(--color-danger))',
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete Policy'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
