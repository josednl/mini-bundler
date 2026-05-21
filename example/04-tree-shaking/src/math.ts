export function used(a: number, b: number): number {
  return a + b;
}

export function unused(a: number, b: number): number {
  console.log('This function should be removed');
  return a * b;
}
