# Task 9: Rate Limiter (WITHOUT STANDARDS)

import time
from collections import defaultdict

class RateLimiter:
    """Token bucket rate limiter"""

    def __init__(self, maxRequests=100, windowSeconds=60):
        self.maxRequests = maxRequests
        self.windowSeconds = windowSeconds
        self.clients = defaultdict(list)

    def _cleanupOld(self, clientId):
        """Remove old timestamps"""
        now = time.time()
        cutoff = now - self.windowSeconds
        self.clients[clientId] = [t for t in self.clients[clientId] if t > cutoff]

    def isAllowed(self, clientId):
        """Check if request should be allowed"""
        self._cleanupOld(clientId)

        if len(self.clients[clientId]) >= self.maxRequests:
            return False

        self.clients[clientId].append(time.time())
        return True

    def getRemainingRequests(self, clientId):
        """Get remaining requests for client"""
        self._cleanupOld(clientId)
        return max(0, self.maxRequests - len(self.clients[clientId]))

    def reset(self, clientId):
        """Reset rate limit for a client"""
        if clientId in self.clients:
            del self.clients[clientId]


def checkRateLimit(limiter, clientId):
    if not limiter.isAllowed(clientId):
        print(f"Rate limit exceeded for {clientId}")
        return False
    return True
