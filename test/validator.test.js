'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { validate } = require('../engine/validator');

const item = (o = {}) => ({ calories: 100, sodium_mg: 0, carbs_g: 0, fiber_g: 0, added_sugar_g: 0, sat_fat_g: 0, ...o });
const plan = (policy, meals) => ({ policy, meals: Object.entries(meals).map(([type, items]) => ({ type, items })) });

test('rejects unknown policy and negative numbers', () => {
  const r = validate(plan('nope', { lunch: [item({ sodium_mg: -5 })] }));
  assert.equal(r.ok, false);
  assert.equal(r.problems.length, 2);
});

test('low sodium: flags daily and per-meal sodium as errors', () => {
  const r = validate(plan('low_sodium', { breakfast: [item({ sodium_mg: 800 })], lunch: [item({ sodium_mg: 800 })], dinner: [item({ sodium_mg: 800 })] }));
  assert.equal(r.status, 'non_compliant');
  assert.ok(r.violations.some((v) => v.ruleId === 'NA-DAY' && v.actual === 2400));
  assert.equal(r.violations.filter((v) => v.ruleId === 'NA-MEAL').length, 3);
});

test('low sodium: passes a clean plan', () => {
  const r = validate(plan('low_sodium', { breakfast: [item({ sodium_mg: 300 })], lunch: [item({ sodium_mg: 300 })], dinner: [item({ sodium_mg: 300 })] }));
  assert.equal(r.status, 'compliant');
  assert.equal(r.score, 100);
});

test('diabetic: carb range is inclusive and enforced per meal', () => {
  const r = validate(plan('diabetic', { breakfast: [item({ carbs_g: 45 })], lunch: [item({ carbs_g: 60 })], dinner: [item({ carbs_g: 61 })] }));
  const bad = r.violations.filter((v) => v.ruleId === 'CHO-MEAL');
  assert.equal(bad.length, 1);
  assert.equal(bad[0].mealType, 'dinner');
});

test('diabetic: missing main meal is an error', () => {
  const r = validate(plan('diabetic', { breakfast: [item({ carbs_g: 50 })], lunch: [item({ carbs_g: 50 })] }));
  assert.ok(r.violations.some((v) => v.ruleId === 'MEALS' && v.severity === 'error'));
});

test('added sugar percentage is derived from calories', () => {
  const r = validate(plan('general', { lunch: [item({ calories: 400, added_sugar_g: 20 })] })); // 80 kcal = 20%
  assert.equal(r.dayTotals.addedSugarPct, 20);
  assert.ok(r.violations.some((v) => v.ruleId === 'SUG-DAY'));
});
