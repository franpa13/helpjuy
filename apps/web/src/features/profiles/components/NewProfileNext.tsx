import { ShieldCheck } from 'lucide-react';
import { PanelBox } from '@/features/panel/components/PanelPage';

const NEXT = [
  { title: 'Datos de la persona', text: 'Nombre y quién es para vos.' },
  { title: 'Consentimiento', text: 'Leés qué guardamos y para qué. Sin casillas marcadas de antemano.' },
  { title: 'La ficha', text: 'Alergias, remedios, contactos… todo opcional.' },
  { title: 'Tu QR', text: 'Lo imprimís para la billetera, el casco o la heladera.' },
];

/** Columna lateral de "Nueva ficha": qué va a pasar, para que nadie se sienta perdido. */
export function NewProfileNext() {
  return (
    <>
      <PanelBox title="Qué sigue">
        <ol className="grid list-none p-0">
          {NEXT.map((n, i) => (
            <li key={n.title} className="flex gap-3 border-t border-line py-2.5">
              <span className="min-w-5 font-head text-[28px]/[0.9] font-extrabold text-red" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <strong>{n.title}</strong>
                <span className="mt-0.5 block text-sm text-muted-foreground">{n.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </PanelBox>
      <p className="flex items-start gap-2.5 text-[15px] font-bold [&_svg]:shrink-0 [&_svg]:text-green">
        <ShieldCheck size={20} aria-hidden="true" />
        Tus datos de salud se guardan cifrados y vos elegís qué se ve en el QR.
      </p>
    </>
  );
}
