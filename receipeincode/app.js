/*
 * ReceipeInCode — Generador de recetas en Tabular Recipe Notation (TRN)
 * Réplica del sistema de tablas acumulativas de Michael Chu (cookingforengineers.com).
 */

// ===================== DATOS DE REFERENCIA =====================

const UNITS = [
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'l' },
  { value: 'oz', label: 'oz' },
  { value: 'lb', label: 'lb' },
  { value: 'cup', label: 'taza' },
  { value: 'tbsp', label: 'cda' },
  { value: 'tsp', label: 'cdta' },
  { value: 'unidad', label: 'unidad/pieza' },
  { value: 'pizca', label: 'pizca' },
];

const ALLERGENS = ['Leche', 'Huevo', 'Cacahuate', 'Frutos secos', 'Soya', 'Trigo', 'Pescado', 'Marisco'];

const ACTION_GROUPS = [
  { group: 'Preparación', items: [
    ['lavar', 'Lavar'], ['pelar', 'Pelar'], ['medir', 'Medir'], ['pesar', 'Pesar'],
    ['cascar', 'Cascar'], ['separar', 'Separar'], ['engrasar', 'Engrasar'], ['enharinar', 'Enharinar'],
    ['forrar', 'Forrar'], ['precalentar', 'Precalentar'], ['rallar cáscara', 'Rallar cáscara / zest'], ['exprimir', 'Exprimir'],
  ]},
  { group: 'Corte', items: [
    ['cortar', 'Cortar'], ['picar', 'Picar (chop)'], ['cortar en cubos', 'Cortar en cubos (dice)'],
    ['picar fino', 'Picar fino (mince)'], ['rebanar', 'Rebanar (slice)'], ['julianar', 'Julianar'],
    ['rallar', 'Rallar (grate)'], ['machacar', 'Machacar (crush)'], ['hacer puré', 'Hacer puré (mash)'],
    ['desmenuzar', 'Desmenuzar (crumble)'],
  ]},
  { group: 'Mezclado', items: [
    ['mezclar', 'Mezclar (mix)'], ['revolver', 'Revolver (stir)'], ['combinar', 'Combinar'],
    ['batir', 'Batir (beat)'], ['batir con varilla', 'Batir con varilla (whisk)'], ['montar', 'Montar / batir a punto (whip)'],
    ['incorporar envolviendo', 'Incorporar envolviendo (fold in)'], ['licuar', 'Licuar (blend)'], ['acremar', 'Acremar (cream)'],
    ['amasar', 'Amasar (knead)'], ['mezclar ligero', 'Mezclar ligero (toss)'], ['tamizar', 'Tamizar (sift)'], ['agregar', 'Agregar (add)'],
  ]},
  { group: 'Cocción', items: [
    ['hornear', 'Hornear (bake)'], ['asar al horno', 'Asar al horno (roast)'], ['gratinar', 'Gratinar (broil)'],
    ['asar a la parrilla', 'Asar a la parrilla (grill)'], ['freír', 'Freír (fry)'], ['freír por inmersión', 'Freír por inmersión (deep-fry)'],
    ['saltear', 'Saltear (sauté)'], ['sellar', 'Sellar (sear)'], ['hervir', 'Hervir (boil)'], ['cocer a fuego lento', 'Cocer a fuego lento (simmer)'],
    ['escalfar', 'Escalfar (poach)'], ['cocer al vapor', 'Cocer al vapor (steam)'], ['blanquear', 'Blanquear (blanch)'],
    ['sancochar', 'Sancochar (parboil)'], ['brasear', 'Brasear (braise)'], ['guisar', 'Guisar (stew)'], ['tostar', 'Tostar (toast)'],
    ['caramelizar', 'Caramelizar'], ['reducir', 'Reducir'], ['desglasar', 'Desglasar (deglaze)'], ['derretir', 'Derretir (melt)'],
    ['atemperar', 'Atemperar (temper)'], ['calentar', 'Calentar'], ['recalentar', 'Recalentar'], ['dorar', 'Dorar (brown)'],
  ]},
  { group: 'Reposo / Temperatura', items: [
    ['enfriar en refrigerador', 'Enfriar en refrigerador (chill)'], ['dejar enfriar', 'Dejar enfriar (cool)'], ['reposar', 'Reposar (rest)'],
    ['leudar', 'Leudar (proof/rise)'], ['marinar', 'Marinar'], ['remojar', 'Remojar (soak)'], ['infusionar', 'Infusionar (steep)'],
    ['refrigerar', 'Refrigerar'], ['congelar', 'Congelar (freeze)'], ['descongelar', 'Descongelar (thaw)'], ['cuajar', 'Cuajar (set)'],
  ]},
  { group: 'Acabado', items: [
    ['escurrir', 'Escurrir (drain)'], ['colar', 'Colar (strain)'], ['desespumar', 'Desespumar (skim)'], ['decorar', 'Decorar (garnish)'],
    ['sazonar', 'Sazonar (season)'], ['probar', 'Probar (taste)'], ['emplatar', 'Emplatar (plate)'], ['servir', 'Servir'],
    ['espolvorear', 'Espolvorear (dust)'], ['glasear', 'Glasear (glaze)'], ['cubrir con betún', 'Cubrir con betún (frost)'],
    ['armar', 'Armar (assemble)'], ['rebozar', 'Rebozar / cubrir (coat)'], ['sumergir', 'Sumergir (dip)'], ['enrollar', 'Enrollar (roll)'],
    ['untar', 'Untar / extender (spread)'], ['verter', 'Verter (pour)'],
  ]},
];

const ACTION_LABEL_BY_VALUE = {};
ACTION_GROUPS.forEach(g => g.items.forEach(([value, label]) => { ACTION_LABEL_BY_VALUE[value] = label; }));

// ===================== ESTADO =====================

let idCounter = 0;
function nextId(prefix) { idCounter += 1; return `${prefix}${idCounter}`; }

const state = {
  meta: { title: '', servings: '', panSize: '', panPrep: '', ovenTemp: '', bakeTime: '', notes: '', allergens: [] },
  nodes: {},           // id -> ingredient | action node
  ingredientOrder: [],
  actionOrder: [],
};

function resetState() {
  idCounter = 0;
  state.meta = { title: '', servings: '', panSize: '', panPrep: '', ovenTemp: '', bakeTime: '', notes: '', allergens: [] };
  state.nodes = {};
  state.ingredientOrder = [];
  state.actionOrder = [];
}

// ===================== UTILIDADES =====================

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function unitLabel(value) {
  const u = UNITS.find(u => u.value === value);
  return u ? u.label : (value || '');
}

function actionDisplayLabel(node) {
  if (node.actionValue === 'custom') return node.customLabel || '(acción personalizada)';
  return ACTION_LABEL_BY_VALUE[node.actionValue] || node.actionValue;
}

// ===================== LÓGICA DEL ÁRBOL =====================

function buildParentMap() {
  const map = {};
  state.actionOrder.forEach(nodeId => {
    const node = state.nodes[nodeId];
    node.children.forEach((childId, index) => {
      map[childId] = { parentId: nodeId, index };
    });
  });
  return map;
}

function getPoolIds() {
  const parentMap = buildParentMap();
  const all = [...state.ingredientOrder, ...state.actionOrder];
  return all.filter(id => !(id in parentMap));
}

function getRootId() {
  const pool = getPoolIds();
  return pool.length === 1 ? pool[0] : null;
}

function leafOrder(id, memo) {
  if (memo[id]) return memo[id];
  const node = state.nodes[id];
  const result = node.type === 'ingredient' ? [id] : node.children.flatMap(c => leafOrder(c, memo));
  memo[id] = result;
  return result;
}

function colOf(id, memo) {
  if (memo[id] !== undefined) return memo[id];
  const node = state.nodes[id];
  const c = node.type === 'ingredient' ? 1 : 1 + Math.max(...node.children.map(ch => colOf(ch, memo)));
  memo[id] = c;
  return c;
}

// Recorre el árbol y calcula, para cada fila (ingrediente), qué celdas se
// "anclan" en ella y con qué rowspan/colspan, siguiendo el algoritmo:
//   1. Cada hoja = una fila.
//   2. col(nodo) = 1 + max(col(hijos)); las hojas están en columna 1.
//   3. Una celda se ancla en la fila de la PRIMERA hoja de su subárbol.
//   4. rowspan = número de hojas del subárbol.
//   5. colspan = distancia (en columnas) hasta la siguiente celda ya
//      ubicada a su derecha (el hijo siguiente en la cadena, o el padre
//      ya emitido, o el borde de la tabla).
function computeLayout(rootId) {
  const leafMemo = {};
  const colMemo = {};
  const order = leafOrder(rootId, leafMemo);
  const width = colOf(rootId, colMemo);
  const parentMap = buildParentMap();

  const rows = order.map(leafId => {
    const chain = [leafId];
    let cur = leafId;
    for (;;) {
      const p = parentMap[cur];
      if (!p || p.index !== 0) break;
      chain.push(p.parentId);
      cur = p.parentId;
    }
    const lastParent = parentMap[chain[chain.length - 1]];
    const blockColumn = lastParent ? colOf(lastParent.parentId, colMemo) : width + 1;

    const cells = chain.map((id, i) => {
      const endCol = i === chain.length - 1 ? blockColumn : colOf(chain[i + 1], colMemo);
      return {
        id,
        colspan: endCol - colOf(id, colMemo),
        rowspan: leafOrder(id, leafMemo).length,
        isLeaf: state.nodes[id].type === 'ingredient',
      };
    });
    return cells;
  });

  return { rows, width, order };
}

function validate() {
  const errors = [];
  const allIds = [...state.ingredientOrder, ...state.actionOrder];
  if (allIds.length === 0) {
    errors.push('Agrega al menos un ingrediente para comenzar.');
    return errors;
  }
  const pool = getPoolIds();
  if (pool.length > 1) {
    const labels = pool.map(id => shortLabel(id, 0)).join('; ');
    errors.push(`Faltan combinar estos elementos en una única mezcla final: ${labels}.`);
  }
  // Comprobación defensiva de ciclos (estructuralmente no deberían ocurrir,
  // ya que un elemento se retira del "pool" en cuanto se usa como hijo).
  const visiting = new Set();
  const visited = new Set();
  function dfs(id) {
    if (visited.has(id)) return true;
    if (visiting.has(id)) return false;
    visiting.add(id);
    const node = state.nodes[id];
    if (node.type === 'action') {
      for (const child of node.children) if (!dfs(child)) return false;
    }
    visiting.delete(id);
    visited.add(id);
    return true;
  }
  for (const id of allIds) {
    if (!dfs(id)) {
      errors.push('Se detectó un ciclo en la estructura de la receta. Revisa los pasos combinados.');
      break;
    }
  }
  return errors;
}

function shortLabel(id, depth) {
  const node = state.nodes[id];
  if (node.type === 'ingredient') {
    const qty = node.qty ? `${node.qty} ${unitLabel(node.unit)} ` : '';
    return `${qty}${node.name}`.trim();
  }
  if (depth >= 2) return `[${actionDisplayLabel(node)}...]`;
  const inner = node.children.map(c => shortLabel(c, depth + 1)).join(', ');
  return `${actionDisplayLabel(node)}: ${inner}`;
}

// ===================== RENDER: FORMULARIO =====================

function fillUnitSelect(select) {
  select.innerHTML = UNITS.map(u => `<option value="${u.value}">${escapeHtml(u.label)}</option>`).join('');
}

function fillActionSelect(select) {
  const groups = ACTION_GROUPS.map(g => {
    const options = g.items.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
    return `<optgroup label="${escapeHtml(g.group)}">${options}</optgroup>`;
  }).join('');
  select.innerHTML = groups + '<option value="custom">Otra (personalizada)…</option>';
}

function renderAllergenCheckboxes() {
  const wrap = document.getElementById('allergen-list');
  wrap.innerHTML = ALLERGENS.map(a => `
    <label><input type="checkbox" class="allergen-checkbox" value="${escapeHtml(a)}"> ${escapeHtml(a)}</label>
  `).join('');
  wrap.querySelectorAll('.allergen-checkbox').forEach(cb => {
    cb.checked = state.meta.allergens.includes(cb.value);
    cb.addEventListener('change', () => {
      state.meta.allergens = [...wrap.querySelectorAll('.allergen-checkbox:checked')].map(c => c.value);
      renderPreview();
    });
  });
}

function renderIngredientList() {
  const wrap = document.getElementById('ingredient-list');
  if (state.ingredientOrder.length === 0) {
    wrap.innerHTML = '<p class="placeholder">Aún no hay ingredientes.</p>';
    return;
  }
  const parentMap = buildParentMap();
  wrap.innerHTML = state.ingredientOrder.map(id => {
    const node = state.nodes[id];
    const used = id in parentMap;
    const qty = node.qty ? `${node.qty} ${unitLabel(node.unit)}` : '';
    const alt = node.qtyAlt ? ` (${node.qtyAlt} ${unitLabel(node.unitAlt)})` : '';
    return `
      <div class="list-row">
        <span class="row-text">${escapeHtml(qty)}${escapeHtml(alt)} ${escapeHtml(node.name)}</span>
        <span class="badge ${used ? 'used' : ''}">${used ? 'usado' : 'disponible'}</span>
        ${used ? '' : `<button type="button" data-remove-ingredient="${id}" title="Eliminar">✕</button>`}
      </div>`;
  }).join('');
  wrap.querySelectorAll('[data-remove-ingredient]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-remove-ingredient');
      delete state.nodes[id];
      state.ingredientOrder = state.ingredientOrder.filter(x => x !== id);
      renderAll();
    });
  });
}

function renderCombinePool() {
  const wrap = document.getElementById('combine-pool');
  const pool = getPoolIds();
  if (pool.length === 0) {
    wrap.innerHTML = '<p class="placeholder">Agrega ingredientes para poder combinarlos.</p>';
    return;
  }
  wrap.innerHTML = pool.map(id => `
    <label class="pool-row">
      <input type="checkbox" class="pool-checkbox" value="${id}">
      <span>${escapeHtml(shortLabel(id, 0))}</span>
    </label>
  `).join('');
}

function renderStepsList() {
  const wrap = document.getElementById('steps-list');
  if (state.actionOrder.length === 0) {
    wrap.innerHTML = '';
    return;
  }
  const parentMap = buildParentMap();
  wrap.innerHTML = state.actionOrder.map((id, i) => {
    const node = state.nodes[id];
    const used = id in parentMap;
    const childrenLabel = node.children.map(c => shortLabel(c, 1)).join('; ');
    const note = node.note ? ` <em>(${escapeHtml(node.note)})</em>` : '';
    return `
      <div class="list-row">
        <span class="row-text">Paso ${i + 1}: <strong>${escapeHtml(actionDisplayLabel(node))}</strong> — ${escapeHtml(childrenLabel)}${note}</span>
        <span class="badge ${used ? 'used' : ''}">${used ? 'usado' : 'disponible'}</span>
        ${used ? '' : `<button type="button" data-remove-step="${id}" title="Eliminar paso (los elementos regresan al grupo disponible)">✕</button>`}
      </div>`;
  }).join('');
  wrap.querySelectorAll('[data-remove-step]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-remove-step');
      delete state.nodes[id];
      state.actionOrder = state.actionOrder.filter(x => x !== id);
      renderAll();
    });
  });
}

// ===================== RENDER: VISTA PREVIA (TABLA) =====================

function renderPreview() {
  const errBox = document.getElementById('errors');
  const errors = validate();
  errBox.innerHTML = errors.map(e => `<div class="error">⚠ ${escapeHtml(e)}</div>`).join('');

  const cardWrap = document.getElementById('preview-card');
  const rootId = getRootId();

  if (!rootId || state.ingredientOrder.length === 0) {
    cardWrap.innerHTML = '<p class="placeholder">Agrega ingredientes y combínalos para ver la vista previa.</p>';
    return;
  }

  const { rows, width } = computeLayout(rootId);
  const m = state.meta;

  const metaParts = [];
  if (m.servings) metaParts.push(`Rinde: ${escapeHtml(m.servings)}`);
  if (m.panSize) metaParts.push(`Molde: ${escapeHtml(m.panSize)}`);
  if (m.ovenTemp) metaParts.push(`Horno: ${escapeHtml(m.ovenTemp)}`);
  if (m.bakeTime) metaParts.push(`Tiempo de horneado: ${escapeHtml(m.bakeTime)}`);

  let specialRows = '';
  if (m.panPrep) specialRows += `<tr><td class="special-row" colspan="${width}">🧈 ${escapeHtml(m.panPrep)}</td></tr>`;
  if (m.ovenTemp) specialRows += `<tr><td class="special-row" colspan="${width}">🔥 Precalentar el horno a ${escapeHtml(m.ovenTemp)}</td></tr>`;

  const bodyRows = rows.map(cells => {
    const tds = cells.map(cell => {
      const node = state.nodes[cell.id];
      const isRootCell = cell.id === rootId;
      let content;
      if (node.type === 'ingredient') {
        const qty = node.qty ? `${escapeHtml(node.qty)} ${escapeHtml(unitLabel(node.unit))}` : '';
        const alt = node.qtyAlt ? ` (${escapeHtml(node.qtyAlt)} ${escapeHtml(unitLabel(node.unitAlt))})` : '';
        content = `<div class="cell-ing"><span class="qty">${qty}${alt}</span><span class="name">${escapeHtml(node.name)}</span></div>`;
      } else {
        let note = node.note;
        if (!note && isRootCell && (m.ovenTemp || m.bakeTime)) {
          note = [m.ovenTemp, m.bakeTime].filter(Boolean).join(', ');
        }
        content = `<div class="cell-action"><span class="verb">${escapeHtml(actionDisplayLabel(node))}</span>${note ? `<div class="note">${escapeHtml(note)}</div>` : ''}</div>`;
      }
      const cls = node.type === 'ingredient' ? 'cell-leaf' : 'cell-action';
      return `<td class="${cls}" rowspan="${cell.rowspan}" colspan="${cell.colspan}">${content}</td>`;
    }).join('');
    return `<tr>${tds}</tr>`;
  }).join('');

  const extras = [];
  if (m.notes) extras.push(`<div><strong>Notas:</strong> ${escapeHtml(m.notes)}</div>`);
  if (m.allergens.length) extras.push(`<div><strong>Alérgenos:</strong> ${escapeHtml(m.allergens.join(', '))}</div>`);

  cardWrap.innerHTML = `
    <h1 class="recipe-title">${escapeHtml(m.title || 'Receta sin título')}</h1>
    ${metaParts.length ? `<p class="recipe-meta">${metaParts.join(' &middot; ')}</p>` : ''}
    <table class="recipe-table">
      <tbody>
        ${specialRows}
        ${bodyRows}
      </tbody>
    </table>
    ${extras.length ? `<div class="recipe-extra">${extras.join('')}</div>` : ''}
  `;
}

function renderAll() {
  renderIngredientList();
  renderCombinePool();
  renderStepsList();
  renderPreview();
}

// ===================== EVENTOS: FORMULARIO =====================

function readMetaFromForm() {
  state.meta.title = document.getElementById('meta-title').value.trim();
  state.meta.servings = document.getElementById('meta-servings').value.trim();
  state.meta.panSize = document.getElementById('meta-pan-size').value.trim();
  state.meta.panPrep = document.getElementById('meta-pan-prep').value.trim();
  state.meta.ovenTemp = document.getElementById('meta-oven-temp').value.trim();
  state.meta.bakeTime = document.getElementById('meta-bake-time').value.trim();
  state.meta.notes = document.getElementById('meta-notes').value.trim();
}

function writeMetaToForm() {
  document.getElementById('meta-title').value = state.meta.title;
  document.getElementById('meta-servings').value = state.meta.servings;
  document.getElementById('meta-pan-size').value = state.meta.panSize;
  document.getElementById('meta-pan-prep').value = state.meta.panPrep;
  document.getElementById('meta-oven-temp').value = state.meta.ovenTemp;
  document.getElementById('meta-bake-time').value = state.meta.bakeTime;
  document.getElementById('meta-notes').value = state.meta.notes;
  renderAllergenCheckboxes();
}

function wireMetaInputs() {
  ['meta-title', 'meta-servings', 'meta-pan-size', 'meta-pan-prep', 'meta-oven-temp', 'meta-bake-time', 'meta-notes']
    .forEach(id => document.getElementById(id).addEventListener('input', () => { readMetaFromForm(); renderPreview(); }));
}

function wireIngredientForm() {
  const altToggle = document.getElementById('ing-alt-toggle');
  const altWrap = document.getElementById('ing-alt-wrap');
  altToggle.addEventListener('change', () => { altWrap.hidden = !altToggle.checked; });

  document.getElementById('btn-add-ingredient').addEventListener('click', () => {
    const qty = document.getElementById('ing-qty').value.trim();
    const unit = document.getElementById('ing-unit').value;
    const name = document.getElementById('ing-name').value.trim();
    if (!name) { alert('Escribe el nombre del ingrediente.'); return; }
    const useAlt = altToggle.checked;
    const qtyAlt = useAlt ? document.getElementById('ing-qty-alt').value.trim() : '';
    const unitAlt = useAlt ? document.getElementById('ing-unit-alt').value : '';

    const id = nextId('ing');
    state.nodes[id] = { id, type: 'ingredient', qty, unit, qtyAlt, unitAlt, name };
    state.ingredientOrder.push(id);

    document.getElementById('ing-qty').value = '';
    document.getElementById('ing-name').value = '';
    document.getElementById('ing-qty-alt').value = '';
    renderAll();
  });
}

function wireCombineForm() {
  const actionSelect = document.getElementById('action-select');
  const customWrap = document.getElementById('custom-action-wrap');
  actionSelect.addEventListener('change', () => {
    customWrap.hidden = actionSelect.value !== 'custom';
  });

  document.getElementById('btn-combine').addEventListener('click', () => {
    const checked = [...document.querySelectorAll('.pool-checkbox:checked')].map(c => c.value);
    if (checked.length === 0) { alert('Selecciona al menos un elemento disponible para combinar.'); return; }
    const actionValue = actionSelect.value;
    const customLabel = document.getElementById('custom-action-input').value.trim();
    if (actionValue === 'custom' && !customLabel) { alert('Escribe el nombre de la acción personalizada.'); return; }
    const note = document.getElementById('note-input').value.trim();

    const id = nextId('act');
    state.nodes[id] = { id, type: 'action', actionValue, customLabel, note, children: checked };
    state.actionOrder.push(id);

    document.getElementById('note-input').value = '';
    document.getElementById('custom-action-input').value = '';
    renderAll();
  });
}

// ===================== EXPORTACIÓN =====================

function wireExportButtons() {
  document.getElementById('btn-print').addEventListener('click', () => window.print());

  const downloadBtn = document.getElementById('btn-download');
  downloadBtn.addEventListener('click', async () => {
    if (typeof html2canvas === 'undefined' || !window.jspdf) {
      alert('La descarga en imagen/PDF requiere conexión a internet para cargar las librerías. Usa "Imprimir / Guardar PDF" como alternativa sin conexión.');
      return;
    }
    const card = document.getElementById('preview-card');
    try {
      const canvas = await html2canvas(card, { scale: 3, backgroundColor: '#FDF6E3' });
      const link = document.createElement('a');
      link.download = `${(state.meta.title || 'receta').replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      alert('No se pudo generar la imagen: ' + e.message);
    }
  });
}

// ===================== RECETA DE EJEMPLO =====================

function loadExampleRecipe() {
  resetState();
  state.meta = {
    title: 'Brownie de café',
    servings: '9 porciones',
    panSize: 'Molde de 20×20 cm',
    panPrep: 'Engrasar y enharinar el molde',
    ovenTemp: '175°C (350°F)',
    bakeTime: '30–40 min',
    notes: 'Para un brownie más fudgy, retira del horno un poco antes.',
    allergens: ['Leche', 'Huevo', 'Trigo'],
  };

  const ing = (qty, unit, name, qtyAlt = '', unitAlt = '') => {
    const id = nextId('ing');
    state.nodes[id] = { id, type: 'ingredient', qty, unit, qtyAlt, unitAlt, name };
    state.ingredientOrder.push(id);
    return id;
  };
  const act = (actionValue, note, children, customLabel = '') => {
    const id = nextId('act');
    state.nodes[id] = { id, type: 'action', actionValue, customLabel, note, children };
    state.actionOrder.push(id);
    return id;
  };

  const mantequilla = ing('115', 'g', 'mantequilla sin sal', '1/2', 'cup');
  const azucar = ing('200', 'g', 'azúcar', '1', 'cup');
  const vainilla = ing('1', 'tsp', 'extracto de vainilla');
  const cafe = ing('1', 'tbsp', 'café espresso instantáneo');
  const huevos = ing('2', 'unidad', 'huevos');
  const harina = ing('95', 'g', 'harina', '3/4', 'cup');
  const cacao = ing('43', 'g', 'cacao en polvo', '1/2', 'cup');
  const sal = ing('1', 'tsp', 'sal', '1/4', 'tsp');

  const derretida = act('derretir', '', [mantequilla]);
  const mezclaBase = act('mezclar', '', [azucar, vainilla, cafe, derretida]);
  const conHuevos = act('mezclar', '', [mezclaBase, huevos]);
  const incorporados = act('incorporar envolviendo', '', [conHuevos, harina, cacao, sal]);
  act('hornear', '175°C (350°F), 30–40 min', [incorporados]);

  writeMetaToForm();
  renderAll();
}

// ===================== INICIALIZACIÓN =====================

function init() {
  fillUnitSelect(document.getElementById('ing-unit'));
  fillUnitSelect(document.getElementById('ing-unit-alt'));
  fillActionSelect(document.getElementById('action-select'));
  renderAllergenCheckboxes();

  wireMetaInputs();
  wireIngredientForm();
  wireCombineForm();
  wireExportButtons();

  document.getElementById('btn-example').addEventListener('click', loadExampleRecipe);
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('¿Reiniciar toda la receta? Se perderán los datos actuales.')) return;
    resetState();
    writeMetaToForm();
    renderAll();
  });

  loadExampleRecipe();
}

document.addEventListener('DOMContentLoaded', init);
