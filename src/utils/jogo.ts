export type Dica = 'maior' | 'menor' | 'acertou';
export function sortearNumero(): number { return Math.floor(Math.random() * 100) + 1; }
export function validarPalpite(texto: string): number | null {
  if (!/^\d+$/.test(texto.trim())) return null;
  const n = Number(texto);
  return Number.isInteger(n) && n >= 1 && n <= 100 ? n : null;
}
export function comparar(palpite: number, segredo: number): Dica {
  return palpite < segredo ? 'maior' : palpite > segredo ? 'menor' : 'acertou';
}
export interface Resultado { id: string; uid: string; nickname: string; tentativas: number; numero: number; criadoEm: number; }
export function ordenarRanking(resultados: Resultado[]): Resultado[] {
  return [...resultados].sort((a, b) => a.tentativas - b.tentativas || a.criadoEm - b.criadoEm || a.id.localeCompare(b.id));
}
