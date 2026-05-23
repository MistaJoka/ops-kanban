# Regression matrix (T16)

**Run together:** Master path in `README.md`  
Cross-reference: priority from `RISK_MODEL.md`, failure modes from `FMEA.md`

## Matrix legend

| Column | Meaning                   |
| ------ | ------------------------- |
| P      | P0 / P1 / P2              |
| Auto   | unit / int / e2e / manual |
| Wave   | 0–4                       |
| Gate   | PR / nightly / release    |

## P0 regression (must pass every release)

| Test ID       | Module | Auto   | Wave | Gate    | FMEA | Risk |
| ------------- | ------ | ------ | ---- | ------- | ---- | ---- |
| SEC-RLS full  | T08    | int    | 0    | release | F-10 | R-01 |
| UNIT-PIPE-004 | T05    | unit   | 0    | PR      | F-03 | —    |
| UNIT-PIPE-005 | T05    | unit   | 0    | PR      | F-04 | R-06 |
| E2E-BOOT-001  | T09    | e2e    | 0    | nightly | F-01 | —    |
| E2E-JOB-004   | T09    | e2e    | 0    | nightly | F-04 | R-06 |
| E2E-JOB-006   | T09    | e2e    | 0    | nightly | F-03 | —    |
| E2E-MNY-001   | T09    | e2e    | 0    | release | —    | —    |
| E2E-AI-002    | T09    | e2e    | 0    | release | F-06 | R-02 |
| AI-INJ-001    | T10    | int    | 0    | nightly | —    | R-03 |
| AI-TOOL-010   | T10    | int    | 0    | PR      | —    | R-02 |
| INT-BOOT-001  | T06    | int    | 0    | PR      | F-01 | —    |
| UAT-01        | T12    | manual | 0    | release | —    | —    |
| UAT-10        | T12    | manual | 0    | release | F-10 | R-01 |

## PR smoke (fast, &lt;5 min)

```txt
UNIT-PIPE-004,005 | UNIT-AI-001–004 | INT-BOOT-001 | SEC-RLS spot (cards,customers)
| E2E-BOOT-001 | E2E-JOB-001 | AI-TOOL-010
```

## Nightly

```txt
PR smoke + full SEC-RLS + E2E R0 + AI-INJ suite + INT-MNY
```

## Release (Wave 0)

```txt
Nightly + UAT full + A11Y-001,002 + FMEA RPN>100 verification + RELEASE_GATES
```

## Wave 1 add-on row

| WH-PAY-001–003 | T11 | int | 1 | release | F-W1-01 | R-20 |

## Coverage dashboard (track weekly)

| Metric                    | Target       |
| ------------------------- | ------------ |
| P0 tests passing          | 100%         |
| Traceability reqs covered | ≥95% (T17)   |
| Open S1/S2                | 0 at release |
| Flaky tests               | &lt;2%       |

## Flaky test policy

3 flakes → quarantine tag `@quarantine`, fix within sprint, cannot gate release if P0.
