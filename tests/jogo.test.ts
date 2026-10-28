import assert from 'node:assert/strict';
import { test } from 'node:test';
import { comparar, ordenarRanking, sortearNumero, validarPalpite, type Resultado } from '../src/utils/jogo';
test('rejeita palpites inválidos e aceita limites inclusivos', () => {
  for (const valor of ['', ' ', '0', '101', '-1', '1.5', 'abc', '1e2', '2,5']) assert.equal(validarPalpite(valor), null);
  assert.equal(validarPalpite('1'), 1); assert.equal(validarPalpite('100'), 100); assert.equal(validarPalpite(' 50 '), 50);
});
test('dicas se referem ao número sorteado', () => {
  assert.equal(comparar(25, 50), 'maior'); assert.equal(comparar(75, 50), 'menor'); assert.equal(comparar(50, 50), 'acertou');
});
test('sorteio inclui 1 e 100', () => {
  const original = Math.random;
  try { Math.random = () => 0; assert.equal(sortearNumero(), 1); Math.random = () => 0.999999; assert.equal(sortearNumero(), 100); }
  finally { Math.random = original; }
});
test('ranking prioriza menor número de tentativas e data em empates', () => {
  const base = { uid: 'u', nickname: 'Jogador', numero: 42 };
  const itens: Resultado[] = [{ ...base, id: 'a', tentativas: 8, criadoEm: 1 }, { ...base, id: 'b', tentativas: 2, criadoEm: 3 }, { ...base, id: 'c', tentativas: 2, criadoEm: 2 }];
  assert.deepEqual(ordenarRanking(itens).map(i => i.id), ['c', 'b', 'a']);
  assert.equal(itens[0].id, 'a');
});
