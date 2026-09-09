const ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function createId(len = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let id = "";
  for (const b of bytes) id += ALPHA[b % ALPHA.length];
  return id;
}