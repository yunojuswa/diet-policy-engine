'use strict';
const { policies, MEAL_TYPES, MAIN } = require('./policies');

const NUTRIENTS = ['calories', 'sodium_mg', 'carbs_g', 'fiber_g', 'added_sugar_g', 'sat_fat_g'];
const OPS = {
  lte: (a, v) => a <= v,
  gte: (a, v) => a >= v,
  between: (a, v) => a >= v[0] && a <= v[1]
};
const round = (n) => Math.round(n * 10) / 10;

// Step 1: check the input shape. Returns a list of human-readable problems.
function checkInput(plan) {
  const errs = [];
  if (!plan || typeof plan !== 'object') return ['Request body must be a JSON object.'];
  if (!policies[plan.policy]) errs.push(`Unknown policy "${plan.policy}".`);
  if (!Array.isArray(plan.meals) || plan.meals.length === 0) return [...errs, 'meals must be a non-empty array.'];
  plan.meals.forEach((m, i) => {
    if (!MEAL_TYPES.includes(m.type)) errs.push(`meals[${i}].type must be one of ${MEAL_TYPES.join(', ')}.`);
    if (!Array.isArray(m.items)) return errs.push(`meals[${i}].items must be an array.`);
    m.items.forEach((it, j) => NUTRIENTS.forEach((k) => {
      if (typeof it[k] !== 'number' || !isFinite(it[k]) || it[k] < 0)
        errs.push(`meals[${i}].items[${j}].${k} must be a number >= 0.`);
    }));
  });
  return errs;
}

// Step 2: add up nutrients and derive percentage metrics.
function totals(items) {
  const t = Object.fromEntries(NUTRIENTS.map((k) => [k, items.reduce((s, it) => s + it[k], 0)]));
  t.addedSugarPct = t.calories ? (t.added_sugar_g * 4 * 100) / t.calories : 0;
  t.satFatPct = t.calories ? (t.sat_fat_g * 9 * 100) / t.calories : 0;
  return t;
}

// Step 3: run every rule of the chosen policy and collect results.
function validate(plan) {
  const problems = checkInput(plan);
  if (problems.length) return { ok: false, problems };

  const policy = policies[plan.policy];
  const meals = plan.meals.filter((m) => m.items.length > 0)
    .map((m) => ({ type: m.type, totals: totals(m.items) }));
  const dayTotals = totals(plan.meals.flatMap((m) => m.items));
  dayTotals.mainMealCount = new Set(meals.filter((m) => MAIN.includes(m.type)).map((m) => m.type)).size;

  const violations = [];
  const passes = [];
  const check = (rule, actual, mealType) => {
    const result = { ruleId: rule.id, scope: rule.scope, mealType, metric: rule.metric,
      actual: round(actual), expected: { op: rule.op, value: rule.value },
      severity: rule.severity, message: rule.message };
    (OPS[rule.op](actual, rule.value) ? passes : violations).push(result);
  };

  for (const rule of policy.rules) {
    if (rule.scope === 'day') check(rule, dayTotals[rule.metric]);
    else meals.filter((m) => rule.mealTypes.includes(m.type)).forEach((m) => check(rule, m.totals[rule.metric], m.type));
  }

  const errors = violations.filter((v) => v.severity === 'error').length;
  const warnings = violations.length - errors;
  const total = violations.length + passes.length;
  return {
    ok: true,
    policy: { id: plan.policy, name: policy.name, source: policy.source },
    status: errors ? 'non_compliant' : warnings ? 'compliant_with_warnings' : 'compliant',
    score: total ? Math.round((passes.length / total) * 100) : 100,
    summary: { errors, warnings, passed: passes.length },
    dayTotals: Object.fromEntries(Object.entries(dayTotals).map(([k, v]) => [k, round(v)])),
    violations, passes
  };
}

module.exports = { validate, checkInput, totals };
