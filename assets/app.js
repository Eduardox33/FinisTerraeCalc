/**
 * Finis Terrae Calc - Modern Engine
 * Gestor amigable de Ramos y Calculadora de Ponderaciones (Controles, Proyecto, Laboratorios)
 * Ponderaciones por defecto: Controles (36%), Proyecto (20%), Laboratorios (14%) -> Total 70% / Dividido por 0.7
 * Pantalla por defecto: Calculadora Rápida
 */

// Claves de Almacenamiento
const STORAGE_KEY = "finis_ramos_v2";
const ACTIVE_RAMO_KEY = "finis_active_ramo_id";

// Categorías fijas requeridas con ponderaciones por defecto oficiales
const CATEGORIES = [
  { id: "controles", name: "Controles", icon: "📝", short: "C", defaultWeight: 36 },
  { id: "proyecto", name: "Proyecto", icon: "🚀", short: "P", defaultWeight: 20 },
  { id: "laboratorios", name: "Laboratorios", icon: "🔬", short: "L", defaultWeight: 14 }
];

// Estado de la Aplicación (por defecto: calculadora rápida)
let appState = {
  ramos: [],
  currentRamoId: null,
  activeTab: "calculadora"
};

// ==========================================
// MÓDULO DE PERSISTENCIA
// ==========================================
function initStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      appState.ramos = JSON.parse(stored);
    } catch (e) {
      console.error("Error al cargar ramos:", e);
      appState.ramos = [];
    }
  } else {
    // Al iniciar de 0: lista vacía por defecto
    appState.ramos = [];
  }

  // Migración opcional de datos anteriores si existieran
  migrateLegacyData();

  // Comprobar si había un ramo activo
  const legacyName = sessionStorage.getItem("nombre");
  const savedActiveId = sessionStorage.getItem(ACTIVE_RAMO_KEY);

  if (savedActiveId && appState.ramos.some(r => r.id === savedActiveId)) {
    appState.currentRamoId = savedActiveId;
  } else if (legacyName && appState.ramos.some(r => r.nombre.toLowerCase() === legacyName.toLowerCase().replaceAll("_", " "))) {
    const found = appState.ramos.find(r => r.nombre.toLowerCase() === legacyName.toLowerCase().replaceAll("_", " "));
    appState.currentRamoId = found.id;
  } else if (appState.ramos.length > 0) {
    appState.currentRamoId = appState.ramos[0].id;
  } else {
    appState.currentRamoId = null;
  }
}

function saveRamosToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.ramos));
  showSaveIndicator();
}

function migrateLegacyData() {
  try {
    const oldRamosList = JSON.parse(localStorage.getItem("ramos"));
    if (Array.isArray(oldRamosList) && oldRamosList.length > 0) {
      console.log("Migrando ramos de versión anterior...", oldRamosList);
      let migratedCount = 0;
      
      oldRamosList.forEach(oldName => {
        if (appState.ramos.some(r => r.nombre.toLowerCase() === oldName.replaceAll("_", " ").toLowerCase())) {
          return;
        }

        const oldData = JSON.parse(localStorage.getItem(oldName));
        const newRamo = createRamoObject(oldName.replaceAll("_", " "));

        if (oldData) {
          if (oldData.ponderaciones && oldData.ponderaciones.length >= 3) {
            newRamo.ponderaciones.controles = parseFloat(oldData.ponderaciones[0]) || 36;
            newRamo.ponderaciones.laboratorios = parseFloat(oldData.ponderaciones[1]) || 14;
            newRamo.ponderaciones.proyecto = parseFloat(oldData.ponderaciones[2]) || 20;
          }
          if (Array.isArray(oldData.controles)) {
            newRamo.notas.controles = oldData.controles.filter(n => n !== "").map(n => parseFloat(n));
          }
          if (Array.isArray(oldData.labs)) {
            newRamo.notas.laboratorios = oldData.labs.filter(n => n !== "").map(n => parseFloat(n));
          }
          if (Array.isArray(oldData.proyecto)) {
            newRamo.notas.proyecto = oldData.proyecto.filter(n => n !== "").map(n => parseFloat(n));
          }
        }

        ensureMinimumCells(newRamo);
        appState.ramos.push(newRamo);
        migratedCount++;
      });

      if (migratedCount > 0) {
        saveRamosToStorage();
        showToast(`Se migraron ${migratedCount} ramos anteriores`);
      }
    }
  } catch (err) {
    console.warn("No se pudieron migrar datos antiguos:", err);
  }
}

function createRamoObject(name, weights = null) {
  return {
    id: "ramo_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    nombre: name || "Nuevo Ramo",
    ponderaciones: weights || {
      controles: 36,
      proyecto: 20,
      laboratorios: 14
    },
    notas: {
      controles: [""],
      proyecto: [""],
      laboratorios: [""]
    },
    updatedAt: Date.now()
  };
}

function ensureMinimumCells(ramo) {
  CATEGORIES.forEach(cat => {
    if (!ramo.notas[cat.id] || !Array.isArray(ramo.notas[cat.id])) {
      ramo.notas[cat.id] = [""];
    } else if (ramo.notas[cat.id].length === 0) {
      ramo.notas[cat.id].push("");
    }
  });
}

// ==========================================
// CÁLCULOS MATEMÁTICOS DE NOTAS
// ==========================================
function parseChileanGrade(val) {
  if (val === null || val === undefined || val === "") return null;
  const str = String(val).replace(",", ".").trim();
  const num = parseFloat(str);
  if (isNaN(num)) return null;
  return Math.min(Math.max(num, 1.0), 7.0);
}

function calculateCategoryAverage(gradesList) {
  if (!Array.isArray(gradesList)) return null;
  const validGrades = gradesList
    .map(parseChileanGrade)
    .filter(g => g !== null);
  
  if (validGrades.length === 0) return null;
  const sum = validGrades.reduce((acc, curr) => acc + curr, 0);
  return sum / validGrades.length;
}

/**
 * Algoritmo Original de Cálculo:
 * pc = ponControles / 100 (36% -> 0.36)
 * pp = ponProyecto / 100  (20% -> 0.20)
 * pl = ponLabs / 100      (14% -> 0.14)
 * Suma de ponderaciones = 0.70 (70%)
 * Nota Presentación = ((control * pc) + (proyecto * pp) + (lab * pl)) / (pc + pp + pl)
 * Nota Examen (Min) = (3.95 - (Nota Presentación * 0.7)) / 0.3
 */
function calculateRamoResults(ramo) {
  const pc = (parseFloat(ramo.ponderaciones.controles) || 36) / 100;
  const pp = (parseFloat(ramo.ponderaciones.proyecto) || 20) / 100;
  const pl = (parseFloat(ramo.ponderaciones.laboratorios) || 14) / 100;
  const sumP = pc + pp + pl; // normalmente 0.70

  const avgControles = calculateCategoryAverage(ramo.notas.controles);
  const avgProyecto = calculateCategoryAverage(ramo.notas.proyecto);
  const avgLabs = calculateCategoryAverage(ramo.notas.laboratorios);

  const catAverages = {
    controles: avgControles,
    proyecto: avgProyecto,
    laboratorios: avgLabs
  };

  const hasAnyGrade = avgControles !== null || avgProyecto !== null || avgLabs !== null;

  let notaPresentacion = null;
  let notaExamenRequerida = null;
  let situacion = "Sin notas ingresadas";
  let statusClass = "pendiente";

  if (hasAnyGrade && sumP > 0) {
    // Si una categoría no tiene notas aún, se considera 1.0 para el cálculo base como en el algoritmo original
    const c = avgControles !== null ? avgControles : 1.0;
    const p = avgProyecto !== null ? avgProyecto : 1.0;
    const l = avgLabs !== null ? avgLabs : 1.0;

    notaPresentacion = ((c * pc) + (p * pp) + (l * pl)) / sumP;

    // Fórmula del examen: ((3.95 - (np * 0.7)) / 0.3)
    const req = (3.95 - (notaPresentacion * 0.7)) / 0.3;
    notaExamenRequerida = req;

    if (notaPresentacion >= 5.0 || req <= 1.0) {
      situacion = "¡Eximido / Aprobado!";
      statusClass = "eximido";
    } else if (req > 7.0) {
      situacion = "En Riesgo (Requiere > 7.0)";
      statusClass = "reprobado";
    } else if (notaPresentacion >= 4.0) {
      situacion = `Aprobando (Exam min: ${req.toFixed(3)})`;
      statusClass = "aprobado";
    } else {
      situacion = `Requiere ${req.toFixed(3)} en examen`;
      statusClass = "reprobado";
    }
  }

  return {
    catAverages,
    notaPresentacion,
    notaExamenRequerida,
    situacion,
    statusClass,
    totalWeight: Math.round((pc + pp + pl) * 100)
  };
}

// ==========================================
// RENDERIZADO DE VISTAS
// ==========================================

// 1. Dashboard de Ramos
function renderRamosDashboard() {
  const container = document.getElementById("ramosListContainer");
  const countBadge = document.getElementById("totalRamosBadge");
  const gpaBadge = document.getElementById("averageGpaBadge");
  if (!container) return;

  if (countBadge) countBadge.innerText = `${appState.ramos.length} Ramos`;

  if (appState.ramos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <div class="empty-text">No tienes ningún ramo guardado aún</div>
        <div class="empty-subtext">Haz clic en "+ Nuevo Ramo" para comenzar</div>
      </div>
    `;
    if (gpaBadge) gpaBadge.innerText = "—";
    return;
  }

  let totalNp = 0;
  let evaluatedRamos = 0;
  let html = "";

  appState.ramos.forEach(ramo => {
    ensureMinimumCells(ramo);
    const results = calculateRamoResults(ramo);
    const npFormatted = results.notaPresentacion !== null ? results.notaPresentacion.toFixed(3) : "—";
    
    if (results.notaPresentacion !== null) {
      totalNp += results.notaPresentacion;
      evaluatedRamos++;
    }

    let badgeClass = "badge-warning";
    if (results.statusClass === "eximido") badgeClass = "badge-info";
    else if (results.statusClass === "aprobado") badgeClass = "badge-success";
    else if (results.statusClass === "reprobado") badgeClass = "badge-danger";

    html += `
      <div class="ramo-item-card ${results.statusClass}" onclick="openRamoDetail('${ramo.id}')">
        <div class="ramo-info">
          <div class="ramo-name">${escapeHtml(ramo.nombre)}</div>
          <div class="ramo-meta">
            <span class="ramo-badge ${badgeClass}">${results.situacion}</span>
            <span>Pon: ${results.totalWeight}% (÷ 0.7)</span>
          </div>
        </div>
        <div class="ramo-grade-preview">
          <div class="preview-score ${results.statusClass}">
            ${npFormatted}
          </div>
          <span class="card-chevron" style="color: var(--ft-text-muted);">❯</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  if (gpaBadge) {
    if (evaluatedRamos > 0) {
      const gpa = (totalNp / evaluatedRamos).toFixed(3);
      gpaBadge.innerText = gpa;
      gpaBadge.className = "preview-score " + (gpa >= 4.0 ? "aprobado" : "reprobado");
    } else {
      gpaBadge.innerText = "—";
      gpaBadge.className = "preview-score";
    }
  }
}

// 2. Detalle y Edición del Ramo
function renderRamoDetail() {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) {
    switchTab("ramos");
    return;
  }

  ensureMinimumCells(ramo);
  const results = calculateRamoResults(ramo);

  // Nombre
  const nameInput = document.getElementById("detailRamoName");
  if (nameInput) nameInput.value = ramo.nombre;

  // Ponderaciones por defecto: 36, 20, 14
  const ponControles = document.getElementById("detailPonControles");
  const ponProyecto = document.getElementById("detailPonProyecto");
  const ponLabs = document.getElementById("detailPonLabs");
  if (ponControles) ponControles.value = ramo.ponderaciones.controles !== undefined ? ramo.ponderaciones.controles : 36;
  if (ponProyecto) ponProyecto.value = ramo.ponderaciones.proyecto !== undefined ? ramo.ponderaciones.proyecto : 20;
  if (ponLabs) ponLabs.value = ramo.ponderaciones.laboratorios !== undefined ? ramo.ponderaciones.laboratorios : 14;

  // Total de ponderaciones (70%)
  const totalPonBadge = document.getElementById("detailTotalPonBadge");
  if (totalPonBadge) {
    totalPonBadge.innerText = `${results.totalWeight}% (÷ 0.70)`;
    totalPonBadge.className = `total-pon-badge ${results.totalWeight === 70 ? 'badge-success' : 'badge-warning'}`;
  }

  // Renderizar las 3 categorías con sus celdas dinámicas
  CATEGORIES.forEach(cat => {
    renderCategoryGrades(ramo, cat, results.catAverages[cat.id]);
  });

  // Tarjeta de Resultados
  updateResultsCard(results);
}

function renderCategoryGrades(ramo, cat, catAvg) {
  const container = document.getElementById(`gradesContainer_${cat.id}`);
  const avgTag = document.getElementById(`avgTag_${cat.id}`);
  if (!container) return;

  if (avgTag) {
    if (catAvg !== null) {
      avgTag.innerText = `Promedio: ${catAvg.toFixed(3)}`;
      avgTag.className = `cat-average-tag ${catAvg >= 4.0 ? 'aprobado' : 'reprobado'}`;
    } else {
      avgTag.innerText = "Promedio: —";
      avgTag.className = "cat-average-tag";
    }
  }

  const grades = ramo.notas[cat.id] || [""];
  let html = "";

  grades.forEach((grade, index) => {
    const parsed = parseChileanGrade(grade);
    let colorClass = "";
    if (parsed !== null) {
      colorClass = parsed >= 4.0 ? "nota-alta" : "nota-baja";
    }

    html += `
      <div class="grade-cell" id="cell_${cat.id}_${index}">
        <span class="cell-label">${cat.short}${index + 1}</span>
        <input 
          type="text" 
          inputmode="decimal" 
          class="grade-input ${colorClass}" 
          placeholder="—" 
          value="${grade !== null && grade !== undefined ? grade : ''}"
          oninput="handleGradeInput('${cat.id}', ${index}, this.value)"
          onkeydown="handleGradeKeyDown(event, '${cat.id}', ${index})"
        >
        ${grades.length > 1 ? `
          <button type="button" class="cell-remove-btn" onclick="removeGradeCell('${cat.id}', ${index})" title="Eliminar celda">
            ✕
          </button>
        ` : `
          <button type="button" class="cell-remove-btn" onclick="clearGradeCell('${cat.id}', ${index})" title="Limpiar celda" style="opacity:0.3;">
            ✕
          </button>
        `}
      </div>
    `;
  });

  html += `
    <button type="button" class="add-cell-btn" onclick="addGradeCell('${cat.id}')">
      <span>＋</span> Agregar Nota
    </button>
  `;

  container.innerHTML = html;
}

// ==========================================
// MANEJADORES DE ACCIÓN DEL USUARIO
// ==========================================

function handleGradeInput(catId, index, rawValue) {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;

  let cleanVal = rawValue.replace(",", ".").trim();
  ramo.notas[catId][index] = cleanVal;
  ramo.updatedAt = Date.now();
  saveRamosToStorage();

  const results = calculateRamoResults(ramo);
  
  const avgTag = document.getElementById(`avgTag_${catId}`);
  const catAvg = results.catAverages[catId];
  if (avgTag) {
    if (catAvg !== null) {
      avgTag.innerText = `Promedio: ${catAvg.toFixed(3)}`;
      avgTag.className = `cat-average-tag ${catAvg >= 4.0 ? 'aprobado' : 'reprobado'}`;
    } else {
      avgTag.innerText = "Promedio: —";
      avgTag.className = "cat-average-tag";
    }
  }

  const cell = document.getElementById(`cell_${catId}_${index}`);
  if (cell) {
    const input = cell.querySelector(".grade-input");
    const parsed = parseChileanGrade(cleanVal);
    if (input) {
      input.classList.remove("nota-alta", "nota-baja");
      if (parsed !== null) {
        input.classList.add(parsed >= 4.0 ? "nota-alta" : "nota-baja");
      }
    }
  }

  updateResultsCard(results);
}

function handleGradeKeyDown(e, catId, index) {
  if (e.key === "Enter") {
    e.preventDefault();
    addGradeCell(catId);
  }
}

function addGradeCell(catId) {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;

  if (!ramo.notas[catId]) ramo.notas[catId] = [];
  ramo.notas[catId].push("");
  ramo.updatedAt = Date.now();
  saveRamosToStorage();

  const results = calculateRamoResults(ramo);
  renderCategoryGrades(ramo, CATEGORIES.find(c => c.id === catId), results.catAverages[catId]);
  
  setTimeout(() => {
    const newIndex = ramo.notas[catId].length - 1;
    const newCell = document.getElementById(`cell_${catId}_${newIndex}`);
    if (newCell) {
      const input = newCell.querySelector(".grade-input");
      if (input) input.focus();
    }
  }, 50);
}

function removeGradeCell(catId, index) {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;

  ramo.notas[catId].splice(index, 1);
  if (ramo.notas[catId].length === 0) {
    ramo.notas[catId].push("");
  }
  ramo.updatedAt = Date.now();
  saveRamosToStorage();

  const results = calculateRamoResults(ramo);
  renderCategoryGrades(ramo, CATEGORIES.find(c => c.id === catId), results.catAverages[catId]);
  updateResultsCard(results);
}

function clearGradeCell(catId, index) {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;

  ramo.notas[catId][index] = "";
  ramo.updatedAt = Date.now();
  saveRamosToStorage();

  const results = calculateRamoResults(ramo);
  renderCategoryGrades(ramo, CATEGORIES.find(c => c.id === catId), results.catAverages[catId]);
  updateResultsCard(results);
}

function handlePonderacionChange(catId, value) {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;

  const num = parseFloat(value) || 0;
  ramo.ponderaciones[catId] = num;
  ramo.updatedAt = Date.now();
  saveRamosToStorage();

  const results = calculateRamoResults(ramo);
  const totalPonBadge = document.getElementById("detailTotalPonBadge");
  if (totalPonBadge) {
    totalPonBadge.innerText = `${results.totalWeight}% (÷ ${(results.totalWeight / 100).toFixed(2)})`;
    totalPonBadge.className = `total-pon-badge ${results.totalWeight === 70 ? 'badge-success' : 'badge-warning'}`;
  }

  updateResultsCard(results);
}

function setRamoPonderacionesPorDefecto() {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;

  ramo.ponderaciones.controles = 36;
  ramo.ponderaciones.proyecto = 20;
  ramo.ponderaciones.laboratorios = 14;
  ramo.updatedAt = Date.now();
  saveRamosToStorage();

  renderRamoDetail();
  showToast("Ponderaciones oficiales restablecidas (36 / 20 / 14)");
}

function handleRamoNameChange(newName) {
  const ramo = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!ramo) return;

  const trimmed = newName.trim();
  ramo.nombre = trimmed || "Ramo sin nombre";
  ramo.updatedAt = Date.now();
  saveRamosToStorage();
}

function updateResultsCard(results) {
  const resNp = document.getElementById("detailResultNp");
  const resExamen = document.getElementById("detailResultExamen");
  const resBanner = document.getElementById("detailResultBanner");

  if (resNp) {
    resNp.innerText = results.notaPresentacion !== null ? results.notaPresentacion.toFixed(3) : "—";
  }

  if (resExamen) {
    if (results.notaExamenRequerida !== null) {
      if (results.notaExamenRequerida <= 1.0) {
        resExamen.innerText = "1.000 (Eximido)";
      } else if (results.notaExamenRequerida > 7.0) {
        resExamen.innerText = "> 7.000";
      } else {
        resExamen.innerText = results.notaExamenRequerida.toFixed(3);
      }
    } else {
      resExamen.innerText = "—";
    }
  }

  if (resBanner) {
    resBanner.className = `result-status-banner ${results.statusClass}`;
    let icon = "ℹ️";
    if (results.statusClass === "eximido") icon = "🎉";
    else if (results.statusClass === "aprobado") icon = "✅";
    else if (results.statusClass === "reprobado") icon = "⚠️";

    resBanner.innerHTML = `<span>${icon}</span> <span>${results.situacion}</span>`;
  }
}

// ==========================================
// GESTIÓN CRUD DE RAMOS
// ==========================================

function createNewRamo() {
  const defaultName = `Ramo ${appState.ramos.length + 1}`;
  const newRamo = createRamoObject(defaultName, { controles: 36, proyecto: 20, laboratorios: 14 });
  appState.ramos.push(newRamo);
  appState.currentRamoId = newRamo.id;
  sessionStorage.setItem(ACTIVE_RAMO_KEY, newRamo.id);
  saveRamosToStorage();

  showToast(`¡"${defaultName}" creado con éxito!`);
  switchTab("detalle");
}

function openRamoDetail(ramoId) {
  appState.currentRamoId = ramoId;
  sessionStorage.setItem(ACTIVE_RAMO_KEY, ramoId);
  switchTab("detalle");
}

function duplicateCurrentRamo() {
  const current = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!current) return;

  const copy = JSON.parse(JSON.stringify(current));
  copy.id = "ramo_" + Date.now();
  copy.nombre = `${current.nombre} (Copia)`;
  copy.updatedAt = Date.now();

  appState.ramos.push(copy);
  appState.currentRamoId = copy.id;
  sessionStorage.setItem(ACTIVE_RAMO_KEY, copy.id);
  saveRamosToStorage();

  showToast(`Copia creada: "${copy.nombre}"`);
  renderRamoDetail();
}

function promptDeleteCurrentRamo() {
  const current = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!current) return;

  openModal(
    "Eliminar Ramo",
    `¿Estás seguro de que deseas eliminar permanentemente <b>"${escapeHtml(current.nombre)}"</b>? No podrás deshacer esta acción.`,
    () => {
      appState.ramos = appState.ramos.filter(r => r.id !== current.id);
      saveRamosToStorage();
      showToast(`Ramo eliminado`);
      switchTab("ramos");
    }
  );
}

function resetCurrentRamoGrades() {
  const current = appState.ramos.find(r => r.id === appState.currentRamoId);
  if (!current) return;

  openModal(
    "Limpiar Notas",
    `¿Deseas vaciar todas las notas de <b>"${escapeHtml(current.nombre)}"</b>? Las ponderaciones se mantendrán.`,
    () => {
      CATEGORIES.forEach(cat => {
        current.notas[cat.id] = [""];
      });
      current.updatedAt = Date.now();
      saveRamosToStorage();
      renderRamoDetail();
      showToast("Notas reiniciadas");
    }
  );
}

// ==========================================
// CALCULADORA RÁPIDA (PANTALLA PRINCIPAL / ACCESO RÁPIDO)
// ==========================================

/**
 * Algoritmo Original de logic.js:
 * let pc=ponControles.value/100;
 * let pl=ponLabs.value/100;
 * let pp=ponProyecto.value/100;
 * notaPresentacion.value=(((control*pc)+(lab*pl)+(proyecto*pp))/(pc+pl+pp)).toFixed(3);
 * notaExamen = ((3.95-(np*0.7))/0.3).toFixed(3);
 */
function calculateQuickCalc() {
  const pcEl = document.getElementById("qc_ponControles");
  const ppEl = document.getElementById("qc_ponProyecto");
  const plEl = document.getElementById("qc_ponLabs");

  const pc = (pcEl ? parseFloat(pcEl.value) : 36) / 100;
  const pp = (ppEl ? parseFloat(ppEl.value) : 20) / 100;
  const pl = (plEl ? parseFloat(plEl.value) : 14) / 100;
  const sumP = pc + pp + pl; // 0.70 por defecto

  const ncRaw = document.getElementById("qc_notaControles")?.value;
  const npRaw = document.getElementById("qc_notaProyecto")?.value;
  const nlRaw = document.getElementById("qc_notaLabs")?.value;

  const nc = parseChileanGrade(ncRaw);
  const np = parseChileanGrade(npRaw);
  const nl = parseChileanGrade(nlRaw);

  const resPreInput = document.getElementById("qc_notaPresentacion");
  const resExamen = document.getElementById("qc_resultExamen");
  const resBadge = document.getElementById("qc_resultBadge");
  const totalPonBadge = document.getElementById("qc_totalPonBadge");

  if (totalPonBadge) {
    const totalW = Math.round(sumP * 100);
    totalPonBadge.innerText = `${totalW}% (÷ ${sumP.toFixed(2)})`;
    totalPonBadge.className = `total-pon-badge ${totalW === 70 ? 'badge-success' : 'badge-warning'}`;
  }

  const hasAny = (nc !== null || np !== null || nl !== null);

  if (hasAny && sumP > 0) {
    // Exacto al algoritmo original: si no se ha puesto nota, toma 1.0 como valor base
    let control = nc !== null ? nc : 1.0;
    let proyecto = np !== null ? np : 1.0;
    let lab = nl !== null ? nl : 1.0;

    let notaPresentacionVal = ((control * pc) + (proyecto * pp) + (lab * pl)) / sumP;
    const npFixed = notaPresentacionVal.toFixed(3);

    if (resPreInput && document.activeElement !== resPreInput) {
      resPreInput.value = npFixed;
    }

    calculateExamenFromPresentacion(notaPresentacionVal);
  } else {
    if (resPreInput && document.activeElement !== resPreInput) {
      resPreInput.value = "";
    }
    if (resExamen) resExamen.innerText = "Nota: 1.000";
    if (resBadge) {
      resBadge.className = "result-status-banner";
      resBadge.innerHTML = "ℹ️ Ingresa tus promedios para calcular tu nota de presentación y examen.";
    }
  }
}

// Permite editar directamente la Nota de Presentación para calcular el examen
function handleDirectPresentacionInput(value) {
  const np = parseChileanGrade(value);
  if (np !== null) {
    calculateExamenFromPresentacion(np);
  } else {
    const resExamen = document.getElementById("qc_resultExamen");
    if (resExamen) resExamen.innerText = "Nota: 1.000";
  }
}

function calculateExamenFromPresentacion(np) {
  const resExamen = document.getElementById("qc_resultExamen");
  const resBadge = document.getElementById("qc_resultBadge");

  // Algoritmo original exacto: ((3.95 - (np * 0.7)) / 0.3)
  const req = (3.95 - (np * 0.7)) / 0.3;

  if (resExamen) {
    if (np >= 5.0 || req <= 1.0) {
      resExamen.innerText = "Nota: 1.000 (¡Eximido!)";
    } else if (req > 7.0) {
      resExamen.innerText = `Nota: ${req.toFixed(3)} (> 7.0)`;
    } else {
      resExamen.innerText = `Nota: ${req.toFixed(3)}`;
    }
  }

  if (resBadge) {
    if (np >= 5.0 || req <= 1.0) {
      resBadge.className = "result-status-banner eximido";
      resBadge.innerHTML = "🎉 ¡Eximido! Apruebas directamente o con nota mínima 1.000.";
    } else if (req > 7.0) {
      resBadge.className = "result-status-banner reprobado";
      resBadge.innerHTML = "⚠️ En riesgo: Necesitas más de 7.000 en el examen para aprobar.";
    } else if (np >= 4.0) {
      resBadge.className = "result-status-banner aprobado";
      resBadge.innerHTML = `✅ Aprobando: Necesitas un <b>${req.toFixed(3)}</b> en el examen para aprobar (4.0).`;
    } else {
      resBadge.className = "result-status-banner reprobado";
      resBadge.innerHTML = `⚠️ Requiere un <b>${req.toFixed(3)}</b> en el examen para alcanzar el 3.95 (4.0).`;
    }
  }
}

function resetQuickCalcToDefaults() {
  const pc = document.getElementById("qc_ponControles");
  const pp = document.getElementById("qc_ponProyecto");
  const pl = document.getElementById("qc_ponLabs");

  if (pc) pc.value = 36;
  if (pp) pp.value = 20;
  if (pl) pl.value = 14;

  const nc = document.getElementById("qc_notaControles");
  const np = document.getElementById("qc_notaProyecto");
  const nl = document.getElementById("qc_notaLabs");
  const npre = document.getElementById("qc_notaPresentacion");

  if (nc) nc.value = "";
  if (np) np.value = "";
  if (nl) nl.value = "";
  if (npre) npre.value = "";

  calculateQuickCalc();
  showToast("Ponderaciones restablecidas a 36 / 20 / 14");
}

// ==========================================
// CONTROL DE NAVEGACIÓN Y VISTAS
// ==========================================
function switchTab(tabName) {
  appState.activeTab = tabName;

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  document.querySelectorAll(".nav-icon-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  document.querySelectorAll(".view-section").forEach(sec => {
    sec.classList.remove("active");
  });

  const targetSection = document.getElementById(`view_${tabName}`);
  if (targetSection) {
    targetSection.classList.add("active");
  }

  if (tabName === "ramos") {
    renderRamosDashboard();
  } else if (tabName === "detalle") {
    renderRamoDetail();
  } else if (tabName === "calculadora") {
    calculateQuickCalc();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==========================================
// MODAL Y TOAST UTILITIES
// ==========================================
let modalCallback = null;

function openModal(title, messageHtml, onConfirm) {
  const overlay = document.getElementById("appModalOverlay");
  const titleEl = document.getElementById("appModalTitle");
  const bodyEl = document.getElementById("appModalBody");
  modalCallback = onConfirm;

  if (titleEl) titleEl.innerHTML = title;
  if (bodyEl) bodyEl.innerHTML = messageHtml;
  if (overlay) overlay.classList.add("open");
}

function closeModal() {
  const overlay = document.getElementById("appModalOverlay");
  if (overlay) overlay.classList.remove("open");
  modalCallback = null;
}

function confirmModalAction() {
  if (typeof modalCallback === "function") {
    modalCallback();
  }
  closeModal();
}

function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>✓</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

function showSaveIndicator() {
  const indicator = document.getElementById("autoSaveIndicator");
  if (indicator) {
    indicator.style.opacity = "1";
    setTimeout(() => {
      indicator.style.opacity = "0";
    }, 1200);
  }
}

function openHelpModal() {
  openModal(
    "ℹ️ Ponderaciones Oficiales y Algoritmo",
    `<div style="text-align: left; font-size: 0.85rem; line-height: 1.6;">
      <p><b>Universidad Finis Terrae</b></p>
      <p style="margin-top:6px;">Las ponderaciones oficiales por defecto suman <b>70%</b> y se dividen por <b>0.7</b>:</p>
      <ul style="margin-left: 20px; margin-top: 6px;">
        <li><b>Controles:</b> 36%</li>
        <li><b>Proyecto:</b> 20%</li>
        <li><b>Laboratorios:</b> 14%</li>
      </ul>
      <p style="margin-top: 10px;"><b>Fórmula de Presentación:</b></p>
      <code style="background:#f1f5f9; display:block; padding:6px; border-radius:6px; margin:4px 0;">
        ((Controles × 0.36) + (Proyecto × 0.20) + (Labs × 0.14)) / 0.70
      </code>
      <p style="margin-top: 10px;"><b>Fórmula de Examen:</b></p>
      <code style="background:#f1f5f9; display:block; padding:6px; border-radius:6px; margin:4px 0;">
        (3.95 - (Nota Presentación × 0.7)) / 0.3
      </code>
      <p style="margin-top: 8px;">Con nota de presentación &ge; 5.0 o examen requerido &le; 1.0, quedas <b>Eximido</b>.</p>
    </div>`,
    null
  );
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================
// MODO NOCHE / DARK MODE (Tonos que no queman la vista)
// ==========================================
const THEME_KEY = "finis_theme_mode";

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.body.classList.add("dark-mode");
    updateThemeToggleBtn(true);
  } else {
    document.body.classList.remove("dark-mode");
    updateThemeToggleBtn(false);
  }
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  updateThemeToggleBtn(isDark);
  showToast(isDark ? "Modo noche activado 🌙" : "Modo claro activado ☀️");
}

function updateThemeToggleBtn(isDark) {
  const btn = document.getElementById("themeToggleBtn");
  if (btn) {
    btn.innerHTML = isDark ? "☀️" : "🌙";
    btn.title = isDark ? "Cambiar a modo claro" : "Cambiar a modo noche";
  }
}

// ==========================================
// INICIALIZACIÓN: PANTALLA POR DEFECTO CALCULADORA RÁPIDA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initStorage();

  const hash = window.location.hash.toLowerCase();
  if (hash.includes("detalle") || hash.includes("ramo")) {
    switchTab("detalle");
  } else if (hash.includes("ramos")) {
    switchTab("ramos");
  } else {
    // Por defecto: Calculadora Rápida para acceso inmediato
    switchTab("calculadora");
  }
});
