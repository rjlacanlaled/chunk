import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Landing page', () => {
  it('shows the hero headline', async () => {
    const { default: LandingPage } = await import('@/app/page');
    render(<LandingPage />);

    expect(
      screen.getByText('Your to-do app is broken.'),
    ).toBeInTheDocument();
  });

  it('shows the CTA button linking to dashboard', async () => {
    const { default: LandingPage } = await import('@/app/page');
    render(<LandingPage />);

    const cta = screen.getByText('Start chunking — it\'s free');
    expect(cta).toBeInTheDocument();
    expect(cta.closest('a')).toHaveAttribute('href', '/dashboard');
  });

  it('renders the Chunk logo in nav and footer', async () => {
    const { default: LandingPage } = await import('@/app/page');
    render(<LandingPage />);

    const logos = screen.getAllByAltText('Chunk');
    expect(logos.length).toBeGreaterThanOrEqual(2);
    const headerLogo = logos.find(
      (el) => el.getAttribute('src') === '/chunk-logos/chunk-logo-horizontal-dark.svg',
    );
    expect(headerLogo).toBeInTheDocument();
  });
});
