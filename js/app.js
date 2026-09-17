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
  // MINHA ESCALA: CONSULTA PESSOAL & FIXAÇÃO LOCAL NO CELULAR (MOBILE-FIRST)
  // ==========================================================================
  function renderPersonalSchedule() {
    const heroEl = document.getElementById("personalScheduleHero");
    if (!heroEl) return;

    const savedId = localStorage.getItem("escala_meu_colaborador_id");
    const allColabs = StorageService.getColaboradores("todas");

    // Cenário 1: Nenhum colaborador selecionado ainda neste dispositivo
    if (!savedId) {
      const sossegoColabs = allColabs.filter(c => c.area === "sossego").sort((a, b) => a.nome.localeCompare(b.nome));
      const saloboColabs = allColabs.filter(c => c.area === "salobo").sort((a, b) => a.nome.localeCompare(b.nome));

      heroEl.innerHTML = `
        <div class="personal-picker-row">
          <div style="flex: 1; min-width: 260px;">
            <div class="personal-hero-title">
              <span style="font-size: 1.3rem;">📱</span>
              <span>Minha Escala no Celular</span>
              <span class="personal-badge-tag">Consulta Rápida</span>
            </div>
            <p style="font-size: 0.84rem; color: var(--text-muted); margin-top: 4px;">
              Selecione seu nome abaixo. O sistema manterá seus dados salvos neste aparelho para você ver seu turno e caminhão direto!
            </p>
          </div>

          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap; width: 100%; max-width: 580px;">
            <select id="selectMyColaborador" class="personal-select">
              <option value="">-- Selecione seu nome na lista (36 colaboradores) --</option>
              <optgroup label="Área Sossego (3 Caminhões)">
                ${sossegoColabs.map(c => `<option value="${c.id}">${c.nome} • ${c.cargo} (Turma ${c.turma3x3 || 'A'})</option>`).join("")}
              </optgroup>
              <optgroup label="Área Salobo (4 Caminhões)">
                ${saloboColabs.map(c => `<option value="${c.id}">${c.nome} • ${c.cargo} (Turma ${c.turma3x3 || 'A'})</option>`).join("")}
              </optgroup>
            </select>
            <button id="btnSalvarMeuPerfil" class="btn btn-cyan" style="white-space: nowrap;">
              ✓ Salvar Meu Perfil
            </button>
          </div>
        </div>
      `;

      const selectEl = document.getElementById("selectMyColaborador");
      const btnSaveEl = document.getElementById("btnSalvarMeuPerfil");

      function saveProfile(id) {
        if (!id) {
          showToast("Selecione seu nome na lista para salvar.", "warning");
          return;
        }
        localStorage.setItem("escala_meu_colaborador_id", id);
        const savedColab = StorageService.getColaboradorById(id);
        showToast(`Perfil fixado: ${savedColab ? savedColab.nome : 'Colaborador'}!`, "success");
        renderPersonalSchedule();
        renderScheduleTable();
      }

      if (btnSaveEl) {
        btnSaveEl.addEventListener("click", () => {
          saveProfile(selectEl ? selectEl.value : "");
        });
      }

      if (selectEl) {
        selectEl.addEventListener("change", (e) => {
          if (e.target.value) {
            saveProfile(e.target.value);
          }
        });
      }
      return;
    }

    // Cenário 2: Colaborador já salvo localmente
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

    // Status Hoje Badge
    let statusBadgeHtml = "";
    if (stHoje.status === "T") {
      statusBadgeHtml = `
        <div class="my-status-badge trabalho">
          <span>🟢</span> TRABALHANDO HOJE
        </div>
      `;
    } else if (stHoje.status === "F") {
      statusBadgeHtml = `
        <div class="my-status-badge folga">
          <span>⚪</span> FOLGA HOJE
        </div>
      `;
    } else if (stHoje.status === "FE") {
      statusBadgeHtml = `
        <div class="my-status-badge" style="background: rgba(168,85,247,0.15); color: var(--purple-neon); border: 1px solid var(--purple-neon);">
          <span>🟣</span> EM FÉRIAS
        </div>
      `;
    } else if (stHoje.status === "AT") {
      statusBadgeHtml = `
        <div class="my-status-badge" style="background: rgba(245,158,11,0.15); color: var(--amber-neon); border: 1px solid var(--amber-neon);">
          <span>🟡</span> ATESTADO MÉDICO
        </div>
      `;
    } else {
      statusBadgeHtml = `
        <div class="my-status-badge" style="background: rgba(59,130,246,0.15); color: #93c5fd; border: 1px solid #3b82f6;">
          <span>🔵</span> ${stHoje.detalhe || 'TREINAMENTO'}
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
      if (stDia.status === "T") {
        tagClass = "tag-t";
        tagText = "Trabalho";
      } else if (stDia.status === "FE") {
        tagText = "Férias";
      } else if (stDia.status === "AT") {
        tagText = "Atestado";
      } else if (stDia.status === "TR") {
        tagText = "Treino";
      }

      timelineCardsHtml += `
        <div class="timeline-day-card ${isToday ? 'is-today' : ''}">
          <div class="timeline-day-name">${dayName}</div>
          <div class="timeline-day-date">${dayDateStr}</div>
          <div class="timeline-day-tag ${tagClass}">${tagText}</div>
        </div>
      `;
    }

    const todayDateFormatted = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

    heroEl.innerHTML = `
      <div class="personal-hero-header">
        <div class="personal-hero-title">
          <span style="font-size: 1.4rem;">👤</span>
          <div>
            <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Meu Perfil Salvo:</span>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${colab.nome}</div>
          </div>
          <span class="personal-badge-tag">${colab.cargo}</span>
          <span class="personal-badge-tag" style="background: ${isSalobo ? 'rgba(34, 197, 94, 0.12)' : 'rgba(56, 189, 248, 0.12)'}; color: ${isSalobo ? 'var(--emerald-neon)' : 'var(--cyan-neon)'};">
            Área ${isSalobo ? 'Salobo' : 'Sossego'}
          </span>
          <span class="personal-badge-tag" style="background: rgba(245, 158, 11, 0.12); color: var(--amber-neon);">
            Turma ${colab.turma3x3 || 'A'}
          </span>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn btn-glass" id="btnTrocarColaborador" style="padding: 7px 14px; font-size: 0.82rem;" title="Mudar o colaborador fixado neste aparelho">
            🔄 Trocar Nome
          </button>
        </div>
      </div>

      <div class="my-card-content">
        <div class="my-status-box">
          ${statusBadgeHtml}
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: capitalize;">${todayDateFormatted}</div>
            <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); margin-top: 2px;">
              ${stHoje.detalhe}
            </div>
          </div>
        </div>
      </div>

      <div class="my-details-grid">
        <div class="my-detail-item">
          <div class="label">Caminhão Designado</div>
          <div class="val">${truckDesc}</div>
        </div>
        <div class="my-detail-item">
          <div class="label">Sua Dupla / Parceiro</div>
          <div class="val">${partnerDesc}</div>
        </div>
        <div class="my-detail-item">
          <div class="label">Destino / Frente</div>
          <div class="val">${destinationDesc}</div>
        </div>
        <div class="my-detail-item">
          <div class="label">Regime & Horário</div>
          <div class="val">${colab.regime || 'Escala 3x3'} • ${stHoje.turno}</div>
        </div>
      </div>

      <div style="margin-top: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-size: 0.78rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">
            Previsão dos Próximos 7 Dias
          </span>
          <a href="#scheduleCalendarSection" style="font-size: 0.75rem; color: var(--cyan-neon); text-decoration: none; font-weight: 600;">
            Ver Mês Completo ↓
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
        showToast("Seleção de colaborador desfeita. Escolha outro nome.", "info");
        renderPersonalSchedule();
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

  // Alternar Tema Claro / Escuro (Apenas Ícone no Canto Superior Direito)
  const btnThemeToggle = document.getElementById("btnThemeToggle");
  function updateThemeButton(theme) {
    if (btnThemeToggle) {
      btnThemeToggle.innerHTML = theme === "light" ? "🌙" : "☀️";
      btnThemeToggle.title = theme === "light" ? "Mudar para Modo Escuro" : "Mudar para Modo Claro";
    }
  }

  const currentTheme = localStorage.getItem("escala_theme") || "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeButton(currentTheme);

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", () => {
      const active = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", active);
      localStorage.setItem("escala_theme", active);
      updateThemeButton(active);
    });
  }

  // CONTROLE DE ACESSO AO PAINEL DE GESTÃO (LOGIN / SENHA)
  const btnAdminLink = document.getElementById("btnAdminLink");
  const modalLogin = document.getElementById("modalLogin");
  const formLogin = document.getElementById("formLogin");
  const btnCancelLogin = document.getElementById("btnCancelLogin");
  const loginErrorMsg = document.getElementById("loginErrorMsg");

  if (btnAdminLink) {
    btnAdminLink.addEventListener("click", (e) => {
      e.preventDefault();
      const user = StorageService.getUsuarioLogado();
      if (user) {
        window.location.href = "admin.html";
      } else {
        if (loginErrorMsg) loginErrorMsg.style.display = "none";
        if (modalLogin) modalLogin.classList.add("open");
      }
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
          showToast(`Bem-vindo, ${res.user.nome}! Redirecionando...`, "success");
          setTimeout(() => {
            window.location.href = "admin.html";
          }, 500);
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
