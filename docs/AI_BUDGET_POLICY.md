# AI Budget Policy — Strideto

**Status:** Official engineering policy (L.2)  
**Aligned with:** L.1 Production Readiness §14

## Rules

1. **Paid AI integrations remain disabled** until the platform generates sustainable revenue.
2. Every AI-labeled capability must:
   - Remain behind **feature flags** (or stay unconfigured with no API keys)
   - Provide **deterministic fallback** behavior
   - Expose **operational cost** assumptions in docs before enablement
   - **Never block** core workflows (auth, apply, profiles, tracker, readiness, assessments, employer pipeline)

## Current launch configuration

| Setting | Value |
|---------|-------|
| Paid AI APIs (`OPENAI_*`, `ANTHROPIC_*`, etc.) | **OFF** (do not set keys) |
| Deterministic career features | **ON** |
| Career platform | Fully functional without LLM |
| Monthly AI operating cost | **≈ $0** |

## Deterministic surfaces (allowed ON)

- Readiness / scoring engine (weighted providers)
- Employer candidate ranking (explainable weights)
- Assessment attempt grading
- Resume analyzer heuristics / templates
- Admin job-description templates
- Keyword chatbot placeholders (if retained)

## Forbidden at launch

- LLM resume scoring as a hard dependency
- Paid embedding / matching for employer list
- Any GigRadar AI code review that requires paid APIs (deferred to C.9 + budget)

## Enablement process (post-revenue)

1. Document cost estimate and hard monthly spend cap  
2. Add feature flag default **OFF**  
3. Ship deterministic fallback path  
4. Opt-in staging experiment  
5. Finance/product approval  

See also: `.cursor/rules/ai-budget-policy.mdc`
