'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export function Breadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <li>
          <Link href="/" className="hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded px-1">
            خانه
          </Link>
        </li>
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1.5">
            <ChevronLeft className="size-3.5" aria-hidden />
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded px-1">
                {item.label}
              </Link>
            ) : (
              <span className="font-bold text-foreground" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
