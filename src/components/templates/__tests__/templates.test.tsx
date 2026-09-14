import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarketingTemplate } from '../marketing-template';
import { DashboardTemplate } from '../dashboard-template';
import { AuthTemplate } from '../auth-template';

describe('Atomic Design System - Templates Layer', () => {
  describe('MarketingTemplate', () => {
    it('should render hero, stats, features, and CTA slots correctly', () => {
      render(
        <MarketingTemplate
          heroSlot={<div data-testid="hero-slot">Hero Headline</div>}
          statsSlot={<div data-testid="stats-slot">100+ Customers</div>}
          featuresSlot={<div data-testid="features-slot">Core Features</div>}
          ctaSlot={<div data-testid="cta-slot">Get Started Free</div>}
        />,
      );

      expect(screen.getByTestId('hero-slot')).toBeInTheDocument();
      expect(screen.getByTestId('stats-slot')).toBeInTheDocument();
      expect(screen.getByTestId('features-slot')).toBeInTheDocument();
      expect(screen.getByTestId('cta-slot')).toBeInTheDocument();
    });
  });

  describe('DashboardTemplate', () => {
    it('should render header, actions, stats, and content slots correctly', () => {
      render(
        <DashboardTemplate
          headerSlot={<h1>Orders Dashboard</h1>}
          actionsSlot={<button type="button">Export CSV</button>}
          statsSlot={<div>Stats Grid</div>}
          contentSlot={<div>Orders Table</div>}
        />,
      );

      expect(screen.getByRole('heading', { name: 'Orders Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
      expect(screen.getByText('Stats Grid')).toBeInTheDocument();
      expect(screen.getByText('Orders Table')).toBeInTheDocument();
    });
  });

  describe('AuthTemplate', () => {
    it('should render title, subtitle, form, and footer slots', () => {
      render(
        <AuthTemplate
          title="Sign in to your account"
          subtitle="Enter your credentials below"
          formSlot={
            <form aria-label="login-form">
              <input placeholder="Email" />
            </form>
          }
          footerSlot={<p>Need help? Contact support</p>}
        />,
      );

      expect(screen.getByRole('heading', { name: 'Sign in to your account' })).toBeInTheDocument();
      expect(screen.getByText('Enter your credentials below')).toBeInTheDocument();
      expect(screen.getByRole('form', { name: 'login-form' })).toBeInTheDocument();
      expect(screen.getByText('Need help? Contact support')).toBeInTheDocument();
    });
  });
});
