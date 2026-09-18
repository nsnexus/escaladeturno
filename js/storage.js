/**
 * STORAGE SERVICE - CAMADA DE DADOS UNIFICADA
 * Sincroniza estado em tempo real entre LocalStorage e Firebase Firestore.
 */

const StorageService = (function () {
  const LOCAL_STORAGE_KEY = "escala_turno_dados_v1";
  const FIRESTORE_COLLECTION = "escala_operacional";
  const FIRESTORE_DOC_ID = "dados_gerais";

  let currentData = null;
  let subscribers = [];
  let isListeningFirestore = false;

  // Carrega dados iniciais ou do cache local
  function init() {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        currentData = JSON.parse(cached);
        // Garante que o array de administradores existe mesmo se o cache for anterior
        if (!currentData.administradores || currentData.administradores.length === 0) {
          currentData.administradores = JSON.parse(JSON.stringify(INITIAL_DATA.administradores || []));
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentData));
        }
        // Garante que o array de escalas extras existe
        if (!currentData.escalasExtras || !Array.isArray(currentData.escalasExtras)) {
          currentData.escalasExtras = [];
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentData));
        }
      } else {
        currentData = JSON.parse(JSON.stringify(INITIAL_DATA));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentData));
      }
    } catch (err) {
      console.error("Erro ao carregar dados do LocalStorage:", err);
      currentData = JSON.parse(JSON.stringify(INITIAL_DATA));
    }

    // Escuta alterações de outras abas via Storage Event
    window.addEventListener("storage", (e) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        try {
          currentData = JSON.parse(e.newValue);
          notifySubscribers();
        } catch (err) {}
      }
    });

    // Tenta conectar ao Firebase se disponível
    setupFirebaseListener();
    return currentData;
  }

  // Configura sincronização em tempo real com o Firestore
  function setupFirebaseListener() {
    if (isListeningFirestore) return;
    const db = FirebaseService.getDb();
    if (!db) return;

    try {
      db.collection(FIRESTORE_COLLECTION)
        .doc(FIRESTORE_DOC_ID)
        .onSnapshot(
          (doc) => {
            if (doc.exists) {
              const remoteData = doc.data();
              if (remoteData && remoteData.colaboradores) {
                console.log("☁️ Dados recebidos do Firebase Firestore em tempo real!");
                currentData = remoteData;
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentData));
                notifySubscribers();
              }
            } else {
              // Se documento ainda não existe na nuvem, salva o atual lá
              console.log("☁️ Inicializando documento no Firebase Firestore...");
              saveToFirestore(currentData);
            }
          },
          (err) => {
            console.warn("Erro no listener do Firestore:", err);
          }
        );
      isListeningFirestore = true;
    } catch (e) {
      console.warn("Falha ao configurar listener do Firestore:", e);
    }
  }

  async function saveToFirestore(data) {
    const db = FirebaseService.getDb();
    if (!db) return;
    try {
      await db.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOC_ID).set({
        ...data,
        ultimaAtualizacao: new Date().toISOString()
      });
      console.log("☁️ Sincronizado com o Firestore!");
    } catch (err) {
      console.error("Erro ao salvar no Firestore:", err);
    }
  }

  // Salva os dados no LocalStorage e no Firestore
  function persist() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentData));
      window.dispatchEvent(new CustomEvent("escala:data_updated", { detail: currentData }));
      notifySubscribers();
      saveToFirestore(currentData);
    } catch (err) {
      console.error("Erro ao persistir dados:", err);
    }
  }

  function notifySubscribers() {
    subscribers.forEach((fn) => {
      try {
        fn(currentData);
      } catch (err) {
        console.error("Erro no subscriber:", err);
      }
    });
  }

  function subscribe(fn) {
    subscribers.push(fn);
    if (currentData) fn(currentData);
    return () => {
      subscribers = subscribers.filter((s) => s !== fn);
    };
  }

  // MÉTODOS DE ACESSO E MANIPULAÇÃO

  function getData() {
    if (!currentData) init();
    return currentData;
  }

  function getColaboradores(filtroArea = "todas") {
    const data = getData();
    if (!data.colaboradores) return [];
    if (filtroArea === "todas" || !filtroArea) return data.colaboradores;
    return data.colaboradores.filter((c) => c.area === filtroArea);
  }

  function getColaboradorById(id) {
    const data = getData();
    return data.colaboradores.find((c) => c.id === id) || null;
  }

  function saveColaborador(colaborador) {
    const data = getData();
    if (!colaborador.id) {
      colaborador.id = "colab-" + Date.now();
    }
    const index = data.colaboradores.findIndex((c) => c.id === colaborador.id);
    if (index >= 0) {
      data.colaboradores[index] = { ...data.colaboradores[index], ...colaborador };
    } else {
      data.colaboradores.push(colaborador);
    }
    persist();
    return colaborador;
  }

  function deleteColaborador(id) {
    const data = getData();
    data.colaboradores = data.colaboradores.filter((c) => c.id !== id);
    // Remove também de qualquer caminhão associado
    data.caminhoes.forEach((cam) => {
      if (cam.motoristaId === id) cam.motoristaId = null;
      if (cam.ajudanteId === id) cam.ajudanteId = null;
    });
    persist();
  }

  function getCaminhoes(filtroArea = "todas") {
    const data = getData();
    if (!data.caminhoes) return [];
    if (filtroArea === "todas" || !filtroArea) return data.caminhoes;
    return data.caminhoes.filter((c) => c.area === filtroArea);
  }

  function saveCaminhao(caminhao) {
    const data = getData();
    if (!caminhao.id) {
      caminhao.id = "cam-" + Date.now();
    }
    const index = data.caminhoes.findIndex((c) => c.id === caminhao.id);
    if (index >= 0) {
      data.caminhoes[index] = { ...data.caminhoes[index], ...caminhao };
    } else {
      data.caminhoes.push(caminhao);
    }
    persist();
    return caminhao;
  }

  function deleteCaminhao(id) {
    const data = getData();
    data.caminhoes = data.caminhoes.filter((c) => c.id !== id);
    persist();
  }

  function getConfiguracoes() {
    const data = getData();
    return data.configuracoesEscala || INITIAL_DATA.configuracoesEscala;
  }

  function saveConfiguracoes(config) {
    const data = getData();
    data.configuracoesEscala = { ...data.configuracoesEscala, ...config };
    persist();
  }

  // Define status de um dia específico para um colaborador (exceção à regra matemática)
  // status: "T" (Trabalho), "F" (Folga), "FE" (Férias), "AT" (Atestado), "TR" (Treinamento), "" (Limpar exceção)
  function setExcecaoDia(colaboradorId, dataIso, status) {
    const data = getData();
    if (!data.configuracoesEscala.excecoes) {
      data.configuracoesEscala.excecoes = {};
    }
    if (!data.configuracoesEscala.excecoes[dataIso]) {
      data.configuracoesEscala.excecoes[dataIso] = {};
    }

    if (!status || status === "AUTO") {
      delete data.configuracoesEscala.excecoes[dataIso][colaboradorId];
      if (Object.keys(data.configuracoesEscala.excecoes[dataIso]).length === 0) {
        delete data.configuracoesEscala.excecoes[dataIso];
      }
    } else {
      data.configuracoesEscala.excecoes[dataIso][colaboradorId] = status;
    }
    persist();
  }

  // Permuta de turno (Swap) entre dois colaboradores para uma data
  function swapEscala(idA, idB, dataIso) {
    const statusA = calcularStatusDia(idA, dataIso);
    const statusB = calcularStatusDia(idB, dataIso);
    setExcecaoDia(idA, dataIso, statusB);
    setExcecaoDia(idB, dataIso, statusA);
  }

  // Restaura os dados para a planilha original
  function resetToOriginal() {
    currentData = JSON.parse(JSON.stringify(INITIAL_DATA));
    persist();
    return currentData;
  }

  // Exportar Backup
  function exportBackupJSON() {
    const jsonStr = JSON.stringify(getData(), null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_escala_turno_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Importar Backup
  function importBackupJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.colaboradores && Array.isArray(parsed.colaboradores)) {
        currentData = parsed;
        persist();
        return true;
      }
      throw new Error("Formato inválido do arquivo de backup.");
    } catch (err) {
      console.error("Erro ao importar JSON:", err);
      throw err;
    }
  }

  // ==========================================================================
  // GESTÃO DE ESCALAS EXTRAS & HORAS EXTRAS (EXTRA ROTINA)
  // ==========================================================================

  function getEscalasExtras(filtros = {}) {
    const data = getData();
    let extras = Array.isArray(data.escalasExtras) ? [...data.escalasExtras] : [];

    if (filtros.mesAno) {
      extras = extras.filter(e => e.data && e.data.startsWith(filtros.mesAno));
    }
    if (filtros.area && filtros.area !== "todas") {
      extras = extras.filter(e => e.area === filtros.area);
    }
    if (filtros.colaboradorId) {
      extras = extras.filter(e => e.colaboradorId === filtros.colaboradorId);
    }
    if (filtros.tipo && filtros.tipo !== "todas") {
      extras = extras.filter(e => e.tipo === filtros.tipo);
    }
    if (filtros.data) {
      extras = extras.filter(e => e.data === filtros.data);
    }

    return extras.sort((a, b) => (b.data || "").localeCompare(a.data || "") || (b.criadoEm || "").localeCompare(a.criadoEm || ""));
  }

  function getEscalaExtraById(id) {
    const data = getData();
    return (data.escalasExtras || []).find(e => e.id === id) || null;
  }

  function calcularDiferencaHoras(inicioStr, fimStr) {
    if (!inicioStr || !fimStr) return 0;
    const [h1, m1] = inicioStr.split(":").map(Number);
    const [h2, m2] = fimStr.split(":").map(Number);
    let min1 = h1 * 60 + (m1 || 0);
    let min2 = h2 * 60 + (m2 || 0);
    if (min2 <= min1) {
      min2 += 24 * 60; // Cruzou a meia-noite
    }
    const diff = (min2 - min1) / 60;
    return parseFloat(diff.toFixed(1));
  }

  function saveEscalaExtraLote(dadosGerais, colaboradoresIds) {
    const data = getData();
    if (!data.escalasExtras) data.escalasExtras = [];

    if (!Array.isArray(colaboradoresIds) || colaboradoresIds.length === 0) {
      throw new Error("Selecione pelo menos um colaborador para a convocação.");
    }

    let horas = parseFloat(dadosGerais.totalHoras);
    if (isNaN(horas) || horas <= 0) {
      if (dadosGerais.horaInicio && dadosGerais.horaFim) {
        horas = calcularDiferencaHoras(dadosGerais.horaInicio, dadosGerais.horaFim);
      } else {
        horas = 4.0;
      }
    }

    const criados = [];
    const agoraIso = new Date().toISOString();

    colaboradoresIds.forEach(colabId => {
      const colab = getColaboradorById(colabId);
      if (!colab) return;

      const novoItem = {
        id: "extra-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
        colaboradorId: colab.id,
        colaboradorNome: colab.nome,
        colaboradorCargo: colab.cargo,
        area: colab.area,
        data: dadosGerais.data,
        tipo: dadosGerais.tipo || "prorrogacao",
        horaInicio: dadosGerais.horaInicio || "19:00",
        horaFim: dadosGerais.horaFim || "23:00",
        totalHoras: horas,
        motivo: dadosGerais.motivo || "Extra rotina operacional",
        frente: dadosGerais.frente || (colab.area === "salobo" ? "Usina Salobo" : "Mina Sossego"),
        criadoPor: dadosGerais.criadoPor || "Gestão Operacional",
        criadoEm: agoraIso,
        status: "agendada"
      };

      data.escalasExtras.push(novoItem);
      criados.push(novoItem);
    });

    persist();
    return criados;
  }

  function deleteEscalaExtra(id) {
    const data = getData();
    if (!data.escalasExtras) return false;
    const initialLen = data.escalasExtras.length;
    data.escalasExtras = data.escalasExtras.filter(e => e.id !== id);
    if (data.escalasExtras.length !== initialLen) {
      persist();
      return true;
    }
    return false;
  }

  function calcularDashboardHorasExtras(filtros = {}) {
    const extras = getEscalasExtras(filtros);

    let totalHoras = 0;
    let totalConvocoes = extras.length;
    let horasSossego = 0;
    let horasSalobo = 0;

    const colabMap = {};

    extras.forEach(e => {
      const h = parseFloat(e.totalHoras) || 0;
      totalHoras += h;

      if (e.area === "salobo") {
        horasSalobo += h;
      } else {
        horasSossego += h;
      }

      if (!colabMap[e.colaboradorId]) {
        colabMap[e.colaboradorId] = {
          id: e.colaboradorId,
          nome: e.colaboradorNome,
          cargo: e.colaboradorCargo,
          area: e.area,
          totalHoras: 0,
          totalConvocoes: 0,
          registros: []
        };
      }
      colabMap[e.colaboradorId].totalHoras += h;
      colabMap[e.colaboradorId].totalConvocoes += 1;
      colabMap[e.colaboradorId].registros.push(e);
    });

    const colaboradoresAcionados = Object.keys(colabMap).length;
    const mediaHorasPorColab = colaboradoresAcionados > 0 
      ? parseFloat((totalHoras / colaboradoresAcionados).toFixed(1)) 
      : 0;

    const ranking = Object.values(colabMap).sort((a, b) => b.totalHoras - a.totalHoras);

    return {
      totalHoras: parseFloat(totalHoras.toFixed(1)),
      totalConvocoes,
      colaboradoresAcionados,
      mediaHorasPorColab,
      horasSossego: parseFloat(horasSossego.toFixed(1)),
      horasSalobo: parseFloat(horasSalobo.toFixed(1)),
      ranking,
      registros: extras
    };
  }

  // GESTÃO DE ADMINISTRADORES & AUTENTICAÇÃO
  const SESSION_KEY = "escala_admin_session";

  function getAdministradores() {
    const data = getData();
    if (!data.administradores || data.administradores.length === 0) {
      data.administradores = JSON.parse(JSON.stringify(INITIAL_DATA.administradores || []));
    }
    return data.administradores;
  }

  function saveAdministrador(admin) {
    const data = getData();
    if (!data.administradores) data.administradores = [];
    if (!admin.id) admin.id = "admin-" + Date.now();
    
    const index = data.administradores.findIndex(
      (a) => a.id === admin.id || (a.email && a.email.toLowerCase() === (admin.email || "").toLowerCase())
    );

    if (index >= 0) {
      data.administradores[index] = { ...data.administradores[index], ...admin };
    } else {
      admin.criadoEm = new Date().toISOString();
      data.administradores.push(admin);
    }
    persist();
    return admin;
  }

  function deleteAdministrador(id) {
    const data = getData();
    if (!data.administradores) return;
    if (data.administradores.length <= 1) {
      throw new Error("Não é permitido excluir o único administrador do sistema.");
    }
    data.administradores = data.administradores.filter((a) => a.id !== id);
    persist();
  }

  async function autenticarAdmin(email, senha) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanSenha = (senha || "").trim();

    if (!cleanEmail || !cleanSenha) {
      return { success: false, error: "Informe o e-mail e a senha." };
    }

    // 1. CHECAGEM DIRETA DE CREDENCIAIS MESTRE (Zero falhas / Offline e Online)
    if (cleanEmail === "narcisofelizardo@gmail.com" && (cleanSenha === "Filipe@18122026" || cleanSenha === "admin")) {
      const sessionData = {
        id: "wwrCCeniTMXOmRQtSNMINFmD81A3",
        nome: "Narciso Felizardo",
        email: "narcisofelizardo@gmail.com",
        nivel: "Super Admin",
        origem: "master",
        loginEm: new Date().toISOString()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      
      // Sincroniza SDK se presente
      if (typeof firebase !== "undefined" && firebase.auth) {
        firebase.auth().signInWithEmailAndPassword(cleanEmail, cleanSenha).catch(() => {});
      }
      return { success: true, user: sessionData };
    }

    // 2. TENTA VIA REST API DIRETA DO GOOGLE IDENTITY TOOLKIT (Robusto em qualquer browser)
    const cfg = FirebaseService.getConfig();
    if (cfg && cfg.apiKey) {
      try {
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${cfg.apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password: cleanSenha,
            returnSecureToken: true
          })
        });

        const authResult = await response.json();
        if (response.ok && authResult.idToken) {
          const sessionData = {
            id: authResult.localId,
            nome: authResult.displayName || cleanEmail.split("@")[0],
            email: authResult.email,
            token: authResult.idToken,
            nivel: "Super Admin",
            origem: "firebase_auth_rest",
            loginEm: new Date().toISOString()
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

          // Sincroniza SDK se presente
          if (typeof firebase !== "undefined" && firebase.auth) {
            firebase.auth().signInWithEmailAndPassword(cleanEmail, cleanSenha).catch(() => {});
          }
          return { success: true, user: sessionData };
        }
      } catch (restErr) {
        console.warn("REST Identity Toolkit falhou, tentando fallback local:", restErr);
      }
    }

    // 3. TENTA VIA SDK OFICIAL DO FIREBASE AUTH
    if (typeof firebase !== "undefined" && firebase.auth) {
      try {
        if (!firebase.apps || !firebase.apps.length) {
          firebase.initializeApp(cfg);
        }
        const userCredential = await firebase.auth().signInWithEmailAndPassword(cleanEmail, cleanSenha);
        if (userCredential && userCredential.user) {
          const fbUser = userCredential.user;
          const sessionData = {
            id: fbUser.uid,
            nome: fbUser.displayName || cleanEmail.split("@")[0],
            email: fbUser.email,
            nivel: "Super Admin",
            origem: "firebase_auth_sdk",
            loginEm: new Date().toISOString()
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
          return { success: true, user: sessionData };
        }
      } catch (sdkErr) {
        console.warn("Tentativa SDK Firebase Auth:", sdkErr.code, sdkErr.message);
      }
    }

    // 4. BANCO DE ADMINISTRADORES (FIRESTORE OU LOCAL)
    const admins = getAdministradores();
    const localUser = admins.find(
      (a) => a.email && a.email.toLowerCase() === cleanEmail && a.senha === cleanSenha
    );

    if (localUser) {
      const sessionData = {
        id: localUser.id,
        nome: localUser.nome,
        email: localUser.email,
        nivel: localUser.nivel || "Administrador",
        origem: "banco_dados",
        loginEm: new Date().toISOString()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      return { success: true, user: sessionData };
    }

    return { success: false, error: "E-mail ou senha incorretos." };
  }

  function getUsuarioLogado() {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (s) return JSON.parse(s);
    } catch (e) {}
    return null;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    if (typeof firebase !== "undefined" && firebase.auth) {
      firebase.auth().signOut().catch(() => {});
    }
  }

  // CALCULO DE ESCALA MATEMÁTICO (3X3 e ADM)
  // Retorna { status: 'T'|'F'|'FE'|'AT'|'TR', turno: 'DIURNO'|'NOTURNO'|'ADM'|'FOLGA', detalhe: string }
  function calcularStatusDia(colaboradorId, dataIso) {
    const data = getData();
    const colab = getColaboradorById(colaboradorId);
    if (!colab) return { status: "F", turno: "FOLGA", detalhe: "Desconhecido" };

    let res = null;

    // Se o colaborador estiver marcado globalmente em férias ou atestado
    if (colab.status === "ferias") res = { status: "FE", turno: "FOLGA", detalhe: "Férias" };
    else if (colab.status === "atestado") res = { status: "AT", turno: "FOLGA", detalhe: "Atestado" };
    else if (colab.status === "folga") res = { status: "F", turno: "FOLGA", detalhe: "Folga Programada" };
    else {
      // Verifica exceção cadastrada para essa data específica
      const excecoes = data.configuracoesEscala?.excecoes || {};
      if (excecoes[dataIso] && excecoes[dataIso][colaboradorId]) {
        const exc = excecoes[dataIso][colaboradorId];
        if (exc === "T") res = { status: "T", turno: colab.turnoPadrao || "DIURNO", detalhe: "Trabalho (Ajuste)" };
        else if (exc === "F") res = { status: "F", turno: "FOLGA", detalhe: "Folga (Ajuste)" };
        else if (exc === "FE") res = { status: "FE", turno: "FOLGA", detalhe: "Férias" };
        else if (exc === "AT") res = { status: "AT", turno: "FOLGA", detalhe: "Atestado" };
        else if (exc === "TR") res = { status: "TR", turno: "DIURNO", detalhe: "Treinamento" };
      }

      if (!res) {
        // Regra Especial para Encarregado / Responsável Geral (não entra em escala, mas trabalha dias úteis e plantão)
        if (colab.regime === "ESPECIAL" || colab.cargo.toLowerCase().includes("encarregado")) {
          const d = new Date(dataIso + "T12:00:00");
          const diaSemana = d.getDay(); // 0 domingo, 6 sabado
          if (diaSemana === 0) res = { status: "F", turno: "FOLGA", detalhe: "Descanso Semanal" };
          else res = { status: "T", turno: "GERAL", detalhe: "Supervisão Operacional" };
        } else if (colab.regime === "ADM" || colab.situacao.includes("ADM")) {
          // Regra ADM (Segunda a Sexta)
          const d = new Date(dataIso + "T12:00:00");
          const diaSemana = d.getDay();
          if (diaSemana === 0 || diaSemana === 6) {
            res = { status: "F", turno: "FOLGA", detalhe: "Folga Fim de Semana" };
          } else {
            res = { status: "T", turno: "ADM", detalhe: "Expediente Administrativo (07:30 - 17:18)" };
          }
        } else {
          // Regra Ciclo 3x3 (3 dias de trabalho x 3 dias de folga)
          const dataBaseStr = data.configuracoesEscala?.dataBaseCiclo3x3 || "2026-09-01";
          const dataBase = new Date(dataBaseStr + "T00:00:00");
          const dataAlvo = new Date(dataIso + "T00:00:00");

          const diffTime = dataAlvo.getTime() - dataBase.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          // Ciclo completo = 6 dias (3 trabalho + 3 folga)
          const cicloPos = ((diffDays % 6) + 6) % 6;

          const isTurmaA = (colab.turma3x3 || "A") === "A";
          const trabalhandoHoje = isTurmaA ? cicloPos < 3 : cicloPos >= 3;
          const diaNoCiclo = isTurmaA ? (cicloPos < 3 ? cicloPos + 1 : cicloPos - 2) : (cicloPos >= 3 ? cicloPos - 2 : cicloPos + 1);

          const turno = colab.turnoPadrao || (colab.situacao.includes("NOTURNO") ? "NOTURNO" : "DIURNO");

          if (trabalhandoHoje) {
            res = {
              status: "T",
              turno: turno,
              detalhe: `Trabalho (${diaNoCiclo}º dia de 3) - ${turno}`
            };
          } else {
            res = {
              status: "F",
              turno: "FOLGA",
              detalhe: `Folga (${diaNoCiclo}º dia de 3)`
            };
          }
        }
      }
    }

    // ========================================================================
    // CHECAGEM DE ESCALA EXTRA / HORA EXTRA CADASTRADA NESTA DATA
    // ========================================================================
    const extras = (data.escalasExtras || []).filter(
      (e) => e.colaboradorId === colaboradorId && e.data === dataIso && e.status !== "cancelada"
    );

    if (extras.length > 0) {
      const extra = extras[0];
      res.temExtra = true;
      res.escalaExtra = extra;
      res.escalasExtras = extras;

      const tipoNomes = {
        prorrogacao: "Prorrogação de Jornada",
        folga: "Convocado na Folga",
        feriado: "Plantão Feriado",
        especial: "Operação Especial"
      };
      const tipoNome = tipoNomes[extra.tipo] || "Escala Extra";

      if (extra.tipo === "folga" && res.status === "F") {
        res.detalheFolgaOriginal = res.detalhe;
        res.detalhe = `⚡ ${tipoNome} (${extra.horaInicio} às ${extra.horaFim} • +${extra.totalHoras}h)`;
      } else {
        res.detalhe += ` • ⚡ Extra: ${extra.horaInicio}-${extra.horaFim} (+${extra.totalHoras}h)`;
      }
    }

    return res;
  }

  // Inicializa imediatamente
  init();

  return {
    init,
    getData,
    persist,
    subscribe,
    setupFirebaseListener,
    getColaboradores,
    getColaboradorById,
    saveColaborador,
    deleteColaborador,
    getCaminhoes,
    saveCaminhao,
    deleteCaminhao,
    getConfiguracoes,
    saveConfiguracoes,
    setExcecaoDia,
    swapEscala,
    calcularStatusDia,
    resetToOriginal,
    exportBackupJSON,
    importBackupJSON,
    getAdministradores,
    saveAdministrador,
    deleteAdministrador,
    autenticarAdmin,
    getUsuarioLogado,
    logout,
    getEscalasExtras,
    getEscalaExtraById,
    saveEscalaExtraLote,
    deleteEscalaExtra,
    calcularDiferencaHoras,
    calcularDashboardHorasExtras
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = StorageService;
}
