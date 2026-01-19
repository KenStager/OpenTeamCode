# Task 7: Database Connection Pool (WITHOUT STANDARDS)

import threading
from queue import Queue, Empty

class MockConnection:
    def __init__(self, id):
        self.id = id
        self.inUse = False

    def execute(self, query):
        return f"Executed: {query}"

    def close(self):
        pass


class ConnectionPool:
    """Database connection pool"""

    def __init__(self, maxConnections=10):
        self.maxConnections = maxConnections
        self.pool = Queue(maxsize=maxConnections)
        self.lock = threading.Lock()
        self.connectionCount = 0

        # Pre-create some connections
        for i in range(min(3, maxConnections)):
            self._createConnection()

    def _createConnection(self):
        if self.connectionCount < self.maxConnections:
            conn = MockConnection(self.connectionCount)
            self.pool.put(conn)
            self.connectionCount += 1
            return conn
        return None

    def acquire(self, timeout=30):
        """Get a connection from pool"""
        try:
            conn = self.pool.get(timeout=timeout)
            conn.inUse = True
            return conn
        except Empty:
            # Try to create a new connection
            with self.lock:
                newConn = self._createConnection()
                if newConn:
                    newConn.inUse = True
                    return newConn
            raise Exception("No connections available")

    def release(self, conn):
        """Return connection to pool"""
        if conn:
            conn.inUse = False
            self.pool.put(conn)

    def closeAll(self):
        """Close all connections"""
        while not self.pool.empty():
            try:
                conn = self.pool.get_nowait()
                conn.close()
            except:
                pass
