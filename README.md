# Diet Policy Engine
Rule-based validator for institutional diet policies. Node.js (built-in modules only) + plain HTML/CSS/JS.

    npm start      # http://localhost:3000
    npm test       # 6 unit tests

Add or edit policies in `engine/policies.js` (rules are data). Thresholds are illustrative: replace them with your institution's actual policy.

API: GET /api/policies, POST /api/validate  {"policy":"diabetic","meals":[{"type":"lunch","items":[{"calories":400,"sodium_mg":300,"carbs_g":50,"fiber_g":5,"added_sugar_g":2,"sat_fat_g":3}]}]}
