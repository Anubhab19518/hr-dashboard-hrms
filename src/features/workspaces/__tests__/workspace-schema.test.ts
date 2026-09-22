import { describe, it, expect } from 'vitest';
import { createWorkspaceSchema } from '../schemas/workspace.schema';

describe('Workspace Schema Validation', () => {
  it('validates valid workspace payload', () => {
    const valid = createWorkspaceSchema.safeParse({
      name: 'Acme Security Corp',
      slug: 'acme-security-corp',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.name).toBe('Acme Security Corp');
      expect(valid.data.slug).toBe('acme-security-corp');
    }
  });

  it('rejects short workspace names', () => {
    const invalid = createWorkspaceSchema.safeParse({
      name: 'A',
      slug: 'valid-slug',
    });
    expect(invalid.success).toBe(false);
  });

  it('rejects invalid characters in slug', () => {
    const invalid = createWorkspaceSchema.safeParse({
      name: 'Valid Name',
      slug: 'Invalid Slug with Spaces!',
    });
    expect(invalid.success).toBe(false);
  });
});
