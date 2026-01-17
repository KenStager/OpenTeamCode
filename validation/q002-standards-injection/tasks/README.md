# Standards Injection Test Tasks

These 10 coding tasks are used to measure standards compliance with and without `.ai/standards.md` injection.

## Task List

### Task 1: User Authentication Function
Write a Python function that validates user credentials against a database. The function should:
- Accept username and password parameters
- Query a user database (mock the DB call)
- Return a user object if valid, raise an exception if invalid
- Handle common error cases

### Task 2: API Response Handler
Write a Python function that fetches data from an external API and handles errors. The function should:
- Accept a URL and optional headers
- Make an HTTP GET request
- Parse the JSON response
- Handle network errors, timeouts, and invalid responses

### Task 3: Data Processing Pipeline
Write a Python function that processes a list of records with validation. The function should:
- Accept a list of dictionaries
- Validate each record has required fields
- Transform valid records (e.g., normalize names, parse dates)
- Return processed records and a list of validation errors

### Task 4: File Upload Handler
Write a Python function that handles file uploads. The function should:
- Accept a file path and destination
- Validate file type and size
- Copy the file to destination
- Return metadata about the uploaded file

### Task 5: Cache Manager
Write a Python class that manages an in-memory cache with expiration. The class should:
- Support get, set, and delete operations
- Handle TTL (time-to-live) for entries
- Provide a method to clear expired entries

### Task 6: Email Notification Service
Write a Python function that sends email notifications. The function should:
- Accept recipient, subject, and body
- Validate email format
- Mock the actual sending (use a print statement)
- Return success/failure status

### Task 7: Database Connection Pool
Write a Python class that manages database connections. The class should:
- Maintain a pool of connections
- Provide methods to acquire and release connections
- Handle connection failures gracefully

### Task 8: Configuration Loader
Write a Python function that loads configuration from multiple sources. The function should:
- Load from environment variables
- Load from a YAML file
- Merge configurations with proper precedence
- Validate required settings

### Task 9: Rate Limiter
Write a Python class that implements rate limiting. The class should:
- Track request counts per client
- Allow configurable limits and time windows
- Return whether a request should be allowed or blocked

### Task 10: Metrics Collector
Write a Python class that collects and reports metrics. The class should:
- Track counters and gauges
- Support labels/tags for metrics
- Provide a method to export metrics in a simple format

---

## Execution Instructions

### Without Standards (10 runs)
1. Ensure `opencode.jsonc` does NOT include `.ai/standards.md` in instructions
2. For each task, prompt OpenCode: "Write a Python function/class for [task description]"
3. Save the output to `without-standards/task-XX-output.py`
4. Score against the rubric

### With Standards (10 runs)
1. Enable `.ai/standards.md` in `opencode.jsonc` instructions field
2. For each task, use the exact same prompt
3. Save the output to `with-standards/task-XX-output.py`
4. Score against the rubric

### Scoring
Use `rubric.md` to score each output on the 5 standards.
