# Team Coding Standards

These standards MUST be followed for all Python code.

## 1. Naming Conventions
- Functions: `snake_case` (e.g., `get_user_data`, NOT `getUserData`)
- Classes: `PascalCase` (e.g., `UserService`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- Private methods: prefix with underscore (`_internal_method`)

## 2. Error Handling
- Always use specific exception types (not bare `except:`)
- Custom exceptions inherit from `AppError` base class
- Include error context in exception messages
- Pattern:
  ```python
  try:
      result = risky_operation()
  except SpecificError as e:
      logger.error(f"Operation failed: {e}")
      raise AppError(f"Context: {context}") from e
  ```

## 3. Import Ordering
1. Standard library imports
2. Third-party imports
3. Local imports
- Each group separated by blank line
- Alphabetical within groups

## 4. Docstrings
- All public functions must have docstrings
- Use Google style:
  ```python
  def function(arg1: str, arg2: int) -> bool:
      """Short description.

      Longer description if needed.

      Args:
          arg1: Description of arg1.
          arg2: Description of arg2.

      Returns:
          Description of return value.

      Raises:
          ValueError: When something is wrong.
      """
  ```

## 5. Type Hints
- All function signatures must have type hints
- Use `Optional[X]` for nullable values
- Use `list[X]` not `List[X]` (Python 3.9+)
