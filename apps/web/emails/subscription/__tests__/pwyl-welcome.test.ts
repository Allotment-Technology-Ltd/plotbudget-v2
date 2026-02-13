import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PWYLWelcomeEmail from '../pwyl-welcome';

function render(props: { displayName?: string; amount?: number } = {}) {
  return renderToStaticMarkup(
    React.createElement(PWYLWelcomeEmail, {
      displayName: props.displayName ?? 'there',
      amount: props.amount ?? 3,
    })
  );
}

describe('PWYLWelcomeEmail', () => {
  it('renders PLOT Premium and CTA link', () => {
    const html = render({ displayName: 'Alex', amount: 3 });
    expect(html).toContain('Welcome to PLOT Premium');
    expect(html).toContain('Manage Subscription');
    expect(html).toContain('https://app.plotbudget.com/dashboard/settings?tab=subscription');
  });

  it('renders thank-you for paid support when amount > 0', () => {
    const html = render({ displayName: 'Sam', amount: 3.5 });
    expect(html).toContain('Thank you for supporting PLOT');
    expect(html).toContain('Hi Sam');
  });

  it('renders Community Supporter when amount is 0', () => {
    const html = render({ displayName: 'Jordan', amount: 0 });
    expect(html).toContain('Community Supporter');
    expect(html).toContain('at no cost');
    expect(html).not.toContain('£0.00/month');
  });

  it('renders premium features list', () => {
    const html = render({ amount: 3 });
    expect(html).toContain('Unlimited bills and wants');
    expect(html).toContain('Unlimited savings pots');
    expect(html).toContain('Unlimited repayments');
  });
});
