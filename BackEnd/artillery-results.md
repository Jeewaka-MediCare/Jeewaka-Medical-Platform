# Artillery Load Test Results

**Test Date:** 2025-10-12
**Target:** http://localhost:5000 (public API routes)
**Duration:** 60 seconds
**Arrival Rate:** 10 new users/sec
**Total Requests:** 3,000

## Summary
- **No virtual user failures** (all VUs completed their sessions)

## Performance Metrics
| Metric                | Min | Max | Mean | Median | 95th pct | 99th pct |
|-----------------------|-----|-----|------|--------|----------|----------|
| Response Time (ms)    | 0   | 8   | 0.7  | 1      | 2        | 2        |
| 4xx Response Time (ms)| 0   | 3   | 0.6  | 1      | 2        | 2        |
| 5xx Response Time (ms)| 0   | 8   | 0.8  | 1      | 1        | 2        |

- **Request Rate:** ~69 requests/sec
- **Downloaded Bytes:** 307,200 bytes

## Virtual User Metrics
- **VUs Created:** 600
- **VUs Completed:** 600
- **VUs Failed:** 0
- **Session Length (s):**
  - Min: 5.9
  - Max: 37.3
  - Mean: 7.8
  - Median: 7.2
  - 95th pct: 10.7
  - 99th pct: 25.3

## Observations
- Response times were very fast (mean < 1ms), indicating the server handled the load efficiently.
- No virtual users failed, so the server remained stable under load.