# Task 10: Metrics Collector (WITHOUT STANDARDS)

import time
from collections import defaultdict

class MetricsCollector:
    """Collect and export application metrics"""

    def __init__(self):
        self.counters = defaultdict(int)
        self.gauges = defaultdict(float)
        self.labels = defaultdict(dict)

    def incrementCounter(self, name, value=1, tags=None):
        """Increment a counter metric"""
        key = self._makeKey(name, tags)
        self.counters[key] += value
        if tags:
            self.labels[key] = tags

    def setGauge(self, name, value, tags=None):
        """Set a gauge metric"""
        key = self._makeKey(name, tags)
        self.gauges[key] = value
        if tags:
            self.labels[key] = tags

    def _makeKey(self, name, tags):
        if not tags:
            return name
        tagStr = ",".join(f"{k}={v}" for k, v in sorted(tags.items()))
        return f"{name}{{{tagStr}}}"

    def getCounter(self, name, tags=None):
        key = self._makeKey(name, tags)
        return self.counters.get(key, 0)

    def getGauge(self, name, tags=None):
        key = self._makeKey(name, tags)
        return self.gauges.get(key, 0)

    def export(self):
        """Export all metrics in simple format"""
        output = []
        timestamp = int(time.time())

        for key, value in self.counters.items():
            output.append(f"counter {key} {value} {timestamp}")

        for key, value in self.gauges.items():
            output.append(f"gauge {key} {value} {timestamp}")

        return "\n".join(output)

    def reset(self):
        """Clear all metrics"""
        self.counters.clear()
        self.gauges.clear()
        self.labels.clear()
