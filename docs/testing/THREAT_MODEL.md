# Threat model — STRIDE (T03)

Couples threats to **security test cases** in `SECURITY_RLS.md` and `API_CONTRACTS.md`.

**Scope:** Wave 0 app + API routes + Supabase + AI endpoint.

## 1. STRIDE per asset

**Assets:** `cards`, `customers`, `invoices`, `quotes`, `ai_tool_calls`, `profiles`, service role key, `GEMINI_API_KEY`.

| Threat            | STRIDE | Scenario                         | Test                                  |
| ----------------- | ------ | -------------------------------- | ------------------------------------- |
| Spoofing          | S      | Attacker uses stolen JWT         | SEC-AUTH-002, SEC-AUTH-003            |
| Tampering         | T      | PATCH card with another org's id | SEC-RLS-020, INT-API-015              |
| Repudiation       | R      | Deny AI move                     | AI-LOG-001 (activity + ai_tool_calls) |
| Info disclosure   | I      | List cards without membership    | SEC-RLS-001, SEC-RLS-002              |
| Denial of service | D      | Flood /api/ai/command            | PERF-AI-001, rate limit               |
| Elevation         | E      | Worker calls mark paid           | SEC-ROLE-005, AI-TOOL-010             |

## 2. Trust boundaries

```txt
[Browser] —anon→ [Next.js] —user JWT→ [Supabase RLS]
                —service role→ [Supabase] (server only)
                —API key→ [Gemini]
[Internet] —webhook→ [Next.js] (Wave 1+, signature required)
```

## 3. Attack trees (abbreviated)

### Steal another org's jobs

```txt
Goal: Read org B cards as user A
├─ Bypass RLS with anon key → SEC-RLS-001
├─ Guess UUID → SEC-RLS-030 (404, not 403 leak)
├─ SQL injection → ORM parameterized INT-API-*
└─ Leak in AI response → AI-CTX-003 cross-org prompt
```

### Unauthorized AI write

```txt
Goal: Move card via AI without approval
├─ POST executor with forged body → SEC-API-010
├─ Prompt injection "ignore tools" → AI-INJ-*
└─ Client-side only check → INT-API-020 server enforce
```

## 4. Security test coupling matrix

| STRIDE | Min tests before release |
| ------ | ------------------------ |
| S      | 3                        |
| T      | 5                        |
| R      | 2                        |
| I      | 10 (full RLS matrix)     |
| D      | 2                        |
| E      | 4                        |

## 5. Wave 1 threats (preview)

| Threat                   | Control          | Test         |
| ------------------------ | ---------------- | ------------ |
| Forged PayPal webhook    | Signature verify | WH-PAY-001   |
| Webhook replay           | Idempotency      | WH-PAY-003   |
| Portal token brute force | Hash + expiry    | SEC-PORT-002 |
