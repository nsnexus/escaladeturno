/**
 * FIREBASE CONFIG & ADAPTER
 * Gerencia a inicialização do Firebase e o estado de conexão.
 * Suporta modo Nuvem (Firestore Realtime) e modo Offline (LocalStorage) automático.
 */

const FirebaseService = (function () {
  const STORAGE_KEY = "escala_firebase_config";
  let db = null;
  let auth = null;
  let isConnected = false;
  let listeners = [];

  // Configuração oficial do projeto Firebase fornecido pelo usuário
  const DEFAULT_CONFIG = {
    apiKey: "AIzaSyDxAkfhd4eb5bHPhnWjcX0Gi1_gaLQXJSg",
    authDomain: "escala-4e21c.firebaseapp.com",
    projectId: "escala-4e21c",
    storageBucket: "escala-4e21c.firebasestorage.app",
    messagingSenderId: "1032700627575",
    appId: "1:1032700627575:web:ab747a43ab4973b5171472",
    measurementId: "G-4C4H3M2C28"
  };

  // Configuração salva no LocalStorage ou padrão
  function getConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Erro ao ler config do Firebase:", e);
    }
    return DEFAULT_CONFIG;
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

      if (firebase.auth) {
        auth = firebase.auth();
        console.log("🔐 Firebase Authentication conectado com sucesso!");
      }
      
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

  // Auto-inicialização imediata
  if (typeof window !== "undefined") {
    if (typeof firebase !== "undefined") {
      initFirebase();
    } else {
      window.addEventListener("DOMContentLoaded", () => initFirebase());
    }
  }

  return {
    getConfig,
    saveConfig,
    hasValidConfig,
    initFirebase,
    getDb: () => db,
    getAuth: () => auth,
    isConnected: () => isConnected,
    onStatusChange
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = FirebaseService;
}
