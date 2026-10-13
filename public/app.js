'use strict';
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
const FIELDS = [['calories', 'kcal'], ['sodium_mg', 'Sodium mg'], ['carbs_g', 'Carbs g'],
  ['fiber_g', 'Fiber g'], ['added_sugar_g', 'Added sugar g'], ['sat_fat_g', 'Sat fat g']];
const LABELS = { sodium_mg: 'Sodium (mg)', carbs_g: 'Carbohydrate (g)', fiber_g: 'Fiber (g)', calories: 'Calories',
  added_sugar_g: 'Added sugar (g)', sat_fat_g: 'Saturated fat (g)', addedSugarPct: 'Added sugar (% kcal)',
  satFatPct: 'Saturated fat (% kcal)', mainMealCount: 'Main meals included' };
const OPS = { lte: 'at most', gte: 'at least', between: 'between' };

// [name, kcal, sodium, carbs, fiber, added sugar, sat fat]
const row = (a) => Object.fromEntries(['name', 'calories', 'sodium_mg', 'carbs_g', 'fiber_g', 'added_sugar_g', 'sat_fat_g'].map((k, i) => [k, a[i]]));
const SAMPLES = {
  good: { breakfast: [['Oatmeal with milk', 250, 120, 40, 4, 0, 1.5], ['Mixed berries, 1 cup', 60, 1, 15, 4, 0, 0]],
    lunch: [['Grilled chicken salad', 400, 450, 20, 5, 2, 3], ['Whole wheat roll', 120, 200, 22, 3, 1, 0.2], ['Orange', 62, 0, 15, 3, 0, 0]],
    dinner: [['Baked salmon', 300, 300, 0, 0, 0, 2.5], ['Brown rice, 1 cup', 215, 10, 45, 4, 0, 0.4], ['Steamed broccoli', 55, 64, 11, 5, 0, 0.1]],
    snack: [['Greek yogurt with berries', 110, 50, 17, 2, 0, 0]] },
  bad: { breakfast: [['Bacon egg & cheese biscuit', 520, 1100, 36, 1, 2, 12], ['Sweetened orange juice', 150, 10, 36, 0, 28, 0]],
    lunch: [['Canned noodle soup', 180, 900, 25, 1, 2, 1.5], ['Ham sandwich', 450, 1300, 42, 2, 5, 6], ['Cola', 140, 45, 39, 0, 39, 0]],
    dinner: [['Fried chicken', 480, 1050, 18, 1, 0, 7], ['Mashed potatoes', 200, 400, 30, 2, 0, 3]],
    snack: [['Cookies', 320, 220, 50, 1, 25, 6]] }
};

const $ = (id) => document.getElementById(id);
function el(tag, props = {}, ...kids) {
  const n = Object.assign(document.createElement(tag), props);
  kids.flat().forEach((k) => n.append(k));
  return n;
}

let policies = {};

function addRow(type, data) {
  const tr = el('tr');
  tr.append(el('td', {}, el('input', { type: 'text', placeholder: 'Food', value: data?.name ?? '', 'aria-label': 'Food name' })));
  FIELDS.forEach(([k, label]) =>
    tr.append(el('td', {}, el('input', { type: 'number', min: 0, step: 'any', value: data?.[k] ?? 0, name: k, 'aria-label': `${label} for ${type}` }))));
  tr.append(el('td', {}, el('button', { type: 'button', className: 'del', textContent: 'Remove', onclick: () => tr.remove() })));
  $('meal-' + type).querySelector('tbody').append(tr);
}

function buildMeals() {
  const box = $('meals');
  box.replaceChildren();
  MEALS.forEach((type) => {
    const head = el('tr', {}, el('th', { textContent: 'Food' }), FIELDS.map(([, l]) => el('th', { textContent: l })), el('th'));
    box.append(el('div', { className: 'meal', id: 'meal-' + type },
      el('h3', { textContent: type }),
      el('div', { className: 'items' }, el('table', {}, el('thead', {}, head), el('tbody'))),
      el('button', { type: 'button', textContent: `Add food to ${type}`, onclick: () => addRow(type) })));
  });
}

function load(sample) {
  buildMeals();
  MEALS.forEach((t) => (sample[t] || []).forEach((r) => addRow(t, row(r))));
}

function collect() {
  return {
    policy: $('policy').value,
    meals: MEALS.map((type) => ({
      type,
      items: [...$('meal-' + type).querySelectorAll('tbody tr')].map((tr) => {
        const it = { name: tr.querySelector('input[type=text]').value };
        tr.querySelectorAll('input[type=number]').forEach((i) => { it[i.name] = i.value === '' ? NaN : Number(i.value); });
        return it;
      })
    }))
  };
}

function showRules() {
  const p = policies[$('policy').value];
  $('rule-list').replaceChildren(el('li', { textContent: 'Source: ' + p.source }),
    ...p.rules.map((r) => el('li', { textContent: `[${r.severity}] ${r.message}` })));
}

const where = (f) => (f.scope === 'meal' ? `${f.mealType}: ` : 'Whole day: ') + LABELS[f.metric];
const expected = (f) => `${OPS[f.expected.op]} ${[].concat(f.expected.value).join(' and ')}`;
const finding = (f, cls) => el('div', { className: 'finding ' + cls },
  el('strong', { textContent: where(f) }),
  el('span', { textContent: ` is ${f.actual}, needs ${expected(f)}` }),
  el('small', { textContent: f.message + ' (' + f.ruleId + ')' }));

function render(r) {
  const out = $('result');
  if (!r.ok) {
    out.replaceChildren(el('div', { className: 'banner non_compliant' }, el('strong', { textContent: 'The plan could not be checked' }),
      el('ul', {}, r.problems.map((p) => el('li', { textContent: p })))));
    return;
  }
  const titles = { compliant: 'Compliant', compliant_with_warnings: 'Compliant, with warnings', non_compliant: 'Not compliant' };
  const s = r.summary;
  out.replaceChildren(
    el('div', { className: 'banner ' + r.status }, el('strong', { textContent: `${titles[r.status]} (${r.score}% of rules passed)` }),
      el('span', { textContent: `${s.errors} errors, ${s.warnings} warnings, ${s.passed} passed. Policy: ${r.policy.name}.` })),
    r.violations.length ? el('h3', { textContent: 'Fix these' }) : '',
    ...r.violations.map((f) => finding(f, f.severity)),
    el('h3', { textContent: 'Daily totals' }),
    el('table', { className: 'totals' }, el('tbody', {}, Object.entries(r.dayTotals).map(([k, v]) =>
      el('tr', {}, el('td', { textContent: LABELS[k] || k }), el('td', { textContent: v }))))),
    r.passes.length ? el('h3', { textContent: 'Passed' }) : '',
    ...r.passes.map((f) => finding(f, 'pass')));
}

async function check() {
  try {
    const res = await fetch('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(collect()) });
    render(await res.json());
  } catch {
    render({ ok: false, problems: ['Cannot reach the server. Is it running (npm start)?'] });
  }
}

(async function init() {
  policies = await (await fetch('/api/policies')).json();
  Object.entries(policies).forEach(([id, p]) => $('policy').append(el('option', { value: id, textContent: p.name })));
  $('policy').addEventListener('change', showRules);
  $('validate').addEventListener('click', check);
  $('sample-good').addEventListener('click', () => load(SAMPLES.good));
  $('sample-bad').addEventListener('click', () => load(SAMPLES.bad));
  showRules();
  load(SAMPLES.good);
})();
