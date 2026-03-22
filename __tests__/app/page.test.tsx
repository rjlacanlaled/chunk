import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Landing page', () => {
  it('shows the hero headline', async () => {
    const { default: LandingPage } = await import('@/app/page');
    render(<LandingPage />);

    expect(
      screen.getByText('Chunky fixed it.'),
    ).toBeInTheDocument();
  });

  it('shows the CTA button linking to dashboard', async () => {
    const { default: LandingPage } = await import('@/app/page');
    render(<LandingPage />);

    const cta = screen.getByText(/Chat with Chunky/);
    expect(cta).toBeInTheDocument();
    expect(cta.closest('a')).toHaveAttribute('href', '/dashboard');
  });

  it('renders the Chunk logo in footer', async () => {
    const { default: LandingPage } = await import('@/app/page');
    render(<LandingPage />);

    const logo = screen.getByAltText('Chunk');
    expect(logo).toBeInTheDocument();
    expect(logo.getAttribute('src')).toBe('/chunk-logos/chunk-logo-horizontal-dark.svg');
  });
});
