import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';
import { Badge } from '../badge';
import { Input } from '../input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card';

describe('Atomic Design System - Atoms Layer', () => {
  describe('Button Atom', () => {
    it('should render button with primary variant and text', () => {
      render(<Button variant="primary">Click Me</Button>);
      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('should handle click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Action</Button>);
      fireEvent.click(screen.getByRole('button', { name: 'Action' }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should disable button and show loading indicator when isLoading is true', () => {
      render(<Button isLoading>Loading Action</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should render icons when leftIcon or rightIcon are provided', () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">←</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
        >
          Nav
        </Button>,
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Badge Atom', () => {
    it('should render with different variants', () => {
      const { rerender } = render(<Badge variant="success">Confirmed</Badge>);
      expect(screen.getByText('Confirmed')).toBeInTheDocument();

      rerender(<Badge variant="warning">Pending</Badge>);
      expect(screen.getByText('Pending')).toBeInTheDocument();

      rerender(<Badge variant="danger">Cancelled</Badge>);
      expect(screen.getByText('Cancelled')).toBeInTheDocument();

      rerender(<Badge variant="info">Info</Badge>);
      expect(screen.getByText('Info')).toBeInTheDocument();
    });
  });

  describe('Input Atom', () => {
    it('should render input field with accessible label and helper text', () => {
      render(
        <Input
          label="Email Address"
          helperText="We will never share your email"
          placeholder="user@example.com"
        />,
      );
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('We will never share your email')).toBeInTheDocument();
    });

    it('should render accessible error state when error prop is set', () => {
      render(<Input label="Password" error="Password must be at least 8 characters" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Password must be at least 8 characters');
      expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Card Atom Compound', () => {
    it('should render Card container and nested sections', () => {
      render(
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Atom Title</CardTitle>
            <CardDescription>Atom Description</CardDescription>
          </CardHeader>
          <CardContent>Body content</CardContent>
          <CardFooter>Footer content</CardFooter>
        </Card>,
      );

      expect(screen.getByText('Atom Title')).toBeInTheDocument();
      expect(screen.getByText('Atom Description')).toBeInTheDocument();
      expect(screen.getByText('Body content')).toBeInTheDocument();
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });
  });
});
