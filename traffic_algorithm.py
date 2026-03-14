from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Tuple


class DensityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


VEHICLE_THRESHOLDS: Dict[DensityLevel, Tuple[int, int]] = {
    DensityLevel.LOW: (0, 9),
    DensityLevel.MEDIUM: (10, 30),
    DensityLevel.HIGH: (31, 10_000),
}


TIMING_BY_DENSITY: Dict[DensityLevel, int] = {
    DensityLevel.LOW: 15,
    DensityLevel.MEDIUM: 30,
    DensityLevel.HIGH: 60,
}


def density_for_count(count: int) -> DensityLevel:
    for level, (lo, hi) in VEHICLE_THRESHOLDS.items():
        if lo <= count <= hi:
            return level
    return DensityLevel.HIGH


@dataclass
class LaneState:
    lane_id: str
    vehicle_count: int
    density: DensityLevel


@dataclass
class SignalDecision:
    lane_order: List[LaneState]
    timings: Dict[str, int]


def compute_signal_plan(counts_by_lane: Dict[str, int]) -> SignalDecision:
    """
    Compute lane priorities and green durations from lane vehicle counts.

    Priority is given to lanes with higher vehicle counts; ties are broken
    lexicographically on lane_id for determinism.
    """
    lane_states: List[LaneState] = []
    timings: Dict[str, int] = {}

    for lane_id, count in counts_by_lane.items():
        density = density_for_count(count)
        lane_states.append(LaneState(lane_id=lane_id, vehicle_count=count, density=density))
        timings[lane_id] = TIMING_BY_DENSITY[density]

    # Sort lanes by vehicle_count descending, then lane_id
    lane_states.sort(key=lambda l: (-l.vehicle_count, l.lane_id))

    return SignalDecision(lane_order=lane_states, timings=timings)


def pretty_print_decision(decision: SignalDecision) -> str:
    lines: List[str] = []
    for lane_state in decision.lane_order:
        lane_id = lane_state.lane_id
        lines.append(
            f"{lane_id}: {lane_state.vehicle_count} vehicles -> {lane_state.density.value} "
            f"(GREEN {decision.timings[lane_id]} seconds)"
        )
    return "\n".join(lines)


if __name__ == "__main__":
    counts = {"Lane A": 45, "Lane B": 22, "Lane C": 7}
    decision = compute_signal_plan(counts)
    print(pretty_print_decision(decision))

