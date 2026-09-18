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

  // 6. BACKUP & RESTAURAÇÃO
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

  // 7. GESTÃO DE ADMINISTRADORES
  const adminUsersTableBody = document.getElementById("adminUsersTableBody");
  const navBadgeAdmins = document.getElementById("navBadgeAdmins");
  const btnNovoAdmin = document.getElementById("btnNovoAdmin");
  const modalAdmin = document.getElementById("modalAdmin");
  const formAdmin = document.getElementById("formAdmin");
  const btnCloseModalAdmin = document.getElementById("btnCloseModalAdmin");
  const btnCancelModalAdmin = document.getElementById("btnCancelModalAdmin");
  const modalAdminTitulo = document.getElementById("modalAdminTitulo");

  function renderAdminsTable() {
    if (!adminUsersTableBody) return;
    const admins = StorageService.getAdministradores();
    if (navBadgeAdmins) navBadgeAdmins.textContent = admins.length;

    adminUsersTableBody.innerHTML = admins
      .map((a) => {
        const isSuper = a.nivel === "Super Admin";
        const dateStr = a.criadoEm ? new Date(a.criadoEm).toLocaleDateString("pt-BR") : "Original";

        return `
          <tr>
            <td>
              <div style="font-weight:600; color:var(--text-main);">${a.nome}</div>
            </td>
            <td>
              <div style="font-family:var(--font-mono); color:var(--cyan-neon);">${a.email}</div>
            </td>
            <td>
              <span class="roster-status-tag ${isSuper ? 'tag-trabalho' : 'tag-folga'}">
                ${a.nivel || 'Administrador'}
              </span>
            </td>
            <td style="color:var(--text-dim); font-size:0.8rem;">
              ${dateStr}
            </td>
            <td>
              <div class="table-actions-cell" style="justify-content:center;">
                <button class="btn-icon btn-icon-edit" onclick="window.editarAdmin('${a.id}')" title="Editar / Alterar Senha">
                  ✏️
                </button>
                ${
                  admins.length > 1
                    ? `<button class="btn-icon btn-icon-danger" onclick="window.excluirAdmin('${a.id}')" title="Excluir Administrador">🗑️</button>`
                    : ""
                }
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  window.abrirModalNovoAdmin = function () {
    if (formAdmin) formAdmin.reset();
    document.getElementById("adminUserId").value = "";
    if (modalAdminTitulo) modalAdminTitulo.textContent = "🔑 Novo Administrador";
    if (modalAdmin) modalAdmin.classList.add("open");
  };

  if (btnNovoAdmin) btnNovoAdmin.addEventListener("click", window.abrirModalNovoAdmin);

  window.editarAdmin = function (id) {
    const admins = StorageService.getAdministradores();
    const a = admins.find((u) => u.id === id);
    if (!a) return;

    document.getElementById("adminUserId").value = a.id;
    document.getElementById("adminNome").value = a.nome;
    document.getElementById("adminEmail").value = a.email;
    document.getElementById("adminSenha").value = a.senha || "";
    document.getElementById("adminNivel").value = a.nivel || "Administrador";

    if (modalAdminTitulo) modalAdminTitulo.textContent = "✏️ Editar Administrador";
    if (modalAdmin) modalAdmin.classList.add("open");
  };

  window.excluirAdmin = function (id) {
    const admins = StorageService.getAdministradores();
    const a = admins.find((u) => u.id === id);
    if (!a) return;

    if (confirm(`Tem certeza que deseja remover o acesso do administrador "${a.nome}" (${a.email})?`)) {
      try {
        StorageService.deleteAdministrador(id);
        showToast(`Administrador ${a.nome} removido!`, "warning");
        renderAdminsTable();
      } catch (err) {
        showToast(err.message, "error");
      }
    }
  };

  function fecharModalAdmin() {
    if (modalAdmin) modalAdmin.classList.remove("open");
  }

  if (btnCloseModalAdmin) btnCloseModalAdmin.addEventListener("click", fecharModalAdmin);
  if (btnCancelModalAdmin) btnCancelModalAdmin.addEventListener("click", fecharModalAdmin);

  if (formAdmin) {
    formAdmin.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("adminUserId").value;
      const nome = document.getElementById("adminNome").value.trim();
      const email = document.getElementById("adminEmail").value.trim().toLowerCase();
      const senha = document.getElementById("adminSenha").value.trim();
      const nivel = document.getElementById("adminNivel").value;

      StorageService.saveAdministrador({
        id: id || undefined,
        nome,
        email,
        senha,
        nivel
      });

      fecharModalAdmin();
      showToast(`Administrador ${nome} salvo com sucesso!`, "success");
      renderAdminsTable();
    });
  }

  // ==========================================================================
  // 9. GESTÃO DE ESCALAS EXTRAS & DASHBOARD DE HORAS EXTRAS
  // ==========================================================================
  const navBadgeExtras = document.getElementById("navBadgeExtras");
  const filterExtrasMesAno = document.getElementById("filterExtrasMesAno");
  const filterExtrasArea = document.getElementById("filterExtrasArea");
  const filterExtrasTipo = document.getElementById("filterExtrasTipo");
  const btnResetFiltrosExtras = document.getElementById("btnResetFiltrosExtras");

  const kpiTotalHorasExtras = document.getElementById("kpiTotalHorasExtras");
  const kpiTotalConvocoes = document.getElementById("kpiTotalConvocoes");
  const kpiColabsConvocados = document.getElementById("kpiColabsConvocados");
  const kpiMediaHoras = document.getElementById("kpiMediaHoras");

  const txtHorasSossego = document.getElementById("txtHorasSossego");
  const barHorasSossego = document.getElementById("barHorasSossego");
  const txtHorasSalobo = document.getElementById("txtHorasSalobo");
  const barHorasSalobo = document.getElementById("barHorasSalobo");
  const rankingTopColabs = document.getElementById("rankingTopColabs");

  const btnSubTabConsolidado = document.getElementById("btnSubTabConsolidado");
  const btnSubTabHistorico = document.getElementById("btnSubTabHistorico");
  const panelConsolidadoColabs = document.getElementById("panelConsolidadoColabs");
  const panelHistoricoLancamentos = document.getElementById("panelHistoricoLancamentos");

  const tableConsolidadoBody = document.getElementById("tableConsolidadoBody");
  const tableHistoricoExtrasBody = document.getElementById("tableHistoricoExtrasBody");

  const btnNovaEscalaExtra = document.getElementById("btnNovaEscalaExtra");
  const btnExportExtrasCsv = document.getElementById("btnExportExtrasCsv");

  // Modal Escala Extra
  const modalEscalaExtra = document.getElementById("modalEscalaExtra");
  const formEscalaExtra = document.getElementById("formEscalaExtra");
  const btnCloseModalExtra = document.getElementById("btnCloseModalExtra");
  const btnCancelModalExtra = document.getElementById("btnCancelModalExtra");

  const extraData = document.getElementById("extraData");
  const extraTipo = document.getElementById("extraTipo");
  const extraHoraInicio = document.getElementById("extraHoraInicio");
  const extraHoraFim = document.getElementById("extraHoraFim");
  const extraCalculoPreview = document.getElementById("extraCalculoPreview");
  const extraQtdDesejada = document.getElementById("extraQtdDesejada");
  const extraMotivo = document.getElementById("extraMotivo");
  const extraFrente = document.getElementById("extraFrente");
  const extraSelectedCounterBadge = document.getElementById("extraSelectedCounterBadge");
  const extraPickerSearchInput = document.getElementById("extraPickerSearchInput");
  const extraColabPickerGrid = document.getElementById("extraColabPickerGrid");
  const extraPickerAreaTabs = document.querySelectorAll("[data-picker-area]");

  let selectedColabIdsForExtra = new Set();
  let pickerAreaFilter = "todas";
  let pickerSearchQuery = "";

  // Inicializa mês atual no filtro se vazio
  if (filterExtrasMesAno && !filterExtrasMesAno.value) {
    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, "0");
    filterExtrasMesAno.value = `${yyyy}-${mm}`;
  }

  function renderHorasExtrasDashboard() {
    if (!kpiTotalHorasExtras && !tableConsolidadoBody && !tableHistoricoExtrasBody) return;

    const mesAno = filterExtrasMesAno ? filterExtrasMesAno.value : "";
    const area = filterExtrasArea ? filterExtrasArea.value : "todas";
    const tipo = filterExtrasTipo ? filterExtrasTipo.value : "todas";

    const dash = StorageService.calcularDashboardHorasExtras({ mesAno, area, tipo });

    // Atualiza KPIs
    if (kpiTotalHorasExtras) kpiTotalHorasExtras.textContent = `${dash.totalHoras}h`;
    if (kpiTotalConvocoes) kpiTotalConvocoes.textContent = `${dash.totalConvocoes}`;
    if (kpiColabsConvocados) kpiColabsConvocados.textContent = `${dash.colaboradoresAcionados}`;
    if (kpiMediaHoras) kpiMediaHoras.textContent = `${dash.mediaHorasPorColab}h`;
    if (navBadgeExtras) navBadgeExtras.textContent = dash.totalConvocoes;

    // Comparativo Sossego vs Salobo
    const pctSossego = dash.totalHoras > 0 ? Math.round((dash.horasSossego / dash.totalHoras) * 100) : 0;
    const pctSalobo = dash.totalHoras > 0 ? Math.round((dash.horasSalobo / dash.totalHoras) * 100) : 0;

    if (txtHorasSossego) txtHorasSossego.textContent = `${dash.horasSossego}h (${pctSossego}%)`;
    if (barHorasSossego) barHorasSossego.style.width = `${pctSossego}%`;
    if (txtHorasSalobo) txtHorasSalobo.textContent = `${dash.horasSalobo}h (${pctSalobo}%)`;
    if (barHorasSalobo) barHorasSalobo.style.width = `${pctSalobo}%`;

    // Top Ranking
    if (rankingTopColabs) {
      if (dash.ranking.length === 0) {
        rankingTopColabs.innerHTML = `
          <div style="color:var(--text-dim); font-size:0.85rem; padding:12px; text-align:center;">
            Nenhuma hora extra registrada para os filtros selecionados.
          </div>
        `;
      } else {
        const medals = ["🥇", "🥈", "🥉", "4º", "5º"];
        rankingTopColabs.innerHTML = dash.ranking.slice(0, 5).map((r, idx) => {
          const isSalobo = r.area === "salobo";
          const initials = r.nome.split(" ").slice(0, 2).map(n => n[0]).join("");
          return `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); font-size:0.82rem;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.1rem; width:22px; text-align:center;">${medals[idx] || (idx+1)+'º'}</span>
                <div class="avatar-badge ${isSalobo ? 'salobo' : ''}" style="width:28px; height:28px; font-size:0.75rem;">${initials}</div>
                <div>
                  <div style="font-weight:700; color:var(--text-main);">${r.nome}</div>
                  <div style="font-size:0.72rem; color:var(--text-dim);">${r.cargo} • ${isSalobo ? 'Salobo' : 'Sossego'}</div>
                </div>
              </div>
              <div style="text-align:right;">
                <span style="font-weight:800; color:var(--amber-neon); font-size:0.9rem;">${r.totalHoras}h</span>
                <div style="font-size:0.7rem; color:var(--text-dim);">${r.totalConvocoes} convoc.</div>
              </div>
            </div>
          `;
        }).join("");
      }
    }

    // Tabela 1: Consolidado por Colaborador
    if (tableConsolidadoBody) {
      if (dash.ranking.length === 0) {
        tableConsolidadoBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align:center; padding:32px; color:var(--text-dim);">
              Nenhum colaborador com horas extras registradas no período selecionado.
            </td>
          </tr>
        `;
      } else {
        const maxHoras = Math.max(...dash.ranking.map(r => r.totalHoras), 1);
        tableConsolidadoBody.innerHTML = dash.ranking.map(r => {
          const isSalobo = r.area === "salobo";
          const initials = r.nome.split(" ").slice(0, 2).map(n => n[0]).join("");
          const pct = Math.min(100, Math.round((r.totalHoras / maxHoras) * 100));

          return `
            <tr>
              <td>
                <div style="display:flex; align-items:center; gap:10px;">
                  <div class="avatar-badge ${isSalobo ? 'salobo' : ''}">${initials}</div>
                  <div>
                    <div style="font-weight:700; color:var(--text-main);">${r.nome}</div>
                    <div style="font-size:0.75rem; color:var(--text-dim);">${r.cargo}</div>
                  </div>
                </div>
              </td>
              <td>${r.cargo}</td>
              <td>
                <span class="roster-status-tag ${isSalobo ? 'tag-trabalho' : 'tag-folga'}">
                  ${isSalobo ? 'Salobo' : 'Sossego'}
                </span>
              </td>
              <td style="text-align:center; font-weight:700;">${r.totalConvocoes}</td>
              <td style="text-align:center;">
                <span style="font-weight:800; color:#d97706; background:#fef3c7; border:1px solid #fde68a; padding:3px 8px; border-radius:999px; font-size:0.85rem;">
                  ⚡ ${r.totalHoras}h
                </span>
              </td>
              <td>
                <div style="height:8px; background:#e2e8f0; border-radius:999px; overflow:hidden;">
                  <div style="height:100%; width:${pct}%; background:linear-gradient(90deg, #f59e0b, #d97706); border-radius:999px;"></div>
                </div>
              </td>
              <td style="text-align:center;">
                <button class="btn btn-glass" style="padding:4px 10px; font-size:0.75rem;" onclick="window.abrirModalComColaborador('${r.id}')" title="Lançar nova convocação extra para este colaborador">
                  <i class="fa-solid fa-plus"></i> Convocação
                </button>
              </td>
            </tr>
          `;
        }).join("");
      }
    }

    // Tabela 2: Histórico Detalhado
    if (tableHistoricoExtrasBody) {
      if (dash.registros.length === 0) {
        tableHistoricoExtrasBody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align:center; padding:32px; color:var(--text-dim);">
              Nenhum lançamento de escala extra registrado no período selecionado.
            </td>
          </tr>
        `;
      } else {
        tableHistoricoExtrasBody.innerHTML = dash.registros.map(e => {
          const isSalobo = e.area === "salobo";
          const [ano, mes, dia] = (e.data || "").split("-");
          const dataFmt = ano && mes && dia ? `${dia}/${mes}/${ano}` : e.data;

          const tipoLabels = {
            prorrogacao: "Prorrogação de Jornada",
            folga: "Convocação na Folga (3x3)",
            feriado: "Plantão em Feriado",
            especial: "Operação Especial"
          };

          const tipoClasses = {
            prorrogacao: "tag-trabalho",
            folga: "tag-folga",
            feriado: "tag-ferias",
            especial: "tag-atestado"
          };

          return `
            <tr>
              <td><strong style="color:var(--text-main); font-family:var(--font-mono);">${dataFmt}</strong></td>
              <td>
                <div style="font-weight:700; color:var(--text-main);">${e.colaboradorNome}</div>
                <div style="font-size:0.75rem; color:var(--text-dim);">${e.colaboradorCargo}</div>
              </td>
              <td>
                <span class="roster-status-tag ${isSalobo ? 'tag-trabalho' : 'tag-folga'}">
                  ${isSalobo ? 'Salobo' : 'Sossego'}
                </span>
              </td>
              <td>
                <span class="roster-status-tag ${tipoClasses[e.tipo] || 'tag-trabalho'}">
                  ${tipoLabels[e.tipo] || e.tipo}
                </span>
              </td>
              <td><i class="fa-regular fa-clock" style="color:var(--text-dim);"></i> ${e.horaInicio} às ${e.horaFim}</td>
              <td style="text-align:center;">
                <span style="font-weight:800; color:#d97706; background:#fef3c7; border:1px solid #fde68a; padding:2px 7px; border-radius:999px; font-size:0.8rem;">
                  +${e.totalHoras}h
                </span>
              </td>
              <td>
                <div style="font-size:0.82rem; color:var(--text-main); font-weight:600;">${e.motivo || 'Rotina operacional'}</div>
                <div style="font-size:0.72rem; color:var(--text-dim);">${e.frente || 'Base operacional'}</div>
              </td>
              <td style="text-align:center;">
                <button class="btn-icon btn-icon-danger" onclick="window.excluirEscalaExtra('${e.id}')" title="Excluir Convocação Extra">
                  🗑️
                </button>
              </td>
            </tr>
          `;
        }).join("");
      }
    }
  }

  function atualizarCalculoHorasModal() {
    if (!extraHoraInicio || !extraHoraFim || !extraCalculoPreview) return;
    const diff = StorageService.calcularDiferencaHoras(extraHoraInicio.value, extraHoraFim.value);
    extraCalculoPreview.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> ${diff.toFixed(1)}h extras`;
  }

  function atualizarContadorPicker() {
    if (!extraSelectedCounterBadge) return;
    const desejada = parseInt(extraQtdDesejada ? extraQtdDesejada.value : "1", 10) || 1;
    const selecionados = selectedColabIdsForExtra.size;

    const badgeText = `${selecionados} de ${desejada} selecionado(s)`;
    if (selecionados === desejada) {
      extraSelectedCounterBadge.style.background = "#dcfce7";
      extraSelectedCounterBadge.style.color = "#15803d";
      extraSelectedCounterBadge.innerHTML = `<i class="fa-solid fa-check"></i> ${badgeText} (Meta Atingida)`;
    } else if (selecionados > desejada) {
      extraSelectedCounterBadge.style.background = "#fef3c7";
      extraSelectedCounterBadge.style.color = "#b45309";
      extraSelectedCounterBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${badgeText} (+${selecionados - desejada})`;
    } else {
      extraSelectedCounterBadge.style.background = "#e0f2fe";
      extraSelectedCounterBadge.style.color = "#0369a1";
      extraSelectedCounterBadge.innerHTML = `<i class="fa-solid fa-user-plus"></i> ${badgeText} (Faltam ${desejada - selecionados})`;
    }
  }

  function renderExtraColabPicker() {
    if (!extraColabPickerGrid) return;
    const allColabs = StorageService.getColaboradores(pickerAreaFilter);
    const q = (pickerSearchQuery || "").toLowerCase().trim();
    const dataAlvo = extraData ? extraData.value : new Date().toISOString().slice(0, 10);

    const filtrados = allColabs.filter(c => {
      if (!q) return true;
      return (
        c.nome.toLowerCase().includes(q) ||
        c.cargo.toLowerCase().includes(q) ||
        (c.matricula && c.matricula.toLowerCase().includes(q))
      );
    });

    if (filtrados.length === 0) {
      extraColabPickerGrid.innerHTML = `
        <div style="grid-column:1/-1; padding:20px; text-align:center; color:var(--text-dim); font-size:0.82rem;">
          Nenhum colaborador encontrado com os filtros acima.
        </div>
      `;
      return;
    }

    extraColabPickerGrid.innerHTML = filtrados.map(c => {
      const isSelected = selectedColabIdsForExtra.has(c.id);
      const isSalobo = c.area === "salobo";
      const initials = c.nome.split(" ").slice(0, 2).map(n => n[0]).join("");

      // Status do colaborador nesta data
      const stDia = StorageService.calcularStatusDia(c.id, dataAlvo);
      let statusTagHtml = "";
      if (stDia.status === "F") {
        statusTagHtml = `<span style="font-size:0.68rem; font-weight:800; background:#e0f2fe; color:#0369a1; padding:1px 5px; border-radius:4px;"><i class="fa-solid fa-bed"></i> Folga 3x3</span>`;
      } else if (stDia.status === "T") {
        statusTagHtml = `<span style="font-size:0.68rem; font-weight:800; background:#fef3c7; color:#b45309; padding:1px 5px; border-radius:4px;"><i class="fa-solid fa-briefcase"></i> Regular (${stDia.turno})</span>`;
      } else {
        statusTagHtml = `<span style="font-size:0.68rem; font-weight:800; background:#f3e8ff; color:#7e22ce; padding:1px 5px; border-radius:4px;">${stDia.detalhe}</span>`;
      }

      return `
        <label style="display:flex; align-items:center; gap:8px; padding:8px 10px; background:${isSelected ? '#ecfdf5' : '#ffffff'}; border:1px solid ${isSelected ? 'var(--hc-green)' : 'var(--border-subtle)'}; border-radius:var(--radius-sm); cursor:pointer; transition:all 0.2s ease;">
          <input type="checkbox" class="extra-colab-checkbox" value="${c.id}" ${isSelected ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--hc-green); cursor:pointer;">
          <div class="avatar-badge ${isSalobo ? 'salobo' : ''}" style="width:28px; height:28px; font-size:0.75rem; flex-shrink:0;">${initials}</div>
          <div style="flex:1; min-width:0;">
            <div style="font-size:0.82rem; font-weight:700; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.nome}</div>
            <div style="display:flex; align-items:center; gap:4px; margin-top:2px; flex-wrap:wrap;">
              <span style="font-size:0.7rem; color:var(--text-dim);">${c.cargo}</span>
              <span>•</span>
              <span style="font-size:0.7rem; font-weight:700; color:${isSalobo ? 'var(--hc-green-dark)' : '#0369a1'};">${isSalobo ? 'Salobo' : 'Sossego'}</span>
              ${statusTagHtml}
            </div>
          </div>
        </label>
      `;
    }).join("");

    // Adiciona listener aos checkboxes
    extraColabPickerGrid.querySelectorAll(".extra-colab-checkbox").forEach(chk => {
      chk.addEventListener("change", (e) => {
        const id = e.target.value;
        if (e.target.checked) {
          selectedColabIdsForExtra.add(id);
        } else {
          selectedColabIdsForExtra.delete(id);
        }
        atualizarContadorPicker();
        renderExtraColabPicker();
      });
    });
  }

  function abrirModalNovaEscalaExtra(preSelectColabId = null) {
    if (formEscalaExtra) formEscalaExtra.reset();
    selectedColabIdsForExtra.clear();

    const hoje = new Date();
    const yyyy = hoje.getFullYear();
    const mm = String(hoje.getMonth() + 1).padStart(2, "0");
    const dd = String(hoje.getDate()).padStart(2, "0");

    if (extraData) extraData.value = `${yyyy}-${mm}-${dd}`;
    if (extraTipo) extraTipo.value = "prorrogacao";
    if (extraHoraInicio) extraHoraInicio.value = "19:00";
    if (extraHoraFim) extraHoraFim.value = "23:00";
    if (extraQtdDesejada) extraQtdDesejada.value = "1";
    if (extraMotivo) extraMotivo.value = "";
    if (extraFrente) extraFrente.value = "";

    pickerAreaFilter = "todas";
    pickerSearchQuery = "";
    if (extraPickerSearchInput) extraPickerSearchInput.value = "";

    extraPickerAreaTabs.forEach(t => {
      if (t.getAttribute("data-picker-area") === "todas") t.classList.add("active");
      else t.classList.remove("active");
    });

    if (preSelectColabId) {
      selectedColabIdsForExtra.add(preSelectColabId);
      const c = StorageService.getColaboradorById(preSelectColabId);
      if (c && extraFrente) {
        extraFrente.value = c.area === "salobo" ? "Usina Salobo" : "Mina Sossego";
      }
    }

    atualizarCalculoHorasModal();
    atualizarContadorPicker();
    renderExtraColabPicker();

    if (modalEscalaExtra) modalEscalaExtra.classList.add("open");
  }

  window.abrirModalComColaborador = function(colabId) {
    abrirModalNovaEscalaExtra(colabId);
  };

  function fecharModalEscalaExtra() {
    if (modalEscalaExtra) modalEscalaExtra.classList.remove("open");
  }

  window.excluirEscalaExtra = function(id) {
    const extra = StorageService.getEscalaExtraById(id);
    const nome = extra ? extra.colaboradorNome : "esta convocação";
    if (confirm(`Deseja realmente cancelar e excluir a convocação extra de ${nome}?`)) {
      StorageService.deleteEscalaExtra(id);
      showToast("Convocação extra excluída com sucesso!", "warning");
      renderHorasExtrasDashboard();
    }
  };

  if (btnSubTabConsolidado && btnSubTabHistorico) {
    btnSubTabConsolidado.addEventListener("click", () => {
      btnSubTabConsolidado.classList.add("active");
      btnSubTabHistorico.classList.remove("active");
      if (panelConsolidadoColabs) panelConsolidadoColabs.style.display = "block";
      if (panelHistoricoLancamentos) panelHistoricoLancamentos.style.display = "none";
    });

    btnSubTabHistorico.addEventListener("click", () => {
      btnSubTabHistorico.classList.add("active");
      btnSubTabConsolidado.classList.remove("active");
      if (panelHistoricoLancamentos) panelHistoricoLancamentos.style.display = "block";
      if (panelConsolidadoColabs) panelConsolidadoColabs.style.display = "none";
    });
  }

  if (filterExtrasMesAno) filterExtrasMesAno.addEventListener("change", renderHorasExtrasDashboard);
  if (filterExtrasArea) filterExtrasArea.addEventListener("change", renderHorasExtrasDashboard);
  if (filterExtrasTipo) filterExtrasTipo.addEventListener("change", renderHorasExtrasDashboard);

  if (btnResetFiltrosExtras) {
    btnResetFiltrosExtras.addEventListener("click", () => {
      const hoje = new Date();
      const yyyy = hoje.getFullYear();
      const mm = String(hoje.getMonth() + 1).padStart(2, "0");
      if (filterExtrasMesAno) filterExtrasMesAno.value = `${yyyy}-${mm}`;
      if (filterExtrasArea) filterExtrasArea.value = "todas";
      if (filterExtrasTipo) filterExtrasTipo.value = "todas";
      renderHorasExtrasDashboard();
      showToast("Filtros redefinidos!", "info");
    });
  }

  if (btnNovaEscalaExtra) btnNovaEscalaExtra.addEventListener("click", () => abrirModalNovaEscalaExtra());
  if (btnCloseModalExtra) btnCloseModalExtra.addEventListener("click", fecharModalEscalaExtra);
  if (btnCancelModalExtra) btnCancelModalExtra.addEventListener("click", fecharModalEscalaExtra);

  if (extraHoraInicio) extraHoraInicio.addEventListener("input", atualizarCalculoHorasModal);
  if (extraHoraFim) extraHoraFim.addEventListener("input", atualizarCalculoHorasModal);
  if (extraData) extraData.addEventListener("change", renderExtraColabPicker);
  if (extraQtdDesejada) extraQtdDesejada.addEventListener("input", atualizarContadorPicker);

  if (extraTipo) {
    extraTipo.addEventListener("change", () => {
      if (extraTipo.value === "folga") {
        extraHoraInicio.value = "07:00";
        extraHoraFim.value = "19:00";
      } else if (extraTipo.value === "prorrogacao") {
        extraHoraInicio.value = "19:00";
        extraHoraFim.value = "23:00";
      }
      atualizarCalculoHorasModal();
    });
  }

  extraPickerAreaTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      extraPickerAreaTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      pickerAreaFilter = tab.getAttribute("data-picker-area") || "todas";
      renderExtraColabPicker();
    });
  });

  if (extraPickerSearchInput) {
    extraPickerSearchInput.addEventListener("input", (e) => {
      pickerSearchQuery = e.target.value;
      renderExtraColabPicker();
    });
  }

  if (formEscalaExtra) {
    formEscalaExtra.addEventListener("submit", (e) => {
      e.preventDefault();
      if (selectedColabIdsForExtra.size === 0) {
        showToast("Selecione pelo menos um colaborador na lista abaixo!", "warning");
        return;
      }

      const dadosGerais = {
        data: extraData.value,
        tipo: extraTipo.value,
        horaInicio: extraHoraInicio.value,
        horaFim: extraHoraFim.value,
        totalHoras: StorageService.calcularDiferencaHoras(extraHoraInicio.value, extraHoraFim.value),
        motivo: extraMotivo.value.trim() || "Extra rotina operacional",
        frente: extraFrente.value.trim(),
        criadoPor: StorageService.getUsuarioLogado()?.nome || "Gestão HC Ambiental"
      };

      try {
        const salvos = StorageService.saveEscalaExtraLote(dadosGerais, Array.from(selectedColabIdsForExtra));
        fecharModalEscalaExtra();
        showToast(`Sucesso! Convocação de escala extra salva para ${salvos.length} colaborador(es)!`, "success");
        renderHorasExtrasDashboard();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  if (btnExportExtrasCsv) {
    btnExportExtrasCsv.addEventListener("click", () => {
      const mesAno = filterExtrasMesAno ? filterExtrasMesAno.value : "";
      const area = filterExtrasArea ? filterExtrasArea.value : "todas";
      const tipo = filterExtrasTipo ? filterExtrasTipo.value : "todas";

      const extras = StorageService.getEscalasExtras({ mesAno, area, tipo });
      if (extras.length === 0) {
        showToast("Nenhum registro para exportar com os filtros atuais.", "info");
        return;
      }

      let csv = "ID;Data;Colaborador;Cargo;Area;Tipo;Inicio;Fim;TotalHoras;Motivo;Frente;CriadoPor;CriadoEm\n";
      extras.forEach(e => {
        csv += `"${e.id}";"${e.data}";"${e.colaboradorNome}";"${e.colaboradorCargo}";"${e.area}";"${e.tipo}";"${e.horaInicio}";"${e.horaFim}";"${e.totalHoras}";"${(e.motivo||'').replace(/"/g, '""')}";"${(e.frente||'').replace(/"/g, '""')}";"${e.criadoPor||''}";"${e.criadoEm||''}"\n`;
      });

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HC_Ambiental_Horas_Extras_${mesAno || 'Geral'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Relatório de horas extras exportado em CSV!", "success");
    });
  }

  // 8. RENDERIZAÇÃO GERAL DO ADMIN
  function renderAllAdmin() {
    renderColaboradoresTable();
    renderTrucksAdmin();
    populateEscalaSelects();
    renderAdminsTable();
    renderHorasExtrasDashboard();
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
    renderAdminsTable();
    renderHorasExtrasDashboard();
  });

  // Tema fixo: apenas claro (HC Ambiental)
  document.documentElement.removeAttribute("data-theme");
  localStorage.removeItem("escala_theme");

  // CONTROLE DE AUTENTICAÇÃO E BLOQUEIO (AUTH WALL)
  const modalAdminAuthWall = document.getElementById("modalAdminAuthWall");
  const formAdminAuthWall = document.getElementById("formAdminAuthWall");
  const authWallErrorMsg = document.getElementById("authWallErrorMsg");
  const adminUserEmailDisplay = document.getElementById("adminUserEmailDisplay");
  const btnLogout = document.getElementById("btnLogout");

  function verificarAutenticacao() {
    const user = StorageService.getUsuarioLogado();
    if (!user) {
      if (modalAdminAuthWall) modalAdminAuthWall.style.display = "flex";
    } else {
      if (modalAdminAuthWall) modalAdminAuthWall.style.display = "none";
      if (adminUserEmailDisplay) adminUserEmailDisplay.textContent = user.email;
    }
  }

  if (formAdminAuthWall) {
    formAdminAuthWall.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("authWallEmail").value.trim();
      const senha = document.getElementById("authWallSenha").value.trim();
      const submitBtn = formAdminAuthWall.querySelector("button[type='submit']");

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Verificando...";
      }
      if (authWallErrorMsg) authWallErrorMsg.style.display = "none";

      try {
        const res = await StorageService.autenticarAdmin(email, senha);
        if (res.success) {
          modalAdminAuthWall.style.display = "none";
          if (adminUserEmailDisplay) adminUserEmailDisplay.textContent = res.user.email;
          showToast(`Autenticado com sucesso como ${res.user.nome}!`, "success");
          renderAllAdmin();
        } else {
          if (authWallErrorMsg) {
            authWallErrorMsg.textContent = res.error || "E-mail ou senha incorretos.";
            authWallErrorMsg.style.display = "block";
          }
        }
      } catch (err) {
        if (authWallErrorMsg) {
          authWallErrorMsg.textContent = "Erro de autenticação: " + (err.message || err);
          authWallErrorMsg.style.display = "block";
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Entrar";
        }
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      StorageService.logout();
      window.location.href = "index.html";
    });
  }

  // Inicializa Firebase se configurado e renderiza
  FirebaseService.initFirebase();
  verificarAutenticacao();
  renderAllAdmin();
});
