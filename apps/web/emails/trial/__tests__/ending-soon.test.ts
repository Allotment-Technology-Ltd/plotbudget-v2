import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TrialEndingSoonEmail from '../ending-soon';

function render(props: Parameters<typeof TrialEndingSoonEmail>[0]) {
  return renderToStaticMarkup(React.createElement(TrialEndingSoonEmail, props));
}

describe('TrialEndingSoonEmail', () => {
  it('renders trial ending copy and key phrases', () => {
    const html = render({ displayName: 'Alex', daysRemaining: 3 });
    expect(html).toContain('Your trial is ending soon');
    expect(html).toContain('Hi Alex');
    expect(html).toContain('trial ends in about 3 days');
    expect(html).toContain('Free tier');
    expect(html).toContain('Premium');
    expect(html).toContain('pay what you like');
  });

  it('includes blueprint or settings CTA URL', () => {
    const html = render({ displayName: 'Sam', daysRemaining: 3 });
    expect(html).toMatch(/dashboard\/blueprint|settings|plotbudget\.com/);
  });
});
