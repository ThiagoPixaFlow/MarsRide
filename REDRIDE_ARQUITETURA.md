# RedRide — Arquitetura e funcionamento do produto

> **Documento-base do MVP**  
> Produto: RedRide — mobilidade em uma colônia de Marte com veículos autônomos e motoristas conversacionais de IA.  
> Status: especificação inicial, sujeita a refinamento durante a construção do front-end.

## 1. Visão do produto

O RedRide é um aplicativo de mobilidade fictício para uma colônia de Marte. O passageiro escolhe um destino em um mapa 3D estilizado, solicita uma viagem, recebe uma opção de veículo e motorista, aprova ou recusa a indicação e acompanha o rover durante o trajeto. Durante a viagem, poderá conversar com o motorista de IA, que tem personalidade própria, conhece o contexto da viagem e pode sugerir lugares e pequenas experiências.

O produto deve ser demonstrável como uma aplicação real, mas sua operação é simulada: não existem veículos físicos, pagamentos reais ou uma infraestrutura real de transporte em Marte.

### 1.1 Objetivo do MVP

Entregar uma jornada completa e coerente:

1. Criar uma conta ou entrar.
2. Abrir o aplicativo diretamente no mapa de Marte.
3. Escolher um destino.
4. Solicitar uma viagem e visualizar a estimativa de preço.
5. Receber um motorista/veículo selecionado pelo sistema.
6. Aprovar ou recusar a opção apresentada.
7. Acompanhar o rover no mapa.
8. Conversar com o motorista de IA durante a viagem.
9. Concluir a viagem e consultar o histórico.
10. Pagar usando créditos fictícios do RedRide.

O foco é essa jornada. Funcionalidades que não contribuem diretamente para ela ficam fora do MVP.

## 2. Decisões de produto já definidas

| Tema | Decisão | Consequência para o projeto |
|---|---|---|
| Mapa | Mapa 3D estilizado de Marte | Usar Three.js com React Three Fiber; começar com uma região fictícia, não com o planeta inteiro. |
| Veículos | Simulação dinâmica, com movimentação e eventos | Exibir rovers em movimento e representar estados/eventos de viagem. Não simular física real. |
| Motorista | O sistema escolhe uma opção aleatória entre as disponíveis; o passageiro aprova ou recusa | O backend controla a seleção, a disponibilidade e as tentativas recusadas. |
| Pagamento | Créditos fictícios marcianos | Manter saldo e extrato interno; não integrar gateway de pagamento. |
| Entrada | O produto abre no login/cadastro | Não haverá landing page no MVP. |
| Desenvolvimento | Três fases: front-end, back-end e IA | O front-end começa com dados simulados; depois recebe backend real; IA é integrada por último. |

### 2.1 Decisões que permanecerão abertas durante a construção

Alguns detalhes de experiência ainda não precisam ser fixados. Vamos decidir com o protótipo em mãos:

- Como exatamente o mapa enquadra e destaca o rover selecionado.
- Se os veículos próximos ficam sempre visíveis ou aparecem de forma mais discreta.
- Como será a transição visual entre a busca, a apresentação do motorista e a aprovação.
- Se o rover selecionado já aparece se aproximando antes da aprovação ou se a animação de aproximação começa depois dela.
- Onde o chat ficará na tela durante a viagem: painel lateral, janela flutuante ou outra composição.
- Quais eventos visuais de simulação serão mais interessantes sem poluir a interface.

**Diretriz:** manter as regras de negócio e os estados necessários, mas não congelar agora cada detalhe visual. O comportamento exato da interface pode evoluir durante a fase de front-end.

## 3. Escopo do MVP

### 3.1 Incluído

- Cadastro, login, logout e recuperação básica de acesso, usando provedor de autenticação.
- Tela principal com mapa 3D de uma região de Marte.
- Visualização de alguns veículos circulando pelo mapa.
- Seleção de origem e destino usando pontos de interesse predefinidos.
- Estimativa de preço e duração.
- Saldo de créditos marcianos.
- Solicitação de viagem.
- Seleção aleatória de motorista e veículo disponíveis.
- Aprovação ou recusa da opção pelo passageiro.
- Nova seleção quando o passageiro recusar, sem reapresentar candidatos já recusados naquela solicitação.
- Acompanhamento da viagem e movimentação simulada do rover.
- Estados e alguns eventos de viagem.
- Chat com o motorista de IA, contextualizado pela viagem.
- Sugestão de ponto de interesse ou parada pelo motorista, sujeita à confirmação do passageiro.
- Conclusão da viagem, débito de créditos e histórico básico.
- Perfil simples do passageiro.

### 3.2 Fora do MVP

- Landing page institucional ou comercial.
- Aplicativo mobile nativo.
- Pagamento real, cartão, Pix ou integração financeira.
- Múltiplas colônias grandes ou mapa completo de Marte.
- Cálculo cartográfico real ou integração obrigatória com mapas externos.
- Física realista, colisões ou simulação física dos rovers.
- Tráfego complexo, previsão meteorológica real ou otimização avançada de rotas.
- Painel administrativo completo.
- Sistema de suporte humano.
- Programa de fidelidade, cupons, planos e assinaturas.
- Avaliações avançadas, ranking público de motoristas ou rede social.
- Memória permanente e complexa da IA entre diferentes viagens.
- Arquitetura de microserviços, filas e workers independentes.

Esses itens podem ser reconsiderados depois que a jornada principal estiver funcionando.

## 4. Jornada principal do passageiro

### 4.1 Entrada e autenticação

1. O usuário abre o RedRide.
2. Caso não esteja autenticado, vê a tela de login.
3. Pode entrar ou navegar para o cadastro.
4. Após autenticar, é direcionado para `/app`.
5. No primeiro acesso, o sistema garante que exista um perfil e uma carteira de créditos iniciais.

Não haverá onboarding obrigatório no MVP. Preferências simples poderão ser adicionadas ao perfil mais tarde, caso realmente ajudem a experiência da IA.

### 4.2 Tela principal e mapa

A tela principal é centrada no mapa 3D estilizado de uma região marciana. A interface deve oferecer o necessário para o usuário iniciar uma viagem:

- mapa com terreno e estruturas da colônia;
- localização atual simulada do passageiro;
- pontos de interesse e destinos selecionáveis;
- alguns rovers visíveis circulando pela região;
- acesso ao campo de destino;
- saldo de créditos;
- acesso ao histórico e ao perfil.

O mapa é o centro da experiência. Os controles e painéis devem apoiar a exploração e a solicitação de viagem sem esconder desnecessariamente o mapa.

### 4.3 Solicitação e seleção do motorista

1. O passageiro escolhe um destino.
2. O sistema apresenta uma estimativa de preço e duração.
3. O passageiro confirma a solicitação.
4. O backend valida saldo e disponibilidade.
5. O sistema escolhe aleatoriamente uma combinação elegível de veículo e motorista.
6. A opção selecionada é apresentada ao passageiro para aprovação.
7. O passageiro aprova ou recusa.
8. Se recusar, o candidato é marcado como recusado para aquela solicitação e o sistema busca outro candidato disponível.
9. Se não houver candidatos restantes, a solicitação termina com uma mensagem de indisponibilidade.
10. Após a aprovação, a viagem segue para a etapa de embarque e deslocamento.

A forma visual exata dessa interação ainda será refinada. Uma direção inicial é mostrar os veículos circulando no mapa, destacar o rover selecionado e dar foco nele enquanto o passageiro avalia a opção. Podemos decidir durante o front-end se a animação de aproximação começa antes ou depois da aprovação. A regra funcional, porém, permanece: só existe uma opção ativa para aprovação por vez.

### 4.4 Viagem em andamento

A tela de viagem apresenta:

- mapa com a rota;
- rover em movimento;
- origem e destino;
- estado atual da viagem;
- identificação do motorista e do veículo;
- previsão de chegada;
- acesso ao chat do motorista.

A simulação pode apresentar eventos simples e controlados, por exemplo uma notificação de condição da rota ou uma pequena alteração no tempo estimado. Os eventos serão definidos por cenários preparados pelo projeto; não precisamos criar um simulador climático ou de tráfego completo.

### 4.5 Conversa com o motorista

Na terceira fase, o passageiro poderá conversar com o motorista de IA. O motorista:

- mantém uma personalidade definida;
- sabe quem é o passageiro e qual viagem está em andamento;
- conhece origem, destino e estado da viagem;
- pode responder perguntas sobre a região e pontos de interesse cadastrados;
- pode sugerir um passeio ou uma parada próxima;
- só altera a viagem depois de o passageiro confirmar a sugestão.

O chat pertence à viagem. O contexto e o histórico da conversa ficam associados ao `ride_id`.

### 4.6 Finalização e histórico

1. A simulação chega ao destino.
2. A viagem muda para concluída.
3. O sistema registra o valor final e efetiva o débito de créditos.
4. O passageiro vê um resumo da viagem.
5. A viagem fica disponível no histórico.

A avaliação por estrelas pode ser adicionada se houver tempo, mas não é requisito para a jornada principal.

## 5. Estados e regras de negócio

### 5.1 Estados de uma viagem

Os estados devem ser explícitos para evitar transições inconsistentes:

- `requested`: solicitação criada.
- `searching_driver`: procurando uma combinação disponível.
- `awaiting_approval`: opção de motorista/veículo apresentada ao passageiro.
- `driver_approved`: passageiro aprovou a opção.
- `approaching_pickup`: rover se desloca até o ponto de embarque.
- `in_progress`: passageiro está em viagem.
- `completed`: viagem concluída.
- `cancelled`: viagem cancelada.
- `no_driver_available`: não existem candidatos disponíveis.

Uma recusa de candidato não precisa ser um estado definitivo da viagem. Ela é registrada como evento/tentativa, e a viagem volta ao processo de busca.

### 5.2 Regras de seleção

- Só podem ser selecionados veículos ativos e disponíveis.
- Um usuário só pode ter uma viagem ativa por vez no MVP.
- Um veículo não pode estar associado a mais de uma viagem ativa.
- Um motorista não pode estar associado a mais de uma viagem ativa.
- A seleção deve ser aleatória entre os candidatos elegíveis.
- Candidatos recusados pelo passageiro não devem ser reapresentados na mesma solicitação; as tentativas ficam registradas em `ride_candidate_attempts`.
- A seleção precisa acontecer no backend, nunca exclusivamente no navegador.
- A escolha aleatória não precisa usar IA.

### 5.3 Créditos marcianos

A moeda fictícia será chamada provisoriamente de **Mars Credits**, abreviada como `MC`.

Regras iniciais:

- Cada novo usuário recebe um saldo inicial definido para demonstração.
- O preço é calculado pelo backend com uma fórmula simples e previsível.
- O usuário vê a estimativa antes de confirmar a corrida.
- O sistema verifica se o saldo cobre o valor.
- O débito deve ser registrado uma única vez, em uma operação atômica.
- Uma viagem cancelada antes de começar não deve gerar cobrança definitiva.
- Não existe integração com dinheiro real.
- Para facilitar testes, pode existir uma ação de recarga demonstrativa com valor fixo, registrada no extrato como crédito fictício.

A fórmula do preço pode começar como valor-base + distância simulada + adicional da categoria do rover. Os valores serão definidos em configuração/seed, não espalhados pelo frontend.

## 6. Simulação dos veículos e das viagens

A simulação deve parecer dinâmica sem exigir infraestrutura complexa.

### 6.1 Veículos no mapa

- Cada rover possui um estado, uma posição e um caminho ou conjunto de pontos de movimento.
- Na tela inicial, alguns rovers percorrem trajetos predefinidos para dar vida ao mapa.
- Os trajetos podem ser loops simples entre pontos da colônia.
- A posição visual é interpolada no cliente para produzir movimento fluido.

### 6.2 Veículo associado à viagem

Quando uma viagem é aprovada:

- o backend associa o rover à viagem;
- registra o caminho e os horários relevantes;
- a interface anima o veículo ao longo dos pontos da rota;
- a tela consulta ou recebe atualizações de estado;
- ao alcançar a etapa final, a viagem passa para concluída.

Não é necessário gravar a posição do rover a cada frame. O backend armazena os dados necessários para reconstruir o progresso, como rota, início, duração e estado.

### 6.3 Eventos

Para dar variedade à demonstração, podemos ter poucos eventos predefinidos, como:

- atraso curto;
- alerta de trecho com poeira;
- chegada ao ponto de embarque;
- início da viagem;
- chegada ao destino.

Um evento pode atualizar o tempo estimado, o estado ou apresentar uma notificação. Não criaremos um motor de eventos genérico nem uma simulação física.

### 6.4 Persistência sem processo permanente

A simulação não deve depender de um `setTimeout` longo nem de um processo Node.js permanentemente ligado. Em hospedagem serverless, esse tipo de processo pode ser encerrado.

A abordagem do MVP será baseada em timestamps e progresso calculável:

- o backend registra `started_at`, `estimated_duration` e os pontos da rota;
- o cliente calcula a posição visual atual a partir do horário e da rota;
- atualizações de estado importantes são gravadas no banco;
- ao recarregar a página, o cliente consegue reconstruir a posição aproximada do veículo.

## 7. Inteligência artificial — terceira fase

A IA será integrada somente depois que as telas e os fluxos de viagem estiverem funcionando com dados reais.

### 7.1 Papel da IA

Cada motorista é um personagem conversacional com identidade e personalidade próprias. Para o MVP, podemos começar com dois ou três motoristas bem definidos, em vez de criar dezenas.

O motorista deve:

- conversar de maneira natural;
- manter sua personalidade;
- conhecer o contexto da corrida;
- responder perguntas sobre os locais cadastrados;
- fazer perguntas e sugerir passeios;
- propor uma parada opcional durante a viagem.

### 7.2 Contexto enviado ao modelo

O backend monta o contexto da conversa usando dados do sistema:

- nome e personalidade do motorista;
- nome do passageiro, quando disponível;
- origem e destino;
- estado da viagem;
- pontos de interesse conhecidos próximos à rota;
- mensagens recentes da conversa.

Não é necessário implementar memória de longo prazo entre corridas no MVP.

### 7.3 Ações da IA

A IA pode ter ferramentas limitadas, por exemplo:

- consultar informações de um ponto de interesse;
- procurar pontos de interesse cadastrados próximos à rota;
- propor uma parada.

A IA não altera a viagem silenciosamente. Para adicionar uma parada, ela apresenta a sugestão e espera uma confirmação explícita do passageiro. O backend valida a ação e então atualiza a viagem.

### 7.4 Limites

- A chave do provedor de IA fica somente no servidor.
- O modelo não acessa o banco diretamente.
- Ferramentas chamam serviços internos do backend.
- O backend valida usuário, viagem e estado antes de executar uma ação.
- Mensagens e chamadas à IA devem ter limites de tamanho e frequência.
- Respostas da IA sobre Marte devem usar o conteúdo fictício/documentado do universo do RedRide; o modelo não deve inventar fatos operacionais como se fossem dados confirmados do sistema.

## 8. Arquitetura técnica

### 8.1 Estilo arquitetural

**Monólito modular em Next.js.** Frontend e backend ficam no mesmo projeto e repositório, organizados por domínio. Não vamos criar microserviços para o MVP.

O termo monorepo não é necessário para esse escopo: teremos uma aplicação Next.js única. Se no futuro surgirem outras aplicações ou pacotes independentes, a estrutura poderá evoluir.

### 8.2 Stack proposta

| Camada | Tecnologia | Uso |
|---|---|---|
| Aplicação | Next.js App Router | Páginas, layouts e backend HTTP |
| Linguagem | TypeScript | Tipagem do projeto |
| UI | React + Tailwind CSS | Componentes e estilos |
| Mapa 3D | Three.js + React Three Fiber | Terreno, colônia, veículos e rotas |
| Banco | Supabase PostgreSQL | Persistência dos dados |
| Autenticação | Supabase Auth | Cadastro, login e sessões |
| Atualizações | Supabase Realtime ou consulta periódica | Estado da viagem e mensagens |
| Validação | Zod | Validação de entrada e contratos |
| IA | Provedor LLM + AI SDK | Chat e ferramentas do motorista, somente na fase 3 |

A biblioteca de animação e outras dependências visuais podem ser escolhidas durante o front-end. Não precisamos instalar ferramentas antes de haver uma necessidade concreta.

### 8.3 Comunicação

- Componentes de interface chamam endpoints do próprio Next.js.
- Route Handlers validam autenticação e payloads.
- Services concentram regras de negócio.
- Repositories concentram acesso ao banco.
- Integrações externas ficam atrás de módulos próprios.
- Segredos e chaves permanecem no servidor.

### 8.4 Atualizações em tempo real

Para o MVP, usar Supabase Realtime para mudanças relevantes de estado e mensagens, ou polling simples caso a configuração de realtime atrapalhe o cronograma. A animação de alta frequência do rover acontece no navegador; não precisamos transmitir coordenadas dezenas de vezes por segundo.

## 9. Estrutura de páginas e rotas

Não haverá landing page.

| Rota | Acesso | Responsabilidade |
|---|---|---|
| `/login` | Público | Entrar |
| `/register` | Público | Criar conta |
| `/forgot-password` | Público | Recuperar acesso, se houver tempo |
| `/app` | Autenticado | Mapa principal e início da solicitação |
| `/app/ride/[rideId]` | Autenticado | Acompanhar viagem e acessar chat |
| `/app/history` | Autenticado | Consultar viagens anteriores |
| `/app/profile` | Autenticado | Dados básicos e saldo de créditos |

O pedido de viagem pode começar na própria tela `/app`, sem exigir uma página independente. Se o layout ficar mais claro com um modal, drawer ou rota específica, decidiremos durante o front-end.

## 10. Módulos funcionais

| Módulo | Responsabilidade |
|---|---|
| `auth` | Sessão, cadastro e login |
| `users` | Perfil e preferências mínimas |
| `map` | Cena 3D, pontos e visualização dos rovers |
| `locations` | Colônias, estações e pontos de interesse |
| `vehicles` | Cadastro e disponibilidade dos rovers |
| `drivers` | Identidade e personalidade dos motoristas |
| `rides` | Solicitações, aprovação, estados e conclusão |
| `simulation` | Posição, trajetos e eventos simulados |
| `wallet` | Saldo e transações de créditos fictícios |
| `chat` | Mensagens associadas à viagem |
| `ai` | Contexto do motorista e ferramentas de IA, na fase 3 |

Não é necessário criar um módulo administrativo completo para gerenciar esses dados. Os registros iniciais podem ser inseridos por seed/migration no banco.

## 11. Organização de pastas sugerida

```text
redride/
├── public/
│   ├── images/
│   ├── models/
│   └── fonts/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (product)/
│   │   │   └── app/
│   │   │       ├── page.tsx
│   │   │       ├── ride/[rideId]/page.tsx
│   │   │       ├── history/page.tsx
│   │   │       └── profile/page.tsx
│   │   ├── api/
│   │   │   ├── rides/route.ts
│   │   │   ├── rides/[rideId]/route.ts
│   │   │   ├── rides/[rideId]/approval/route.ts
│   │   │   ├── rides/[rideId]/cancel/route.ts
│   │   │   ├── rides/[rideId]/messages/route.ts
│   │   │   ├── wallet/route.ts
│   │   │   └── ai/chat/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── map/
│   │   ├── ride/
│   │   └── chat/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── locations/
│   │   ├── vehicles/
│   │   ├── drivers/
│   │   ├── rides/
│   │   ├── simulation/
│   │   ├── wallet/
│   │   ├── chat/
│   │   └── ai/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── validations/
│   │   └── utils/
│   ├── hooks/
│   ├── types/
│   └── config/
├── .env.local
├── package.json
└── tsconfig.json
```

A pasta `app` cuida das rotas e da composição das páginas. `components` contém componentes visuais reutilizáveis. `modules` concentra regras e funcionalidades por domínio. Não precisamos criar arquivos vazios para todos os módulos logo no início; eles surgem conforme a implementação avança.

### Exemplo de organização de um módulo

```text
modules/rides/
├── ride.types.ts
├── ride.schema.ts
├── ride.repository.ts
├── ride.service.ts
└── ride.constants.ts
```

- `types`: contratos e tipos TypeScript.
- `schema`: validação dos dados de entrada.
- `repository`: leitura e escrita no banco.
- `service`: regras de negócio.
- `constants`: estados e valores fixos.

## 12. Modelo de dados inicial

O modelo deve começar pequeno e evoluir quando uma funcionalidade exigir novos dados.

### 12.1 Tabelas

| Tabela | Campos/objetivo principal |
|---|---|
| `profiles` | `id`, `name`, `username`, `avatar_url`, `created_at`; `id` referencia o usuário do Supabase Auth |
| `wallets` | `id`, `user_id`, `balance`, `currency` |
| `wallet_transactions` | `id`, `wallet_id`, `ride_id`, `type`, `amount`, `description`, `created_at` |
| `locations` | `id`, `name`, `description`, `type`, `map_x`, `map_z` |
| `vehicles` | `id`, `name`, `model`, `category`, `capacity`, `status`, `map_x`, `map_z` |
| `drivers` | `id`, `name`, `personality`, `description`, `avatar_url`, `system_prompt`, `is_active` |
| `rides` | `id`, `user_id`, `vehicle_id`, `driver_id`, `origin_id`, `destination_id`, `status`, `price`, `route_data`, `started_at`, `completed_at`, `created_at` |
| `ride_candidate_attempts` | `id`, `ride_id`, `driver_id`, `vehicle_id`, `status`, `presented_at`, `responded_at` — candidatos apresentados, aprovados ou recusados |
| `ride_events` | `id`, `ride_id`, `event_type`, `payload`, `created_at` |
| `ride_messages` | `id`, `ride_id`, `sender_type`, `content`, `created_at` |
| `ride_stops` | `id`, `ride_id`, `location_id`, `status`, `created_at` |

`ride_stops` pode entrar na fase 3, quando a IA realmente puder propor e adicionar paradas. Se não houver tempo, pode ser omitida do MVP inicial.

### 12.2 Observações sobre os dados

- `map_x` e `map_z` representam posições no espaço local da cena 3D. Não são latitude/longitude reais.
- `route_data` guarda os pontos de uma rota simulada, de forma que o navegador consiga animar o veículo.
- `ride_events` guarda eventos importantes, não cada frame da animação.
- O saldo deve ser atualizado de forma transacional; não fazer débito somente no frontend.
- O histórico de mensagens é relacionado à viagem, não a uma conversa global sem contexto.
- O prompt do motorista é dado de configuração controlado pelo servidor.

## 13. Backend e endpoints principais

Os endpoints abaixo são uma referência inicial. Eles podem ser ajustados conforme as telas e os contratos de dados forem construídos.

| Método | Endpoint | Função |
|---|---|---|
| GET | `/api/users/me` | Consultar perfil e saldo |
| PATCH | `/api/users/me` | Atualizar perfil básico |
| GET | `/api/locations` | Listar destinos e pontos do mapa |
| GET | `/api/vehicles/nearby` | Consultar rovers disponíveis para a simulação |
| POST | `/api/rides` | Criar solicitação e calcular estimativa |
| GET | `/api/rides/[rideId]` | Consultar estado e dados da viagem |
| POST | `/api/rides/[rideId]/approval` | Aprovar ou recusar candidato |
| POST | `/api/rides/[rideId]/cancel` | Cancelar solicitação/viagem, conforme o estado |
| POST | `/api/rides/[rideId]/start` | Iniciar a viagem após embarque simulado |
| POST | `/api/rides/[rideId]/complete` | Concluir viagem na simulação |
| GET | `/api/rides` | Listar histórico do passageiro |
| GET | `/api/wallet` | Consultar saldo e extrato |
| POST | `/api/ai/chat` | Enviar mensagem ao motorista, na fase 3 |

O frontend não escolhe o motorista, não calcula o saldo definitivo e não altera diretamente o estado da viagem. Ele solicita ações ao backend.

## 14. Fluxo técnico de uma solicitação

1. O frontend envia destino e origem ao endpoint de criação.
2. O backend valida usuário, local, disponibilidade e saldo.
3. O backend calcula a estimativa com uma regra determinística.
4. A solicitação é criada e recebe o estado `searching_driver`.
5. O serviço procura veículos/motoristas disponíveis.
6. Um candidato é escolhido aleatoriamente.
7. O candidato é associado à tentativa e a viagem passa para `awaiting_approval`.
8. O frontend destaca/apresenta a opção.
9. Se houver aprovação, o backend confirma a associação e avança a viagem.
10. Se houver recusa, o backend registra a recusa, libera o candidato e procura outro.
11. Quando não houver candidatos, a viagem passa para `no_driver_available`.
12. Com a opção aprovada, a simulação segue para embarque e deslocamento.

A implementação deve impedir duas aprovações concorrentes para a mesma solicitação e a alocação simultânea de um veículo em duas viagens ativas.

## 15. Simulação e animação: separação de responsabilidades

A simulação tem duas camadas:

**Camada de domínio/backend**
- determina o estado da viagem;
- define a rota e a duração simulada;
- registra eventos importantes;
- controla a disponibilidade de veículos;
- determina quando a viagem pode avançar.

**Camada visual/frontend**
- renderiza o mapa e os rovers;
- anima veículos entre pontos;
- destaca o rover selecionado;
- apresenta alertas e mudanças de estado;
- reconstrói a posição do rover quando a página é recarregada.

A animação não é fonte de verdade. O estado persistido no backend é a fonte de verdade.

## 16. Segurança mínima

- Usar Supabase Auth para autenticação.
- Ativar Row Level Security nas tabelas expostas ao cliente.
- Usuários só consultam seus perfis, carteiras, viagens e mensagens.
- Verificar permissões no servidor em toda operação sensível.
- Manter chaves privadas e chave de serviço apenas no backend.
- Validar payloads com Zod.
- Validar transições de estado no service da viagem.
- Registrar cada débito/crédito no extrato.
- Ferramentas da IA executam ações exclusivamente via services do backend.

## 17. Variáveis de ambiente previstas

Os nomes exatos serão definidos quando o projeto for criado. A lista inicial esperada:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER_API_KEY=
```

A chave de serviço do Supabase e a chave do provedor de IA nunca podem usar prefixo `NEXT_PUBLIC_` nem ser importadas por componentes client-side.

## 18. Critérios de conclusão do MVP

O MVP estará funcional quando for possível:

- Criar conta, entrar e sair.
- Abrir o mapa 3D depois da autenticação.
- Visualizar destinos e rovers em movimento.
- Selecionar origem e destino.
- Ver preço e saldo de créditos.
- Solicitar uma viagem.
- Receber uma opção aleatória de motorista/veículo.
- Aprovar ou recusar e receber outra opção quando possível.
- Acompanhar a viagem no mapa.
- Conversar com o motorista de IA.
- Receber uma sugestão de passeio ou parada e confirmá-la.
- Concluir a viagem e registrar o débito fictício.
- Consultar o histórico.

## 19. Princípios para evitar crescimento desnecessário do escopo

1. Uma região de Marte é suficiente para a demonstração.
2. Poucos veículos e poucos motoristas, mas bem apresentados.
3. Rotas predefinidas e simulação controlada, sem física real.
4. Uma fórmula simples de preço, sem algoritmo complexo.
5. Créditos fictícios, sem pagamento real.
6. Sem painel administrativo completo; utilizar seeds para os dados iniciais.
7. Sem microserviços, workers ou infraestrutura de filas no MVP.
8. IA limitada ao motorista conversacional e a poucas ferramentas úteis.
9. A interface pode mudar durante a construção; as regras de negócio devem permanecer consistentes.
10. Não implementar uma funcionalidade só porque ela aparece neste documento: priorizar a jornada principal e respeitar as três fases da imersão.

---

**Documento de referência:** esta especificação descreve a direção do RedRide, não um contrato imutável de interface. Fluxos visuais, disposição de painéis e animações podem ser refinados com o produto em funcionamento, sem alterar desnecessariamente as regras centrais.
