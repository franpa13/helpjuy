import { fireEvent, render, screen } from '@testing-library/react';
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard';

function Page({ dirty }: { dirty: boolean }) {
  useUnsavedChangesGuard(dirty);
  return (
    <>
      <a href="/panel">Mis fichas</a>
      <a href="/e/abc" target="_blank">
        Ver como el paramédico
      </a>
      <a href="/panel/fondo" download>
        Descargar
      </a>
    </>
  );
}

const beforeUnload = () => {
  const e = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(e);
  return e.defaultPrevented;
};

describe('useUnsavedChangesGuard', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sin cambios no molesta: ni al cerrar la pestaña ni al tocar un link', () => {
    const confirm = vi.spyOn(window, 'confirm');
    render(<Page dirty={false} />);
    expect(beforeUnload()).toBe(false);
    fireEvent.click(screen.getByText('Mis fichas'));
    expect(confirm).not.toHaveBeenCalled();
  });

  it('con cambios, el navegador pide confirmar antes de cerrar o recargar', () => {
    render(<Page dirty />);
    expect(beforeUnload()).toBe(true);
  });

  it('con cambios, un link interno pregunta; si dice que no, se queda', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Page dirty />);
    const followed = fireEvent.click(screen.getByText('Mis fichas'));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('cambios sin guardar'));
    expect(followed).toBe(false);
  });

  it('si dice que sí, sigue', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Page dirty />);
    expect(fireEvent.click(screen.getByText('Mis fichas'))).toBe(true);
  });

  it('no pregunta por links que abren otra pestaña o descargan (no se pierde nada)', () => {
    const confirm = vi.spyOn(window, 'confirm');
    render(<Page dirty />);
    fireEvent.click(screen.getByText('Ver como el paramédico'));
    fireEvent.click(screen.getByText('Descargar'));
    expect(confirm).not.toHaveBeenCalled();
  });
});
