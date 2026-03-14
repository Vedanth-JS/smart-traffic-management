from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional

from traffic_algorithm import SignalDecision


class SignalColor(str, Enum):
    RED = "RED"
    YELLOW = "YELLOW"
    GREEN = "GREEN"


@dataclass
class LaneSignalState:
    lane_id: str
    color: SignalColor
    remaining_seconds: int


class SignalController:
    """
    Simple discrete-time signal controller.

    It steps through the lanes in the order provided by SignalDecision,
    giving each lane GREEN for the configured duration. Between GREEN
    phases for different lanes it inserts a short YELLOW phase.
    """

    def __init__(self, yellow_duration: int = 3):
        self.yellow_duration = yellow_duration
        self.current_lane_index: int = 0
        self.current_lane_id: Optional[str] = None
        self.current_color: SignalColor = SignalColor.RED
        self.remaining_seconds: int = 0
        self.decision: Optional[SignalDecision] = None

    def load_decision(self, decision: SignalDecision) -> None:
        self.decision = decision
        self.current_lane_index = 0
        if not decision.lane_order:
            self.current_lane_id = None
            self.current_color = SignalColor.RED
            self.remaining_seconds = 0
            return
        self.current_lane_id = decision.lane_order[0].lane_id
        self.current_color = SignalColor.GREEN
        self.remaining_seconds = decision.timings[self.current_lane_id]

    def force_green_for_lane(self, lane_id: str, duration: int) -> None:
        """
        Override state to immediately give GREEN to a specific lane,
        used for emergency vehicle priority.
        """
        self.current_lane_id = lane_id
        self.current_color = SignalColor.GREEN
        self.remaining_seconds = duration

    def tick(self, dt_seconds: int = 1) -> Dict[str, LaneSignalState]:
        """
        Advance the controller by dt_seconds and return the signal state
        for all lanes.
        """
        if self.decision is None or not self.decision.lane_order:
            return {}

        self.remaining_seconds -= dt_seconds
        if self.remaining_seconds <= 0:
            if self.current_color == SignalColor.GREEN:
                # Transition to yellow for same lane
                self.current_color = SignalColor.YELLOW
                self.remaining_seconds = self.yellow_duration
            elif self.current_color == SignalColor.YELLOW:
                # Move to next lane and switch to green
                self.current_lane_index = (self.current_lane_index + 1) % len(
                    self.decision.lane_order
                )
                self.current_lane_id = self.decision.lane_order[self.current_lane_index].lane_id
                self.current_color = SignalColor.GREEN
                self.remaining_seconds = self.decision.timings[self.current_lane_id]

        # Build full state
        state: Dict[str, LaneSignalState] = {}
        for lane in self.decision.lane_order:
            if lane.lane_id == self.current_lane_id:
                color = self.current_color
                remaining = self.remaining_seconds
            else:
                color = SignalColor.RED
                remaining = 0
            state[lane.lane_id] = LaneSignalState(
                lane_id=lane.lane_id,
                color=color,
                remaining_seconds=remaining,
            )
        return state


if __name__ == "__main__":
    from traffic_algorithm import compute_signal_plan

    counts = {"Lane A": 45, "Lane B": 22, "Lane C": 7}
    decision = compute_signal_plan(counts)
    controller = SignalController()
    controller.load_decision(decision)

    for t in range(0, 200):
        state = controller.tick(1)
        pretty = ", ".join(
            f"{lane_id}:{lane_state.color.value}({lane_state.remaining_seconds}s)"
            for lane_id, lane_state in state.items()
        )
        print(f"t={t:03d}s -> {pretty}")

