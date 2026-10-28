import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInAnonymously } from 'firebase/auth';
import { limitToFirst, onValue, orderByChild, push, query, ref, runTransaction } from 'firebase/database';
import { obterFirebase } from '../../firebaseConfig';
import { ordenarRanking, Resultado } from '../utils/jogo';
const CHAVE = '@adivinha/pendentes';
let autenticando: Promise<void> | null = null;
let sincronizando: Promise<void> | null = null;
export async function autenticar() {
  const { auth } = obterFirebase();
  if (auth.currentUser) return;
  if (!autenticando) autenticando = signInAnonymously(auth).then(() => {}).finally(() => { autenticando = null; });
  await autenticando;
}
export async function criarResultado(nickname: string, tentativas: number, numero: number): Promise<Resultado> {
  // O ID é gerado localmente; a partida pode terminar sem conexão.
  const { database } = obterFirebase();
  return { id: push(ref(database, 'resultados')).key!, uid: '', nickname, tentativas, numero, criadoEm: Date.now() };
}
export async function pendentes(): Promise<Resultado[]> {
  const valor = await AsyncStorage.getItem(CHAVE);
  return valor ? JSON.parse(valor) as Resultado[] : [];
}
let alterandoFila: Promise<void> = Promise.resolve();
function alterarFila(alterar: (fila: Resultado[]) => Resultado[]): Promise<void> {
  const operacao = alterandoFila.catch(() => {}).then(async () => {
    await AsyncStorage.setItem(CHAVE, JSON.stringify(alterar(await pendentes())));
  });
  alterandoFila = operacao;
  return operacao;
}
export function guardarResultado(resultado: Resultado) {
  return alterarFila(fila => fila.some(item => item.id === resultado.id) ? fila : [...fila, resultado]);
}
export function sincronizar(): Promise<void> {
  if (sincronizando) return sincronizando;
  sincronizando = (async () => {
    const fila = await pendentes();
    if (!fila.length) return;
    await autenticar();
    const { auth, database } = obterFirebase();
    for (const resultado of fila) {
      // Mesmo ID em cada reenvio: não duplica a vitória.
      await runTransaction(ref(database, `resultados/${resultado.id}`), atual => atual === null ? { ...resultado, uid: auth.currentUser!.uid } : undefined, { applyLocally: false });
      await alterarFila(atual => atual.filter(item => item.id !== resultado.id));
    }
  })().finally(() => { sincronizando = null; });
  return sincronizando;
}
export async function observarRanking(receber: (itens: Resultado[]) => void, erro: (e: Error) => void) {
  await autenticar();
  const { database } = obterFirebase();
  return onValue(query(ref(database, 'resultados'), orderByChild('tentativas'), limitToFirst(100)), snapshot => {
    const itens: Resultado[] = [];
    snapshot.forEach(child => { itens.push({ ...child.val(), id: child.key } as Resultado); });
    receber(ordenarRanking(itens));
  }, erro);
}
