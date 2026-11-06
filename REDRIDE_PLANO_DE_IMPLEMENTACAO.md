# RedRide — Plano de implementação por fases

> Documento complementar a `REDRIDE_ARQUITETURA.md`.  
> Objetivo: desenvolver o RedRide em três fases independentes, conforme a imersão: **Front-end → Back-end → IA**.

## Princípio de execução

Não construir o produto inteiro de uma vez. Cada fase deve terminar com uma entrega utilizável e verificável. O front-end deve funcionar primeiro com dados simulados; o back-end substitui esses dados por persistência e regras reais; a IA entra somente quando a jornada de viagem estiver funcionando.

---

# Fase 1 — Front-end

## Objetivo

Construir toda a experiência visual e navegável do RedRide usando dados mockados. Nesta fase, não depender de banco de dados, autenticação real ou provedor de IA.

## Escopo

### 1. Estrutura inicial

- Criar projeto Next.js com App Router e TypeScript.
- Configurar Tailwind CSS.
- Organizar layouts para autenticação e aplicação.
- Criar identidade visual inicial do RedRide.
- Definir componentes básicos reutilizáveis.

### 2. Autenticação visual

- Tela de login.
- Tela de cadastro.
- Estados de validação e erro.
- Navegação simulada para a área principal.

A autenticação nesta fase é somente demonstrativa. Não armazenar senha real nem apresentar a simulação como segurança de verdade.

### 3. Aplicativo principal

- Layout autenticado.
- Mapa 3D estilizado de uma região marciana.
- Pontos de interesse selecionáveis.
- Localização simulada do passageiro.
- Rovers circulando por rotas predefinidas.
- Painel para escolher destino.
- Exibição de estimativa e créditos fictícios.

### 4. Solicitação e aprovação

- Estado de busca por motorista.
- Apresentação de um candidato fictício.
- Aprovar ou recusar.
- Ao recusar, apresentar outro candidato mockado.
- Estado sem candidatos disponíveis.

A composição visual exata — por exemplo, quando o mapa aproxima a câmera do rover e como aparece o cartão de aprovação — pode ser ajustada durante esta fase.

### 5. Viagem

- Tela ou painel de viagem.
- Rota desenhada no mapa.
- Rover animado entre pontos.
- Estados: aproximando, embarque, em andamento e concluída.
- Um ou dois eventos visuais de demonstração.
- Chat visual com mensagens mockadas do motorista.

### 6. Telas complementares mínimas

- Histórico de viagens.
- Perfil e saldo de créditos.

## Dados mockados

Criar dados locais organizados para:

- usuário;
- saldo de créditos;
- colônia, locais e pontos de interesse;
- veículos;
- motoristas e suas personalidades;
- solicitações e viagens;
- mensagens;
- eventos de viagem.

Os mocks devem seguir formatos próximos aos contratos que serão usados pelo backend, evitando refazer os componentes na fase seguinte.

## Critérios para encerrar a fase 1

- É possível navegar entre login, cadastro e aplicação.
- A tela principal apresenta o mapa 3D.
- É possível selecionar um destino.
- A solicitação mostra preço e saldo fictícios.
- O sistema apresenta um motorista aleatório mockado.
- É possível aprovar, recusar e receber outro candidato.
- É possível acompanhar um rover em movimento.
- O usuário consegue visualizar o chat e o histórico com dados simulados.
- A aplicação funciona sem conexão com banco ou IA.

---

# Fase 2 — Back-end

## Objetivo

Substituir os mocks por autenticação, banco de dados e regras de negócio reais. Manter a interface construída na fase 1 sempre que possível.

## Escopo

### 1. Supabase

- Criar projeto Supabase.
- Configurar variáveis de ambiente.
- Configurar Supabase Auth.
- Criar migrations do banco.
- Criar políticas RLS.
- Criar seeds para locais, veículos e motoristas.

### 2. Autenticação e perfil

- Implementar cadastro e login reais.
- Proteger rotas privadas.
- Criar perfil associado ao usuário autenticado.
- Implementar logout.
- Garantir saldo inicial de créditos uma única vez por usuário.

### 3. Locais, veículos e motoristas

- Buscar pontos de interesse do banco.
- Buscar veículos e seus estados.
- Buscar motoristas ativos.
- Disponibilizar os dados necessários à cena 3D.

### 4. Viagens

- Criar solicitação no backend.
- Calcular preço no servidor.
- Validar saldo.
- Selecionar candidato aleatoriamente.
- Controlar aprovação e recusa.
- Não reapresentar candidatos recusados na mesma solicitação.
- Impedir que um rover ou motorista seja alocado em duas viagens ativas.
- Controlar cancelamento e transições de estado.
- Registrar eventos importantes.
- Persistir rota e horários para reconstruir a simulação.

### 5. Créditos

- Criar carteira por usuário.
- Registrar créditos iniciais.
- Consultar saldo e extrato.
- Efetivar débito de forma transacional.
- Registrar reembolso quando aplicável.
- Criar recarga demonstrativa opcional, sem dinheiro real.

### 6. Simulação

- Substituir o progresso mockado pelo estado persistido.
- Usar timestamps e pontos de rota para calcular o progresso.
- Animar a posição no cliente a partir desses dados.
- Persistir eventos e transições, não cada frame do rover.
- Permitir que a página seja recarregada sem perder o estado da viagem.

### 7. Atualizações

- Integrar Supabase Realtime para eventos/mensagens se necessário.
- Caso isso complique o MVP, começar com consultas periódicas simples.
- Não criar WebSocket próprio, fila ou worker sem necessidade comprovada.

## Critérios para encerrar a fase 2

- Cadastro e login persistem no Supabase.
- Perfil e carteira pertencem ao usuário autenticado.
- Solicitações são persistidas.
- Seleção aleatória e aprovação/recusa são executadas no servidor.
- Disponibilidade dos veículos é consistente.
- Créditos são debitados e registrados no extrato.
- A viagem mantém seu estado após recarregar a página.
- A animação do rover reflete os dados persistidos.
- O histórico mostra as viagens reais do usuário.
- Ainda é possível concluir toda a jornada sem IA, usando mensagens/driver responses mockados.

---

# Fase 3 — Inteligência artificial

## Objetivo

Transformar os motoristas em personagens conversacionais com personalidade, contexto da viagem e capacidade limitada de executar ações úteis.

## Escopo

### 1. Integração com o modelo

- Escolher o provedor de LLM.
- Configurar chave somente no servidor.
- Criar o serviço de geração de resposta.
- Implementar streaming de respostas, se compatível com o cronograma.

### 2. Personalidades

Começar com dois ou três motoristas diferentes. Cada um terá:

- nome e descrição;
- personalidade;
- estilo de comunicação;
- especialidade/conhecimento dentro do universo do RedRide;
- instruções de sistema próprias.

A seleção aleatória de motorista continua sendo regra do backend, não tarefa da IA.

### 3. Contexto da conversa

Cada mensagem deve considerar:

- motorista selecionado;
- passageiro;
- origem e destino;
- estado atual da viagem;
- pontos de interesse conhecidos;
- mensagens recentes daquela viagem.

A conversa permanece associada ao `ride_id`.

### 4. Ferramentas do motorista

Começar com poucas ferramentas:

- consultar informações de um ponto de interesse;
- procurar pontos de interesse cadastrados próximos à rota;
- propor uma parada para o passageiro.

Quando o passageiro aceitar uma parada, a IA chama a ferramenta correspondente e o backend valida a operação. A IA nunca altera a viagem sem confirmação explícita.

### 5. Experiência conversacional

- O motorista inicia ou mantém conversa de maneira natural, sem enviar mensagens excessivas.
- Pode fazer perguntas ao passageiro.
- Pode sugerir passeios contextualizados.
- Respeita pedidos para ficar em silêncio ou encerrar a conversa.
- Informa quando não sabe algo, em vez de inventar dados operacionais.

## Critérios para encerrar a fase 3

- O passageiro conversa com o motorista durante uma viagem real do sistema.
- Cada motorista mantém uma personalidade reconhecível.
- A IA usa informações corretas da corrida.
- O histórico das mensagens é persistido.
- O motorista consegue consultar um ponto de interesse.
- O motorista consegue propor uma parada.
- A parada só é adicionada depois da confirmação do usuário.
- Falhas do provedor de IA não quebram o restante do aplicativo.

---

# Ordem sugerida de trabalho

| Ordem | Entrega | Depende de |
|---:|---|---|
| 1 | Estrutura Next.js e layout | — |
| 2 | Login e cadastro visuais | 1 |
| 3 | Mapa 3D e pontos de interesse | 1 |
| 4 | Veículos circulando no mapa | 3 |
| 5 | Seleção de destino e solicitação mockada | 3 |
| 6 | Candidato, aprovação e recusa | 5 |
| 7 | Viagem animada, estados e eventos | 6 |
| 8 | Chat visual mockado, histórico e perfil | 7 |
| 9 | Supabase Auth, schema e RLS | fase de back-end |
| 10 | Serviços e endpoints de viagem/carteira | 9 |
| 11 | Troca dos mocks por dados persistidos | 10 |
| 12 | Integração com IA e personalidades | fase de IA |
| 13 | Ferramentas do motorista e confirmação de parada | 12 |

# Regras para os prompts de desenvolvimento

Ao criar prompts para o ChatGPT ou outra ferramenta de programação:

1. Informar em qual fase estamos e o que já foi concluído.
2. Pedir uma entrega pequena e verificável por vez.
3. Não permitir que a ferramenta antecipe backend ou IA durante a fase de front-end.
4. Pedir que preserve os contratos de dados usados pelos mocks.
5. Solicitar explicação dos arquivos criados ou modificados.
6. Não pedir refatorações gerais sem necessidade.
7. Ao terminar uma etapa, validar os critérios de conclusão antes de avançar.

## Definição de pronto de cada tarefa

Uma tarefa só é considerada pronta quando:

- funciona no fluxo esperado;
- apresenta estados de carregamento, vazio e erro quando aplicável;
- respeita os tipos e contratos do projeto;
- não duplica regras de negócio em componentes;
- não quebra as etapas já concluídas;
- possui uma forma clara de testar o comportamento.

---

**Importante:** este plano organiza a ordem de construção. Não é necessário implementar todas as possibilidades descritas se o tempo da imersão exigir reduzir o escopo. A jornada principal do passageiro tem prioridade sobre funcionalidades complementares.
