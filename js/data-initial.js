/**
 * DATA INITIAL - SISTEMA INTEGRADO DE ESCALA DE TURNO
 * Dados oficiais extraídos de:
 * 1. EFETIVO SOSSEGO HC.pdf (Área Sossego - 3 Caminhões)
 * 2. EFETIVO_HC_AREA_SALOBO_EDITAVEL.docx (Área Salobo - 4 Caminhões)
 */

const INITIAL_DATA = {
  // Configuração das Áreas Operacionais
  areas: [
    {
      id: "sossego",
      nome: "Área Sossego",
      caminhoesQtd: 3,
      responsavelGeral: "Divino Soares dos Santos (Encarregado)",
      descricao: "Operação Sossego - 3 Caminhões ativos em rota",
      cor: "#00d2ff"
    },
    {
      id: "salobo",
      nome: "Área Salobo",
      caminhoesQtd: 4,
      responsavelGeral: "Pedro Reis de Almeida (Sup. Administrativo)",
      descricao: "Operação Salobo - 4 Caminhões ativos em rota",
      cor: "#00f5a0"
    }
  ],

  // 36 Colaboradores Oficiais Cadastrados
  colaboradores: [
    // --- EFETIVO ÁREA SOSSEGO (18 Colaboradores) ---
    {
      id: "sos-01",
      nome: "Denis da Silva Duarte",
      cargo: "Ajudante de Motorista",
      area: "sossego",
      situacao: "NOTURNO 3X3",
      regime: "3X3",
      turnoPadrao: "NOTURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: "A",
      matricula: "SOS-1001",
      telefone: "(94) 99101-0001",
      email: "denis.duarte@operacao.com.br",
      observacao: "Ajudante de motorista no turno noturno 3x3"
    },
    {
      id: "sos-02",
      nome: "Elmaquison Paio Da Conceição",
      cargo: "Sup. Administrativo",
      area: "sossego",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SOS-1002",
      telefone: "(94) 99101-0002",
      email: "elmaquison.conceicao@operacao.com.br",
      observacao: "Supervisão administrativa da base Sossego"
    },
    {
      id: "sos-03",
      nome: "Francisco Caio de Souza Pereira",
      cargo: "Ajudante de Motorista",
      area: "sossego",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SOS-1003",
      telefone: "(94) 99101-0003",
      email: "francisco.pereira@operacao.com.br",
      observacao: "Apoio operacional diurno"
    },
    {
      id: "sos-04",
      nome: "Genilson Alves de Carvalho",
      cargo: "Tec. Montagem",
      area: "sossego",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SOS-1004",
      telefone: "(94) 99101-0004",
      email: "genilson.carvalho@operacao.com.br",
      observacao: "Técnico especialista em montagem e manutenção"
    },
    {
      id: "sos-05",
      nome: "Jardel Rodrigues Sousa",
      cargo: "Motorista",
      area: "sossego",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SOS-1005",
      telefone: "(94) 99101-0005",
      email: "jardel.sousa@operacao.com.br",
      observacao: "Motorista administrativo / Apoio rodoviário"
    },
    {
      id: "sos-06",
      nome: "Leandro Santos de Araujo",
      cargo: "Ajudante de Motorista",
      area: "sossego",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SOS-1006",
      telefone: "(94) 99101-0006",
      email: "leandro.araujo@operacao.com.br",
      observacao: "Ajudante diurno"
    },
    {
      id: "sos-07",
      nome: "Divino Soares dos Santos",
      cargo: "Encarregado",
      area: "sossego",
      situacao: "RESPONSÁVEL",
      regime: "ESPECIAL",
      turnoPadrao: "GERAL",
      carteiraMina: true,
      status: "ativo",
      turma3x3: null,
      matricula: "SOS-1007",
      telefone: "(94) 99101-0007",
      email: "divino.santos@operacao.com.br",
      observacao: "Encarregado Responsável Geral - Não entra na escala de revezamento"
    },
    {
      id: "sos-08",
      nome: "Lorrane Fonseca da Silva",
      cargo: "Tec. Segurança",
      area: "sossego",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SOS-1008",
      telefone: "(94) 99101-0008",
      email: "lorrane.silva@operacao.com.br",
      observacao: "Técnica de Segurança do Trabalho - Acompanhamento e DDS"
    },
    {
      id: "sos-09",
      nome: "Nilton dos Reis da Silva",
      cargo: "Motorista",
      area: "sossego",
      situacao: "NOTURNO 3X3",
      regime: "3X3",
      turnoPadrao: "NOTURNO",
      carteiraMina: true,
      status: "ativo",
      turma3x3: "A",
      matricula: "SOS-1009",
      telefone: "(94) 99101-0009",
      email: "nilton.silva@operacao.com.br",
      observacao: "Motorista Carteira Mina Habilitado - Turno Noturno 3x3"
    },
    {
      id: "sos-10",
      nome: "Reinaldo Silva de Souza",
      cargo: "Motorista",
      area: "sossego",
      situacao: "3X3 MINA",
      regime: "3X3",
      turnoPadrao: "DIURNO",
      carteiraMina: true,
      status: "ativo",
      turma3x3: "B",
      matricula: "SOS-1010",
      telefone: "(94) 99101-0010",
      email: "reinaldo.souza@operacao.com.br",
      observacao: "Motorista com Carteira Mina - Escala 3x3 Mina"
    },
    {
      id: "sos-11",
      nome: "Eugenio de Souza da Conceição",
      cargo: "Motorista",
      area: "sossego",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SOS-1011",
      telefone: "(94) 99101-0011",
      email: "eugenio.conceicao@operacao.com.br",
      observacao: "Motorista administrativo diurno"
    },
    {
      id: "sos-12",
      nome: "Rondinelle Lazame Pacheco",
      cargo: "Ajudante de Motorista",
      area: "sossego",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SOS-1012",
      telefone: "(94) 99101-0012",
      email: "rondinelle.pacheco@operacao.com.br",
      observacao: "Ajudante operacional diurno"
    },
    {
      id: "sos-13",
      nome: "Murilo Edielson Aguiar da Silva",
      cargo: "Ajudante de Motorista",
      area: "sossego",
      situacao: "NOTURNO 3X3",
      regime: "3X3",
      turnoPadrao: "NOTURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: "B",
      matricula: "SOS-1013",
      telefone: "(94) 99101-0013",
      email: "murilo.silva@operacao.com.br",
      observacao: "Ajudante de motorista no turno 3x3"
    },
    {
      id: "sos-14",
      nome: "Roniel Rodrigues de Oliveira",
      cargo: "Motorista",
      area: "sossego",
      situacao: "NOTURNO 3X3",
      regime: "3X3",
      turnoPadrao: "NOTURNO",
      carteiraMina: true,
      status: "ativo",
      turma3x3: "B",
      matricula: "SOS-1014",
      telefone: "(94) 99101-0014",
      email: "roniel.oliveira@operacao.com.br",
      observacao: "Motorista Carteira Mina - Turno Noturno 3x3"
    },
    {
      id: "sos-15",
      nome: "João Marcos Souza Rodrigues",
      cargo: "Ajudante de Motorista",
      area: "sossego",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SOS-1015",
      telefone: "(94) 99101-0015",
      email: "joao.rodrigues@operacao.com.br",
      observacao: "Ajudante administrativo"
    },
    {
      id: "sos-16",
      nome: "Danilo de Paula da Silva",
      cargo: "Motorista de Caminhão",
      area: "sossego",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SOS-1016",
      telefone: "(94) 99101-0016",
      email: "danilo.silva@operacao.com.br",
      observacao: "Motorista pesado de caminhão"
    },
    {
      id: "sos-17",
      nome: "Marcelo Pereira da Luz",
      cargo: "Motorista de Caminhão",
      area: "sossego",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SOS-1017",
      telefone: "(94) 99101-0017",
      email: "marcelo.luz@operacao.com.br",
      observacao: "Motorista de caminhão diurno"
    },
    {
      id: "sos-18",
      nome: "William Pereira Chaves",
      cargo: "Ajudante de Motorista",
      area: "sossego",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SOS-1018",
      telefone: "(94) 99101-0018",
      email: "william.chaves@operacao.com.br",
      observacao: "Ajudante de motorista diurno"
    },

    // --- EFETIVO ÁREA SALOBO (18 Colaboradores) ---
    {
      id: "sal-01",
      nome: "Alex Cunha do Nascimento",
      cargo: "Tec. Montagem BQ",
      area: "salobo",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SAL-2001",
      telefone: "(94) 99201-0001",
      email: "alex.nascimento@operacao.com.br",
      observacao: "Técnico Especialista em Montagem BQ"
    },
    {
      id: "sal-02",
      nome: "Elnatan S. Martins",
      cargo: "Ajudante de Motorista",
      area: "salobo",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SAL-2002",
      telefone: "(94) 99201-0002",
      email: "elnatan.martins@operacao.com.br",
      observacao: "Ajudante diurno em Salobo"
    },
    {
      id: "sal-03",
      nome: "Deusiano da Conceição sousa",
      cargo: "Motorista",
      area: "salobo",
      situacao: "NOTURNO 3X3",
      regime: "3X3",
      turnoPadrao: "NOTURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: "A",
      matricula: "SAL-2003",
      telefone: "(94) 99201-0003",
      email: "deusiano.sousa@operacao.com.br",
      observacao: "Motorista turno noturno 3x3"
    },
    {
      id: "sal-04",
      nome: "Italo Martins de Moura",
      cargo: "Motorista",
      area: "salobo",
      situacao: "ADM - CARTEIRA MINA",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: true,
      status: "ativo",
      turma3x3: null,
      matricula: "SAL-2004",
      telefone: "(94) 99201-0004",
      email: "italo.moura@operacao.com.br",
      observacao: "Motorista com Carteira Mina Habilitada"
    },
    {
      id: "sal-05",
      nome: "Izaque Moraes da Silva",
      cargo: "Motorista",
      area: "salobo",
      situacao: "ADM - CARTEIRA MINA",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: true,
      status: "ativo",
      turma3x3: null,
      matricula: "SAL-2005",
      telefone: "(94) 99201-0005",
      email: "izaque.silva@operacao.com.br",
      observacao: "Motorista com Carteira Mina Habilitada"
    },
    {
      id: "sal-06",
      nome: "Jiro Viegas Feitosa",
      cargo: "Motorista",
      area: "salobo",
      situacao: "NOTURNO 3X3",
      regime: "3X3",
      turnoPadrao: "NOTURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: "B",
      matricula: "SAL-2006",
      telefone: "(94) 99201-0006",
      email: "jiro.feitosa@operacao.com.br",
      observacao: "Motorista 3x3 noturno"
    },
    {
      id: "sal-07",
      nome: "Jailson da Silva Farias",
      cargo: "Ajudante de Motorista",
      area: "salobo",
      situacao: "NOTURNO 3X3",
      regime: "3X3",
      turnoPadrao: "NOTURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: "A",
      matricula: "SAL-2007",
      telefone: "(94) 99201-0007",
      email: "jailson.farias@operacao.com.br",
      observacao: "Ajudante no turno noturno 3x3"
    },
    {
      id: "sal-08",
      nome: "Jheimeson S. Sousa",
      cargo: "Ajudante de Motorista",
      area: "salobo",
      situacao: "NOTURNO 3X3",
      regime: "3X3",
      turnoPadrao: "NOTURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: "B",
      matricula: "SAL-2008",
      telefone: "(94) 99201-0008",
      email: "jheimeson.sousa@operacao.com.br",
      observacao: "Ajudante no turno noturno 3x3"
    },
    {
      id: "sal-09",
      nome: "Joao Paulo Gonçalves Neves",
      cargo: "Motorista",
      area: "salobo",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SAL-2009",
      telefone: "(94) 99201-0009",
      email: "joao.neves@operacao.com.br",
      observacao: "Motorista diurno operacional"
    },
    {
      id: "sal-10",
      nome: "José Marcos Neres de Sá",
      cargo: "Motorista",
      area: "salobo",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SAL-2010",
      telefone: "(94) 99201-0010",
      email: "jose.sa@operacao.com.br",
      observacao: "Motorista operacional"
    },
    {
      id: "sal-11",
      nome: "Pablo Passos Simplicio",
      cargo: "Ajudante de Motorista",
      area: "salobo",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SAL-2011",
      telefone: "(94) 99201-0011",
      email: "pablo.simplicio@operacao.com.br",
      observacao: "Ajudante de motorista diurno"
    },
    {
      id: "sal-12",
      nome: "Pedro Reis de Almeida",
      cargo: "SUP.Administrativo",
      area: "salobo",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SAL-2012",
      telefone: "(94) 99201-0012",
      email: "pedro.almeida@operacao.com.br",
      observacao: "Supervisor Administrativo e Operacional de Salobo"
    },
    {
      id: "sal-13",
      nome: "Odair José da Cruz Sousa",
      cargo: "Ajudante de Motorista",
      area: "salobo",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SAL-2013",
      telefone: "(94) 99201-0013",
      email: "odair.sousa@operacao.com.br",
      observacao: "Ajudante de motorista diurno"
    },
    {
      id: "sal-14",
      nome: "Francisco Jones dos Reis Lima",
      cargo: "Motorista",
      area: "salobo",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SAL-2014",
      telefone: "(94) 99201-0014",
      email: "francisco.lima@operacao.com.br",
      observacao: "Motorista operacional"
    },
    {
      id: "sal-15",
      nome: "Wenderson Magalhaes da Silva",
      cargo: "Ajudante de Motorista",
      area: "salobo",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SAL-2015",
      telefone: "(94) 99201-0015",
      email: "wenderson.silva@operacao.com.br",
      observacao: "Ajudante de motorista diurno"
    },
    {
      id: "sal-16",
      nome: "Nilson Silva de Oliveira",
      cargo: "Ajudante de Motorista",
      area: "salobo",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SAL-2016",
      telefone: "(94) 99201-0016",
      email: "nilson.oliveira@operacao.com.br",
      observacao: "Ajudante operacional"
    },
    {
      id: "sal-17",
      nome: "Mara Rhayanne Barros Silva",
      cargo: "Tec.Segurança",
      area: "salobo",
      situacao: "ADM",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: false,
      status: "ativo",
      turma3x3: null,
      matricula: "SAL-2017",
      telefone: "(94) 99201-0017",
      email: "mara.silva@operacao.com.br",
      observacao: "Técnica de Segurança do Trabalho de Salobo"
    },
    {
      id: "sal-18",
      nome: "Walleson Lopes da Conceição",
      cargo: "Motorista",
      area: "salobo",
      situacao: "ADM CARTEIRA MINA",
      regime: "ADM",
      turnoPadrao: "DIURNO",
      carteiraMina: true,
      status: "ativo",
      turma3x3: null,
      matricula: "SAL-2018",
      telefone: "(94) 99201-0018",
      email: "walleson.conceicao@operacao.com.br",
      observacao: "Motorista Habilitado com Carteira Mina"
    }
  ],

  // Caminhões Cadastrados (3 em Sossego, 4 em Salobo)
  caminhoes: [
    // Frota Sossego (3 Caminhões)
    {
      id: "cam-sos-01",
      numero: "01",
      placa: "SOS-1A01",
      modelo: "Mercedes-Benz Axor 2544 / Traçado",
      area: "sossego",
      motoristaId: "sos-09", // Nilton (Mina)
      ajudanteId: "sos-01",   // Denis
      status: "em_rota",
      destino: "Frente de Lavra Mina Sossego",
      observacao: "Caminhão de alta capacidade em rota de mineração"
    },
    {
      id: "cam-sos-02",
      numero: "02",
      placa: "SOS-2B02",
      modelo: "Volvo FMX 460 6x4",
      area: "sossego",
      motoristaId: "sos-10", // Reinaldo (Mina)
      ajudanteId: "sos-13",   // Murilo
      status: "em_rota",
      destino: "Britador Primário",
      observacao: "Escala 3x3 Ativa"
    },
    {
      id: "cam-sos-03",
      numero: "03",
      placa: "SOS-3C03",
      modelo: "Scania G440 XT Heavy Duty",
      area: "sossego",
      motoristaId: "sos-14", // Roniel (Mina)
      ajudanteId: "sos-03",   // Francisco Caio
      status: "disponivel",
      destino: "Pátio Central Sossego",
      observacao: "Pronto para carga e descarga"
    },

    // Frota Salobo (4 Caminhões)
    {
      id: "cam-sal-01",
      numero: "01",
      placa: "SAL-4D01",
      modelo: "Volvo FMX 500 8x4 Rígido",
      area: "salobo",
      motoristaId: "sal-04", // Italo Martins (Mina)
      ajudanteId: "sal-07",   // Jailson
      status: "em_rota",
      destino: "Mina Subterrânea / Rampa Norte",
      observacao: "Operação pesada Salobo"
    },
    {
      id: "cam-sal-02",
      numero: "02",
      placa: "SAL-5E02",
      modelo: "Mercedes-Benz Arocs 3351 6x4",
      area: "salobo",
      motoristaId: "sal-05", // Izaque Moraes (Mina)
      ajudanteId: "sal-02",   // Elnatan
      status: "em_rota",
      destino: "Usina de Beneficiamento",
      observacao: "Transporte de concentrado de cobre"
    },
    {
      id: "cam-sal-03",
      numero: "03",
      placa: "SAL-6F03",
      modelo: "Scania P360 Bitrem",
      area: "salobo",
      motoristaId: "sal-18", // Walleson (Mina)
      ajudanteId: "sal-11",   // Pablo
      status: "carregamento",
      destino: "Silo 02 - Depósito de Minério",
      observacao: "Aguardando liberação de balança"
    },
    {
      id: "cam-sal-04",
      numero: "04",
      placa: "SAL-7G04",
      modelo: "Volvo FMX 460 Tipper",
      area: "salobo",
      motoristaId: "sal-03", // Deusiano
      ajudanteId: "sal-08",   // Jheimeson
      status: "disponivel",
      destino: "Oficina Mecânica / Check de Pneus",
      observacao: "Checklist de segurança concluído 100%"
    }
  ],

  // Parâmetros de Ciclo de Turno e Escala
  configuracoesEscala: {
    // Data de referência do ciclo 3x3 (Turma A inicia trabalho de 3 dias, Turma B inicia folga de 3 dias)
    dataBaseCiclo3x3: "2026-09-01",
    cicloDiasTrabalho: 3,
    cicloDiasFolga: 3,
    horarios: {
      diurno: { inicio: "07:00", fim: "19:00", nome: "Turno Diurno (07h às 19h)" },
      noturno: { inicio: "19:00", fim: "07:00", nome: "Turno Noturno (19h às 07h)" },
      adm: { inicio: "07:30", fim: "17:18", nome: "Administrativo Comercial" }
    },
    // Ajustes pontuais ou exceções na escala (Data -> ColaboradorId -> Status)
    // Exemplos de status: "T" (Trabalho), "F" (Folga), "FE" (Férias), "AT" (Atestado), "TR" (Treinamento)
    excecoes: {}
  },

  // Administradores do Sistema com acesso ao Painel de Gestão
  administradores: [
    {
      id: "admin-narciso",
      nome: "Narciso Felizardo",
      email: "narcisofelizardo@gmail.com",
      senha: "admin", // Senha inicial de acesso
      nivel: "Super Admin",
      criadoEm: "2026-09-17T19:00:00.000Z"
    }
  ]
};

// Exporta para uso em navegadores e Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = INITIAL_DATA;
}
