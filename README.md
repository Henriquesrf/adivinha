# Adivinha Número

Trabalho escolar: jogo de adivinhação em **TypeScript, React Native e Expo**, com ranking no **Firebase Realtime Database**.

## Funcionalidades

- Nickname obrigatório (até 24 caracteres) antes de iniciar.
- Sorteio de inteiro de 1 a 100, inclusive, a cada partida.
- Dica **verde** quando o número sorteado é maior que o palpite; **vermelha** quando é menor.
- Contagem de palpites válidos, incluindo o acerto. Entradas inválidas não contam; palpites repetidos contam.
- Vitória mostra o número e a quantidade de tentativas.
- Cada vitória é uma entrada no ranking; o mesmo nickname pode aparecer em várias partidas.
- Ranking das 100 melhores partidas, com menos tentativas primeiro. Dentro dos resultados carregados, empates são ordenados pela data e pelo ID. No corte de 100, empates são selecionados pela chave do Firebase.
- Resultados ficam em uma fila persistente no aparelho até serem enviados. O aplicativo tenta novamente a cada 15 segundos enquanto aberto e ao voltar ao primeiro plano.
- Transação com ID estável evita duplicar resultados ao reenviar. Partidas em andamento não são recuperadas após fechar o app.
- Telas de jogo e ranking, com mensagens de carregamento, lista vazia e falha de conexão.

## 1. Preparação

Extraia o ZIP em `C:\projetos`. Abra o terminal **dentro de `adivinha-numero`**, onde fica o `package.json`.

Use Node.js 24 LTS. Instale as dependências:

```bash
npm ci
```

O projeto já está criado. **Não rode `create-expo-app` nem `reset-project` nesta pasta**, pois não são necessários para executar a entrega.

## 2. Conectar seu Firebase (obrigatório)

O código está pronto, mas não inclui configuração de uma conta Firebase. Esta etapa precisa ser feita no seu projeto antes de apresentar o trabalho.

1. Abra https://console.firebase.google.com/ e crie ou selecione um projeto.
2. Em **Configurações do projeto > Geral**, registre um **app Web** e copie seu objeto `firebaseConfig`.
3. Crie o **Realtime Database** e copie a URL exata exibida pelo console (incluindo a região, quando houver). Este app não usa Firestore.
4. Em **Authentication > Sign-in method**, habilite **Anônimo**. O jogador só informa nickname; o login anônimo ocorre internamente. Email/senha não é necessário neste trabalho.
5. Copie `.env.example` para `.env` na raiz. No CMD do Windows:

```bat
copy .env.example .env
```

6. Abra `.env` e preencha:

```dotenv
EXPO_PUBLIC_FIREBASE_API_KEY=valor_de_apiKey
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=valor_de_authDomain
EXPO_PUBLIC_FIREBASE_DATABASE_URL=url_exata_do_Realtime_Database
EXPO_PUBLIC_FIREBASE_PROJECT_ID=valor_de_projectId
EXPO_PUBLIC_FIREBASE_APP_ID=valor_de_appId
```

7. Em **Realtime Database > Regras**, cole todo o conteúdo de `database.rules.json` e clique em **Publicar**. As regras permitem leitura autenticada e apenas criação de resultados válidos, sem edição ou exclusão.
8. Se o Expo já estiver aberto, pare com Ctrl+C e reinicie com `npx expo start --clear`.

A configuração é lida por `firebaseConfig.ts`. Nunca coloque chave privada de conta de serviço neste app. Variáveis `EXPO_PUBLIC_` fazem parte do aplicativo distribuído; o controle de acesso é feito pelas regras. O `.env` está ignorado pelo Git; entregue sua configuração ao professor separadamente se ele precisar executar conectado ao seu banco.

## 3. Executar no Android

Com Android Studio/emulador configurado ou celular conectado com depuração USB:

```bash
npm run android
```

Alternativa: rode `npm start` e leia o QR Code com uma versão do Expo Go compatível com o SDK declarado no `package.json`.

Se o dispositivo não aparecer:

```bash
adb devices
adb reverse tcp:8081 tcp:8081
```

Mantenha o terminal do Expo aberto. Se aparecer que `expo` não foi encontrado, confirme que está na pasta correta e execute `npm ci`.

## 4. Publicar no GitHub

Crie um repositório vazio chamado `adivinha-numero` no GitHub. Na pasta do projeto:

```bash
git init
git add .
git commit -m "Implementa jogo de adivinhacao e ranking Firebase"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/adivinha-numero.git
git push -u origin main
```

Troque `SEU_USUARIO` pelo seu usuário. Entregue ao professor o link do repositório criado. Se usar o repositório `banco1`, adapte a URL e preserve os arquivos existentes; não use push forçado. O ZIP não publica nem altera repositórios automaticamente.

## Estrutura

```text
App.tsx                         Tela de jogo e navegação
firebaseConfig.ts               Inicialização do Firebase
src/components/Botao.tsx         Botão reutilizável
src/screens/Ranking.tsx          Tela de ranking em tempo real
src/services/resultados.ts      Autenticação, fila local e banco
src/utils/jogo.ts                Sorteio, validação e comparação
tests/jogo.test.ts               Testes da lógica
.env.example                    Modelo de configuração
database.rules.json             Regras do Realtime Database
.github/workflows/ci.yml         Validação no GitHub Actions
```

## Dados armazenados

Caminho: `resultados/<id>`. Cada registro contém `id`, `uid` (autenticação anônima), `nickname`, `tentativas`, `numero` e `criadoEm` (timestamp em milissegundos).

A autenticação anônima usa sessão em memória; pode gerar outro usuário ao reabrir o app. A fila local é independente da sessão e o envio usa o usuário atual. Nickname não é uma identidade exclusiva. O projeto é didático: sorteio e contagem ocorrem no cliente, sem proteção contra adulteração por clientes modificados.

## Verificação

```bash
npm run typecheck
npm test
npx expo install --check
npx expo export --platform android
```

Roteiro manual após configurar Firebase:

1. Tente iniciar com nickname vazio: deve rejeitar.
2. Informe nickname e inicie. Tente vazio, 0 e 101: não devem contar.
3. Faça palpites e confira a cor e o sentido das dicas.
4. Acerte, confira o total e veja a entrada no ranking e no console Firebase.
5. Inicie outra partida; o contador deve voltar a zero e sortear novamente.
6. Termine uma partida sem conexão; reconecte e verifique o envio sem duplicidade.
7. Reabra o app e confira que o ranking permanece no Firebase.

TypeScript, testes de lógica e exportação não substituem um teste no dispositivo com seu Firebase. A conexão real depende da configuração da sua conta.

## Referências

- Enunciado e PDFs fornecidos na disciplina.
- https://github.com/IgorBandasz/aula_banco_mobile
- https://docs.expo.dev/guides/using-firebase/
- https://firebase.google.com/docs/database/web/read-and-write
- https://firebase.google.com/docs/database/security
