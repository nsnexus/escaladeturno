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

    let fbError = null;

    // 1. Tenta autenticar via Firebase Authentication Oficial
    if (typeof firebase !== "undefined" && firebase.auth) {
      try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(cleanEmail, cleanSenha);
        if (userCredential && userCredential.user) {
          const fbUser = userCredential.user;
          const sessionData = {
            id: fbUser.uid,
            nome: fbUser.displayName || cleanEmail.split("@")[0],
            email: fbUser.email,
            nivel: "Super Admin",
            origem: "firebase_auth",
            loginEm: new Date().toISOString()
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
          console.log("✓ Autenticado com sucesso via Firebase Authentication:", fbUser.email);
          return { success: true, user: sessionData };
        }
      } catch (err) {
        console.warn("Tentativa via Firebase Auth:", err.code, err.message);
        fbError = err;
      }
    }

    // 2. Tenta autenticar via Firestore (caso tenha cadastrado na coleção de administradores)
    const db = FirebaseService.getDb();
    if (db) {
      try {
        const docSnap = await db.collection("escala_operacional").doc("dados_gerais").get();
        if (docSnap.exists) {
          const d = docSnap.data();
          if (d.administradores && Array.isArray(d.administradores)) {
            const foundAdmin = d.administradores.find(
              (a) => a.email && a.email.toLowerCase() === cleanEmail && a.senha === cleanSenha
            );
            if (foundAdmin) {
              const sessionData = {
                id: foundAdmin.id,
                nome: foundAdmin.nome,
                email: foundAdmin.email,
                nivel: foundAdmin.nivel || "Administrador",
                origem: "firestore",
                loginEm: new Date().toISOString()
              };
              localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
              console.log("✓ Autenticado com sucesso via Firestore:", foundAdmin.email);
              return { success: true, user: sessionData };
            }
          }
        }
      } catch (e) {
        console.warn("Consulta a administradores no Firestore falhou:", e);
      }
    }

    // 3. Tenta autenticar via banco local (LocalStorage / Cache)
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
        origem: "local",
        loginEm: new Date().toISOString()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      console.log("✓ Autenticado com sucesso via banco local:", localUser.email);
      return { success: true, user: sessionData };
    }

    // 4. Credenciais de Emergência / Padrão Inicial
    if (cleanEmail === "narcisofelizardo@gmail.com" && cleanSenha === "admin") {
      const sessionData = {
        id: "admin-narciso",
        nome: "Narciso Felizardo",
        email: "narcisofelizardo@gmail.com",
        nivel: "Super Admin",
        origem: "default",
        loginEm: new Date().toISOString()
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      return { success: true, user: sessionData };
    }

    // Se falhou em tudo, monta mensagem de erro amigável
    let errorMsg = "E-mail ou senha incorretos.";
    if (fbError) {
      if (fbError.code === "auth/invalid-credential" || fbError.code === "auth/wrong-password") {
        errorMsg = "Senha incorreta. Verifique a senha cadastrada no Firebase.";
      } else if (fbError.code === "auth/user-not-found") {
        errorMsg = "Usuário não encontrado no Firebase Authentication.";
      } else if (fbError.code === "auth/operation-not-allowed") {
        errorMsg = "Provedor E-mail/Senha não está ativado no Firebase Console.";
      } else if (fbError.code === "auth/too-many-requests") {
        errorMsg = "Acesso bloqueado temporariamente por excesso de tentativas. Tente mais tarde.";
      }
    }

    return { success: false, error: errorMsg };
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

    // Se o colaborador estiver marcado globalmente em férias ou atestado
    if (colab.status === "ferias") return { status: "FE", turno: "FOLGA", detalhe: "Férias" };
    if (colab.status === "atestado") return { status: "AT", turno: "FOLGA", detalhe: "Atestado" };
    if (colab.status === "folga") return { status: "F", turno: "FOLGA", detalhe: "Folga Programada" };

    // Verifica exceção cadastrada para essa data específica
    const excecoes = data.configuracoesEscala?.excecoes || {};
    if (excecoes[dataIso] && excecoes[dataIso][colaboradorId]) {
      const exc = excecoes[dataIso][colaboradorId];
      if (exc === "T") return { status: "T", turno: colab.turnoPadrao || "DIURNO", detalhe: "Trabalho (Ajuste)" };
      if (exc === "F") return { status: "F", turno: "FOLGA", detalhe: "Folga (Ajuste)" };
      if (exc === "FE") return { status: "FE", turno: "FOLGA", detalhe: "Férias" };
      if (exc === "AT") return { status: "AT", turno: "FOLGA", detalhe: "Atestado" };
      if (exc === "TR") return { status: "TR", turno: "DIURNO", detalhe: "Treinamento" };
    }

    // Regra Especial para Encarregado / Responsável Geral (não entra em escala, mas trabalha dias úteis e plantão)
    if (colab.regime === "ESPECIAL" || colab.cargo.toLowerCase().includes("encarregado")) {
      const d = new Date(dataIso + "T12:00:00");
      const diaSemana = d.getDay(); // 0 domingo, 6 sabado
      if (diaSemana === 0) return { status: "F", turno: "FOLGA", detalhe: "Descanso Semanal" };
      return { status: "T", turno: "GERAL", detalhe: "Supervisão Operacional" };
    }

    // Regra ADM (Segunda a Sexta)
    if (colab.regime === "ADM" || colab.situacao.includes("ADM")) {
      const d = new Date(dataIso + "T12:00:00");
      const diaSemana = d.getDay();
      if (diaSemana === 0 || diaSemana === 6) {
        return { status: "F", turno: "FOLGA", detalhe: "Folga Fim de Semana" };
      }
      return { status: "T", turno: "ADM", detalhe: "Expediente Administrativo (07:30 - 17:18)" };
    }

    // Regra Ciclo 3x3 (3 dias de trabalho x 3 dias de folga)
    const dataBaseStr = data.configuracoesEscala?.dataBaseCiclo3x3 || "2026-09-01";
    const dataBase = new Date(dataBaseStr + "T00:00:00");
    const dataAlvo = new Date(dataIso + "T00:00:00");

    const diffTime = dataAlvo.getTime() - dataBase.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Ciclo completo = 6 dias (3 trabalho + 3 folga)
    const cicloPos = ((diffDays % 6) + 6) % 6; // 0, 1, 2 = Trabalho Turma A (Folga Turma B); 3, 4, 5 = Folga Turma A (Trabalho Turma B)

    const isTurmaA = (colab.turma3x3 || "A") === "A";
    const trabalhandoHoje = isTurmaA ? cicloPos < 3 : cicloPos >= 3;
    const diaNoCiclo = isTurmaA ? (cicloPos < 3 ? cicloPos + 1 : cicloPos - 2) : (cicloPos >= 3 ? cicloPos - 2 : cicloPos + 1);

    const turno = colab.turnoPadrao || (colab.situacao.includes("NOTURNO") ? "NOTURNO" : "DIURNO");

    if (trabalhandoHoje) {
      return {
        status: "T",
        turno: turno,
        detalhe: `Trabalho (${diaNoCiclo}º dia de 3) - ${turno}`
      };
    } else {
      return {
        status: "F",
        turno: "FOLGA",
        detalhe: `Folga (${diaNoCiclo}º dia de 3)`
      };
    }
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
    logout
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = StorageService;
}
