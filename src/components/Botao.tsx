import { Pressable, StyleSheet, Text } from 'react-native';
export function Botao({ titulo, onPress, desabilitado = false, secundario = false }: {
  titulo: string; onPress: () => void; desabilitado?: boolean; secundario?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: desabilitado }} disabled={desabilitado}
    onPress={onPress} style={({ pressed }) => [s.botao, secundario && s.secundario, (pressed || desabilitado) && s.apagado]}>
    <Text style={[s.texto, secundario && s.textoEscuro]}>{titulo}</Text>
  </Pressable>;
}
const s = StyleSheet.create({ botao: { backgroundColor: '#2349c7', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  secundario: { backgroundColor: '#e9edf7' }, apagado: { opacity: 0.5 }, texto: { color: '#fff', fontWeight: '700', fontSize: 16 }, textoEscuro: { color: '#203052' } });
