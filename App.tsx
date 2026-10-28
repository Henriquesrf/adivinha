import { useEffect, useRef, useState } from 'react';
import { AppState, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { firebaseConfigurado } from './firebaseConfig';
import { Botao } from './src/components/Botao';
import { Ranking } from './src/screens/Ranking';
import { comparar, Dica, Resultado, sortearNumero, validarPalpite } from './src/utils/jogo';
import { criarResultado, guardarResultado, pendentes, sincronizar } from './src/services/resultados';

export default function App() {
  const [tela, setTela] = useState<'jogo' | 'ranking'>('jogo');
  const [nickname, setNickname] = useState('');
  const [jogador, setJogador] = useState('');
  const segredo = useRef(0);
  const [palpite, setPalpite] = useState('');
  const [tentativas, setTentativas] = useState(0);
  const [dica, setDica] = useState<Dica | null>(null);
  const [erro, setErro] = useState('');
  const [historico, setHistorico] = useState<number[]>([]);
  const [salvamento, setSalvamento] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [quantidadePendente, setQuantidadePendente] = useState(0);
  const resultado = useRef<Resultado | null>(null);
  const vencido = useRef(false);
  const enviandoLocal = useRef(false);

  async function atualizarPendencias() { setQuantidadePendente((await pendentes()).length); }
  function enviarPendentes() {
    void sincronizar().then(atualizarPendencias).catch(() => { void atualizarPendencias().catch(() => {}); });
  }
  useEffect(() => {
    if (!firebaseConfigurado) return;
    void atualizarPendencias().catch(() => {});
    enviarPendentes();
    const timer = setInterval(enviarPendentes, 15000);
    const listener = AppState.addEventListener('change', estado => { if (estado === 'active') enviarPendentes(); });
    return () => { clearInterval(timer); listener.remove(); };
  }, []);

  function iniciar() {
    if (!nickname.trim()) { setErro('Informe seu nickname para começar.'); return; }
    if (!firebaseConfigurado) { setErro('Configure o Firebase no arquivo .env antes de começar. Veja o README.'); return; }
    segredo.current = sortearNumero(); vencido.current = false; resultado.current = null;
    setJogador(nickname.trim()); setTentativas(0); setPalpite(''); setDica(null); setErro('');
    setHistorico([]); setSalvamento(''); setGuardado(false); Keyboard.dismiss();
  }
  async function guardarVitoria(total: number) {
    if (enviandoLocal.current) return;
    enviandoLocal.current = true;
    try {
      setSalvamento('Guardando resultado...');
      if (!resultado.current) resultado.current = await criarResultado(jogador, total, segredo.current);
      await guardarResultado(resultado.current);
      setGuardado(true);
      setSalvamento('Resultado guardado no aparelho para envio ao ranking.');
      await atualizarPendencias();
      enviarPendentes();
    } catch { setSalvamento('Não foi possível guardar. Toque em tentar salvar novamente antes de sair.'); }
    finally { enviandoLocal.current = false; }
  }
  function tentar() {
    if (vencido.current) return;
    const numero = validarPalpite(palpite);
    if (numero === null) { setErro('Digite um número inteiro de 1 a 100.'); return; }
    const total = tentativas + 1;
    const novaDica = comparar(numero, segredo.current);
    setErro(''); setTentativas(total); setHistorico(h => [...h, numero]); setDica(novaDica); setPalpite('');
    if (novaDica === 'acertou') { vencido.current = true; Keyboard.dismiss(); void guardarVitoria(total); }
  }
  return <SafeAreaProvider><SafeAreaView style={s.area}><StatusBar style="dark" />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.conteudo}>
        <View style={s.menu}><View style={{ flex: 1 }}><Botao titulo="Jogar" secundario={tela !== 'jogo'} onPress={() => setTela('jogo')} /></View>
          <View style={{ flex: 1 }}><Botao titulo="Ranking" secundario={tela !== 'ranking'} onPress={() => setTela('ranking')} /></View></View>
        {quantidadePendente > 0 && <Text style={s.pendente} accessibilityLiveRegion="polite">{quantidadePendente} resultado(s) aguardando envio. Tentaremos automaticamente com conexão.</Text>}
        {tela === 'ranking' ? <Ranking /> : <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
          <Text style={s.selo}>DESAFIO • 1 A 100</Text><Text style={s.titulo}>Qual é o número?</Text>
          <Text style={s.subtitulo}>Use as dicas e descubra em poucas tentativas.</Text>
          {!jogador ? <View style={s.cartao}>
            <Text style={s.rotulo}>Seu nickname</Text><TextInput accessibilityLabel="Seu nickname" value={nickname} onChangeText={setNickname} maxLength={24}
              autoCapitalize="none" autoCorrect={false} placeholder="Como você quer aparecer?" placeholderTextColor="#6b7280" style={s.campo} onSubmitEditing={iniciar} />
            {!firebaseConfigurado && <Text style={s.aviso}>Falta conectar o Firebase. Preencha o .env conforme o README e reinicie o Expo.</Text>}
            <Botao titulo="Começar partida" onPress={iniciar} />
          </View> : <View style={s.cartao}>
            <Text style={s.rotulo}>Jogador: {jogador}</Text><Text style={s.contador}>Tentativas: {tentativas}</Text>
            {dica === 'acertou' ? <>
              <Text style={s.vitoria}>Você acertou!</Text><Text style={s.subtitulo}>O número era {segredo.current}. Você venceu com {tentativas} {tentativas === 1 ? 'tentativa' : 'tentativas'}.</Text>
              <Text style={s.aviso} accessibilityLiveRegion="polite">{salvamento}</Text>
              {!guardado && <Botao titulo="Tentar salvar novamente" onPress={() => void guardarVitoria(tentativas)} />}
              <Botao titulo="Jogar novamente" desabilitado={!guardado} onPress={iniciar} />
              <Botao titulo="Trocar nickname" secundario desabilitado={!guardado} onPress={() => { setJogador(''); setErro(''); }} />
            </> : <>
              <Text style={s.rotulo}>Seu palpite</Text><TextInput accessibilityLabel="Palpite entre 1 e 100" value={palpite} onChangeText={setPalpite} keyboardType="number-pad" maxLength={6}
                placeholder="1 a 100" placeholderTextColor="#6b7280" style={[s.campo, s.numero]} onSubmitEditing={tentar} />
              <Botao titulo="Confirmar palpite" onPress={tentar} />
              {dica && <Text accessibilityLiveRegion="polite" style={[s.dica, dica === 'maior' ? s.maior : s.menor]}>
                {dica === 'maior' ? '↑ O número sorteado é maior!' : '↓ O número sorteado é menor!'}
              </Text>}
            </>}
            {!!historico.length && <Text style={s.historico}>Seus palpites: {historico.join(' · ')}</Text>}
          </View>}
          {!!erro && <Text accessibilityLiveRegion="polite" style={s.erro}>{erro}</Text>}
          <Text style={s.rodape}>Verde: tente um número maior.{ '\n' }Vermelho: tente um número menor.</Text>
        </ScrollView>}
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView></SafeAreaProvider>;
}
const s = StyleSheet.create({
  area: { flex: 1, backgroundColor: '#f3f5fa' }, conteudo: { flex: 1, paddingHorizontal: 24, maxWidth: 640, width: '100%', alignSelf: 'center' },
  menu: { flexDirection: 'row', gap: 12, marginBottom: 28 }, selo: { color: '#2349c7', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  titulo: { color: '#152344', fontSize: 34, fontWeight: '800', marginTop: 12 }, subtitulo: { color: '#58667e', fontSize: 16, lineHeight: 25, marginTop: 12, marginBottom: 24 },
  cartao: { backgroundColor: '#fff', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#e0e6f0' }, rotulo: { color: '#203052', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  campo: { borderWidth: 1, borderColor: '#b8c4d9', borderRadius: 10, padding: 14, fontSize: 17, color: '#152344', backgroundColor: '#fff' }, numero: { fontSize: 28, textAlign: 'center' },
  contador: { fontSize: 18, fontWeight: '700', color: '#2349c7', marginBottom: 24 }, dica: { fontSize: 19, fontWeight: '700', textAlign: 'center', marginTop: 24, lineHeight: 28 },
  maior: { color: '#16803d' }, menor: { color: '#c52222' }, vitoria: { color: '#16803d', fontSize: 28, fontWeight: '800' },
  erro: { color: '#b42318', marginTop: 16, lineHeight: 22 }, aviso: { color: '#58667e', marginTop: 14, lineHeight: 22 }, historico: { color: '#58667e', marginTop: 24, lineHeight: 24 },
  rodape: { color: '#66758b', fontSize: 13, lineHeight: 22, textAlign: 'center', marginTop: 24 }, pendente: { color: '#82520a', marginBottom: 16, lineHeight: 20 },
});
