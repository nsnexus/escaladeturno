/**
 * ADMIN.JS - CONTROLADOR DO PAINEL ADMINISTRATIVO
 * Gerencia o CRUD de colaboradores, alocação de caminhões, ajuste de escalas e Firebase.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Estado local do admin
  let adminAreaFilter = "todas";
  let adminSearchQuery = "";

  // Elementos da Sidebar e Abas
  const navItems = document.querySelectorAll(".admin-nav-item");
  const tabPanes = document.querySelectorAll(".admin-tab-pane");

  // Elementos do Efetivo
  const adminColabTableBody = document.getElementById("adminColaboradoresTableBody");
  const adminSearchInput = document.getElementById("adminSearchInput");
  const adminAreaTabs = document.querySelectorAll("[data-admin-area]");
  const btnNovoColab = document.getElementById("btnNovoColaborador");
  const btnExportCsv = document.getElementById("btnExportCsv");

  // Modal Colaborador
  const modalColab = document.getElementById("modalColaborador");
  const formColab = document.getElementById("formColaborador");
  const btnCloseModalColab = document.getElementById("btnCloseModalColab");
  const btnCancelModalColab = document.getElementById("btnCancelModalColab");
  const modalColabTitulo = document.getElementById("modalColaboradorTitulo");

  // Elementos de Caminhões
  const adminTrucksGrid = document.getElementById("adminTrucksGrid");
  const btnNovoCam = document.getElementById("btnNovoCaminhao");
  const modalCam = document.getElementById("modalCaminhao");
  const formCam = document.getElementById("formCaminhao");
  const btnCloseModalCam = document.getElementById("btnCloseModalCam");
  const btnCancelModalCam = document.getElementById("btnCancelModalCam");
  const modalCamTitulo = document.getElementById("modalCaminhaoTitulo");

  // Elementos de Ajuste de Escala
  const swapColab1 = document.getElementById("swapColab1");
  const swapColab2 = document.getElementById("swapColab2");
  const swapDate = document.getElementById("swapDate");
  const btnExecuteSwap = document.getElementById("btnExecuteSwap");

  const exceptionColab = document.getElementById("exceptionColab");
  const exceptionDate = document.getElementById("exceptionDate");
  const exceptionStatus = document.getElementById("exceptionStatus");
  const btnApplyException = document.getElementById("btnApplyException");

  const cycleBaseDate = document.getElementById("cycleBaseDate");
  const btnSaveCycleConfig = document.getElementById("btnSaveCycleConfig");

  // Elementos do Firebase
  const firebaseConfigForm = document.getElementById("firebaseConfigForm");
  const fbApiKey = document.getElementById("fbApiKey");
  const fbAuthDomain = document.getElementById("fbAuthDomain");
  const fbProjectId = document.getElementById("fbProjectId");
  const fbStorageBucket = document.getElementById("fbStorageBucket");
  const fbMessagingSenderId = document.getElementById("fbMessagingSenderId");
  const fbAppId = document.getElementById("fbAppId");
  const btnSyncToCloud = document.getElementById("btnSyncToCloud");
  const firebaseStatusIndicator = document.getElementById("firebaseStatusIndicator");
  const footerStatusBadge = document.getElementById("footerStatusBadge");

  // Backup e Restauração
  const btnExportBackup = document.getElementById("btnExportBackup");
  const btnImportBackup = document.getElementById("btnImportBackup");
  const backupFileInput = document.getElementById("backupFileInput");
  const btnResetOriginal = document.getElementById("btnResetOriginal");

  // Badges da Sidebar
  const navBadgeEfetivo = document.getElementById("navBadgeEfetivo");
  const navBadgeCaminhoes = document.getElementById("navBadgeCaminhoes");

  // 1. NAVEGAÇÃO ENTRE ABAS
  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabTarget = btn.getAttribute("data-tab");
      navItems.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPane = document.getElementById(tabTarget);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // 2. GESTÃO DE EFETIVO (TABELA & FILTROS)
  function renderColaboradoresTable() {
    if (!adminColabTableBody) return;
    const colabs = StorageService.getColaboradores(adminAreaFilter);
    const query = adminSearchQuery.toLowerCase().trim();

    const filtered = colabs.filter((c) => {
      if (!query) return true;
      return (
        c.nome.toLowerCase().includes(query) ||
        c.cargo.toLowerCase().includes(query) ||
        (c.matricula && c.matricula.toLowerCase().includes(query)) ||
        c.situacao.toLowerCase().includes(query)
      );
    });

    if (navBadgeEfetivo) navBadgeEfetivo.textContent = StorageService.getColaboradores("todas").length;

    if (filtered.length === 0) {
      adminColabTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:30px; color:var(--text-dim);">
            Nenhum colaborador encontrado com os filtros atuais.
          </td>
        </tr>
      `;
      return;
    }

    adminColabTableBody.innerHTML = filtered
      .map((c) => {
        const isSalobo = c.area === "salobo";
        const initials = c.nome.split(" ").slice(0, 2).map((n) => n[0]).join("");

        const statusClasses = {
          ativo: "tag-trabalho",
          folga: "tag-folga",
          ferias: "tag-ferias",
          atestado: "tag-atestado"
        };

        const statusNames = {
          ativo: "Ativo",
          folga: "Em Folga",
          ferias: "Em Férias",
          atestado: "Atestado"
        };

        return `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:10px;">
                <div class="avatar-badge ${isSalobo ? 'salobo' : ''}">${initials}</div>
                <div>
                  <div style="font-weight:600; color:var(--text-main);">${c.nome}</div>
                  <div style="font-size:0.72rem; color:var(--text-dim);">${c.matricula || "SEM MATRÍCULA"}</div>
                </div>
              </div>
            </td>
            <td>
              <div style="color:var(--text-main);">${c.cargo}</div>
              <div style="font-size:0.72rem; color:var(--text-dim);">${c.observacao || ""}</div>
            </td>
            <td>
              <span style="font-weight:600; color:${isSalobo ? 'var(--emerald-neon)' : 'var(--cyan-neon)'}">
                ${isSalobo ? 'Salobo (4 Cam)' : 'Sossego (3 Cam)'}
              </span>
            </td>
            <td>
              <div style="font-weight:600;">${c.situacao}</div>
              <div style="font-size:0.72rem; color:var(--text-dim);">
                ${c.regime} ${c.turma3x3 ? `• Turma ${c.turma3x3}` : ''}
              </div>
            </td>
            <td>
              ${c.carteiraMina ? `<span class="badge-mina">★ SIM (MINA)</span>` : `<span style="color:var(--text-dim);font-size:0.8rem;">Não</span>`}
            </td>
            <td>
              <span class="roster-status-tag ${statusClasses[c.status] || 'tag-trabalho'}">
                ${statusNames[c.status] || c.status}
              </span>
            </td>
            <td>
              <div class="table-actions-cell" style="justify-content:center;">
                <button class="btn-icon btn-icon-edit" onclick="window.editarColaborador('${c.id}')" title="Editar Colaborador">
                  ✏️
                </button>
                <button class="btn-icon btn-icon-danger" onclick="window.excluirColaborador('${c.id}')" title="Excluir Colaborador">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  // Filtros de Área do Efetivo
  adminAreaTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      adminAreaTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      adminAreaFilter = tab.getAttribute("data-admin-area");
      renderColaboradoresTable();
    });
  });

  // Busca do Efetivo
  if (adminSearchInput) {
    adminSearchInput.addEventListener("input", (e) => {
      adminSearchQuery = e.target.value;
      renderColaboradoresTable();
    });
  }

  // 3. MODAL DE COLABORADOR (CRIAR / EDITAR)
  window.abrirModalNovoColaborador = function () {
    formColab.reset();
    document.getElementById("colabId").value = "";
    modalColabTitulo.textContent = "👤 Novo Colaborador";
    modalColab.classList.add("open");
  };

  if (btnNovoColab) {
    btnNovoColab.addEventListener("click", window.abrirModalNovoColaborador);
  }

  window.editarColaborador = function (id) {
    const c = StorageService.getColaboradorById(id);
    if (!c) return;

    document.getElementById("colabId").value = c.id;
    document.getElementById("colabNome").value = c.nome;
    document.getElementById("colabArea").value = c.area;
    document.getElementById("colabCargo").value = c.cargo;
    document.getElementById("colabRegime").value = c.regime || "3X3";
    document.getElementById("colabTurnoPadrao").value = c.turnoPadrao || "NOTURNO";
    document.getElementById("colabTurma").value = c.turma3x3 || "";
    document.getElementById("colabCarteiraMina").value = c.carteiraMina ? "true" : "false";
    document.getElementById("colabMatricula").value = c.matricula || "";
    document.getElementById("colabStatus").value = c.status || "ativo";
    document.getElementById("colabObs").value = c.observacao || "";

    modalColabTitulo.textContent = "✏️ Editar Colaborador";
    modalColab.classList.add("open");
  };

  window.excluirColaborador = function (id) {
    const c = StorageService.getColaboradorById(id);
    if (!c) return;
    if (confirm(`Tem certeza que deseja excluir o colaborador "${c.nome}"?`)) {
      StorageService.deleteColaborador(id);
      showToast(`Colaborador ${c.nome} excluído com sucesso!`, "warning");
      renderAllAdmin();
    }
  };

  function fecharModalColab() {
    modalColab.classList.remove("open");
  }

  if (btnCloseModalColab) btnCloseModalColab.addEventListener("click", fecharModalColab);
  if (btnCancelModalColab) btnCancelModalColab.addEventListener("click", fecharModalColab);

  // Submit Formulário Colaborador
  if (formColab) {
    formColab.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("colabId").value;
      const nome = document.getElementById("colabNome").value.trim();
      const area = document.getElementById("colabArea").value;
      const cargo = document.getElementById("colabCargo").value.trim();
      const regime = document.getElementById("colabRegime").value;
      const turnoPadrao = document.getElementById("colabTurnoPadrao").value;
      const turma3x3 = document.getElementById("colabTurma").value || null;
      const carteiraMina = document.getElementById("colabCarteiraMina").value === "true";
      const matricula = document.getElementById("colabMatricula").value.trim();
      const status = document.getElementById("colabStatus").value;
      const observacao = document.getElementById("colabObs").value.trim();

      let situacao = regime;
      if (regime === "3X3") {
        situacao = `${turnoPadrao} 3X3`;
      } else if (regime === "ADM") {
        situacao = carteiraMina ? "ADM - CARTEIRA MINA" : "ADM";
      }

      const colaboradorData = {
        id: id || undefined,
        nome,
        area,
        cargo,
        regime,
        situacao,
        turnoPadrao,
        turma3x3,
        carteiraMina,
        matricula,
        status,
        observacao
      };

      StorageService.saveColaborador(colaboradorData);
      fecharModalColab();
      showToast(`Colaborador ${nome} salvo com sucesso!`, "success");
      renderAllAdmin();
    });
  }

  // Exportar CSV
  if (btnExportCsv) {
    btnExportCsv.addEventListener("click", () => {
      const colabs = StorageService.getColaboradores(adminAreaFilter);
      let csv = "ID,Nome,Matricula,Area,Cargo,Situacao,Regime,CarteiraMina,Status\n";
      colabs.forEach((c) => {
        csv += `"${c.id}","${c.nome}","${c.matricula || ''}","${c.area}","${c.cargo}","${c.situacao}","${c.regime}","${c.carteiraMina ? 'Sim' : 'Não'}","${c.status}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `efetivo_escala_${adminAreaFilter}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // 4. GESTÃO DE CAMINHÕES & DUPLAS OPERACIONAIS
  function renderTrucksAdmin() {
    if (!adminTrucksGrid) return;
    const trucks = StorageService.getCaminhoes("todas");
    const allColabs = StorageService.getColaboradores("todas");

    if (navBadgeCaminhoes) navBadgeCaminhoes.textContent = trucks.length;

    adminTrucksGrid.innerHTML = trucks
      .map((truck) => {
        const isSalobo = truck.area === "salobo";
        const motoristasDisponiveis = allColabs.filter(
          (c) => c.area === truck.area && (c.cargo.toLowerCase().includes("motorista") || c.situacao.includes("CARTEIRA MINA"))
        );
        const ajudantesDisponiveis = allColabs.filter(
          (c) => c.area === truck.area && (c.cargo.toLowerCase().includes("ajudante") || !c.cargo.toLowerCase().includes("motorista"))
        );

        const motoristaAtual = truck.motoristaId ? StorageService.getColaboradorById(truck.motoristaId) : null;
        const avisoMina = (truck.destino || "").toLowerCase().includes("mina") && motoristaAtual && !motoristaAtual.carteiraMina;

        return `
          <div class="truck-editor-card" id="cardTruck-${truck.id}">
            <div class="truck-editor-header">
              <div style="display:flex; align-items:center; gap:10px;">
                <div class="truck-number-badge" style="${isSalobo ? 'border-color: var(--emerald-neon); color: var(--emerald-neon);' : ''}">
                  <span>CAM</span>
                  <span>${truck.numero}</span>
                </div>
                <div>
                  <h3 style="font-size:1.05rem;">Caminhão ${truck.numero} (${isSalobo ? 'Salobo' : 'Sossego'})</h3>
                  <div style="font-size:0.75rem; color:var(--text-dim);">${truck.placa || ''} • ${truck.modelo || ''}</div>
                </div>
              </div>
              <div style="display:flex; gap:6px;">
                <button class="btn-icon btn-icon-edit" onclick="window.editarCaminhao('${truck.id}')" title="Editar Veículo">✏️</button>
                <button class="btn-icon btn-icon-danger" onclick="window.excluirCaminhao('${truck.id}')" title="Excluir Caminhão">🗑️</button>
              </div>
            </div>

            <!-- Seleção de Motorista -->
            <div class="truck-assignment-row">
              <div class="truck-assignment-label">🚚 Motorista Responsável</div>
              <select class="form-control" id="selectMotorista-${truck.id}" onchange="window.atualizarTripulacaoCaminhao('${truck.id}')">
                <option value="">-- Selecione o Motorista --</option>
                ${motoristasDisponiveis
                  .map((m) => `
                    <option value="${m.id}" ${truck.motoristaId === m.id ? 'selected' : ''}>
                      ${m.nome} ${m.carteiraMina ? '★ (CARTEIRA MINA)' : ''} [${m.situacao}]
                    </option>
                  `)
                  .join("")}
              </select>
            </div>

            <!-- Seleção de Ajudante -->
            <div class="truck-assignment-row">
              <div class="truck-assignment-label">👷 Ajudante de Motorista</div>
              <select class="form-control" id="selectAjudante-${truck.id}" onchange="window.atualizarTripulacaoCaminhao('${truck.id}')">
                <option value="">-- Selecione o Ajudante --</option>
                ${ajudantesDisponiveis
                  .map((a) => `
                    <option value="${a.id}" ${truck.ajudanteId === a.id ? 'selected' : ''}>
                      ${a.nome} [${a.cargo}]
                    </option>
                  `)
                  .join("")}
              </select>
            </div>

            <!-- Status e Destino -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
              <div>
                <div class="truck-assignment-label">Status Operação</div>
                <select class="form-control" id="selectStatus-${truck.id}" onchange="window.atualizarTripulacaoCaminhao('${truck.id}')">
                  <option value="em_rota" ${truck.status === 'em_rota' ? 'selected' : ''}>Em Rota</option>
                  <option value="carregamento" ${truck.status === 'carregamento' ? 'selected' : ''}>Carregamento</option>
                  <option value="disponivel" ${truck.status === 'disponivel' ? 'selected' : ''}>Disponível</option>
                  <option value="manutencao" ${truck.status === 'manutencao' ? 'selected' : ''}>Manutenção</option>
                </select>
              </div>

              <div>
                <div class="truck-assignment-label">Destino / Frente</div>
                <input type="text" class="form-control" id="inputDestino-${truck.id}" value="${truck.destino || ''}" placeholder="Ex: Lavra / Silo" onchange="window.atualizarTripulacaoCaminhao('${truck.id}')">
              </div>
            </div>

            ${
              avisoMina
                ? `<div style="margin-top:10px; padding:6px 10px; background:rgba(255,184,0,0.15); border:1px solid var(--amber-neon); border-radius:4px; font-size:0.75rem; color:var(--amber-neon);">
                    ⚠️ Atenção: Rota para Mina, mas motorista não possui Carteira Mina registrada.
                   </div>`
                : ""
            }
          </div>
        `;
      })
      .join("");
  }

  // Atualiza tripulação do caminhão no change
  window.atualizarTripulacaoCaminhao = function (truckId) {
    const truck = StorageService.getCaminhoes().find((t) => t.id === truckId);
    if (!truck) return;

    const motoristaId = document.getElementById(`selectMotorista-${truckId}`).value || null;
    const ajudanteId = document.getElementById(`selectAjudante-${truckId}`).value || null;
    const status = document.getElementById(`selectStatus-${truckId}`).value;
    const destino = document.getElementById(`inputDestino-${truckId}`).value.trim();

    truck.motoristaId = motoristaId;
    truck.ajudanteId = ajudanteId;
    truck.status = status;
    truck.destino = destino;

    StorageService.saveCaminhao(truck);
    showToast(`Caminhão ${truck.numero} atualizado com sucesso!`, "success");
    renderTrucksAdmin();
  };

  // Modal Novo Caminhão
  window.abrirModalNovoCaminhao = function () {
    formCam.reset();
    document.getElementById("camId").value = "";
    modalCamTitulo.textContent = "🚛 Novo Caminhão";
    modalCam.classList.add("open");
  };

  if (btnNovoCam) btnNovoCam.addEventListener("click", window.abrirModalNovoCaminhao);

  window.editarCaminhao = function (id) {
    const t = StorageService.getCaminhoes().find((x) => x.id === id);
    if (!t) return;
    document.getElementById("camId").value = t.id;
    document.getElementById("camNumero").value = t.numero;
    document.getElementById("camArea").value = t.area;
    document.getElementById("camPlaca").value = t.placa || "";
    document.getElementById("camModelo").value = t.modelo || "";
    document.getElementById("camStatus").value = t.status || "em_rota";
    document.getElementById("camDestino").value = t.destino || "";

    modalCamTitulo.textContent = "🚛 Editar Caminhão";
    modalCam.classList.add("open");
  };

  window.excluirCaminhao = function (id) {
    const t = StorageService.getCaminhoes().find((x) => x.id === id);
    if (!t) return;
    if (confirm(`Excluir caminhão número ${t.numero}?`)) {
      StorageService.deleteCaminhao(id);
      showToast(`Caminhão ${t.numero} excluído!`, "warning");
      renderTrucksAdmin();
    }
  };

  function fecharModalCam() {
    modalCam.classList.remove("open");
  }

  if (btnCloseModalCam) btnCloseModalCam.addEventListener("click", fecharModalCam);
  if (btnCancelModalCam) btnCancelModalCam.addEventListener("click", fecharModalCam);

  if (formCam) {
    formCam.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("camId").value;
      const numero = document.getElementById("camNumero").value.trim();
      const area = document.getElementById("camArea").value;
      const placa = document.getElementById("camPlaca").value.trim();
      const modelo = document.getElementById("camModelo").value.trim();
      const status = document.getElementById("camStatus").value;
      const destino = document.getElementById("camDestino").value.trim();

      const camData = {
        id: id || undefined,
        numero,
        area,
        placa,
        modelo,
        status,
        destino
      };

      StorageService.saveCaminhao(camData);
      fecharModalCam();
      showToast(`Caminhão ${numero} salvo com sucesso!`, "success");
      renderTrucksAdmin();
    });
  }

  // 5. AJUSTE DE ESCALA & TROCA DE TURNO (SWAP)
  function populateEscalaSelects() {
    const colabs = StorageService.getColaboradores("todas");
    const optionsHtml = colabs
      .map((c) => `<option value="${c.id}">${c.nome} (${c.cargo} • ${c.area}) [${c.situacao}]</option>`)
      .join("");

    if (swapColab1) swapColab1.innerHTML = optionsHtml;
    if (swapColab2) swapColab2.innerHTML = optionsHtml;
    if (exceptionColab) exceptionColab.innerHTML = optionsHtml;

    // Seta data de hoje nos inputs
    const today = new Date().toISOString().slice(0, 10);
    if (swapDate) swapDate.value = today;
    if (exceptionDate) exceptionDate.value = today;

    const cfg = StorageService.getConfiguracoes();
    if (cycleBaseDate) cycleBaseDate.value = cfg.dataBaseCiclo3x3 || "2026-09-01";
  }

  // Executar Swap
  if (btnExecuteSwap) {
    btnExecuteSwap.addEventListener("click", () => {
      const id1 = swapColab1.value;
      const id2 = swapColab2.value;
      const date = swapDate.value;

      if (!id1 || !id2 || !date) {
        showToast("Selecione os dois colaboradores e a data para permuta.", "error");
        return;
      }
      if (id1 === id2) {
        showToast("Selecione dois colaboradores diferentes.", "warning");
        return;
      }

      StorageService.swapEscala(id1, id2, date);
      const c1 = StorageService.getColaboradorById(id1);
      const c2 = StorageService.getColaboradorById(id2);
      showToast(`Troca de turno realizada entre ${c1.nome} e ${c2.nome} no dia ${date}!`, "success");
    });
  }

  // Aplicar Exceção Individual
  if (btnApplyException) {
    btnApplyException.addEventListener("click", () => {
      const colabId = exceptionColab.value;
      const date = exceptionDate.value;
      const status = exceptionStatus.value;

      if (!colabId || !date) {
        showToast("Selecione o colaborador e a data.", "error");
        return;
      }

      StorageService.setExcecaoDia(colabId, date, status);
      const c = StorageService.getColaboradorById(colabId);
      showToast(`Escala de ${c.nome} ajustada para ${status} no dia ${date}!`, "success");
    });
  }

  // Salvar Parâmetros de Ciclo
  if (btnSaveCycleConfig) {
    btnSaveCycleConfig.addEventListener("click", () => {
      const dt = cycleBaseDate.value;
      if (!dt) {
        showToast("Informe uma data válida.", "error");
        return;
      }
      StorageService.saveConfiguracoes({ dataBaseCiclo3x3: dt });
      showToast("Data base do ciclo 3x3 atualizada com sucesso!", "success");
    });
  }

  // 6. FIREBASE & NUVEM
  function loadFirebaseConfigForm() {
    const cfg = FirebaseService.getConfig();
    if (fbApiKey) fbApiKey.value = cfg.apiKey || "";
    if (fbAuthDomain) fbAuthDomain.value = cfg.authDomain || "";
    if (fbProjectId) fbProjectId.value = cfg.projectId || "";
    if (fbStorageBucket) fbStorageBucket.value = cfg.storageBucket || "";
    if (fbMessagingSenderId) fbMessagingSenderId.value = cfg.messagingSenderId || "";
    if (fbAppId) fbAppId.value = cfg.appId || "";
  }

  if (firebaseConfigForm) {
    firebaseConfigForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newCfg = {
        apiKey: fbApiKey.value.trim(),
        authDomain: fbAuthDomain.value.trim(),
        projectId: fbProjectId.value.trim(),
        storageBucket: fbStorageBucket.value.trim(),
        messagingSenderId: fbMessagingSenderId.value.trim(),
        appId: fbAppId.value.trim()
      };

      FirebaseService.saveConfig(newCfg);
      showToast("Configuração salva! Tentando conectar ao Firebase...", "info");

      const success = await FirebaseService.initFirebase();
      if (success) {
        StorageService.setupFirebaseListener();
        showToast("Conexão com Firebase Firestore estabelecida com sucesso!", "success");
      } else {
        showToast("Operando em modo local. Verifique as credenciais se desejar nuvem.", "warning");
      }
    });
  }

  if (btnSyncToCloud) {
    btnSyncToCloud.addEventListener("click", () => {
      StorageService.persist();
      showToast("Dados enviados para o Firebase Firestore!", "success");
    });
  }

  // 7. BACKUP & RESTAURAÇÃO
  if (btnExportBackup) {
    btnExportBackup.addEventListener("click", () => {
      StorageService.exportBackupJSON();
      showToast("Backup JSON exportado com sucesso!", "success");
    });
  }

  if (btnImportBackup && backupFileInput) {
    btnImportBackup.addEventListener("click", () => {
      backupFileInput.click();
    });

    backupFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (evt) {
        try {
          StorageService.importBackupJSON(evt.target.result);
          showToast("Backup restaurado com sucesso!", "success");
          renderAllAdmin();
        } catch (err) {
          showToast("Erro ao importar arquivo de backup: " + err.message, "error");
        }
      };
      reader.readAsText(file);
      backupFileInput.value = "";
    });
  }

  if (btnResetOriginal) {
    btnResetOriginal.addEventListener("click", () => {
      if (
        confirm(
          "Deseja restaurar todos os 36 colaboradores e frotas das planilhas oficiais Sossego e Salobo? Quaisquer alterações locais serão substituídas pelos dados originais."
        )
      ) {
        StorageService.resetToOriginal();
        showToast("Dados originais de Sossego e Salobo restaurados!", "success");
        renderAllAdmin();
      }
    });
  }

  // 8. RENDERIZAÇÃO GERAL DO ADMIN
  function renderAllAdmin() {
    renderColaboradoresTable();
    renderTrucksAdmin();
    populateEscalaSelects();
    loadFirebaseConfigForm();
  }

  // Toast Helper
  function showToast(message, type = "success") {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'warning' ? '⚠️' : 'ℹ'}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(50px)";
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Escuta atualizações de outras abas ou storage
  StorageService.subscribe(() => {
    renderColaboradoresTable();
    renderTrucksAdmin();
  });

  // Alternar Tema Claro / Escuro (White / Dark)
  const btnThemeToggleAdmin = document.getElementById("btnThemeToggleAdmin");
  function updateThemeButtonAdmin(theme) {
    if (btnThemeToggleAdmin) {
      btnThemeToggleAdmin.innerHTML = theme === "light" ? "🌙 Modo Escuro" : "☀️ Modo Claro";
    }
  }

  const currentThemeAdmin = localStorage.getItem("escala_theme") || "dark";
  document.documentElement.setAttribute("data-theme", currentThemeAdmin);
  updateThemeButtonAdmin(currentThemeAdmin);

  if (btnThemeToggleAdmin) {
    btnThemeToggleAdmin.addEventListener("click", () => {
      const active = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", active);
      localStorage.setItem("escala_theme", active);
      updateThemeButtonAdmin(active);
    });
  }

  // Inicializa Firebase se configurado e renderiza
  FirebaseService.initFirebase();
  renderAllAdmin();
});
