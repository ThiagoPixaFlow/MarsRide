# 🚀 RedRide — Mobilidade Autônoma em Marte

> **Transporte autônomo, rotas holográficas e pilotos de Inteligência Artificial na colônia marciana de Nova Acidália.**

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black?style=flat&logo=three.js)](https://threejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

---

## 📖 Sobre o Projeto

O **RedRide** é uma experiência futurista de aplicativo de transporte inspirada no ecossistema de Marte. A plataforma permite aos colonos de Nova Acidália:

- 🗺️ **Explorar o mapa 3D de Marte**: Relevo marciano tridimensional, cúpulas geodésicas pressurizadas, malha viária conectada e suporte a câmera orbital livre (3D) ou visão tática superior (2.5D).
- 🚗 **Chamar Rovers Autônomos**: Cotação em tempo real entre 10 pontos de interesse (POIs) com cálculo de distância, tempo estimado e valor em Créditos Marcianos (**MCR**).
- 🤖 **Pilotos de IA com Personalidade**: Cada motorista possui voz, estilo de direção, biografia e tom únicos (cientistas, pilotos veteranos, geólogos e exploradores).
- 📡 **Telemetria e Deslocamento na Pista**: Acompanhe o rover em tempo real se deslocando pelas estradas, com linha holográfica de rota que diminui à medida que o veículo avança.
- 💬 **Chat Interativo de Bordo**: Converse com o piloto durante o trajeto.
- 💳 **Carteira de Créditos (MCR)**: Débito atômico após o término da viagem e recarga rápida de saldo.

---

## 🛠️ Tecnologias Utilizadas

- **Framework Web**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Renderização 3D**: [Three.js](https://threejs.org/) via [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) e [@react-three/drei](https://github.com/pmndrs/drei)
- **Estilização & UI**: [Tailwind CSS](https://tailwindcss.com/) e [Lucide Icons](https://lucide.dev/)
- **Banco de Dados & Autenticação**: [Supabase](https://supabase.com/) (PostgreSQL relacional, RLS e Triggers)
- **Validação de Formulários**: [React Hook Form](https://react-hook-form.com/) e [Zod](https://zod.dev/)

---

## 💻 Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) versão **20.x** ou superior (testado na v24)
- Gerenciador de pacotes **npm** (incluso com Node.js) ou **pnpm** / **yarn**
- [Git](https://git-scm.com/)

---

## ⚡ Passo a Passo: Como Rodar o Projeto

### 1. Clonar o Repositório

```bash
git clone https://github.com/SEU-USUARIO/MarsRide.git
cd MarsRide
```

### 2. Instalar as Dependências

```bash
npm install
```

---

### 3. Escolher o Modo de Execução

O RedRide conta com arquitetura híbrida e pode ser executado de duas formas:

#### Opção A — Modo Demonstração (100% Local / Sem Banco de Dados)
Se você quer apenas testar a interface, o mapa 3D e as viagens sem precisar criar conta no Supabase:
1. **Você não precisa configurar nada no `.env.local`**.
2. O sistema detectará automaticamente a ausência das chaves e utilizará um armazenamento local mockado em memória/localStorage.
3. Na tela de login, basta clicar em **"Entrar como Visitante (Acesso Rápido Demo)"** e começar a navegar!

---

#### Opção B — Modo Completo com Supabase (PostgreSQL em Nuvem)

Para persistência real de dados, autenticação de colonos e histórico de transações:

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e crie um novo projeto.
2. No painel do seu projeto Supabase, acesse **SQL Editor** e execute os dois scripts SQL inclusos na pasta `supabase/`:
   - Primeiro execute: [`supabase/migrations/20261104000000_initial_schema.sql`](supabase/migrations/20261104000000_initial_schema.sql) *(cria as tabelas, RLS e triggers)*
   - Em seguida execute: [`supabase/seed.sql`](supabase/seed.sql) *(popula os 10 POIs, 12 pilotos de IA e 10 rovers)*
3. Copie as chaves do projeto em **Project Settings → API / API Keys**:
   - `Project URL`
   - `anon / publishable key`
   - `service_role / secret key`
4. Crie o arquivo `.env.local` na raiz do projeto (ou copie de `.env.example`):

```bash
cp .env.example .env.local
```

Preencha com os dados do seu projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-ou-publishable
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-secret
```

---

### 4. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Abra o navegador e acesse:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🎮 Como Usar a Aplicação

1. **Acesso à Colônia**:
   - **Visitante**: Clique no botão cinza *"Entrar como Visitante (Acesso Rápido Demo)"* para acessar instantaneamente com o perfil de Alex Vance e 1.000 MCR na carteira.
   - **Cadastro**: Crie um novo perfil de colono na aba de cadastro para receber automaticamente os 1.000 créditos de boas-vindas.
2. **Cotação de Viagem**:
   - Selecione um **Ponto de Partida** e um **Destino** (você pode selecionar pelos menus ou clicando diretamente nos marcadores do mapa 3D).
   - Escolha entre **RedRide Go** (rovers padrão) ou **RedRide Prime** (rovers executivos pressurizados).
   - Clique em **"Solicitar RedRide"**.
3. **Aprovação do Motorista**:
   - O radar fará a varredura e apresentará o piloto mais compatível na pista.
   - Você pode:
     - **Aprovar Motorista**: Inicia a rota de aproximação do rover em tempo real.
     - **Recusar (Outro)**: Busca outro motorista disponível na colônia.
     - **Cancelar Solicitação**: Aborta o pedido e libera o veículo.
4. **Viagem & Chat**:
   - Durante o percurso, abra o chat flutuante para interagir com a personalidade da IA do motorista.
   - Conclua a viagem para efetuar o débito automático na carteira de MCR.

---

## 📁 Estrutura de Pastas do Projeto

```text
MarsRide/
├── src/
│   ├── app/                      # Rotas e páginas do Next.js (App Router)
│   │   ├── (auth)/               # Telas de login e cadastro
│   │   ├── (product)/            # Terminal principal: mapa, histórico e perfil
│   │   └── api/                  # API Route Handlers (rides, drivers, wallet, etc.)
│   ├── components/               # Componentes visuais
│   │   ├── driver/               # Cards de candidatos e perfis de motoristas
│   │   ├── layout/               # Navbar e estrutura geral
│   │   ├── map/                  # Canvas Three.js, terreno 3D, estradas e rovers
│   │   ├── ride/                 # Painéis de solicitação e viagem ativa
│   │   ├── ui/                   # Botões, inputs, cards com glassmorphism
│   │   └── wallet/               # Modal e extrato de créditos MCR
│   ├── config/                   # Configurações de rotas, preços e simulação
│   ├── lib/                      # Utilitários (Three.js, grafo de estradas, Supabase)
│   ├── mocks/                    # Dados locais de contingência (POIs, pilotos, rovers)
│   └── modules/                  # Camadas de domínio e serviços (auth, rides, wallet)
├── supabase/
│   ├── migrations/               # Esquema DDL do PostgreSQL
│   └── seed.sql                  # Carga inicial da colônia
└── README.md
```

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento com Turbopack em `http://localhost:3000` |
| `npm run build` | Compila o projeto otimizado para produção |
| `npm run start` | Inicia o servidor em modo de produção (após o build) |
| `npm run lint` | Executa a verificação estática de código com o ESLint |

---

## 📄 Licença

Este projeto é desenvolvido para fins de demonstração e estudo sob a licença [MIT](LICENSE).
