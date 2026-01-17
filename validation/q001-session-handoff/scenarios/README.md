# Session Handoff Scenarios

This directory contains the 25 handoff scenarios for Q001 validation.

## Scenario Mix (Recommended)

### By Task Type (25 total)
- **Bug Fixes**: 8 scenarios (S001-S008)
- **Feature Additions**: 8 scenarios (S009-S016)
- **Refactoring**: 5 scenarios (S017-S021)
- **Documentation/Tests**: 4 scenarios (S022-S025)

### By Complexity
- **Low**: 8 scenarios (quick wins, ~30 min work)
- **Medium**: 10 scenarios (substantial work, ~1-2 hours)
- **High**: 7 scenarios (complex work, multi-session)

---

## Scenario Definitions

### Bug Fixes (S001-S008)

**S001**: Fix null pointer in user authentication
- Complexity: Low
- Context: User login fails silently when email is None

**S002**: Fix race condition in cache invalidation
- Complexity: High
- Context: Intermittent stale data in multi-threaded environment

**S003**: Fix incorrect date formatting in reports
- Complexity: Low
- Context: Dates showing as MM/DD instead of DD/MM for EU users

**S004**: Fix memory leak in file upload handler
- Complexity: Medium
- Context: Memory grows unbounded during large file uploads

**S005**: Fix SQL injection vulnerability in search
- Complexity: Medium
- Context: User input not properly sanitized in query builder

**S006**: Fix broken pagination in API responses
- Complexity: Low
- Context: Page 2+ returns duplicate results

**S007**: Fix infinite loop in retry logic
- Complexity: Medium
- Context: Failed requests retry forever under certain conditions

**S008**: Fix incorrect calculation in billing module
- Complexity: High
- Context: Discounts not applied correctly for annual subscriptions

### Feature Additions (S009-S016)

**S009**: Add rate limiting to API endpoints
- Complexity: Medium
- Context: Prevent abuse with configurable limits per endpoint

**S010**: Add export to CSV functionality
- Complexity: Low
- Context: Users need to download report data

**S011**: Add two-factor authentication
- Complexity: High
- Context: Security requirement for enterprise customers

**S012**: Add webhook notifications
- Complexity: Medium
- Context: Notify external systems on state changes

**S013**: Add bulk import from Excel
- Complexity: High
- Context: Users migrating from spreadsheets

**S014**: Add search autocomplete
- Complexity: Medium
- Context: Improve UX for finding items

**S015**: Add user preferences API
- Complexity: Low
- Context: Store and retrieve user settings

**S016**: Add audit logging
- Complexity: Medium
- Context: Compliance requirement for tracking changes

### Refactoring (S017-S021)

**S017**: Extract database queries to repository pattern
- Complexity: High
- Context: Improve testability and reduce duplication

**S018**: Convert callbacks to async/await
- Complexity: Medium
- Context: Modernize legacy code for readability

**S019**: Consolidate duplicate validation logic
- Complexity: Medium
- Context: Same validation copied in 5 places

**S020**: Split monolithic service into smaller modules
- Complexity: High
- Context: Service file is 2000+ lines

**S021**: Improve error messages across API
- Complexity: Low
- Context: Generic errors unhelpful for debugging

### Documentation/Tests (S022-S025)

**S022**: Add unit tests for payment module
- Complexity: Medium
- Context: Critical path with 0% coverage

**S023**: Add integration tests for auth flow
- Complexity: Medium
- Context: Login/logout flow untested

**S024**: Document API endpoints with OpenAPI
- Complexity: Low
- Context: No API documentation exists

**S025**: Add performance benchmarks
- Complexity: Medium
- Context: Need baseline for optimization

---

## Scenario Files

Each scenario should have a file created during the experiment:
- `S001-artifact.md` - The session artifact created by Developer A
- `S001-feedback.md` - The continuation feedback from Developer B

Baseline scenarios use simpler naming:
- `B001-summary.md` - Just a markdown summary (no structured artifact)
- `B001-feedback.md` - Continuation feedback
