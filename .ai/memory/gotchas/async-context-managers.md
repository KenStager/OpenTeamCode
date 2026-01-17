# Gotcha: Async Context Managers

## The Problem

Using synchronous context managers in async code can block the event loop.

### Wrong

```python
async def process_data():
    with open("data.json") as f:  # BLOCKS!
        data = json.load(f)
    return data
```

### Right

```python
import aiofiles

async def process_data():
    async with aiofiles.open("data.json") as f:
        content = await f.read()
        data = json.loads(content)
    return data
```

## Common Offenders

1. **File I/O**: Use `aiofiles` instead of built-in `open()`
2. **Database connections**: Use async drivers (`asyncpg`, `aiomysql`)
3. **HTTP clients**: Use `httpx.AsyncClient` or `aiohttp`
4. **Locks**: Use `asyncio.Lock` not `threading.Lock`

## Detection

Look for these patterns in async functions:
- `with open(...)`
- `with connection.cursor()`
- `requests.get()` / `requests.post()`
- `time.sleep()` (use `asyncio.sleep()`)

## When Sync is OK

Small, fast operations that don't block significantly:
- Reading small config files at startup
- Quick in-memory operations
- Logging (usually buffered)

## Team Note

We use `aiofiles` and `httpx` for all async I/O operations. Added to requirements.txt.

## Date Added
2024-01-15
