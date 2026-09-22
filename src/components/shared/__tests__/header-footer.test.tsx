import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../header';
import { Footer } from '../footer';

describe('Header and Footer Components (AGENTS.md Rule 19)', () => {
  it('should render Header with brand title and navigation links', () => {
    render(<Header />);

    expect(screen.getByText('HR Dashboard')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should render Footer with copyright and operational status indicator', () => {
    render(<Footer />);

    expect(screen.getByText(/All Systems Operational/i)).toBeInTheDocument();
    expect(screen.getByText(/HR Dashboard/i)).toBeInTheDocument();
  });
});
