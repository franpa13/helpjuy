'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export type FaqEntry = { q: string; a: string };

/** Preguntas frecuentes: se pueden abrir varias a la vez. */
export function Faq({ items }: { items: FaqEntry[] }) {
  return (
    <Accordion type="multiple" className="mt-8 max-w-[820px] border-t-3 border-ink">
      {items.map((f) => (
        <AccordionItem key={f.q} value={f.q}>
          <AccordionTrigger>{f.q}</AccordionTrigger>
          <AccordionContent className="max-w-[40em]">
            <p>{f.a}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
