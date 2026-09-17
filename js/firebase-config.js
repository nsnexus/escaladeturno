/**
 * FIREBASE CONFIG & ADAPTER
 * Gerencia a inicialização do Firebase e o estado de conexão.
 * Suporta modo Nuvem (Firestore Realtime) e modo Offline (LocalStorage) automático.
 */

const FirebaseService = (function () {
  const STORAGE_KEY = "escala_firebase_config";
  let db = null;
  let isConnected = false;
  let listeners = [];

  // Configuração padrão salva no LocalStorage ou vazia
  function getConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Erro ao ler config do Firebase:", e);
    }
    return {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: ""
    };
  }

  function saveConfig(config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  function hasValidConfig(cfg) {
    return !!(cfg && cfg.apiKey && cfg.projectId);
  }

  // Inicializa o Firebase caso configurado
  async function initFirebase() {
    const config = getConfig();
    if (!hasValidConfig(config)) {
      console.log("ℹ️ Firebase não configurado. Operando em Modo Local (Offline/LocalStorage).");
      notifyStatusChange(false, "Modo Local (Offline)");
      return false;
    }

    try {
      if (typeof firebase === "undefined") {
        console.warn("SDK do Firebase ainda não carregado.");
        notifyStatusChange(false, "SDK não carregado");
        return false;
      }

      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }
      db = firebase.firestore();
      
      // Habilita persistência offline do Firestore se disponível
      try {
        await db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
      } catch (e) {}

      isConnected = true;
      console.log("🚀 Firebase Firestore conectado com sucesso!");
      notifyStatusChange(true, "Conectado ao Firestore");
      return true;
    } catch (error) {
      console.error("Erro ao inicializar Firebase:", error);
      isConnected = false;
      notifyStatusChange(false, "Erro de Conexão: " + error.message);
      return false;
    }
  }

  function onStatusChange(callback) {
    listeners.push(callback);
    callback(isConnected, isConnected ? "Conectado ao Firestore" : "Modo Local (Offline)");
  }

  function notifyStatusChange(connected, message) {
    listeners.forEach((cb) => cb(connected, message));
  }

  return {
    getConfig,
    saveConfig,
    hasValidConfig,
    initFirebase,
    getDb: () => db,
    isConnected: () => isConnected,
    onStatusChange
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = FirebaseService;
}
