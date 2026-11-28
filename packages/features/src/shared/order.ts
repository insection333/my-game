// Ids in one order wherever the rules run (session 293): by their characters' codes, where localeCompare
// followed the device's language, so the page and the server could break a tie differently.
export const codeOrder = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
