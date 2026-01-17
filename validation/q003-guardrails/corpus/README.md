# Guardrails Test Corpus

This directory contains test files for validating the secrets detection prototype.

## Structure

```
corpus/
├── true-positives/    # Files WITH actual secrets (should be detected)
│   ├── aws-credentials.txt
│   ├── env-with-secrets.txt
│   ├── config-with-key.json
│   ├── private-key.pem
│   ├── github-token.txt
│   ├── slack-config.yaml
│   ├── hardcoded-password.py
│   └── jwt-token.js
│
└── true-negatives/    # Legitimate code (should NOT be detected)
    ├── base64-encoding.py
    ├── uuid-generation.py
    ├── hash-functions.py
    ├── crypto-utils.py
    ├── test-fixtures.py
    ├── encrypted-config.yaml
    ├── password-hashing.py
    └── api-client.py
```

## Running Tests

From the `validation/q003-guardrails/` directory:

```bash
# Test true positives (expect detections)
bun run prototype.ts corpus/true-positives/

# Test true negatives (expect NO detections, or low confidence only)
bun run prototype.ts corpus/true-negatives/

# Test individual file
bun run prototype.ts corpus/true-positives/aws-credentials.txt
```

## Expected Results

### True Positives
Every file in `true-positives/` should trigger at least one detection.

### True Negatives
Files in `true-negatives/` should NOT trigger high-confidence detections.
- Some medium/low confidence alerts may be acceptable
- Goal: <5% false positive rate

## Adding More Test Files

### Adding True Positives
1. Create a file with intentionally fake credentials
2. Mark it clearly as a test file with comments
3. Document expected detections in `results.md`

### Adding True Negatives
1. Create legitimate code that might look like secrets
2. Common sources: base64, UUIDs, hashes, encrypted values
3. Document why it might trigger FPs in `results.md`

## Important Notes

- All credentials in this corpus are FAKE
- Do not add real secrets to this directory
- Files are for testing only, not for production use
