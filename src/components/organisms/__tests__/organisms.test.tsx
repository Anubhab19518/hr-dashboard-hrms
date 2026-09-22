import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../header';
import { Footer } from '../footer';

describe('Atomic Design System - Organisms Layer', () => {
  describe('Header Organism', () => {
    it('should render navigation links and CTA buttons', () => {
      render(<Header />);
      expect(screen.getByRole('navigation', { name: 'Main Navigation' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sign In' })).toBeInTheDocument();
    });
  });

  describe('Footer Organism', () => {
    it('should render copyright and operational status indicator', () => {
      render(<Footer />);
      expect(screen.getByText(/All Systems Operational/i)).toBeInTheDocument();
      expect(screen.getByText(/Workforce Management Platform/i)).toBeInTheDocument();
    });
  });
});
