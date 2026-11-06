'use client';

import { Label as LabelPrimitive } from 'radix-ui';
import * as React from 'react';
import { cn } from '@/lib/utils';

/** Rótulo chico en mayúsculas, como los de una ficha en papel. */
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root data-slot="label" className={cn('label', className)} {...props} />;
}

export { Label };
