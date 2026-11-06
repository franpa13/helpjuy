'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';

export type FaqEntry = { q: string; a: string };

function FaqItem({ q, a }: FaqEntry) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="border-b border-line">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-4 bg-transparent py-[18px] text-left text-[19px] font-bold text-inherit"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        {q}
        <motion.span className="inline-block font-head text-[32px]/[0.8] font-extrabold text-red" animate={{ rotate: open ? 45 : 0 }} aria-hidden="true">
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            key="a"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-[40em] pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq({ items }: { items: FaqEntry[] }) {
  return (
    <div className="mt-8 max-w-[820px] border-t-3 border-ink">
      {items.map((f) => (
        <FaqItem key={f.q} {...f} />
      ))}
    </div>
  );
}
