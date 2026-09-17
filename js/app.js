/**
 * APP.JS - CONTROLADOR DA TELA DE APRESENTAÇÃO / DISPLAY TV
 * Gerencia a renderização em tempo real da escala, frotas de caminhões e métricas.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Estado da Aplicação
  const state = {
    selectedArea: "todas",
    searchQuery: "",
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(), // 0 = Jan, 8 = Setembro, etc.
    tvModeActive: false,
    tvRotationInterval: null,
    tvStep: 0
  };

  // Elementos do DOM
  const clockDigitsEl = document.getElementById("clockDigits");
  const clockDateEl = document.getElementById("clockDate");
  const clockShiftEl = document.getElementById("clockShiftTag");
  const trucksGridEl = document.getElementById("trucksGrid");
  const roster3x3ListEl = document.getElementById("roster3x3List");
  const rosterAdmListEl = document.getElementById("rosterAdmList");
  const rosterFolgasListEl = document.getElementById("rosterFolgasList");
  const scheduleTableHeadEl = document.getElementById("scheduleTableHead");
  const scheduleTableBodyEl = document.getElementById("scheduleTableBody");
  const currentMonthDisplayEl = document.getElementById("currentMonthDisplay");
  const searchInputEl = document.getElementById("searchInput");
  const areaTabs = document.querySelectorAll(".area-tab");
  const btnTvMode = document.getElementById("btnTvMode");
  const btnFullscreen = document.getElementById("btnFullscreen");
  const btnPrint = document.getElementById("btnPrint");
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");
  const currentMonthBtn = document.getElementById("currentMonthBtn");

  // Status de Nuvem
  const cloudStatusBadge = document.getElementById("cloudStatusBadge");

  // 1. INICIALIZAÇÃO DO RELÓGIO OPERACIONAL
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    if (clockDigitsEl) {
      clockDigitsEl.textContent = `${hours}:${minutes}:${seconds}`;
    }

    if (clockDateEl) {
      const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
      clockDateEl.textContent = now.toLocaleDateString("pt-BR", options);
    }

    if (clockShiftEl) {
      const h = now.getHours();
      const isNoturno = h >= 19 || h < 7;
      clockShiftEl.innerHTML = isNoturno 
        ? `<span style="color: var(--purple-neon)">●</span> TURNO NOTURNO (19h às 07h)` 
        : `<span style="color: var(--amber-neon)">●</span> TURNO DIURNO (07h às 19h)`;
    }
  }
  setInterval(updateClock, 1000);
  updateClock();

  // 2. FORMATAÇÃO DE DATA ISO (YYYY-MM-DD)
  function getTodayIso() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // 3. RENDERIZAÇÃO DAS ESTATÍSTICAS DO TOPO
  function renderStats(data) {
    const todayIso = getTodayIso();
    const colabs = StorageService.getColaboradores(state.selectedArea);
    const trucks = StorageService.getCaminhoes(state.selectedArea);

    let emTurnoHoje = 0;
    let emFolgaHoje = 0;
    let caminhoesAtivos = 0;

    colabs.forEach((c) => {
      const st = StorageService.calcularStatusDia(c.id, todayIso);
      if (st.status === "T") emTurnoHoje++;
      else emFolgaHoje++;
    });

    trucks.forEach((t) => {
      if (t.status === "em_rota" || t.status === "carregamento") {
        caminhoesAtivos++;
      }
    });

    const statEfetivoEl = document.getElementById("statTotalEfetivo");
    const statEmTurnoEl = document.getElementById("statEmTurno");
    const statCaminhoesEl = document.getElementById("statCaminhoesAtivos");
    const statFolgasEl = document.getElementById("statFolgas");

    if (statEfetivoEl) statEfetivoEl.textContent = colabs.length;
    if (statEmTurnoEl) statEmTurnoEl.textContent = emTurnoHoje;
    if (statCaminhoesEl) statCaminhoesEl.textContent = `${caminhoesAtivos} / ${trucks.length}`;
    if (statFolgasEl) statFolgasEl.textContent = emFolgaHoje;

    // Atualiza contadores nas abas
    const countTodas = StorageService.getColaboradores("todas").length;
    const countSos = StorageService.getColaboradores("sossego").length;
    const countSal = StorageService.getColaboradores("salobo").length;

    const bTodas = document.getElementById("badgeCountTodas");
    const bSos = document.getElementById("badgeCountSossego");
    const bSal = document.getElementById("badgeCountSalobo");

    if (bTodas) bTodas.textContent = countTodas;
    if (bSos) bSos.textContent = countSos;
    if (bSal) bSal.textContent = countSal;
  }

  // 4. RENDERIZAÇÃO DOS CAMINHÕES & DUPLAS OPERACIONAIS
  function renderTrucks() {
    if (!trucksGridEl) return;
    const trucks = StorageService.getCaminhoes(state.selectedArea);
    trucksGridEl.innerHTML = "";

    if (trucks.length === 0) {
      trucksGridEl.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-dim);">
          Nenhum caminhão registrado para esta área operacional.
        </div>
      `;
      return;
    }

    trucks.forEach((truck) => {
      const motorista = truck.motoristaId ? StorageService.getColaboradorById(truck.motoristaId) : null;
      const ajudante = truck.ajudanteId ? StorageService.getColaboradorById(truck.ajudanteId) : null;

      const areaNome = truck.area === "salobo" ? "Salobo (Cobre)" : "Sossego (Mineração)";
      const isSalobo = truck.area === "salobo";

      const statusLabels = {
        em_rota: "Em Rota Operacional",
        carregamento: "Carregamento / Pátio",
        disponivel: "Disponível na Base",
        manutencao: "Manutenção Preventiva"
      };

      const card = document.createElement("div");
      card.className = "truck-card";
      card.innerHTML = `
        <div class="truck-top">
          <div class="truck-identity">
            <div class="truck-number-badge" style="${isSalobo ? 'border-color: var(--emerald-neon); color: var(--emerald-neon);' : ''}">
              <span>CAM</span>
              <span>${truck.numero}</span>
            </div>
            <div class="truck-info">
              <h3>Caminhão ${truck.numero}</h3>
              <div class="truck-placa">${truck.placa || "FROTA OPERACIONAL"} • ${truck.modelo || "Caminhão Traçado"}</div>
            </div>
          </div>
          <span class="truck-status-pill status-${truck.status}">
            <span class="status-dot" style="width:7px;height:7px;"></span>
            ${statusLabels[truck.status] || "Em Rota"}
          </span>
        </div>

        <div class="crew-box">
          <!-- Motorista -->
          <div class="crew-member">
            <div class="crew-role-avatar">
              <div class="role-icon-circle">🚚</div>
              <div class="crew-details">
                <div class="name">${motorista ? motorista.nome : "<span style='color:var(--coral-neon)'>Não escalado</span>"}</div>
                <div class="role">${motorista ? motorista.cargo : "Motorista"}</div>
              </div>
            </div>
            ${motorista && motorista.carteiraMina ? `<span class="badge-mina">★ CARTEIRA MINA</span>` : ""}
          </div>

          <!-- Ajudante -->
          <div class="crew-member">
            <div class="crew-role-avatar">
              <div class="role-icon-circle">👷</div>
              <div class="crew-details">
                <div class="name">${ajudante ? ajudante.nome : "<span style='color:var(--text-dim)'>Aguardando ajudante</span>"}</div>
                <div class="role">${ajudante ? ajudante.cargo : "Ajudante de Motorista"}</div>
              </div>
            </div>
            <span style="font-size:0.75rem; color:var(--text-dim)">Área ${isSalobo ? 'Salobo' : 'Sossego'}</span>
          </div>
        </div>

        <div class="truck-route-footer">
          <span>Destino: <strong>${truck.destino || "Frente de Operação"}</strong></span>
          <span style="font-size:0.72rem; color:var(--text-dim);">${areaNome}</span>
        </div>
      `;
      trucksGridEl.appendChild(card);
    });
  }

  // 5. RENDERIZAÇÃO DOS QUADROS DO DIA
  function renderTodayRoster() {
    const todayIso = getTodayIso();
    const colabs = StorageService.getColaboradores(state.selectedArea);
    const query = state.searchQuery.toLowerCase().trim();

    const list3x3 = [];
    const listAdm = [];
    const listFolga = [];

    colabs.forEach((c) => {
      // Filtro de busca
      if (query) {
        const matches = c.nome.toLowerCase().includes(query) ||
                        c.cargo.toLowerCase().includes(query) ||
                        c.situacao.toLowerCase().includes(query);
        if (!matches) return;
      }

      const st = StorageService.calcularStatusDia(c.id, todayIso);

      if (st.status === "T") {
        if (c.regime === "3X3" || c.situacao.includes("3X3")) {
          list3x3.push({ colab: c, status: st });
        } else {
          listAdm.push({ colab: c, status: st });
        }
      } else {
        listFolga.push({ colab: c, status: st });
      }
    });

    // Renderiza 3x3 Ativo
    if (roster3x3ListEl) {
      roster3x3ListEl.innerHTML = list3x3.length === 0 
        ? `<div style="color:var(--text-dim);padding:16px;text-align:center">Nenhum colaborador 3x3 escalado.</div>` 
        : list3x3.map(({ colab, status }) => createRosterItemHtml(colab, status)).join("");
    }

    // Renderiza ADM Ativo
    if (rosterAdmListEl) {
      rosterAdmListEl.innerHTML = listAdm.length === 0 
        ? `<div style="color:var(--text-dim);padding:16px;text-align:center">Nenhum expediente administrativo.</div>` 
        : listAdm.map(({ colab, status }) => createRosterItemHtml(colab, status)).join("");
    }

    // Renderiza Folgas e Afastamentos
    if (rosterFolgasListEl) {
      rosterFolgasListEl.innerHTML = listFolga.length === 0 
        ? `<div style="color:var(--text-dim);padding:16px;text-align:center">Sem registros de folga/férias.</div>` 
        : listFolga.map(({ colab, status }) => createRosterItemHtml(colab, status)).join("");
    }
  }

  function createRosterItemHtml(colab, st) {
    const initials = colab.nome.split(" ").slice(0, 2).map((n) => n[0]).join("");
    const isSalobo = colab.area === "salobo";

    let tagClass = "tag-trabalho";
    let tagText = st.turno;

    if (st.status === "F") { tagClass = "tag-folga"; tagText = "Folga"; }
    else if (st.status === "FE") { tagClass = "tag-ferias"; tagText = "Férias"; }
    else if (st.status === "AT") { tagClass = "tag-atestado"; tagText = "Atestado"; }
    else if (st.status === "TR") { tagClass = "tag-trabalho"; tagText = "Treinamento"; }

    return `
      <div class="roster-item">
        <div class="roster-user-info">
          <div class="avatar-badge ${isSalobo ? 'salobo' : ''}">${initials}</div>
          <div class="roster-texts">
            <div class="name">${colab.nome}</div>
            <div class="role">${colab.cargo} • ${isSalobo ? 'Salobo' : 'Sossego'}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          ${colab.carteiraMina ? `<span class="badge-mina">MINA</span>` : ""}
          <span class="roster-status-tag ${tagClass}">${tagText}</span>
        </div>
      </div>
    `;
  }

  // 6. RENDERIZAÇÃO DA GRADE MENSAL DE ESCALA
  function renderScheduleTable() {
    if (!scheduleTableHeadEl || !scheduleTableBodyEl) return;

    const year = state.currentYear;
    const month = state.currentMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDay = today.getDate();

    // Atualiza cabeçalho do mês
    const monthDate = new Date(year, month, 1);
    const monthName = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    if (currentMonthDisplayEl) {
      currentMonthDisplayEl.textContent = monthName;
    }

    // Cabeçalho da Tabela
    let headHtml = `
      <tr>
        <th class="col-colab">Colaborador</th>
        <th class="col-cargo">Cargo / Área</th>
    `;

    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d);
      const weekDayLetter = dayDate.toLocaleDateString("pt-BR", { weekday: "narrow" });
      const isToday = isCurrentMonth && d === todayDay;
      headHtml += `
        <th class="${isToday ? 'today-header' : ''}">
          <div style="font-size:0.7rem;opacity:0.7">${weekDayLetter}</div>
          <div>${String(d).padStart(2, "0")}</div>
        </th>
      `;
    }
    headHtml += `</tr>`;
    scheduleTableHeadEl.innerHTML = headHtml;

    // Linhas de Colaboradores
    const colabs = StorageService.getColaboradores(state.selectedArea);
    const query = state.searchQuery.toLowerCase().trim();

    let bodyHtml = "";
    colabs.forEach((c) => {
      if (query) {
        const matches = c.nome.toLowerCase().includes(query) ||
                        c.cargo.toLowerCase().includes(query) ||
                        c.situacao.toLowerCase().includes(query);
        if (!matches) return;
      }

      const isSalobo = c.area === "salobo";
      bodyHtml += `
        <tr>
          <td class="col-colab">
            <div style="font-weight:600; color:var(--text-main); font-size:0.85rem;">
              ${c.nome}
              ${c.carteiraMina ? ` <span class="badge-mina" style="font-size:0.65rem;padding:1px 4px;">MINA</span>` : ""}
            </div>
            <div style="font-size:0.7rem; color:var(--text-dim);">
              ${c.situacao} ${c.turma3x3 ? `(Turma ${c.turma3x3})` : ''}
            </div>
          </td>
          <td class="col-cargo">
            <span style="color:${isSalobo ? 'var(--emerald-neon)' : 'var(--cyan-neon)'}">●</span>
            ${c.cargo} • ${isSalobo ? 'Salobo' : 'Sossego'}
          </td>
      `;

      for (let d = 1; d <= daysInMonth; d++) {
        const dateIso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const st = StorageService.calcularStatusDia(c.id, dateIso);
        const isToday = isCurrentMonth && d === todayDay;

        let cellClass = "cell-t";
        if (st.status === "F") cellClass = "cell-f";
        else if (st.status === "FE") cellClass = "cell-fe";
        else if (st.status === "AT") cellClass = "cell-at";
        else if (st.status === "TR") cellClass = "cell-tr";

        bodyHtml += `
          <td class="day-cell ${cellClass} ${isToday ? 'cell-today' : ''}" title="${c.nome}: ${st.detalhe}">
            ${st.status}
          </td>
        `;
      }
      bodyHtml += `</tr>`;
    });

    scheduleTableBodyEl.innerHTML = bodyHtml;
  }

  // 7. RENDERIZAÇÃO COMPLETA DA APLICAÇÃO
  function renderAll() {
    const data = StorageService.getData();
    renderStats(data);
    renderTrucks();
    renderTodayRoster();
    renderScheduleTable();
  }

  // 8. EVENT LISTENERS & FILTROS

  // Abas de Área (Todas, Sossego, Salobo)
  areaTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      areaTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      state.selectedArea = tab.getAttribute("data-area");
      renderAll();
    });
  });

  // Campo de Busca em Tempo Real
  if (searchInputEl) {
    searchInputEl.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderTodayRoster();
      renderScheduleTable();
    });
  }

  // Navegação de Meses
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
      state.currentMonth--;
      if (state.currentMonth < 0) {
        state.currentMonth = 11;
        state.currentYear--;
      }
      renderScheduleTable();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", () => {
      state.currentMonth++;
      if (state.currentMonth > 11) {
        state.currentMonth = 0;
        state.currentYear++;
      }
      renderScheduleTable();
    });
  }

  if (currentMonthBtn) {
    currentMonthBtn.addEventListener("click", () => {
      const now = new Date();
      state.currentYear = now.getFullYear();
      state.currentMonth = now.getMonth();
      renderScheduleTable();
    });
  }

  // Modo TV / Apresentação Automática
  if (btnTvMode) {
    btnTvMode.addEventListener("click", () => {
      state.tvModeActive = !state.tvModeActive;
      btnTvMode.classList.toggle("btn-active-tv", state.tvModeActive);

      if (state.tvModeActive) {
        showToast("Modo Apresentação TV ativado! Rotação a cada 15 segundos.", "success");
        state.tvRotationInterval = setInterval(() => {
          const areas = ["todas", "sossego", "salobo"];
          state.tvStep = (state.tvStep + 1) % areas.length;
          const targetArea = areas[state.tvStep];

          areaTabs.forEach((t) => {
            if (t.getAttribute("data-area") === targetArea) {
              t.click();
            }
          });
        }, 15000);
      } else {
        clearInterval(state.tvRotationInterval);
        showToast("Modo TV desativado.", "warning");
      }
    });
  }

  // Fullscreen
  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Fullscreen não suportado ou bloqueado:", err);
        });
      } else {
        document.exitFullscreen();
      }
    });
  }

  // Impressão / PDF
  if (btnPrint) {
    btnPrint.addEventListener("click", () => {
      window.print();
    });
  }

  // 9. STATUS FIREBASE
  FirebaseService.onStatusChange((connected, msg) => {
    if (cloudStatusBadge) {
      cloudStatusBadge.innerHTML = connected
        ? `<span class="status-dot" style="width:7px;height:7px;background:var(--emerald-neon)"></span> Firebase: Online`
        : `<span class="status-dot" style="width:7px;height:7px;background:var(--amber-neon)"></span> Modo Local`;
    }
  });

  // 10. REATIVIDADE COM STORAGE (SINCRONIZAÇÃO EM TEMPO REAL)
  StorageService.subscribe(() => {
    renderAll();
  });

  // Função Auxiliar de Notificação Toast
  function showToast(message, type = "success") {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(50px)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Render inicial
  renderAll();
});
