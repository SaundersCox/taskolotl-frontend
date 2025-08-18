import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  generateColorVariants(baseHex: string): string[] {
    const hex = baseHex.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    const variants = [
      baseHex,
      `#${Math.min(255, r + 64)
        .toString(16)
        .padStart(2, '0')}${Math.min(255, g + 32)
        .toString(16)
        .padStart(2, '0')}${Math.min(255, b + 16)
        .toString(16)
        .padStart(2, '0')}`,
      `#${Math.max(0, r - 32)
        .toString(16)
        .padStart(2, '0')}${Math.max(0, g - 16)
        .toString(16)
        .padStart(2, '0')}${Math.max(0, b - 64)
        .toString(16)
        .padStart(2, '0')}`,
    ];

    return variants;
  }
}
