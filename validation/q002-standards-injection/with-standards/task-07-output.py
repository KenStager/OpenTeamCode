# Task 7: Database Connection Pool (WITH STANDARDS)

import threading
from dataclasses import dataclass
from queue import Empty, Queue
from typing import Optional

DEFAULT_POOL_SIZE: int = 10
DEFAULT_INITIAL_CONNECTIONS: int = 3
DEFAULT_ACQUIRE_TIMEOUT: int = 30


class AppError(Exception):
    """Base class for application errors."""

    pass


class ConnectionError(AppError):
    """Base class for connection-related errors."""

    pass


class PoolExhaustedError(ConnectionError):
    """Raised when no connections are available."""

    pass


@dataclass
class MockConnection:
    """Mock database connection for testing."""

    connection_id: int
    in_use: bool = False

    def execute(self, query: str) -> str:
        """Execute a query on this connection.

        Args:
            query: The SQL query to execute.

        Returns:
            A string describing the executed query.
        """
        return f"Executed on connection {self.connection_id}: {query}"

    def close(self) -> None:
        """Close this connection."""
        pass


class ConnectionPool:
    """Database connection pool with configurable size.

    Manages a pool of database connections that can be acquired
    and released by multiple threads.

    Attributes:
        max_connections: Maximum number of connections in the pool.
    """

    def __init__(
        self,
        max_connections: int = DEFAULT_POOL_SIZE,
        initial_connections: int = DEFAULT_INITIAL_CONNECTIONS,
    ) -> None:
        """Initialize the connection pool.

        Args:
            max_connections: Maximum number of connections.
            initial_connections: Number of connections to create initially.
        """
        self.max_connections = max_connections
        self._pool: Queue[MockConnection] = Queue(maxsize=max_connections)
        self._lock = threading.Lock()
        self._connection_count = 0

        for _ in range(min(initial_connections, max_connections)):
            self._create_connection()

    def _create_connection(self) -> Optional[MockConnection]:
        """Create a new connection and add it to the pool.

        Returns:
            The new connection, or None if pool is at capacity.
        """
        if self._connection_count >= self.max_connections:
            return None

        connection = MockConnection(connection_id=self._connection_count)
        self._pool.put(connection)
        self._connection_count += 1

        return connection

    def acquire(self, timeout: int = DEFAULT_ACQUIRE_TIMEOUT) -> MockConnection:
        """Acquire a connection from the pool.

        Args:
            timeout: Maximum time to wait for a connection in seconds.

        Returns:
            A database connection.

        Raises:
            PoolExhaustedError: If no connection is available within timeout.
        """
        try:
            connection = self._pool.get(timeout=timeout)
            connection.in_use = True
            return connection
        except Empty:
            pass

        with self._lock:
            new_connection = self._create_connection()
            if new_connection:
                new_connection.in_use = True
                return new_connection

        raise PoolExhaustedError(
            f"No connections available after {timeout}s timeout"
        )

    def release(self, connection: MockConnection) -> None:
        """Return a connection to the pool.

        Args:
            connection: The connection to release.
        """
        if connection:
            connection.in_use = False
            self._pool.put(connection)

    def close_all(self) -> None:
        """Close all connections in the pool."""
        while not self._pool.empty():
            try:
                connection = self._pool.get_nowait()
                connection.close()
            except Empty:
                break

    def available_connections(self) -> int:
        """Return the number of available connections.

        Returns:
            The number of connections currently available.
        """
        return self._pool.qsize()
