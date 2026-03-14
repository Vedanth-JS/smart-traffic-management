from typing import List, Dict

from vehicle_detection import EMERGENCY_KEYWORDS


def emergency_present(detections: List[Dict]) -> bool:
    """
    Lightweight helper to check for emergency vehicles in detections
    produced by VehicleDetector.detect().
    """
    for det in detections:
        cls = det.get("cls_name", "").lower()
        if any(k in cls for k in EMERGENCY_KEYWORDS):
            return True
    return False


def filter_non_emergency(detections: List[Dict]) -> List[Dict]:
    """
    Return detections that are NOT emergency vehicles, useful if
    you want to count normal vehicles separately.
    """
    result: List[Dict] = []
    for det in detections:
        cls = det.get("cls_name", "").lower()
        if not any(k in cls for k in EMERGENCY_KEYWORDS):
            result.append(det)
    return result


if __name__ == "__main__":
    sample = [
        {"cls_name": "car"},
        {"cls_name": "ambulance"},
        {"cls_name": "fire truck"},
    ]
    print("Emergency present:", emergency_present(sample))
    print("Non-emergency:", filter_non_emergency(sample))

