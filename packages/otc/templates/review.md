# Code Review Rubric

This file defines team-specific review criteria that the AI reviewer will check in addition to general best practices.

## Required Checks

### Security
- [ ] No hardcoded credentials or API keys
- [ ] Input validation on all user-provided data
- [ ] SQL/NoSQL queries use parameterized queries
- [ ] No sensitive data in logs or error messages

### Error Handling
- [ ] All external calls have appropriate error handling
- [ ] Errors are logged with sufficient context
- [ ] User-facing errors are helpful but don't leak internals

### Performance
- [ ] No N+1 query patterns
- [ ] Large data sets are paginated
- [ ] Expensive operations have caching where appropriate

### Code Quality
- [ ] Functions are focused and reasonably sized
- [ ] Variable names are descriptive
- [ ] Complex logic has explanatory comments
- [ ] No commented-out code blocks

## Team Conventions

### Python
- Follow PEP 8 style guidelines
- Use type hints for function signatures
- Prefer `pathlib` over `os.path`
- Use context managers for resource handling

### Testing
- New features must have unit tests
- Integration tests for API endpoints
- Test names describe the scenario being tested

### Documentation
- Public functions have docstrings
- README updated for new features
- Breaking changes documented in CHANGELOG

## Review Priorities

When reviewing, prioritize issues in this order:
1. Security vulnerabilities
2. Logic errors / bugs
3. Performance issues
4. Maintainability concerns
5. Style suggestions
