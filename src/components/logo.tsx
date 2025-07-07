import { ToyBrick } from 'lucide-react';
import React from 'react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <ToyBrick className="h-8 w-8 text-primary" />
      <h1 className="text-xl font-bold font-headline text-foreground">
        Sukabumi Playground
      </h1>
    </div>
  );
}
