import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { observarRanking } from '../services/resultados';
import { Resultado } from '../utils/jogo';
import { Botao } from '../components/Botao';
export function Ranking() {
  const [itens, setItens] = useState<Resultado[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [versao, setVersao] = useState(0);
  useEffect(() => {
    let ativo = true;
    let cancelar: (() => void) | undefined;
    setCarregando(true); setErro('');
    const falhou = () => { if (ativo) { setErro('Não foi possível carregar. Confira a internet, o Firebase e suas regras.'); setCarregando(false); } };
    const tempo = setTimeout(() => { if (ativo) { setErro('A conexão está demorando. Confira a internet ou tente novamente.'); setCarregando(false); } }, 15000);
    observarRanking(dados => { if (ativo) { clearTimeout(tempo); setItens(dados); setErro(''); setCarregando(false); } }, falhou)
      .then(unsubscribe => { if (!ativo) unsubscribe(); else cancelar = unsubscribe; }).catch(falhou);
    return () => { ativo = false; clearTimeout(tempo); cancelar?.(); };
  }, [versao]);
  return <View style={{ flex: 1 }}>
    <Text style={s.titulo}>Ranking</Text>
    <Text style={s.descricao}>As 100 melhores partidas. Menos tentativas, melhor posição.</Text>
    {carregando ? <ActivityIndicator size="large" color="#2349c7" /> : erro ? <View><Text style={s.erro}>{erro}</Text><Botao titulo="Tentar novamente" onPress={() => setVersao(v => v + 1)} /></View> :
      <FlatList data={itens} keyExtractor={item => item.id} contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<Text style={s.descricao}>Nenhuma vitória registrada. Seja o primeiro!</Text>}
        renderItem={({ item, index }) => <View style={s.linha}>
          <Text style={s.posicao}>{index + 1}</Text><View style={{ flex: 1 }}><Text style={s.nome}>{item.nickname}</Text>
          <Text style={s.data}>{new Date(item.criadoEm).toLocaleDateString('pt-BR')}</Text></View>
          <Text style={s.pontos}>{item.tentativas} {item.tentativas === 1 ? 'tentativa' : 'tentativas'}</Text>
        </View>} />}
  </View>;
}
const s = StyleSheet.create({ titulo: { fontSize: 30, fontWeight: '800', color: '#152344', marginBottom: 8 }, descricao: { color: '#58667e', fontSize: 16, marginBottom: 24, lineHeight: 24 },
  linha: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, gap: 12 },
  posicao: { color: '#2349c7', fontWeight: '800', fontSize: 20, minWidth: 28 }, nome: { color: '#152344', fontSize: 16, fontWeight: '700' }, data: { color: '#64748b', fontSize: 12, marginTop: 4 }, pontos: { fontWeight: '700', color: '#152344' }, erro: { color: '#b42318', lineHeight: 24 } });
