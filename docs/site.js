(() => {
  const steps = [
    { role: 'Project team', title: 'A clear plan comes first.', detail: 'The pilot allocation is ready. The team prepares a request for 20 million VND of water filters.', approvals: 0, status: 'Eligible', payment: 'Locked', released: '0', next: 'Locked', event: 'Campaign prepared · 100M VND across 3 stages' },
    { role: 'Project team', title: 'One request. One version.', detail: 'The team records the recipient and purpose. Both reviewers must approve this exact version.', approvals: 0, status: 'Requested', payment: 'Locked', released: '0', next: 'Locked', event: 'M1 requested · Version 1 · 20M VND' },
    { role: 'Sponsor', title: 'One approval is not enough.', detail: 'The sponsor has reviewed the request. The independent auditor must still approve before a release is possible.', approvals: 1, status: 'Requested', payment: 'Locked', released: '0', next: 'Locked', event: 'Sponsor approval · 1 of 2 · Release stays locked' },
    { role: 'Independent auditor', title: 'Independent review completes the pair.', detail: 'A different person approves the same version. The sponsor can now record the mock release.', approvals: 2, status: 'Approved', payment: 'Ready', released: '0', next: 'Locked', event: 'Auditor approval · 2 of 2 · Request approved' },
    { role: 'Sponsor', title: 'Release once. Then show the result.', detail: 'A 20M VND mock payment is recorded. Retrying the same request does not create another payment. Delivery evidence is still required.', approvals: 2, status: 'Disbursed', payment: 'Recorded', released: '20', next: 'Locked', event: 'Mock payment recorded · No real funds moved' },
    { role: 'Team → Auditor', title: 'Verified progress opens the next stage.', detail: 'The team submits evidence and the auditor verifies delivery. The 30M VND expansion stage opens for a new request and two new approvals.', approvals: 2, status: 'Verified', payment: 'Recorded', released: '20', next: 'Eligible', event: 'Evidence verified · M2 opens · No automatic payment' },
  ];
  let current = 0;
  const byId = id => document.getElementById(id);
  const buttons = [...document.querySelectorAll('[data-step]')];
  function render(announce = false) {
    const step = steps[current];
    for (const key of ['role', 'title', 'detail', 'status', 'payment', 'released', 'event']) byId(`story-${key}`).textContent = step[key];
    byId('story-next-milestone').textContent = step.next;
    byId('story-approvals').textContent = `${step.approvals} / 2`;
    byId('sponsor-review').textContent = step.approvals >= 1 ? 'Approved' : 'Awaiting review';
    byId('auditor-review').textContent = step.approvals >= 2 ? 'Approved' : 'Awaiting review';
    byId('sponsor-review').classList.toggle('approved', step.approvals >= 1);
    byId('auditor-review').classList.toggle('approved', step.approvals >= 2);
    byId('story-status').classList.toggle('approved', current >= 3);
    byId('story-progress').style.width = `${(current / (steps.length - 1)) * 100}%`;
    byId('story-counter').textContent = `${current + 1} / ${steps.length}`;
    byId('story-prev').disabled = current === 0;
    byId('story-next').disabled = current === steps.length - 1;
    buttons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === current));
      button.classList.toggle('active', index === current);
    });
    if (announce) byId('story-announcement').textContent = `Step ${current + 1} of ${steps.length}. ${step.title} ${step.detail}`;
  }
  buttons.forEach(button => button.addEventListener('click', () => { current = Number(button.dataset.step); render(true); }));
  byId('story-prev').addEventListener('click', () => { current = Math.max(0, current - 1); render(true); });
  byId('story-next').addEventListener('click', () => { current = Math.min(steps.length - 1, current + 1); render(true); });
  byId('story-reset').addEventListener('click', () => { current = 0; render(true); });
  byId('story-controls').hidden = false;
  render();
})();
