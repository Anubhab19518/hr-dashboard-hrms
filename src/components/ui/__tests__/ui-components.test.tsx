import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';
import { Badge } from '../badge';
import { Input } from '../input';
import { Modal } from '../modal';
import { EmptyState } from '@/components/shared/empty-state';

describe('UI Primitives and Shared Components (AGENTS.md Rule 71)', () => {
  it('should render Card and all subcomponents correctly', () => {
    render(
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Content Area</CardContent>
        <CardFooter>Footer Area</CardFooter>
      </Card>,
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Content Area')).toBeInTheDocument();
    expect(screen.getByText('Footer Area')).toBeInTheDocument();
  });

  it('should render Badge with various variants', () => {
    const { rerender } = render(<Badge variant="success">Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();

    rerender(<Badge variant="danger">Failed</Badge>);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('should render Input with label, helperText and accessible error', () => {
    const { rerender } = render(
      <Input label="Username" placeholder="Enter username" helperText="Max 20 chars" />,
    );

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByText('Max 20 chars')).toBeInTheDocument();

    rerender(<Input label="Username" error="Username already taken" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Username already taken');
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
  });

  it('should render Modal when open and call onClose on close button or escape', () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal Body</p>
      </Modal>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Body')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close dialog/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);

    rerender(
      <Modal isOpen={false} onClose={handleClose} title="Test Modal">
        <p>Modal Body</p>
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render EmptyState with action button', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No Results"
        description="Try adjusting your filters"
        actionLabel="Clear Filters"
        onAction={handleAction}
      />,
    );

    expect(screen.getByText('No Results')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
