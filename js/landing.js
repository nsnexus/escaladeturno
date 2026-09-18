/**
 * LANDING.JS - CONTROLADOR DA LANDING PAGE CORPORATIVA
 * Gerencia o alternador de temas, consulta rápida de escalas e persistência do colaborador no celular.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Tema fixo: apenas claro (HC Ambiental)
  document.documentElement.removeAttribute("data-theme");
  localStorage.removeItem("escala_theme");

  // 2. Elementos do Widget de Consulta Rápida
  const colabSelect = document.getElementById("landingColabSelect");
  const resultBox = document.getElementById("landingResultBox");
  const btnSalvarMeuPerfil = document.getElementById("btnSalvarMeuPerfilLanding");
  const savedNotice = document.getElementById("landingSavedNotice");

  if (!colabSelect || !resultBox) return;

  // Carregar lista de colaboradores
  const colaboradores = StorageService.getColaboradores();
  const sortedColabs = [...colaboradores].sort((a, b) => a.nome.localeCompare(b.nome));

  sortedColabs.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    const areaLabel = c.area === "sossego" ? "Sossego" : "Salobo";
    opt.textContent = `${c.nome} (${areaLabel} • ${c.cargo})`;
    colabSelect.appendChild(opt);
  });

  // Função para exibir detalhes do colaborador
  function displayColabQuickDetails(colabId) {
    if (!colabId) {
      resultBox.innerHTML = `
        <div style="text-align: center; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">👤</div>
          <p style="font-size: 0.95rem;">Selecione seu nome no menu ao lado para exibir seus detalhes de turno.</p>
        </div>
      `;
      return;
    }

    const colab = colaboradores.find((c) => c.id === colabId);
    if (!colab) return;

    const today = new Date();
    const statusResult = StorageService.getStatusDia(colab, today);
    const emTurnoHoje = statusResult.emTurno;

    // Buscar alocação de caminhão
    const caminhoes = StorageService.getCaminhoes();
    const camAlocado = caminhoes.find(
      (cam) =>
        cam.motoristaId === colab.id ||
        cam.ajudanteId === colab.id ||
        cam.motoristaNoturnoId === colab.id ||
        cam.ajudanteNoturnoId === colab.id
    );

    const initials = colab.nome
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    const areaName = colab.area === "sossego" ? "Sossego (3 Caminhões)" : "Salobo (4 Caminhões)";

    // Próximos 14 dias em formato de calendário
    const weekDaysNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    let calStripHtml = "";
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dIso = `${year}-${month}-${day}`;
      const stDia = StorageService.calcularStatusDia(colab.id, dIso);
      const isToday = i === 0;

      let tagClass = "status-f";
      let tagText = "Folga";
      if (stDia.status === "T") {
        tagClass = "status-t";
        tagText = "Trabalho";
      } else if (stDia.status === "FE") {
        tagClass = "status-fe";
        tagText = "Férias";
      } else if (stDia.status === "AT") {
        tagClass = "status-at";
        tagText = "Atestado";
      }

      calStripHtml += `
        <div class="calendar-day-card ${isToday ? 'is-today' : ''}" style="min-height:56px; padding:4px 2px; text-align:center;">
          <div style="font-size:0.65rem; color:var(--text-dim);">${isToday ? 'Hoje' : weekDaysNames[d.getDay()]}</div>
          <div style="font-size:0.85rem; font-weight:800; color:var(--text-main); margin:1px 0;">${day}</div>
          <div class="day-status-box ${tagClass}" style="padding:2px 1px; font-size:0.58rem;">
            ${tagText}
          </div>
        </div>
      `;
    }

    resultBox.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:16px;">
        <div style="width:52px; height:52px; border-radius:50%; background:var(--grad-cyan); color:#080c14; font-weight:800; font-size:1.15rem; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          ${initials}
        </div>
        <div style="flex:1;">
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:4px;">
            <h4 style="font-family:var(--font-heading); font-size:1.15rem; font-weight:700; color:var(--text-main); margin:0;">
              ${colab.nome}
            </h4>
            <span class="badge ${emTurnoHoje ? "badge-emerald" : "badge-purple"}" style="font-size:0.8rem; font-weight:700;">
              ${emTurnoHoje ? "● EM TURNO HOJE" : "○ EM FOLGA / DESCANSO"}
            </span>
          </div>

          <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">
            ${colab.cargo} • Matrícula: <strong>${colab.matricula || "N/D"}</strong>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px; padding:12px; border-radius:8px; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle);">
            <div>
              <div style="font-size:0.72rem; color:var(--text-dim); text-transform:uppercase;">Regime de Escala</div>
              <div style="font-size:0.88rem; font-weight:600; color:var(--text-main);">${colab.regime} ${colab.turma ? `(Turma ${colab.turma})` : ""}</div>
            </div>
            <div>
              <div style="font-size:0.72rem; color:var(--text-dim); text-transform:uppercase;">Turno Padrão</div>
              <div style="font-size:0.88rem; font-weight:600; color:var(--text-main);">${colab.turnoPadrao || "Geral"}</div>
            </div>
            <div>
              <div style="font-size:0.72rem; color:var(--text-dim); text-transform:uppercase;">Base Operacional</div>
              <div style="font-size:0.88rem; font-weight:600; color:var(--cyan-neon);">${areaName}</div>
            </div>
            <div>
              <div style="font-size:0.72rem; color:var(--text-dim); text-transform:uppercase;">Caminhão Designado</div>
              <div style="font-size:0.88rem; font-weight:600; color:var(--text-main);">
                ${camAlocado ? `Caminhão ${camAlocado.numero}` : "Apoio Geral / ADM"}
              </div>
            </div>
          </div>
          <div style="margin-top: 14px;">
            <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">
              📅 Calendário da Escala (Próximos 14 Dias)
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(46px, 1fr)); gap: 4px; overflow-x: auto;">
              ${calStripHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Verificar se usuário já tem perfil salvo localmente
  const savedColabId = localStorage.getItem("escala_meu_colaborador_id");
  if (savedColabId && colaboradores.some((c) => c.id === savedColabId)) {
    colabSelect.value = savedColabId;
    displayColabQuickDetails(savedColabId);
  }

  colabSelect.addEventListener("change", (e) => {
    displayColabQuickDetails(e.target.value);
    if (savedNotice) savedNotice.style.display = "none";
  });

  if (btnSalvarMeuPerfil) {
    btnSalvarMeuPerfil.addEventListener("click", () => {
      const selectedId = colabSelect.value;
      if (!selectedId) {
        alert("Por favor, selecione seu nome na lista para salvar seu perfil.");
        return;
      }
      localStorage.setItem("escala_meu_colaborador_id", selectedId);
      if (savedNotice) {
        savedNotice.style.display = "block";
        setTimeout(() => {
          savedNotice.style.display = "none";
        }, 4000);
      }
    });
  }
});
