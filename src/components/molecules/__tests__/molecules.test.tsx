import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../modal';
import { EmptyState } from '../empty-state';

describe('Atomic Design System - Molecules Layer', () => {
  describe('Modal Molecule', () => {
    it('should render dialog when open and call onClose on close button click', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Order Details">
          <p>Order item rows</p>
        </Modal>,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Order Details')).toBeInTheDocument();
      expect(screen.getByText('Order item rows')).toBeInTheDocument();

      const closeButton = screen.getByLabelText('Close dialog');
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should close on Escape keydown', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Escape Test">
          <p>Content</p>
        </Modal>,
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should not render anything when isOpen is false', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={() => {}} title="Closed Modal">
          <p>Hidden</p>
        </Modal>,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('EmptyState Molecule', () => {
    it('should render title, description, and handle action button click', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No records found"
          description="Try modifying your filter parameters."
          actionLabel="Clear Filters"
          onAction={handleAction}
          icon={<span data-testid="empty-icon">📂</span>}
        />,
      );

      expect(screen.getByText('No records found')).toBeInTheDocument();
      expect(screen.getByText('Try modifying your filter parameters.')).toBeInTheDocument();
      expect(screen.getByTestId('empty-icon')).toBeInTheDocument();

      const button = screen.getByRole('button', { name: 'Clear Filters' });
      fireEvent.click(button);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });
});
