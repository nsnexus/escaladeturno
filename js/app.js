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
    tvStep: 0,
    calendarMode: "calendar", // "calendar" (padrao mobile) ou "table"
    selectedCalendarColabId: localStorage.getItem("escala_meu_colaborador_id") || null,
    selectedCalendarDay: new Date().getDate(),
    adminViewMode: StorageService.getUsuarioLogado() ? "full" : "individual",
    pickerQuickArea: "todas"
  };

  // Função utilitária para normalizar strings (busca inteligente sem acentos)
  function normalizeText(text) {
    return (text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

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

  // Elementos da Nova Visualização em Formato Calendário (Mobile & Desktop)
  const btnViewCalendar = document.getElementById("btnViewCalendar");
  const btnViewTable = document.getElementById("btnViewTable");
  const calendarGridContainer = document.getElementById("calendarGridContainer");
  const calendarTableContainer = document.getElementById("calendarTableContainer");
  const calendarColabSelect = document.getElementById("calendarColabSelect");
  const btnUseMyProfileCalendar = document.getElementById("btnUseMyProfileCalendar");
  const calendarMonthStats = document.getElementById("calendarMonthStats");
  const calendarDaysGrid = document.getElementById("calendarDaysGrid");
  const calendarDayDetails = document.getElementById("calendarDayDetails");

  // Status de Nuvem
  const cloudStatusBadge = document.getElementById("cloudStatusBadge");

  // Elementos de Sessão de Liderança / Admin
  const btnAdminTrigger = document.getElementById("btnAdminTrigger");
  const txtAdminTrigger = document.getElementById("txtAdminTrigger");
  const iconAdminTrigger = document.getElementById("iconAdminTrigger");
  const adminSessionBar = document.getElementById("adminSessionBar");
  const adminSessionEmail = document.getElementById("adminSessionEmail");
  const btnAdminViewIndividual = document.getElementById("btnAdminViewIndividual");
  const btnAdminViewFull = document.getElementById("btnAdminViewFull");
  const btnAdminLogout = document.getElementById("btnAdminLogout");
  const viewUsuarioComum = document.getElementById("viewUsuarioComum");
  const viewControleCompletoAdmin = document.getElementById("viewControleCompletoAdmin");
  const calendarViewSwitcher = document.getElementById("calendarViewSwitcher");
  const calendarColabPickerBar = document.getElementById("calendarColabPickerBar");

  // Alternador de Visão de Permissão (Usuário Comum vs Administrador / Liderança)
  function updateAdminUIMode() {
    const adminUser = StorageService.getUsuarioLogado();

    if (adminUser) {
      if (adminSessionBar) adminSessionBar.style.display = "flex";
      if (adminSessionEmail) adminSessionEmail.textContent = adminUser.email;
      if (txtAdminTrigger) txtAdminTrigger.textContent = "Painel Admin";
      if (iconAdminTrigger) {
        iconAdminTrigger.className = "fa-solid fa-sliders";
      }

      if (state.adminViewMode === "full") {
        if (viewControleCompletoAdmin) viewControleCompletoAdmin.style.display = "block";
        if (calendarViewSwitcher) calendarViewSwitcher.style.display = "flex";
        if (calendarColabPickerBar) calendarColabPickerBar.style.display = "flex";
        if (btnAdminViewFull) btnAdminViewFull.classList.add("active");
        if (btnAdminViewIndividual) btnAdminViewIndividual.classList.remove("active");
      } else {
        if (viewControleCompletoAdmin) viewControleCompletoAdmin.style.display = "none";
        if (calendarViewSwitcher) calendarViewSwitcher.style.display = "none";
        if (calendarColabPickerBar) calendarColabPickerBar.style.display = "none";
        if (btnAdminViewIndividual) btnAdminViewIndividual.classList.add("active");
        if (btnAdminViewFull) btnAdminViewFull.classList.remove("active");
      }
    } else {
      // Usuário comum sem login de gestor
      if (adminSessionBar) adminSessionBar.style.display = "none";
      if (viewControleCompletoAdmin) viewControleCompletoAdmin.style.display = "none";
      if (calendarViewSwitcher) calendarViewSwitcher.style.display = "none";
      if (calendarColabPickerBar) calendarColabPickerBar.style.display = "none";
      if (txtAdminTrigger) txtAdminTrigger.textContent = "Liderança / Admin";
      if (iconAdminTrigger) {
        iconAdminTrigger.className = "fa-solid fa-lock";
      }
    }
  }

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
    const myColabId = localStorage.getItem("escala_meu_colaborador_id");

    let bodyHtml = "";
    colabs.forEach((c) => {
      if (query) {
        const matches = c.nome.toLowerCase().includes(query) ||
                        c.cargo.toLowerCase().includes(query) ||
                        c.situacao.toLowerCase().includes(query);
        if (!matches) return;
      }

      const isSalobo = c.area === "salobo";
      const isMyColab = c.id === myColabId;

      bodyHtml += `
        <tr class="${isMyColab ? 'my-colab-row' : ''}">
          <td class="col-colab">
            <div style="font-weight:600; color:var(--text-main); font-size:0.85rem; display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
              <span>${c.nome}</span>
              ${c.carteiraMina ? ` <span class="badge-mina" style="font-size:0.65rem;padding:1px 4px;">MINA</span>` : ""}
              ${isMyColab ? `<span style="background: rgba(56,189,248,0.18); color: var(--cyan-neon); font-size: 0.65rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--cyan-neon);">⭐ Você</span>` : ""}
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

  // ==========================================================================
  // FORMATO DE CALENDÁRIO MENSAL (MOBILE & DESKTOP FIRST)
  // ==========================================================================

  function populateCalendarColabSelect() {
    if (!calendarColabSelect) return;

    const allColabs = StorageService.getColaboradores("todas");
    const sossegoColabs = allColabs.filter(c => c.area === "sossego").sort((a, b) => a.nome.localeCompare(b.nome));
    const saloboColabs = allColabs.filter(c => c.area === "salobo").sort((a, b) => a.nome.localeCompare(b.nome));

    // Determinar colaborador padrão: salvo no celular ou primeiro se for gestor
    const savedId = localStorage.getItem("escala_meu_colaborador_id");
    if (savedId && allColabs.some(c => c.id === savedId)) {
      state.selectedCalendarColabId = savedId;
    } else if (!state.selectedCalendarColabId && allColabs.length > 0) {
      const admin = StorageService.getUsuarioLogado();
      if (admin && state.adminViewMode === "full") {
        state.selectedCalendarColabId = allColabs[0].id;
      }
    }

    let optionsHtml = "";
    optionsHtml += `<optgroup label="Área Sossego (18 Colaboradores)">`;
    sossegoColabs.forEach(c => {
      const isSaved = c.id === savedId;
      optionsHtml += `<option value="${c.id}" ${c.id === state.selectedCalendarColabId ? 'selected' : ''}>${c.nome} • ${c.cargo} (Turma ${c.turma3x3 || 'A'})${isSaved ? ' ⭐' : ''}</option>`;
    });
    optionsHtml += `</optgroup>`;

    optionsHtml += `<optgroup label="Área Salobo (18 Colaboradores)">`;
    saloboColabs.forEach(c => {
      const isSaved = c.id === savedId;
      optionsHtml += `<option value="${c.id}" ${c.id === state.selectedCalendarColabId ? 'selected' : ''}>${c.nome} • ${c.cargo} (Turma ${c.turma3x3 || 'A'})${isSaved ? ' ⭐' : ''}</option>`;
    });
    optionsHtml += `</optgroup>`;

    calendarColabSelect.innerHTML = optionsHtml;
  }

  function renderCalendarGrid() {
    if (!calendarDaysGrid) return;

    const allColabs = StorageService.getColaboradores("todas");
    if (!allColabs.length) return;

    // Se o colaborador selecionado não existir, verifica se é gestor ou convida a selecionar
    let colab = allColabs.find(c => c.id === state.selectedCalendarColabId);
    if (!colab) {
      const admin = StorageService.getUsuarioLogado();
      if (admin && state.adminViewMode === "full") {
        colab = allColabs[0];
        state.selectedCalendarColabId = colab.id;
      } else {
        // Usuário comum ainda não selecionou seu perfil
        calendarDaysGrid.innerHTML = `
          <div style="grid-column: 1/-1; padding: 48px 20px; text-align: center; color: var(--text-muted); background: #ffffff; border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
            <div style="font-size: 2rem; color: var(--hc-green); margin-bottom: 10px;">
              <i class="fa-solid fa-arrow-up"></i>
            </div>
            <h3 style="font-size: 1.05rem; color: var(--text-main); font-weight: 700; margin-bottom: 6px;">Selecione seu nome acima</h3>
            <p style="font-size: 0.85rem; max-width: 440px; margin: 0 auto; line-height: 1.5;">
              Para consultar sua escala mensal completa com todos os dias de turno e folga, pesquise e clique no seu perfil acima.
            </p>
          </div>
        `;
        if (calendarMonthStats) calendarMonthStats.innerHTML = "";
        if (calendarDayDetails) calendarDayDetails.innerHTML = "";
        return;
      }
    }

    const year = state.currentYear;
    const month = state.currentMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo, 6 = Sábado
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDay = today.getDate();

    // Atualiza o mês exibido
    const monthDate = new Date(year, month, 1);
    const monthName = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    if (currentMonthDisplayEl) {
      currentMonthDisplayEl.textContent = monthName;
    }

    // Renderiza Resumo do Mês
    renderCalendarMonthStats(colab, year, month);

    // Renderiza Grade de Dias
    let gridHtml = "";

    // 1. Dias residuais do mês anterior
    for (let i = 0; i < firstDayIndex; i++) {
      const prevDayNum = daysInPrevMonth - firstDayIndex + 1 + i;
      gridHtml += `
        <div class="calendar-day-card is-other-month">
          <div class="day-header">
            <span class="day-num" style="color:var(--text-dim);">${prevDayNum}</span>
          </div>
        </div>
      `;
    }

    // Busca caminhões para associar
    const trucks = StorageService.getCaminhoes();
    const meuCaminhao = trucks.find(t => t.motoristaId === colab.id || t.ajudanteId === colab.id);

    // Garante que o dia selecionado é válido no mês
    if (state.selectedCalendarDay > daysInMonth) {
      state.selectedCalendarDay = 1;
    }
    if (isCurrentMonth && !state.selectedCalendarDay) {
      state.selectedCalendarDay = todayDay;
    }

    // 2. Dias do mês atual
    for (let d = 1; d <= daysInMonth; d++) {
      const dateIso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const st = StorageService.calcularStatusDia(colab.id, dateIso);
      const isToday = isCurrentMonth && d === todayDay;
      const isSelected = d === state.selectedCalendarDay;

      let statusBoxClass = "status-t";
      let shortText = "T";
      let fullText = "Trabalho";

      if (st.status === "F") {
        statusBoxClass = "status-f";
        shortText = "F";
        fullText = "Folga";
      } else if (st.status === "FE") {
        statusBoxClass = "status-fe";
        shortText = "FE";
        fullText = "Férias";
      } else if (st.status === "AT") {
        statusBoxClass = "status-at";
        shortText = "AT";
        fullText = "Atestado";
      } else if (st.status === "TR") {
        statusBoxClass = "status-tr";
        shortText = "TR";
        fullText = "Treino";
      }

      // Turno curto (ex: 19h ou 07h)
      const turnoTag = st.turno === "NOTURNO" ? "19h" : (st.turno === "DIURNO" ? "07h" : "ADM");

      gridHtml += `
        <div class="calendar-day-card ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" data-day="${d}">
          <div class="day-header">
            <span class="day-num">${d}</span>
            ${isToday ? `<span class="today-chip">HOJE</span>` : ""}
          </div>
          <div class="day-status-box ${statusBoxClass}">
            <span class="status-text-short">${shortText} <span style="font-size:0.55rem;opacity:0.8;">${st.status === 'T' ? turnoTag : ''}</span></span>
            <span class="status-text-full">${fullText} ${st.status === 'T' ? `(${turnoTag})` : ''}</span>
          </div>
          ${st.status === 'T' && meuCaminhao ? `<div class="day-truck-chip">🚛 C${meuCaminhao.numero}</div>` : ''}
          ${st.temExtra ? `<div class="day-extra-chip" style="background:#fef3c7; color:#b45309; font-size:0.68rem; font-weight:800; border-radius:4px; padding:2px 4px; margin-top:3px; border:1px solid #fde68a; display:flex; align-items:center; justify-content:center; gap:3px;" title="Escala Extra: ${st.escalaExtra.tipo} (${st.escalaExtra.horaInicio}-${st.escalaExtra.horaFim}) - ${st.escalaExtra.motivo}"><i class="fa-solid fa-bolt" style="font-size:0.6rem;"></i> +${st.escalaExtra.totalHoras}h Extra</div>` : ''}
        </div>
      `;
    }

    // 3. Dias residuais do próximo mês para completar grid de 7
    const totalCells = firstDayIndex + daysInMonth;
    const nextDaysCount = (7 - (totalCells % 7)) % 7;
    for (let j = 1; j <= nextDaysCount; j++) {
      gridHtml += `
        <div class="calendar-day-card is-other-month">
          <div class="day-header">
            <span class="day-num" style="color:var(--text-dim);">${j}</span>
          </div>
        </div>
      `;
    }

    calendarDaysGrid.innerHTML = gridHtml;

    // Adiciona listener de clique em cada dia
    const dayCards = calendarDaysGrid.querySelectorAll(".calendar-day-card:not(.is-other-month)");
    dayCards.forEach(card => {
      card.addEventListener("click", () => {
        const day = parseInt(card.getAttribute("data-day"), 10);
        state.selectedCalendarDay = day;
        dayCards.forEach(c => c.classList.remove("is-selected"));
        card.classList.add("is-selected");
        renderSelectedDayDetails(colab, year, month, day);
      });
    });

    // Renderiza painel de detalhes do dia selecionado
    renderSelectedDayDetails(colab, year, month, state.selectedCalendarDay || 1);
  }

  function renderCalendarMonthStats(colab, year, month) {
    if (!calendarMonthStats) return;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workDays = 0;
    let offDays = 0;
    let nextOffDay = null;
    let totalHorasExtrasMes = 0;

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDay = today.getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateIso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const st = StorageService.calcularStatusDia(colab.id, dateIso);
      if (st.status === "T") {
        workDays++;
      } else if (st.status === "F") {
        offDays++;
        if (isCurrentMonth && d >= todayDay && !nextOffDay) {
          nextOffDay = d;
        }
      }

      if (st.temExtra && st.escalaExtra) {
        totalHorasExtrasMes += parseFloat(st.escalaExtra.totalHoras) || 0;
      }
    }

    const trucks = StorageService.getCaminhoes();
    const meuCaminhao = trucks.find(t => t.motoristaId === colab.id || t.ajudanteId === colab.id);
    const truckStr = meuCaminhao ? `CAM ${meuCaminhao.numero}` : "Reserva / ADM";

    let folgaTexto = "Programada";
    if (isCurrentMonth) {
      if (nextOffDay === todayDay) {
        folgaTexto = "Hoje!";
      } else if (nextOffDay) {
        const diff = nextOffDay - todayDay;
        folgaTexto = `Dia ${nextOffDay} (${diff}d)`;
      } else {
        folgaTexto = "Fim do ciclo";
      }
    } else {
      folgaTexto = `${offDays} dias`;
    }

    calendarMonthStats.innerHTML = `
      <div class="calendar-stat-pill">
        <span class="num" style="color:var(--emerald-neon);">${workDays}</span>
        <span class="label">Dias de Trabalho</span>
      </div>
      <div class="calendar-stat-pill">
        <span class="num" style="color:var(--text-muted);">${offDays}</span>
        <span class="label">Dias de Folga</span>
      </div>
      ${totalHorasExtrasMes > 0 ? `
        <div class="calendar-stat-pill" style="border-color: #fde68a; background: #fffbeb;">
          <span class="num" style="color: #d97706;">+${totalHorasExtrasMes.toFixed(1)}h</span>
          <span class="label" style="color: #92400e;">Horas Extras</span>
        </div>
      ` : ''}
      <div class="calendar-stat-pill">
        <span class="num" style="color:var(--cyan-neon);">${folgaTexto}</span>
        <span class="label">Próxima Folga</span>
      </div>
      <div class="calendar-stat-pill">
        <span class="num" style="color:var(--amber-neon);">${truckStr}</span>
        <span class="label">Caminhão</span>
      </div>
    `;
  }

  function renderSelectedDayDetails(colab, year, month, day) {
    if (!calendarDayDetails) return;

    const date = new Date(year, month, day);
    const dateIso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const st = StorageService.calcularStatusDia(colab.id, dateIso);

    const dateFormatted = date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const isSalobo = colab.area === "salobo";
    const areaName = isSalobo ? "Área Salobo (4 Caminhões)" : "Área Sossego (3 Caminhões)";

    // Caminhão e dupla
    const trucks = StorageService.getCaminhoes();
    const meuCaminhao = trucks.find(t => t.motoristaId === colab.id || t.ajudanteId === colab.id);

    let infoVeiculo = "Apoio / Reserva Técnica";
    let infoDupla = "Disponível na Base";
    if (meuCaminhao) {
      infoVeiculo = `Caminhão ${meuCaminhao.numero} (${meuCaminhao.placa || 'Sem Placa'} • ${meuCaminhao.modelo || 'Traçado'})`;
      if (meuCaminhao.motoristaId === colab.id) {
        const ajudante = meuCaminhao.ajudanteId ? StorageService.getColaboradorById(meuCaminhao.ajudanteId) : null;
        infoDupla = ajudante ? `${ajudante.nome} (Ajudante)` : "Aguardando ajudante";
      } else {
        const motorista = meuCaminhao.motoristaId ? StorageService.getColaboradorById(meuCaminhao.motoristaId) : null;
        infoDupla = motorista ? `${motorista.nome} (Motorista)` : "Aguardando motorista";
      }
    }

    let statusPillHtml = "";
    if (st.status === "T") {
      statusPillHtml = `<span class="badge badge-emerald" style="font-size:0.85rem; padding:4px 10px;">● TRABALHO • ${st.turno} (${st.turno === 'NOTURNO' ? '19h às 07h' : '07h às 19h'})</span>`;
    } else if (st.status === "F") {
      statusPillHtml = `<span class="badge badge-purple" style="font-size:0.85rem; padding:4px 10px;">○ FOLGA DE REVEZAMENTO (3x3)</span>`;
    } else if (st.status === "FE") {
      statusPillHtml = `<span class="badge badge-purple" style="font-size:0.85rem; padding:4px 10px;">🟣 EM FÉRIAS</span>`;
    } else if (st.status === "AT") {
      statusPillHtml = `<span class="badge badge-amber" style="font-size:0.85rem; padding:4px 10px;">🟡 ATESTADO MÉDICO</span>`;
    } else {
      statusPillHtml = `<span class="badge badge-cyan" style="font-size:0.85rem; padding:4px 10px;">🔵 ${st.detalhe || 'TREINAMENTO'}</span>`;
    }

    let extraCalloutHtml = "";
    if (st.temExtra && st.escalaExtra) {
      const ex = st.escalaExtra;
      const tipoLabels = {
        prorrogacao: "Prorrogação de Jornada",
        folga: "Convocação na Folga (3x3)",
        feriado: "Plantão Extra de Feriado",
        especial: "Operação Especial / Parada"
      };
      extraCalloutHtml = `
        <div style="width: 100%; margin-top: 10px; padding: 10px 14px; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.25rem; color: #f59e0b;"><i class="fa-solid fa-bolt"></i></span>
            <div>
              <div style="font-size: 0.86rem; font-weight: 800; color: #92400e;">
                ${tipoLabels[ex.tipo] || ex.tipo}: ${ex.horaInicio} às ${ex.horaFim} (+${ex.totalHoras}h extras)
              </div>
              <div style="font-size: 0.78rem; color: #78350f; margin-top: 1px;">
                <strong>Motivo:</strong> ${ex.motivo || 'Rotina operacional'} ${ex.frente ? `• <strong>Local:</strong> ${ex.frente}` : ''}
              </div>
            </div>
          </div>
          <span style="background: #ffffff; color: #b45309; font-weight: 800; font-size: 0.75rem; padding: 3px 9px; border-radius: 999px; border: 1px solid #fde68a;">
            ⚡ Convocação Extra Oficial
          </span>
        </div>
      `;
    }

    calendarDayDetails.innerHTML = `
      <div style="flex: 1; min-width: 240px;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
          <span style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); text-transform: capitalize;">
            📅 ${dateFormatted}
          </span>
          ${statusPillHtml}
        </div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">
          Colaborador: <strong style="color:var(--text-main);">${colab.nome}</strong> (${colab.cargo}) • ${areaName} • Turma ${colab.turma3x3 || 'A'}
        </div>
      </div>

      <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
        <div style="font-size: 0.82rem; line-height: 1.4;">
          <div>🚛 <strong>Veículo:</strong> ${infoVeiculo}</div>
          <div>👥 <strong>Dupla:</strong> ${infoDupla}</div>
        </div>
      </div>
      ${extraCalloutHtml}
    `;
  }

  // ==========================================================================
  // MINHA ESCALA: CONSULTA PESSOAL & FIXAÇÃO LOCAL NO CELULAR (MOBILE-FIRST)
  // ==========================================================================
  function renderPersonalSchedule() {
    const heroEl = document.getElementById("personalScheduleHero");
    if (!heroEl) return;

    const savedId = localStorage.getItem("escala_meu_colaborador_id");
    const allColabs = StorageService.getColaboradores("todas");

    // ========================================================================
    // CENÁRIO 1: NENHUM COLABORADOR SELECIONADO (CAMPO DE BUSCA COM DIGITAÇÃO)
    // ========================================================================
    if (!savedId) {
      const sossegoCount = allColabs.filter(c => c.area === "sossego").length;
      const saloboCount = allColabs.filter(c => c.area === "salobo").length;

      heroEl.innerHTML = `
        <div class="personal-picker-row" style="flex-direction: column; align-items: stretch; gap: 16px;">
          <div>
            <div class="personal-hero-title">
              <i class="fa-solid fa-user-tag" style="color: var(--hc-green); font-size: 1.25rem;"></i>
              <span>Minha Escala Individual</span>
              <span class="personal-badge-tag"><i class="fa-solid fa-mobile-screen"></i> Consulta Rápida</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; line-height: 1.4;">
              Digite seu nome ou matrícula abaixo para ver seus dias de trabalho, caminhão, parceiro e folgas:
            </p>
          </div>

          <!-- Campo de Busca com Digitação e Autocomplete em Tempo Real -->
          <div class="colab-search-container">
            <div class="colab-search-input-wrap">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input 
                type="text" 
                id="inputBuscaColab" 
                class="colab-search-input" 
                placeholder="Digite seu nome (ex: Carlos, Raimundo, Francisco...) ou matrícula..." 
                autocomplete="off"
              />
              <button type="button" id="btnClearColabSearch" class="colab-search-clear" title="Limpar pesquisa">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <!-- Lista suspensa de sugestões em tempo real -->
            <div id="colabSuggestionsList" class="colab-suggestions-list"></div>
          </div>

          <!-- Toque Rápido com Abas de Área -->
          <div class="colab-quick-container">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
              <span style="font-size: 0.76rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">
                <i class="fa-solid fa-hand-pointer"></i> Ou selecione diretamente na lista:
              </span>
              <div class="colab-quick-filter-tabs" id="quickAreaTabs">
                <button type="button" class="colab-quick-tab ${state.pickerQuickArea === 'todas' ? 'active' : ''}" data-area="todas">Todas (${allColabs.length})</button>
                <button type="button" class="colab-quick-tab ${state.pickerQuickArea === 'sossego' ? 'active' : ''}" data-area="sossego">Sossego (${sossegoCount})</button>
                <button type="button" class="colab-quick-tab ${state.pickerQuickArea === 'salobo' ? 'active' : ''}" data-area="salobo">Salobo (${saloboCount})</button>
              </div>
            </div>
            <div id="colabQuickGrid" class="colab-quick-grid"></div>
          </div>
        </div>
      `;

      const inputBusca = document.getElementById("inputBuscaColab");
      const btnClear = document.getElementById("btnClearColabSearch");
      const suggestionsList = document.getElementById("colabSuggestionsList");
      const quickGrid = document.getElementById("colabQuickGrid");
      const quickAreaTabs = document.querySelectorAll("#quickAreaTabs .colab-quick-tab");

      function saveProfile(id) {
        if (!id) return;
        localStorage.setItem("escala_meu_colaborador_id", id);
        state.selectedCalendarColabId = id;
        const savedColab = StorageService.getColaboradorById(id);
        showToast(`Olá, ${savedColab ? savedColab.nome : 'Colaborador'}! Sua escala foi carregada.`, "success");
        renderPersonalSchedule();
        populateCalendarColabSelect();
        renderCalendarGrid();
        renderScheduleTable();
      }

      function getFilteredList(query, area) {
        const normQ = normalizeText(query);
        return allColabs.filter(c => {
          const matchArea = area === "todas" || c.area === area;
          if (!matchArea) return false;
          if (!normQ) return true;
          const matchNome = normalizeText(c.nome).includes(normQ);
          const matchCargo = normalizeText(c.cargo).includes(normQ);
          const matchMatricula = normalizeText(c.matricula).includes(normQ);
          return matchNome || matchCargo || matchMatricula;
        }).sort((a, b) => a.nome.localeCompare(b.nome));
      }

      function renderQuickGrid() {
        if (!quickGrid) return;
        const currentQuery = inputBusca ? inputBusca.value : "";
        const list = getFilteredList(currentQuery, state.pickerQuickArea);

        if (list.length === 0) {
          quickGrid.innerHTML = `
            <div style="grid-column: 1/-1; padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.88rem;">
              <i class="fa-solid fa-magnifying-glass" style="margin-bottom: 6px; display: block; font-size: 1.2rem; opacity: 0.6;"></i>
              Nenhum colaborador encontrado com "${currentQuery}".
            </div>
          `;
          return;
        }

        quickGrid.innerHTML = list.map(c => {
          const isSalobo = c.area === "salobo";
          return `
            <div class="colab-quick-card" data-colab-id="${c.id}">
              <div class="colab-quick-info">
                <div class="colab-quick-name">${c.nome}</div>
                <div class="colab-quick-meta">
                  <span>${c.cargo}</span>
                  <span>•</span>
                  <span style="color: ${isSalobo ? 'var(--hc-green-dark)' : '#0369a1'}; font-weight: 700;">
                    ${isSalobo ? 'Salobo' : 'Sossego'}
                  </span>
                  <span>•</span>
                  <span>Turma ${c.turma3x3 || 'A'}</span>
                </div>
              </div>
              <i class="fa-solid fa-chevron-right colab-quick-arrow"></i>
            </div>
          `;
        }).join("");

        quickGrid.querySelectorAll(".colab-quick-card").forEach(card => {
          card.addEventListener("click", () => {
            const id = card.getAttribute("data-colab-id");
            saveProfile(id);
          });
        });
      }

      function updateSuggestions(query) {
        if (!suggestionsList) return;
        const normQ = normalizeText(query);
        if (!normQ) {
          suggestionsList.classList.remove("open");
          suggestionsList.innerHTML = "";
          return;
        }

        const matches = allColabs.filter(c => {
          return normalizeText(c.nome).includes(normQ) ||
                 normalizeText(c.cargo).includes(normQ) ||
                 normalizeText(c.matricula).includes(normQ);
        }).slice(0, 8);

        if (matches.length === 0) {
          suggestionsList.innerHTML = `
            <div style="padding: 12px 14px; color: var(--text-muted); font-size: 0.84rem;">
              Nenhum colaborador encontrado com este nome.
            </div>
          `;
          suggestionsList.classList.add("open");
          return;
        }

        suggestionsList.innerHTML = matches.map(c => {
          const isSalobo = c.area === "salobo";
          return `
            <div class="colab-suggestion-item" data-colab-id="${c.id}">
              <div>
                <div class="colab-suggestion-name">${c.nome}</div>
                <div class="colab-suggestion-meta">${c.cargo} • Matrícula: ${c.matricula || 'N/D'}</div>
              </div>
              <div class="colab-suggestion-badges">
                <span class="personal-badge-tag" style="background: ${isSalobo ? 'rgba(0, 166, 81, 0.12)' : 'rgba(14, 165, 233, 0.12)'}; color: ${isSalobo ? 'var(--hc-green-dark)' : '#0369a1'}; font-size: 0.68rem; padding: 2px 6px;">
                  ${isSalobo ? 'Salobo' : 'Sossego'}
                </span>
                <span class="personal-badge-tag" style="font-size: 0.68rem; padding: 2px 6px;">
                  Turma ${c.turma3x3 || 'A'}
                </span>
              </div>
            </div>
          `;
        }).join("");

        suggestionsList.classList.add("open");

        suggestionsList.querySelectorAll(".colab-suggestion-item").forEach(item => {
          item.addEventListener("click", () => {
            const id = item.getAttribute("data-colab-id");
            saveProfile(id);
          });
        });
      }

      if (inputBusca) {
        inputBusca.addEventListener("input", (e) => {
          const val = e.target.value;
          if (btnClear) btnClear.style.display = val.length > 0 ? "block" : "none";
          updateSuggestions(val);
          renderQuickGrid();
        });

        inputBusca.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            const firstSuggestion = suggestionsList ? suggestionsList.querySelector(".colab-suggestion-item") : null;
            if (firstSuggestion) {
              const id = firstSuggestion.getAttribute("data-colab-id");
              saveProfile(id);
            } else {
              const firstCard = quickGrid ? quickGrid.querySelector(".colab-quick-card") : null;
              if (firstCard) {
                const id = firstCard.getAttribute("data-colab-id");
                saveProfile(id);
              }
            }
          }
        });
      }

      if (btnClear) {
        btnClear.addEventListener("click", () => {
          if (inputBusca) {
            inputBusca.value = "";
            inputBusca.focus();
          }
          btnClear.style.display = "none";
          if (suggestionsList) {
            suggestionsList.classList.remove("open");
            suggestionsList.innerHTML = "";
          }
          renderQuickGrid();
        });
      }

      quickAreaTabs.forEach(tab => {
        tab.addEventListener("click", () => {
          quickAreaTabs.forEach(t => t.classList.remove("active"));
          tab.classList.add("active");
          state.pickerQuickArea = tab.getAttribute("data-area");
          renderQuickGrid();
        });
      });

      // Fechar lista de sugestões ao clicar fora
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".colab-search-container")) {
          if (suggestionsList) suggestionsList.classList.remove("open");
        }
      });

      renderQuickGrid();
      return;
    }

    // ========================================================================
    // CENÁRIO 2: COLABORADOR CONECTADO / SALVO (EXIBIÇÃO INDIVIDUALIZADA)
    // ========================================================================
    const colab = StorageService.getColaboradorById(savedId);
    if (!colab) {
      localStorage.removeItem("escala_meu_colaborador_id");
      renderPersonalSchedule();
      return;
    }

    const todayIso = getTodayIso();
    const stHoje = StorageService.calcularStatusDia(colab.id, todayIso);
    const isSalobo = colab.area === "salobo";

    // Busca caminhão designado
    const trucks = StorageService.getCaminhoes();
    const meuCaminhao = trucks.find(t => t.motoristaId === colab.id || t.ajudanteId === colab.id);

    let truckDesc = "Apoio / Reserva Operacional";
    let partnerDesc = "Disponível para remanejamento";
    let destinationDesc = "Base Operacional";

    if (meuCaminhao) {
      truckDesc = `Caminhão ${meuCaminhao.numero} (${meuCaminhao.placa || 'Sem Placa'} • ${meuCaminhao.modelo || 'Traçado'})`;
      destinationDesc = meuCaminhao.destino || "Frente de Mina / Usina";

      if (meuCaminhao.motoristaId === colab.id) {
        const ajudante = meuCaminhao.ajudanteId ? StorageService.getColaboradorById(meuCaminhao.ajudanteId) : null;
        partnerDesc = ajudante ? `${ajudante.nome} (${ajudante.cargo})` : "Aguardando ajudante";
      } else {
        const motorista = meuCaminhao.motoristaId ? StorageService.getColaboradorById(meuCaminhao.motoristaId) : null;
        partnerDesc = motorista ? `${motorista.nome} (${motorista.cargo})` : "Aguardando motorista";
      }
    }

    // Status Hoje Badge com Ícones Font Awesome
    let statusBadgeHtml = "";
    if (stHoje.status === "T") {
      statusBadgeHtml = `
        <div class="my-status-badge trabalho">
          <i class="fa-solid fa-circle-check"></i> TRABALHANDO HOJE
        </div>
      `;
    } else if (stHoje.status === "F") {
      statusBadgeHtml = `
        <div class="my-status-badge folga">
          <i class="fa-solid fa-bed"></i> FOLGA HOJE
        </div>
      `;
    } else if (stHoje.status === "FE") {
      statusBadgeHtml = `
        <div class="my-status-badge" style="background: rgba(168,85,247,0.12); color: #7e22ce; border: 1px solid #c084fc;">
          <i class="fa-solid fa-plane"></i> EM FÉRIAS
        </div>
      `;
    } else if (stHoje.status === "AT") {
      statusBadgeHtml = `
        <div class="my-status-badge" style="background: rgba(245,158,11,0.12); color: #b45309; border: 1px solid #fcd34d;">
          <i class="fa-solid fa-notes-medical"></i> ATESTADO MÉDICO
        </div>
      `;
    } else {
      statusBadgeHtml = `
        <div class="my-status-badge" style="background: rgba(14,165,233,0.12); color: #0369a1; border: 1px solid #7dd3fc;">
          <i class="fa-solid fa-graduation-cap"></i> ${stHoje.detalhe || 'TREINAMENTO'}
        </div>
      `;
    }

    // Banner de Alerta de Convocação Extra Hoje
    let extraAlertBannerHtml = "";
    if (stHoje.temExtra && stHoje.escalaExtra) {
      const ex = stHoje.escalaExtra;
      const tipoNames = {
        prorrogacao: "Prorrogação de Jornada",
        folga: "Convocação na Folga (3x3)",
        feriado: "Plantão Extra de Feriado",
        especial: "Operação Especial / Parada"
      };
      extraAlertBannerHtml = `
        <div class="my-extra-banner" style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1.5px solid #f59e0b; border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; box-shadow: 0 4px 12px rgba(245,158,11,0.15);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #f59e0b; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; box-shadow: 0 2px 6px rgba(245,158,11,0.3);">
              <i class="fa-solid fa-bolt"></i>
            </div>
            <div>
              <div style="font-size: 0.74rem; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px;">
                ⚡ Convocação de Escala Extra Hoje!
              </div>
              <div style="font-size: 1.05rem; font-weight: 800; color: #92400e; margin-top: 1px;">
                ${tipoNames[ex.tipo] || ex.tipo}: ${ex.horaInicio} às ${ex.horaFim} (+${ex.totalHoras}h)
              </div>
              <div style="font-size: 0.82rem; color: #78350f; margin-top: 2px;">
                <strong>Motivo:</strong> ${ex.motivo || 'Rotina operacional'} ${ex.frente ? `• <strong>Local:</strong> ${ex.frente}` : ''}
              </div>
            </div>
          </div>
          <span style="background: #ffffff; color: #b45309; font-weight: 800; font-size: 0.85rem; padding: 4px 12px; border-radius: 999px; border: 1.5px solid #fde68a; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            +${ex.totalHoras}h extras
          </span>
        </div>
      `;
    }

    // Previsão dos Próximos 7 Dias
    const weekDaysNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    let timelineCardsHtml = "";

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dIso = `${year}-${month}-${day}`;

      const stDia = StorageService.calcularStatusDia(colab.id, dIso);
      const isToday = i === 0;
      const dayName = isToday ? "Hoje" : weekDaysNames[d.getDay()];
      const dayDateStr = `${day}/${month}`;

      let tagClass = "tag-f";
      let tagText = "Folga";
      let tagIcon = `<i class="fa-solid fa-circle fa-2xs" style="opacity:0.6;"></i>`;
      if (stDia.status === "T") {
        tagClass = "tag-t";
        tagText = "Trabalho";
        tagIcon = `<i class="fa-solid fa-briefcase fa-2xs"></i>`;
      } else if (stDia.status === "FE") {
        tagText = "Férias";
        tagIcon = `<i class="fa-solid fa-plane fa-2xs"></i>`;
      } else if (stDia.status === "AT") {
        tagText = "Atestado";
        tagIcon = `<i class="fa-solid fa-notes-medical fa-2xs"></i>`;
      } else if (stDia.status === "TR") {
        tagText = "Treino";
        tagIcon = `<i class="fa-solid fa-graduation-cap fa-2xs"></i>`;
      }

      const extraTimelineTag = stDia.temExtra && stDia.escalaExtra
        ? `<div style="margin-top: 4px; font-size: 0.68rem; font-weight: 800; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; border-radius: 4px; padding: 1px 4px; display: flex; align-items: center; justify-content: center; gap: 3px;" title="Escala Extra: ${stDia.escalaExtra.horaInicio}-${stDia.escalaExtra.horaFim}"><i class="fa-solid fa-bolt" style="font-size:0.58rem;"></i> +${stDia.escalaExtra.totalHoras}h</div>`
        : "";

      timelineCardsHtml += `
        <div class="timeline-day-card ${isToday ? 'is-today' : ''}">
          <div class="timeline-day-name">${dayName}</div>
          <div class="timeline-day-date">${dayDateStr}</div>
          <div class="timeline-day-tag ${tagClass}">${tagIcon} ${tagText}</div>
          ${extraTimelineTag}
        </div>
      `;
    }

    const todayDateFormatted = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

    heroEl.innerHTML = `
      <div class="personal-hero-header">
        <div class="personal-hero-title">
          <i class="fa-solid fa-circle-user" style="font-size: 1.6rem; color: var(--hc-green);"></i>
          <div>
            <span style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Meu Perfil Conectado:</span>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${colab.nome}</div>
          </div>
          <span class="personal-badge-tag"><i class="fa-solid fa-id-card"></i> ${colab.cargo}</span>
          <span class="personal-badge-tag" style="background: ${isSalobo ? 'rgba(0, 166, 81, 0.12)' : 'rgba(14, 165, 233, 0.12)'}; color: ${isSalobo ? 'var(--hc-green-dark)' : '#0369a1'};">
            <i class="fa-solid fa-location-dot"></i> Área ${isSalobo ? 'Salobo' : 'Sossego'}
          </span>
          <span class="personal-badge-tag" style="background: rgba(245, 158, 11, 0.12); color: #b45309;">
            <i class="fa-solid fa-clock"></i> Turma ${colab.turma3x3 || 'A'}
          </span>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn btn-glass" id="btnTrocarColaborador" style="padding: 7px 14px; font-size: 0.82rem;" title="Mudar o colaborador fixado neste aparelho">
            <i class="fa-solid fa-arrow-right-arrow-left"></i> Trocar Nome
          </button>
        </div>
      </div>

      ${extraAlertBannerHtml}

      <div class="my-card-content">
        <div class="my-status-box">
          ${statusBadgeHtml}
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: capitalize;">
              <i class="fa-regular fa-calendar"></i> ${todayDateFormatted}
            </div>
            <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-top: 2px;">
              ${stHoje.detalhe}
            </div>
          </div>
        </div>
      </div>

      <div class="my-details-grid">
        <div class="my-detail-item">
          <div class="label"><i class="fa-solid fa-truck"></i> Caminhão Designado</div>
          <div class="val">${truckDesc}</div>
        </div>
        <div class="my-detail-item">
          <div class="label"><i class="fa-solid fa-user-group"></i> Sua Dupla / Parceiro</div>
          <div class="val">${partnerDesc}</div>
        </div>
        <div class="my-detail-item">
          <div class="label"><i class="fa-solid fa-map-location-dot"></i> Destino / Frente</div>
          <div class="val">${destinationDesc}</div>
        </div>
        <div class="my-detail-item">
          <div class="label"><i class="fa-solid fa-business-time"></i> Regime & Horário</div>
          <div class="val">${colab.regime || 'Escala 3x3'} • ${stHoje.turno}</div>
        </div>
      </div>

      <div style="margin-top: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
          <span style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">
            <i class="fa-solid fa-calendar-week"></i> Previsão dos Próximos 7 Dias
          </span>
          <a href="#scheduleCalendarSection" style="font-size: 0.75rem; color: var(--hc-green); text-decoration: none; font-weight: 700;">
            <i class="fa-solid fa-calendar-days"></i> Ver Meu Mês Completo Abaixo ↓
          </a>
        </div>
        <div class="my-week-timeline">
          ${timelineCardsHtml}
        </div>
      </div>
    `;

    // Event listener para trocar colaborador
    const btnTrocar = document.getElementById("btnTrocarColaborador");
    if (btnTrocar) {
      btnTrocar.addEventListener("click", () => {
        localStorage.removeItem("escala_meu_colaborador_id");
        state.selectedCalendarColabId = null;
        showToast("Seleção desfeita. Escolha seu nome na lista.", "info");
        renderPersonalSchedule();
        populateCalendarColabSelect();
        renderCalendarGrid();
        renderScheduleTable();
      });
    }
  }

  // 7. RENDERIZAÇÃO COMPLETA DA APLICAÇÃO
  function renderAll() {
    const data = StorageService.getData();
    renderPersonalSchedule();
    renderStats(data);
    renderTrucks();
    renderTodayRoster();
    populateCalendarColabSelect();
    renderCalendarGrid();
    renderScheduleTable();
    updateAdminUIMode();
  }

  // 8. EVENT LISTENERS & FILTROS

  // Alternador de Visualização: Formato Calendário vs Tabela Geral
  if (btnViewCalendar) {
    btnViewCalendar.addEventListener("click", () => {
      state.calendarMode = "calendar";
      btnViewCalendar.classList.add("active");
      if (btnViewTable) btnViewTable.classList.remove("active");
      if (calendarGridContainer) calendarGridContainer.style.display = "block";
      if (calendarTableContainer) calendarTableContainer.style.display = "none";
      renderCalendarGrid();
    });
  }

  if (btnViewTable) {
    btnViewTable.addEventListener("click", () => {
      state.calendarMode = "table";
      btnViewTable.classList.add("active");
      if (btnViewCalendar) btnViewCalendar.classList.remove("active");
      if (calendarGridContainer) calendarGridContainer.style.display = "none";
      if (calendarTableContainer) calendarTableContainer.style.display = "block";
      renderScheduleTable();
    });
  }

  // Seletor de Colaborador no Calendário Mensal
  if (calendarColabSelect) {
    calendarColabSelect.addEventListener("change", (e) => {
      state.selectedCalendarColabId = e.target.value;
      renderCalendarGrid();
    });
  }

  // Botão "Ver Meu Perfil Salvo" no Calendário
  if (btnUseMyProfileCalendar) {
    btnUseMyProfileCalendar.addEventListener("click", () => {
      const savedId = localStorage.getItem("escala_meu_colaborador_id");
      if (savedId) {
        state.selectedCalendarColabId = savedId;
        if (calendarColabSelect) calendarColabSelect.value = savedId;
        renderCalendarGrid();
        showToast("Visualizando sua escala pessoal no calendário!", "success");
      } else {
        showToast("Nenhum colaborador foi salvo ainda neste celular.", "warning");
      }
    });
  }

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

  // Navegação de Meses (Atualiza tanto o Calendário quanto a Tabela)
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
      state.currentMonth--;
      if (state.currentMonth < 0) {
        state.currentMonth = 11;
        state.currentYear--;
      }
      renderCalendarGrid();
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
      renderCalendarGrid();
      renderScheduleTable();
    });
  }

  if (currentMonthBtn) {
    currentMonthBtn.addEventListener("click", () => {
      const now = new Date();
      state.currentYear = now.getFullYear();
      state.currentMonth = now.getMonth();
      state.selectedCalendarDay = now.getDate();
      renderCalendarGrid();
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

  // Tema fixo: apenas claro (HC Ambiental)
  document.documentElement.removeAttribute("data-theme");
  localStorage.removeItem("escala_theme");

  // CONTROLE DE ACESSO AO PAINEL DE GESTÃO (LOGIN / SESSÃO DE ADMIN)
  const modalLogin = document.getElementById("modalLogin");
  const formLogin = document.getElementById("formLogin");
  const btnCancelLogin = document.getElementById("btnCancelLogin");
  const loginErrorMsg = document.getElementById("loginErrorMsg");

  // Botão de ativação do Login / Redirecionamento Admin
  const triggerBtn = btnAdminTrigger || document.getElementById("btnAdminLink");
  if (triggerBtn) {
    triggerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const user = StorageService.getUsuarioLogado();
      if (user) {
        window.location.href = "admin.html";
      } else {
        if (loginErrorMsg) loginErrorMsg.style.display = "none";
        if (modalLogin) modalLogin.classList.add("open");
        const emailInput = document.getElementById("loginEmail");
        if (emailInput) setTimeout(() => emailInput.focus(), 150);
      }
    });
  }

  // Alternadores da Barra de Sessão do Admin
  if (btnAdminViewIndividual) {
    btnAdminViewIndividual.addEventListener("click", () => {
      state.adminViewMode = "individual";
      updateAdminUIMode();
      showToast("Exibindo visão individual do colaborador.", "info");
    });
  }

  if (btnAdminViewFull) {
    btnAdminViewFull.addEventListener("click", () => {
      state.adminViewMode = "full";
      updateAdminUIMode();
      renderAll();
      showToast("Controle geral e métricas operacionais liberados.", "success");
    });
  }

  if (btnAdminLogout) {
    btnAdminLogout.addEventListener("click", () => {
      StorageService.logout();
      state.adminViewMode = "individual";
      updateAdminUIMode();
      renderAll();
      showToast("Sessão de gestor encerrada com sucesso.", "info");
    });
  }

  if (btnCancelLogin && modalLogin) {
    btnCancelLogin.addEventListener("click", () => {
      modalLogin.classList.remove("open");
    });
  }

  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const senha = document.getElementById("loginSenha").value.trim();
      const submitBtn = formLogin.querySelector("button[type='submit']");

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Verificando...";
      }
      if (loginErrorMsg) loginErrorMsg.style.display = "none";

      try {
        const res = await StorageService.autenticarAdmin(email, senha);
        if (res.success) {
          showToast(`Bem-vindo(a), ${res.user.nome}! Controle operacional liberado.`, "success");
          if (modalLogin) modalLogin.classList.remove("open");
          state.adminViewMode = "full";
          updateAdminUIMode();
          renderAll();
        } else {
          if (loginErrorMsg) {
            loginErrorMsg.textContent = res.error || "E-mail ou senha incorretos.";
            loginErrorMsg.style.display = "block";
          }
        }
      } catch (err) {
        if (loginErrorMsg) {
          loginErrorMsg.textContent = "Erro de autenticação: " + (err.message || err);
          loginErrorMsg.style.display = "block";
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Entrar";
        }
      }
    });
  }

  // 9. REATIVIDADE COM STORAGE (SINCRONIZAÇÃO EM TEMPO REAL)

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
