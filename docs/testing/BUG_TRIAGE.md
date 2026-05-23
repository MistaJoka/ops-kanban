# Bug triage & severity (T19)

## Severity (S1–S4)

| Sev    | Definition                            | Examples                         | SLA fix                   |
| ------ | ------------------------------------- | -------------------------------- | ------------------------- |
| **S1** | Data loss, security breach, pay wrong | Cross-tenant leak, double charge | Block release; hotfix 24h |
| **S2** | Core path blocked                     | Cannot signup, cannot move jobs  | Before release            |
| **S3** | Degraded UX                           | Filter wrong, ugly mobile        | Next sprint               |
| **S4** | Cosmetic                              | typo, minor alignment            | Backlog                   |

## Priority vs severity

|                     | High user impact | Low |
| ------------------- | ---------------- | --- |
| **High likelihood** | S2               | S3  |
| **Low**             | S3               | S4  |

## Regression rule

Every **S1/S2** fix requires:

1. New or updated test ID in matrix
2. FMEA row if new failure mode
3. Risk register update if score ≥12

## Bug report template

```markdown
**ID:** BUG-NNN
**Severity:** S1–S4
**Module:** pipeline | card | ai | rls | webhook
**Steps:**
**Expected:**
**Actual:**
**Env:**
**FMEA/Risk:**
**Test gap:**
```

## AI-specific defects

| Symptom                                  | Default Sev |
| ---------------------------------------- | ----------- |
| AI executed without approval             | S1          |
| Wrong card updated                       | S2          |
| Hallucinated dollar amount shown as fact | S2          |
| Slow response                            | S4          |

## Won't fix criteria

- Out of Wave scope without product sign-off
- Third-party outage (document REL note)
