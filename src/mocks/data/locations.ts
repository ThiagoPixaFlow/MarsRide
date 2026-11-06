import type { Location } from "@/modules/locations/location.types";

/**
 * Pontos de interesse da colônia Nova Acidália (seed expandida).
 * Coordenadas no espaço tridimensional amplo: 1 unidade = 100 m.
 */
export const LOCATIONS_SEED: Location[] = [
  {
    id: "loc-hub-central",
    name: "Hub Central Acidália",
    shortName: "Hub Central",
    type: "hub",
    district: "Núcleo",
    description:
      "O coração pressurizado da colônia: administração, estação central de rovers e a grande cúpula onde os colonos se encontram.",
    position: { x: 0, z: 0 },
    highlights: ["Estação principal de rovers", "Praça da Cúpula", "Centro de atendimento"],
    facts: [
      "A cúpula do Hub tem 120 metros de diâmetro e camadas de regolito compactado que bloqueiam a radiação.",
      "Foi a primeira estrutura permanente da colônia, montada por robôs antes da chegada dos colonos.",
    ],
    openHours: "Aberto 24 sols por sol",
  },
  {
    id: "loc-market",
    name: "Mercado Ferrugem",
    shortName: "Mercado",
    type: "commerce",
    district: "Distrito Oeste",
    description:
      "Mercado coberto com barracas de colonos, cafés hidropônicos e oficinas de artesanato feitas com ligas locais.",
    position: { x: -75, z: 30 },
    highlights: ["Café de algas tostadas", "Feira de peças de rover", "Artesanato em basalto"],
    facts: [
      "O nome vem do óxido de ferro — a mesma ‘ferrugem’ que deixa o solo de Marte avermelhado.",
      "Às sextas-sol acontece a feira de trocas, onde quase tudo é negociado em créditos e favores.",
    ],
    openHours: "06h – 23h",
  },
  {
    id: "loc-gardens",
    name: "Jardins da Cúpula Verde",
    shortName: "Jardins",
    type: "leisure",
    district: "Distrito Norte",
    description:
      "Estufas geodésicas com bosques de bambu, trilhas e o único lago de água líquida aberto ao público em Acidália.",
    position: { x: 70, z: -55 },
    highlights: ["Lago Aurora", "Trilha das samambaias", "Observatório botânico"],
    facts: [
      "As estufas produzem cerca de 30% de todo o oxigênio respirado na colônia.",
      "Plantas cultivadas em Marte crescem mais altas por causa da gravidade de apenas 38% da terrestre.",
    ],
    openHours: "07h – 21h",
  },
  {
    id: "loc-residential",
    name: "Distrito Residencial Olympus",
    shortName: "Olympus",
    type: "residential",
    district: "Distrito Noroeste",
    description:
      "Bairro de habitats cilíndricos semienterrados, com praças internas, escolas e o famoso túnel de murais.",
    position: { x: -65, z: -90 },
    highlights: ["Túnel dos Murais", "Escola Bradbury", "Praça Phobos"],
    facts: [
      "Os habitats ficam parcialmente enterrados: dois metros de regolito protegem os moradores da radiação.",
      "O distrito homenageia o Olympus Mons, o maior vulcão conhecido do Sistema Solar.",
    ],
    openHours: "Residencial · acesso livre",
  },
  {
    id: "loc-research",
    name: "Instituto de Pesquisa Sagan",
    shortName: "Instituto Sagan",
    type: "science",
    district: "Distrito Leste",
    description:
      "Centro científico com laboratórios de astrobiologia, a grande antena de comunicação com a Terra e um museu aberto.",
    position: { x: 115, z: 45 },
    highlights: ["Antena Deep Link", "Museu da Exploração", "Laboratório de astrobiologia"],
    facts: [
      "Uma mensagem para a Terra leva entre 3 e 22 minutos para chegar, dependendo da posição dos planetas.",
      "O museu guarda réplicas dos primeiros rovers: Sojourner, Spirit, Opportunity, Curiosity e Perseverance.",
    ],
    openHours: "08h – 20h",
  },
  {
    id: "loc-spaceport",
    name: "Espaçoporto Bradbury",
    shortName: "Espaçoporto",
    type: "spaceport",
    district: "Planície Sudoeste",
    description:
      "Plataformas de pouso para naves de carga e passageiros vindas da órbita e das luas Phobos e Deimos.",
    position: { x: -170, z: 105 },
    highlights: ["Terminal de passageiros", "Plataforma de lançamento 2", "Mirante de decolagens"],
    facts: [
      "Com a gravidade menor, decolar de Marte exige muito menos combustível do que decolar da Terra.",
      "Os lançamentos acontecem quando Phobos está bem posicionado para o encontro orbital.",
    ],
    openHours: "Operação contínua",
  },
  {
    id: "loc-solar-farm",
    name: "Fazenda Solar Helios",
    shortName: "Helios",
    type: "energy",
    district: "Planalto Leste",
    description:
      "Campos de painéis solares com limpeza robótica e a estação de recarga dos rovers da frota RedRide.",
    position: { x: 170, z: -110 },
    highlights: ["Robôs de limpeza", "Estação de recarga", "Passarela elevada"],
    facts: [
      "Marte recebe cerca de 43% da luz solar que chega à Terra, por isso os campos são enormes.",
      "Durante tempestades de poeira, a colônia muda para os reatores compactos de reserva.",
    ],
    openHours: "Visitas guiadas 10h – 16h",
  },
  {
    id: "loc-ice-mine",
    name: "Mina de Gelo Korolev",
    shortName: "Mina Korolev",
    type: "industry",
    district: "Bacia Noroeste",
    description:
      "Extração de gelo subterrâneo que abastece a colônia com água potável, oxigênio e combustível.",
    position: { x: -180, z: -160 },
    highlights: ["Torre de perfuração", "Galeria de cristais de gelo", "Planta de eletrólise"],
    facts: [
      "A cratera Korolev, ao norte de Marte, guarda um depósito de gelo com quase 2 km de espessura.",
      "Da água extraída obtemos hidrogênio e oxigênio — base para o combustível das naves.",
    ],
    openHours: "Visitas 09h – 15h",
  },
  {
    id: "loc-crater-overlook",
    name: "Mirante da Cratera Jezero",
    shortName: "Mirante Jezero",
    type: "viewpoint",
    district: "Borda Sudeste",
    description:
      "Plataforma panorâmica na borda de uma cratera, perfeita para assistir ao pôr do sol azulado de Marte.",
    position: { x: 195, z: 140 },
    highlights: ["Pôr do sol azul", "Telescópio público", "Trilha da borda"],
    facts: [
      "O pôr do sol em Marte é azulado: a poeira fina espalha a luz azul na direção do Sol.",
      "Jezero é o nome da cratera onde o Perseverance procurou sinais de vida antiga em 2021.",
    ],
    openHours: "Melhor horário: entardecer",
  },
  {
    id: "loc-canyon-gate",
    name: "Portal do Cânion Marineris",
    shortName: "Portal Marineris",
    type: "viewpoint",
    district: "Fronteira Norte",
    description:
      "Entrada para as trilhas do cânion, com passarela suspensa sobre a fenda e base para expedições.",
    position: { x: 20, z: -200 },
    highlights: ["Passarela suspensa", "Base de expedições", "Ecos do cânion"],
    facts: [
      "O Valles Marineris real tem mais de 4.000 km de extensão — cruzaria os Estados Unidos de costa a costa.",
      "Em alguns trechos, o cânion chega a 7 km de profundidade.",
    ],
    openHours: "Expedições ao amanhecer",
  },
];
