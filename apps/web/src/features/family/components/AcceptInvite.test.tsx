import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AcceptInvite } from './AcceptInvite';

describe('AcceptInvite', () => {
  it('unirse llama a la API y va a la familia', async () => {
    const user = userEvent.setup();
    const { routerPush } = await import('../../../../vitest.setup');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    render(<AcceptInvite token="tok123" groupName="Familia Paredes" />);
    await user.click(screen.getByRole('button', { name: 'Unirme a Familia Paredes' }));
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/family-invites/tok123/accept');
    await vi.waitFor(() => expect(routerPush).toHaveBeenCalledWith('/panel/familia'));
  });

  it('si el link venció lo explica', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'invalid_token' }), { status: 400, headers: { 'Content-Type': 'application/json' } }),
    );
    render(<AcceptInvite token="tok123" groupName="Familia Paredes" />);
    await user.click(screen.getByRole('button', { name: 'Unirme a Familia Paredes' }));
    expect(await screen.findByText('La invitación venció o ya se usó. Pedile a quien te invitó un link nuevo.')).toBeInTheDocument();
  });
});
