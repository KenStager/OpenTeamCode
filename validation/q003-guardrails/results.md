# Q003 Results: Guardrails Experiment

## Summary
- True Positive Files Tested: 0
- True Negative Files Tested: 0
- True Positive Rate: 0% (target: >90%)
- False Positive Rate: 0% (target: <5%)

## Success Criteria
- **True Positive Rate**: >90% (secrets actually detected)
- **False Positive Rate**: <5% (legitimate code not flagged)

---

## Corpus Summary

### True Positives (Files WITH secrets)
Files in `corpus/true-positives/`:

| File | Secret Type | Expected Detection |
|------|-------------|-------------------|
| aws-credentials.txt | AWS Keys | AWS Access Key, AWS Secret Key |
| env-with-secrets.txt | Multiple | API Key, Password, Token |
| config-with-key.json | API Key | Generic API Key |
| private-key.pem | Private Key | Private Key Header |
| github-token.txt | GitHub Token | GitHub Token |
| slack-config.yaml | Slack Token | Slack Token |
| hardcoded-password.py | Password | Password Assignment |
| jwt-token.js | JWT | Bearer Token |

### True Negatives (Legitimate code)
Files in `corpus/true-negatives/`:

| File | Why It Might Trigger FP | Should NOT Detect |
|------|-------------------------|-------------------|
| base64-encoding.py | Long base64 strings | (none) |
| uuid-generation.py | UUID looks like keys | (none) |
| hash-functions.py | SHA256 outputs | (none) |
| crypto-utils.py | Encryption code | (none) |
| test-fixtures.py | Mock credentials | (none) |
| encrypted-config.yaml | Encrypted values | (none) |
| password-hashing.py | Password variable names | (none) |
| api-client.py | "api_key" as parameter | (none) |

---

## Detection Results

### By Pattern

| Pattern | TP | FN | TN | FP | TPR | FPR |
|---------|----|----|----|----|-----|-----|
| AWS Access Key | | | | | % | % |
| AWS Secret Key | | | | | % | % |
| Generic API Key | | | | | % | % |
| Password Assignment | | | | | % | % |
| Private Key Header | | | | | % | % |
| GitHub Token | | | | | % | % |
| Slack Token | | | | | % | % |
| Generic Secret | | | | | % | % |
| Bearer Token | | | | | % | % |
| Basic Auth | | | | | % | % |

### Overall Metrics

| Metric | Value | Target |
|--------|-------|--------|
| True Positive Rate (Recall) | % | >90% |
| False Positive Rate | % | <5% |
| Precision | % | - |
| F1 Score | - | - |

---

## False Positive Analysis

| File | Pattern Triggered | Line | Why False Positive? | Tuning Suggestion |
|------|-------------------|------|---------------------|-------------------|
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |

### Common FP Patterns
1.
2.
3.

---

## False Negative Analysis

| File | Expected Pattern | Line | Why Missed? | Tuning Suggestion |
|------|------------------|------|-------------|-------------------|
| | | | | |
| | | | | |
| | | | | |

### Common FN Patterns
1.
2.
3.

---

## Tuning Recommendations

### Patterns to Tighten (Reduce FP)
-
-

### Patterns to Loosen (Reduce FN)
-
-

### New Patterns to Add
-
-

### Patterns to Remove
-
-

---

## Final Verdict

**True Positive Rate**: ___% (Target: >90%)
**False Positive Rate**: ___% (Target: <5%)

**Decision**: [ ] PASS [ ] FAIL [ ] NEEDS TUNING

**Rationale**:

**If NEEDS TUNING**: Specific changes required:
1.
2.
3.
