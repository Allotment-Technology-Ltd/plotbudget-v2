import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PartnerInviteEmail from '../partner-invite';

function render(props: { inviterEmail?: string; joinUrl?: string } = {}) {
  return renderToStaticMarkup(
    React.createElement(PartnerInviteEmail, {
      inviterEmail: props.inviterEmail ?? 'partner@example.com',
      joinUrl: props.joinUrl ?? 'https://app.plotbudget.com/partner/join?t=abc123',
    })
  );
}

describe('PartnerInviteEmail', () => {
  it('renders invite copy and accept CTA', () => {
    const html = render();
    expect(html).toContain('invited to join a household on PLOT Budget');
    expect(html).toContain('Accept invitation');
    expect(html).toContain('https://app.plotbudget.com/partner/join?t=abc123');
  });

  it('renders inviter email', () => {
    const html = render({ inviterEmail: 'alex@example.com' });
    expect(html).toContain('alex@example.com');
  });

  it('renders 20-minute payday ritual messaging', () => {
    const html = render();
    expect(html).toContain('20-minute payday ritual');
  });
});
