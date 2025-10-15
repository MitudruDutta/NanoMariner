export function t(key: string, params?: Array<string | number>): string {
  if (!params || params.length === 0) return key;
  return `${key}: ${params.map(String).join(', ')}`;
}


