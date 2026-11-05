import { render } from '@testing-library/react';
import { HeroText } from './HeroText';

describe('HeroText', () => {
  it('el titular conserva los espacios entre palabras', () => {
    const { container } = render(<HeroText />);
    const h1 = container.querySelector('h1')!;
    expect(h1.textContent).toBe('Si no podés hablar, tu ficha habla por vos');
  });

  it('los espacios quedan fuera de las máscaras inline-block (si no, el navegador los descarta)', () => {
    const { container } = render(<HeroText />);
    const masks = [...container.querySelectorAll('h1 > span')];
    expect(masks).toHaveLength(9);
    for (const m of masks) expect(m.textContent).not.toMatch(/\s$/);
  });
});
