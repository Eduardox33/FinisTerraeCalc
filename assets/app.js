/**
 * Finis Terrae Calc - Engine Minimalista
 * Mantiene compatibilidad total con almacenamiento (finis_ramos_v2),
 * ponderaciones oficiales (36/20/14) y todas las funciones clave.
 */

const STORAGE_KEY = "finis_ramos_v2";
const ACTIVE_RAMO_KEY = "finis_active_ramo_id";
const THEME_KEY = "finis_theme_mode";

const CATEGORIES = [
  { id: "controles", name: "Controles", short: "C", defaultWeight: 36 },
  { id: "proyecto", name: "Proyecto", short: "P", defaultWeight: 20 },
  { id: "laboratorios", name: "Labs", short: "L", defaultWeight: 14 }
];

let appState = {
  ramos: [],
  currentRamoId: null,
  activeTab: "calculadora"
};

let modalConfirmCallback = null;

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initStorage();
  initNavigation();
  initQuickCalc();
  renderApp();
});

// ==========================================
// TEMA
// ==========================================
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById("themeToggleBtn");
  if (btn) btn.innerText = theme === "dark" ? "☀️" : "🌙";
}

// ==========================================
// ALMACENAMIENTO & ESTADO
// ==========================================
function initStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      appState.ramos = JSON.parse(stored);
    } catch (e) {
      appState.ramos = [];
    }
  }

  // Si había id activo
  const savedActiveId = sessionStorage.getItem(ACTIVE_RAMO_KEY);
  if (savedActiveId && appState.ramos.some(r => r.id === savedActiveId)) {
    appState.currentRamoId = savedActiveId;
  } else if (appState.ramos.length > 0) {
    appState.currentRamoId = appState.ramos[0].id;
  }
}

function saveRamos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.ramos));
}

function createRamoObject(nombre = "Nuevo Ramo") {
  return {
    id: "ramo_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    nombre: nombre,
    ponderaciones: { controles: 36, proyecto: 20, laboratorios: 14 },
    notas: { controles: [""], proyecto: [""], laboratorios: [""] },
    updatedAt: Date.now()
  };
}

// ==========================================
// NAVEGACIÓN
// ==========================================
function initNavigation() {
  const hash = window.location.hash.replace("#", "");
  if (["calculadora", "ramos", "detalle"].includes(hash)) {
    switchTab(hash);
  }
}

function switchTab(tabId) {
  appState.activeTab = tabId;
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  document.querySelectorAll(".view-section").forEach(sec => {
    sec.classList.toggle("active", sec.id === `view_${tabId}`);
  });
  window.location.hash = tabId;

  if (tabId === "ramos") {
    renderRamosView();
  } else if (tabId === "detalle") {
    renderDetailView();
  }
}

// ==========================================
// CÁLCULOS MATEMÁTICOS
// ==========================================
function parseGrade(val) {
  if (val === null || val === undefined || val === "") return null;
  const clean = String(val).replace(",", ".").trim();
  const num = parseFloat(clean);
  if (isNaN(num) || num < 1.0 || num > 7.0) return null;
  return Math.round(num * 1000) / 1000;
}

function calcCategoryAvg(gradesArray) {
  if (!gradesArray || !Array.isArray(gradesArray)) return null;
  const valid = gradesArray.map(parseGrade).filter(n => n !== null);
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  return Math.round((sum / valid.length) * 1000) / 1000;
}

function calcRamoResults(ramo) {
  const ponC = parseFloat(ramo.ponderaciones.controles) || 0;
  const ponP = parseFloat(ramo.ponderaciones.proyecto) || 0;
  const ponL = parseFloat(ramo.ponderaciones.laboratorios) || 0;
  const totalWeight = ponC + ponP + ponL;

  const avgC = calcCategoryAvg(ramo.notas.controles);
  const avgP = calcCategoryAvg(ramo.notas.proyecto);
  const avgL = calcCategoryAvg(ramo.notas.laboratorios);

  let accumulated = 0;
  let weightSum = 0;

  if (avgC !== null) { accumulated += avgC * (ponC / 100); weightSum += (ponC / 100); }
  if (avgP !== null) { accumulated += avgP * (ponP / 100); weightSum += (ponP / 100); }
  if (avgL !== null) { accumulated += avgL * (ponL / 100); weightSum += (ponL / 100); }

  let np = null;
  if (weightSum > 0) {
    const factor = totalWeight > 0 ? (totalWeight / 100) : 0.70;
    np = Math.round((accumulated / factor) * 1000) / 1000;
  }

  let requiredExam = null;
  if (np !== null) {
    // 3.95 para redondear a 4.0 oficial
    const req = (3.95 - (np * 0.70)) / 0.30;
    requiredExam = Math.round(req * 1000) / 1000;
  }

  return { avgC, avgP, avgL, totalWeight, np, requiredExam };
}

// ==========================================
// VISTA 1: CALCULADORA RÁPIDA
// ==========================================
function initQuickCalc() {
  calculateQuickCalc();
}

function resetQuickCalc() {
  document.getElementById("qc_ponC").value = 36;
  document.getElementById("qc_ponP").value = 20;
  document.getElementById("qc_ponL").value = 14;
  document.getElementById("qc_notaC").value = "";
  document.getElementById("qc_notaP").value = "";
  document.getElementById("qc_notaL").value = "";
  document.getElementById("qc_npDirect").value = "";
  calculateQuickCalc();
}

function handleDirectNp(val) {
  const parsed = parseGrade(val);
  const valEl = document.getElementById("qc_resultVal");
  const noteEl = document.getElementById("qc_resultNote");

  if (parsed === null) {
    calculateQuickCalc();
    return;
  }

  const req = (3.95 - (parsed * 0.70)) / 0.30;
  displayExamResult(req, parsed, valEl, noteEl);
}

function calculateQuickCalc() {
  const directNpInput = document.getElementById("qc_npDirect");
  if (directNpInput && directNpInput.value.trim() !== "") {
    handleDirectNp(directNpInput.value);
    return;
  }

  const ponC = parseFloat(document.getElementById("qc_ponC").value) || 0;
  const ponP = parseFloat(document.getElementById("qc_ponP").value) || 0;
  const ponL = parseFloat(document.getElementById("qc_ponL").value) || 0;
  const total = ponC + ponP + ponL;

  const totalBadge = document.getElementById("qc_totalBadge");
  if (totalBadge) {
    totalBadge.innerText = `${total}% (÷ ${(total / 100).toFixed(2)})`;
    totalBadge.className = total === 70 ? "badge badge-success" : "badge badge-warning";
  }

  const nC = parseGrade(document.getElementById("qc_notaC").value);
  const nP = parseGrade(document.getElementById("qc_notaP").value);
  const nL = parseGrade(document.getElementById("qc_notaL").value);

  let accumulated = 0;
  let hasAny = false;

  if (nC !== null) { accumulated += nC * (ponC / 100); hasAny = true; }
  if (nP !== null) { accumulated += nP * (ponP / 100); hasAny = true; }
  if (nL !== null) { accumulated += nL * (ponL / 100); hasAny = true; }

  const valEl = document.getElementById("qc_resultVal");
  const noteEl = document.getElementById("qc_resultNote");

  if (!hasAny) {
    valEl.innerText = "—";
    noteEl.innerText = "Ingresa tus notas o promedio";
    return;
  }

  const factor = total > 0 ? (total / 100) : 0.70;
  const np = Math.round((accumulated / factor) * 1000) / 1000;
  const req = (3.95 - (np * 0.70)) / 0.30;

  displayExamResult(req, np, valEl, noteEl);
}

function displayExamResult(req, np, valEl, noteEl) {
  if (req <= 1.0) {
    valEl.innerText = "1.0";
    noteEl.innerText = `Aprobado (Presentación: ${np.toFixed(2)})`;
    valEl.style.color = "var(--success)";
  } else if (req > 7.0) {
    valEl.innerText = req.toFixed(2);
    noteEl.innerText = `Requiere > 7.0 (Presentación: ${np.toFixed(2)})`;
    valEl.style.color = "var(--danger)";
  } else {
    valEl.innerText = req.toFixed(2);
    noteEl.innerText = `Necesaria para 4.0 (Presentación: ${np.toFixed(2)})`;
    valEl.style.color = "var(--primary)";
  }
}

// ==========================================
// VISTA 2: LISTA DE RAMOS
// ==========================================
function renderRamosView() {
  const container = document.getElementById("ramosList");
  const countBadge = document.getElementById("ramosCount");
  const gpaBadge = document.getElementById("averageGpa");

  if (!container) return;
  countBadge.innerText = `${appState.ramos.length} ramo${appState.ramos.length === 1 ? '' : 's'}`;

  if (appState.ramos.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px 0; color: var(--text-muted); font-size: 0.85rem;">
        No tienes ramos guardados.
      </div>
    `;
    gpaBadge.innerText = "—";
    return;
  }

  let totalNpSum = 0;
  let countWithNp = 0;

  let html = "";
  appState.ramos.forEach(ramo => {
    const res = calcRamoResults(ramo);
    if (res.np !== null) {
      totalNpSum += res.np;
      countWithNp++;
    }

    const npDisplay = res.np !== null ? res.np.toFixed(2) : "—";
    const examDisplay = res.requiredExam !== null 
      ? (res.requiredExam <= 1.0 ? "Examen: 1.0" : `Examen: ${res.requiredExam.toFixed(2)}`)
      : "Sin notas";

    html += `
      <div class="ramo-item" onclick="openRamoDetail('${ramo.id}')">
        <div class="ramo-info">
          <span class="ramo-name">${escapeHtml(ramo.nombre)}</span>
          <span class="ramo-sub">${examDisplay}</span>
        </div>
        <div class="ramo-grade" style="color: ${res.np >= 4.0 ? 'var(--success)' : (res.np !== null ? 'var(--danger)' : 'var(--text-muted)')}">
          ${npDisplay}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  gpaBadge.innerText = countWithNp > 0 ? (totalNpSum / countWithNp).toFixed(2) : "—";
}

function openRamoDetail(id) {
  appState.currentRamoId = id;
  sessionStorage.setItem(ACTIVE_RAMO_KEY, id);
  switchTab("detalle");
}

function createNewRamo() {
  const nuevo = createRamoObject(`Ramo ${appState.ramos.length + 1}`);
  appState.ramos.push(nuevo);
  saveRamos();
  openRamoDetail(nuevo.id);
  showToast("Ramo creado");
}

// ==========================================
// VISTA 3: DETALLE DEL RAMO
// ==========================================
function renderDetailView() {
  let ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) {
    if (appState.ramos.length > 0) {
      ramo = appState.ramos[0];
      appState.currentRamoId = ramo.id;
    } else {
      ramo = createRamoObject("Nuevo Ramo");
      appState.ramos.push(ramo);
      appState.currentRamoId = ramo.id;
      saveRamos();
    }
  }

  document.getElementById("detailName").value = ramo.nombre;
  document.getElementById("detailPonC").value = ramo.ponderaciones.controles;
  document.getElementById("detailPonP").value = ramo.ponderaciones.proyecto;
  document.getElementById("detailPonL").value = ramo.ponderaciones.laboratorios;

  updateDetailWeightsBadge(ramo);
  renderCategoryGrades(ramo, "controles");
  renderCategoryGrades(ramo, "proyecto");
  renderCategoryGrades(ramo, "laboratorios");
  updateDetailResults(ramo);
}

function updateDetailWeightsBadge(ramo) {
  const total = (parseFloat(ramo.ponderaciones.controles) || 0) +
                (parseFloat(ramo.ponderaciones.proyecto) || 0) +
                (parseFloat(ramo.ponderaciones.laboratorios) || 0);

  const badge = document.getElementById("detailTotalBadge");
  if (badge) {
    badge.innerText = `${total}% (÷ ${(total / 100).toFixed(2)})`;
    badge.className = total === 70 ? "badge badge-success" : "badge badge-warning";
  }
}

function renderCategoryGrades(ramo, catId) {
  const container = document.getElementById(`grades_${catId}`);
  const avgEl = document.getElementById(`avg_${catId}`);
  if (!container) return;

  const grades = ramo.notas[catId] || [""];
  const avg = calcCategoryAvg(grades);

  if (avgEl) {
    avgEl.innerText = avg !== null ? `Prom: ${avg.toFixed(2)}` : "—";
  }

  let html = "";
  grades.forEach((g, idx) => {
    html += `
      <div class="grade-pill">
        <span class="grade-pill-tag">${idx + 1}</span>
        <input 
          type="text" 
          inputmode="decimal" 
          value="${g}" 
          placeholder="—"
          oninput="handleGradeChange('${catId}', ${idx}, this.value)"
        >
        <button class="pill-del" onclick="removeGrade('${catId}', ${idx})" title="Quitar">✕</button>
      </div>
    `;
  });

  html += `
    <button class="btn-add-grade" onclick="addGrade('${catId}')">＋ Nota</button>
  `;

  container.innerHTML = html;
}

function handleNameChange(val) {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;
  ramo.nombre = val;
  saveRamos();
}

function handleWeightChange(catId, val) {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;
  ramo.ponderaciones[catId] = parseFloat(val) || 0;
  saveRamos();
  updateDetailWeightsBadge(ramo);
  updateDetailResults(ramo);
}

function resetDetailWeights() {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;
  ramo.ponderaciones = { controles: 36, proyecto: 20, laboratorios: 14 };
  document.getElementById("detailPonC").value = 36;
  document.getElementById("detailPonP").value = 20;
  document.getElementById("detailPonL").value = 14;
  saveRamos();
  updateDetailWeightsBadge(ramo);
  updateDetailResults(ramo);
}

function handleGradeChange(catId, idx, val) {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;
  ramo.notas[catId][idx] = val;
  saveRamos();

  const avg = calcCategoryAvg(ramo.notas[catId]);
  const avgEl = document.getElementById(`avg_${catId}`);
  if (avgEl) avgEl.innerText = avg !== null ? `Prom: ${avg.toFixed(2)}` : "—";

  updateDetailResults(ramo);
}

function addGrade(catId) {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;
  if (!ramo.notas[catId]) ramo.notas[catId] = [];
  ramo.notas[catId].push("");
  saveRamos();
  renderCategoryGrades(ramo, catId);
}

function removeGrade(catId, idx) {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;
  ramo.notas[catId].splice(idx, 1);
  if (ramo.notas[catId].length === 0) ramo.notas[catId].push("");
  saveRamos();
  renderCategoryGrades(ramo, catId);
  updateDetailResults(ramo);
}

function updateDetailResults(ramo) {
  const res = calcRamoResults(ramo);
  const npEl = document.getElementById("detailNpVal");
  const examEl = document.getElementById("detailExamVal");

  npEl.innerText = res.np !== null ? res.np.toFixed(2) : "—";
  
  if (res.requiredExam !== null) {
    if (res.requiredExam <= 1.0) {
      examEl.innerText = "1.0 (Aprobado)";
      examEl.style.color = "var(--success)";
    } else if (res.requiredExam > 7.0) {
      examEl.innerText = `${res.requiredExam.toFixed(2)} (Requiere > 7.0)`;
      examEl.style.color = "var(--danger)";
    } else {
      examEl.innerText = res.requiredExam.toFixed(2);
      examEl.style.color = "var(--primary)";
    }
  } else {
    examEl.innerText = "—";
    examEl.style.color = "var(--text-main)";
  }
}

function duplicateCurrentRamo() {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;
  const clone = JSON.parse(JSON.stringify(ramo));
  clone.id = "ramo_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
  clone.nombre = `${clone.nombre} (Copia)`;
  appState.ramos.push(clone);
  saveRamos();
  openRamoDetail(clone.id);
  showToast("Ramo duplicado");
}

function clearCurrentGrades() {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;
  ramo.notas = { controles: [""], proyecto: [""], laboratorios: [""] };
  saveRamos();
  renderDetailView();
  showToast("Notas limpiadas");
}

function promptDeleteRamo() {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;
  showModal(
    "Eliminar Ramo",
    `¿Estás seguro de eliminar "${escapeHtml(ramo.nombre)}"?`,
    () => {
      appState.ramos = appState.ramos.filter(r => r.id !== ramo.id);
      saveRamos();
      if (appState.ramos.length > 0) {
        appState.currentRamoId = appState.ramos[0].id;
      } else {
        appState.currentRamoId = null;
      }
      switchTab("ramos");
      showToast("Ramo eliminado");
    }
  );
}

// ==========================================
// UTILIDADES UI: MODAL Y TOAST
// ==========================================
function showModal(title, text, onConfirm) {
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalText").innerText = text;
  modalConfirmCallback = onConfirm;
  document.getElementById("modalOverlay").style.display = "flex";
}

function closeModal() {
  document.getElementById("modalOverlay").style.display = "none";
  modalConfirmCallback = null;
}

function confirmModal() {
  if (modalConfirmCallback) modalConfirmCallback();
  closeModal();
}

function showToast(msg) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.innerText = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderApp() {
  switchTab(appState.activeTab);
}
