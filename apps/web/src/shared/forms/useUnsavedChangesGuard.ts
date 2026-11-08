'use client';

import { useEffect } from 'react';

const MESSAGE = 'Tenés cambios sin guardar. Si salís ahora, se pierden. ¿Salir igual?';

/**
 * Avisa antes de perder cambios sin guardar: al cerrar o recargar la pestaña (lo pregunta el navegador)
 * y al tocar un link del panel (Next navega sin recargar, así que el aviso del navegador no salta).
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    // En captura, antes que el Link de Next: si la persona se arrepiente, el clic no llega.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href]');
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      // Fuera del sitio ya avisa el navegador (beforeunload); un ancla en la misma página no pierde nada.
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!window.confirm(MESSAGE)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty]);
}
