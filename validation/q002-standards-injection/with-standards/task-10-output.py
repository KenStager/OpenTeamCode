# Task 10: Metrics Collector (WITH STANDARDS)

import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class MetricValue:
    """Represents a metric value with optional labels.

    Attributes:
        value: The numeric value of the metric.
        labels: Optional dictionary of label key-value pairs.
        timestamp: Unix timestamp when the metric was recorded.
    """

    value: float
    labels: dict[str, str] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


class MetricsCollector:
    """Collects and exports application metrics.

    Supports counter and gauge metric types with optional labels
    for dimensional data.

    Attributes:
        _counters: Dictionary of counter metrics.
        _gauges: Dictionary of gauge metrics.
    """

    def __init__(self) -> None:
        """Initialize an empty metrics collector."""
        self._counters: dict[str, MetricValue] = defaultdict(
            lambda: MetricValue(value=0)
        )
        self._gauges: dict[str, MetricValue] = {}

    def _make_key(
        self,
        name: str,
        tags: Optional[dict[str, str]] = None,
    ) -> str:
        """Create a unique key for a metric with labels.

        Args:
            name: The metric name.
            tags: Optional dictionary of label key-value pairs.

        Returns:
            A unique string key for the metric.
        """
        if not tags:
            return name

        tag_str = ",".join(f"{k}={v}" for k, v in sorted(tags.items()))
        return f"{name}{{{tag_str}}}"

    def increment_counter(
        self,
        name: str,
        value: float = 1,
        tags: Optional[dict[str, str]] = None,
    ) -> None:
        """Increment a counter metric.

        Args:
            name: The counter name.
            value: The amount to increment by. Defaults to 1.
            tags: Optional labels for the metric.
        """
        key = self._make_key(name, tags)

        if key not in self._counters:
            self._counters[key] = MetricValue(value=0, labels=tags or {})

        self._counters[key].value += value
        self._counters[key].timestamp = time.time()

    def set_gauge(
        self,
        name: str,
        value: float,
        tags: Optional[dict[str, str]] = None,
    ) -> None:
        """Set a gauge metric value.

        Args:
            name: The gauge name.
            value: The value to set.
            tags: Optional labels for the metric.
        """
        key = self._make_key(name, tags)
        self._gauges[key] = MetricValue(
            value=value,
            labels=tags or {},
            timestamp=time.time(),
        )

    def get_counter(
        self,
        name: str,
        tags: Optional[dict[str, str]] = None,
    ) -> float:
        """Get the current value of a counter.

        Args:
            name: The counter name.
            tags: Optional labels to match.

        Returns:
            The counter value, or 0 if not found.
        """
        key = self._make_key(name, tags)
        return self._counters.get(key, MetricValue(value=0)).value

    def get_gauge(
        self,
        name: str,
        tags: Optional[dict[str, str]] = None,
    ) -> float:
        """Get the current value of a gauge.

        Args:
            name: The gauge name.
            tags: Optional labels to match.

        Returns:
            The gauge value, or 0 if not found.
        """
        key = self._make_key(name, tags)
        return self._gauges.get(key, MetricValue(value=0)).value

    def export(self) -> str:
        """Export all metrics in a simple text format.

        Returns:
            A newline-separated string of all metrics.
        """
        output: list[str] = []
        timestamp = int(time.time())

        for key, metric in self._counters.items():
            output.append(f"counter {key} {metric.value} {timestamp}")

        for key, metric in self._gauges.items():
            output.append(f"gauge {key} {metric.value} {timestamp}")

        return "\n".join(output)

    def reset(self) -> None:
        """Clear all collected metrics."""
        self._counters.clear()
        self._gauges.clear()
