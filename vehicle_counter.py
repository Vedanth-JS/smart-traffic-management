from dataclasses import dataclass
from typing import Dict, List, Tuple

import numpy as np


@dataclass
class LaneConfig:
    lane_id: str
    p1: Tuple[int, int]
    p2: Tuple[int, int]


def _point_side_of_line(
    p: Tuple[float, float], p1: Tuple[float, float], p2: Tuple[float, float]
) -> float:
    """
    Returns signed distance (up to scale) of point p from directed line p1->p2.
    """
    x, y = p
    x1, y1 = p1
    x2, y2 = p2
    return (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)


class LaneCounter:
    """
    Naive per-lane counter using fixed lane lines.

    For each detection, we take the bbox center and assign it to the lane
    with the closest line (within a simple threshold).
    """

    def __init__(self, lane_configs: List[LaneConfig]):
        self.lane_configs = lane_configs

    def count_by_lane(self, detections: List[dict]) -> Dict[str, int]:
        centers = []
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            centers.append(((x1 + x2) / 2.0, (y1 + y2) / 2.0))

        counts: Dict[str, int] = {lane.lane_id: 0 for lane in self.lane_configs}

        for c in centers:
            best_lane = None
            best_dist = float("inf")
            for lane in self.lane_configs:
                # Distance of point from line using cross product magnitude
                num = abs(_point_side_of_line(c, lane.p1, lane.p2))
                denom = np.linalg.norm(np.array(lane.p2) - np.array(lane.p1)) + 1e-6
                d = num / denom
                if d < best_dist:
                    best_dist = d
                    best_lane = lane.lane_id

            if best_lane is not None:
                counts[best_lane] += 1

        return counts


if __name__ == "__main__":
    # Simple sanity check
    lanes = [
        LaneConfig("Lane A", (100, 0), (100, 480)),
        LaneConfig("Lane B", (320, 0), (320, 480)),
        LaneConfig("Lane C", (540, 0), (540, 480)),
    ]
    counter = LaneCounter(lanes)

    fake_dets = [
        {"bbox": (90, 100, 110, 130)},
        {"bbox": (310, 200, 330, 230)},
        {"bbox": (550, 50, 580, 90)},
        {"bbox": (560, 150, 590, 210)},
    ]
    print(counter.count_by_lane(fake_dets))

