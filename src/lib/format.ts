export function formatNumber(value: number, locale = 'nb-NO'): string {
  return new Intl.NumberFormat(locale).format(value);
}
