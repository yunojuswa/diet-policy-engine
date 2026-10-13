'use strict';
// Policies are DATA, not code. Add a policy or rule here and the engine,
// API and web page pick it up automatically.
// NOTE: thresholds are illustrative; replace them with your institution's actual policy.
//
// Rule fields: id, scope ('day'|'meal'), mealTypes (meal scope only), metric,
//              op ('lte'|'gte'|'between'), value, severity ('error'|'warning'), message

const MAIN = ['breakfast', 'lunch', 'dinner'];

const policies = {
  low_sodium: {
    name: 'Low-sodium hospital diet (2,000 mg)',
    source: 'Illustrative institutional policy, informed by AHA / Dietary Guidelines for Americans',
    rules: [
      { id: 'NA-DAY', scope: 'day', metric: 'sodium_mg', op: 'lte', value: 2000, severity: 'error', message: 'Daily sodium must not exceed 2,000 mg.' },
      { id: 'NA-MEAL', scope: 'meal', mealTypes: MAIN, metric: 'sodium_mg', op: 'lte', value: 700, severity: 'error', message: 'Each main meal must stay under 700 mg sodium.' },
      { id: 'NA-SNACK', scope: 'meal', mealTypes: ['snack'], metric: 'sodium_mg', op: 'lte', value: 200, severity: 'warning', message: 'Snacks should stay under 200 mg sodium.' },
      { id: 'SF-DAY', scope: 'day', metric: 'satFatPct', op: 'lte', value: 10, severity: 'warning', message: 'Saturated fat should be under 10% of calories.' },
      { id: 'MEALS', scope: 'day', metric: 'mainMealCount', op: 'gte', value: 3, severity: 'warning', message: 'Plan should include breakfast, lunch and dinner.' }
    ]
  },
  diabetic: {
    name: 'Diabetic consistent-carbohydrate diet',
    source: 'Illustrative institutional policy, informed by ADA nutrition guidance',
    rules: [
      { id: 'CHO-MEAL', scope: 'meal', mealTypes: MAIN, metric: 'carbs_g', op: 'between', value: [45, 60], severity: 'error', message: 'Each main meal must contain 45-60 g carbohydrate.' },
      { id: 'CHO-SNACK', scope: 'meal', mealTypes: ['snack'], metric: 'carbs_g', op: 'between', value: [15, 20], severity: 'warning', message: 'Snacks should contain 15-20 g carbohydrate.' },
      { id: 'SUG-DAY', scope: 'day', metric: 'addedSugarPct', op: 'lte', value: 10, severity: 'error', message: 'Added sugar must be under 10% of calories.' },
      { id: 'FIB-DAY', scope: 'day', metric: 'fiber_g', op: 'gte', value: 25, severity: 'warning', message: 'Aim for at least 25 g fiber per day.' },
      { id: 'NA-DAY', scope: 'day', metric: 'sodium_mg', op: 'lte', value: 2300, severity: 'warning', message: 'Daily sodium should not exceed 2,300 mg.' },
      { id: 'SF-DAY', scope: 'day', metric: 'satFatPct', op: 'lte', value: 10, severity: 'warning', message: 'Saturated fat should be under 10% of calories.' },
      { id: 'MEALS', scope: 'day', metric: 'mainMealCount', op: 'gte', value: 3, severity: 'error', message: 'Three regular meals are required to keep carbohydrate intake consistent.' }
    ]
  },
  general: {
    name: 'National dietary guidelines (general)',
    source: 'Dietary Guidelines for Americans 2020-2025 (limits)',
    rules: [
      { id: 'NA-DAY', scope: 'day', metric: 'sodium_mg', op: 'lte', value: 2300, severity: 'error', message: 'Sodium should be under 2,300 mg per day.' },
      { id: 'SUG-DAY', scope: 'day', metric: 'addedSugarPct', op: 'lte', value: 10, severity: 'error', message: 'Added sugar should be under 10% of calories.' },
      { id: 'SF-DAY', scope: 'day', metric: 'satFatPct', op: 'lte', value: 10, severity: 'error', message: 'Saturated fat should be under 10% of calories.' },
      { id: 'FIB-DAY', scope: 'day', metric: 'fiber_g', op: 'gte', value: 25, severity: 'warning', message: 'Aim for at least 25 g fiber per day.' }
    ]
  }
};

module.exports = { policies, MEAL_TYPES: ['breakfast', 'lunch', 'dinner', 'snack'], MAIN };
