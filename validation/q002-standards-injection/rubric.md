# Standards Compliance Rubric

Use this rubric to score each task output against the 5 standards defined in `.ai/standards.md`.

## Scoring Guide

For each standard, mark:
- **Y** (Yes) = Fully compliant
- **P** (Partial) = Some compliance, some violations
- **N** (No) = Not compliant or not applicable

**Compliance Score** = (Y count + 0.5 * P count) / 5 * 100%

---

## Standard Definitions

### 1. Naming Conventions
**Check for:**
- Functions use `snake_case` (e.g., `get_user_data`, NOT `getUserData`)
- Classes use `PascalCase` (e.g., `UserService`)
- Constants use `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- Private methods prefixed with underscore (`_internal_method`)

**Violations:**
- camelCase function names
- lowercase class names
- Mixed naming styles

### 2. Error Handling
**Check for:**
- Specific exception types (not bare `except:`)
- Custom exceptions inherit from base class when appropriate
- Error context in exception messages
- Proper exception chaining (`raise ... from e`)

**Violations:**
- Bare `except:` clauses
- Generic `Exception` catches without re-raising
- Silent exception swallowing
- Missing error context

### 3. Import Ordering
**Check for:**
1. Standard library imports first
2. Third-party imports second
3. Local imports third
- Each group separated by blank line
- Alphabetical within groups

**Violations:**
- Mixed ordering
- No blank lines between groups
- Non-alphabetical ordering

### 4. Docstrings
**Check for:**
- All public functions have docstrings
- Google style format used
- Args section present (if parameters exist)
- Returns section present (if return value exists)
- Raises section present (if exceptions raised)

**Violations:**
- Missing docstrings on public functions
- Wrong docstring format (not Google style)
- Missing required sections

### 5. Type Hints
**Check for:**
- All function parameters have type hints
- All function return types specified
- `Optional[X]` used for nullable values
- Modern syntax (`list[X]` not `List[X]`)

**Violations:**
- Missing parameter type hints
- Missing return type hints
- Using `Any` without justification
- Using old-style `List`, `Dict` imports

---

## Scoring Template

### Task: [NUMBER]

**Code Review:**
```
[Paste key code snippets showing compliance or violations]
```

| Standard | Score | Notes |
|----------|-------|-------|
| 1. Naming | Y/P/N | |
| 2. Error Handling | Y/P/N | |
| 3. Import Ordering | Y/P/N | |
| 4. Docstrings | Y/P/N | |
| 5. Type Hints | Y/P/N | |

**Compliance Score**: ___/5 = ___%

---

## Summary Table (Copy to results.md)

### Without Standards

| Task | Naming | Error | Imports | Docs | Types | Score |
|------|--------|-------|---------|------|-------|-------|
| 1 | | | | | | /5 |
| 2 | | | | | | /5 |
| 3 | | | | | | /5 |
| 4 | | | | | | /5 |
| 5 | | | | | | /5 |
| 6 | | | | | | /5 |
| 7 | | | | | | /5 |
| 8 | | | | | | /5 |
| 9 | | | | | | /5 |
| 10 | | | | | | /5 |

**Average**: ____%

### With Standards

| Task | Naming | Error | Imports | Docs | Types | Score |
|------|--------|-------|---------|------|-------|-------|
| 1 | | | | | | /5 |
| 2 | | | | | | /5 |
| 3 | | | | | | /5 |
| 4 | | | | | | /5 |
| 5 | | | | | | /5 |
| 6 | | | | | | /5 |
| 7 | | | | | | /5 |
| 8 | | | | | | /5 |
| 9 | | | | | | /5 |
| 10 | | | | | | /5 |

**Average**: ____%

---

## Final Analysis

**Without Standards Compliance**: ____%
**With Standards Compliance**: ____%
**Improvement**: +____%

**Target**: >80% with standards
**Result**: [ ] PASS [ ] FAIL
