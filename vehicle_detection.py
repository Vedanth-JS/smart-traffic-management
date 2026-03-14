import cv2
from typing import List, Tuple, Dict, Optional

try:
    from ultralytics import YOLO
except ImportError:  # pragma: no cover - optional dependency
    YOLO = None  # type: ignore


VEHICLE_CLASSES = {"car", "bus", "truck", "motorcycle"}
EMERGENCY_KEYWORDS = {"ambulance", "fire truck", "firetruck"}


class VehicleDetector:
    """
    YOLOv8-based vehicle detector.

    This is a thin wrapper around ultralytics.YOLO so the rest of the
    system can use a stable interface even if the underlying model changes.
    """

    def __init__(self, model_path: str = "models/yolov8n.pt", device: str = "cpu"):
        if YOLO is None:
            raise ImportError(
                "ultralytics is not installed. Install with `pip install ultralytics`."
            )
        self.model = YOLO(model_path)
        self.device = device

    def detect(
        self, frame_bgr
    ) -> Tuple[List[Dict], bool]:  # returns (detections, emergency_present)
        """
        Run detection on a single BGR frame.

        Returns:
            detections: list of dicts with keys:
                - bbox: (x1, y1, x2, y2)
                - cls_name: str
                - confidence: float
            emergency_present: True if an emergency vehicle is detected.
        """
        # YOLO expects RGB
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        results = self.model.predict(source=frame_rgb, verbose=False, device=self.device)
        detections: List[Dict] = []
        emergency_present = False

        for r in results:
            boxes = r.boxes
            for b in boxes:
                cls_id = int(b.cls[0])
                cls_name = self.model.names.get(cls_id, str(cls_id))
                conf = float(b.conf[0])
                x1, y1, x2, y2 = map(float, b.xyxy[0].tolist())

                det = {
                    "bbox": (x1, y1, x2, y2),
                    "cls_name": cls_name,
                    "confidence": conf,
                }
                # Only keep vehicle-like classes
                if any(k in cls_name.lower() for k in VEHICLE_CLASSES | EMERGENCY_KEYWORDS):
                    detections.append(det)
                    if any(k in cls_name.lower() for k in EMERGENCY_KEYWORDS):
                        emergency_present = True

        return detections, emergency_present


def draw_detections(
    frame_bgr, detections: List[Dict], lane_polylines: Optional[Dict[str, Tuple[Tuple[int, int], Tuple[int, int]]]] = None
):
    """
    Draw bounding boxes and (optionally) lane polylines on a frame.
    """
    for det in detections:
        x1, y1, x2, y2 = map(int, det["bbox"])
        cls_name = det["cls_name"]
        color = (0, 255, 0)
        if any(k in cls_name.lower() for k in EMERGENCY_KEYWORDS):
            color = (0, 0, 255)

        cv2.rectangle(frame_bgr, (x1, y1), (x2, y2), color, 2)
        label = f"{cls_name}"
        cv2.putText(
            frame_bgr,
            label,
            (x1, max(0, y1 - 5)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            1,
            cv2.LINE_AA,
        )

    if lane_polylines:
        for lane_id, (p1, p2) in lane_polylines.items():
            cv2.line(frame_bgr, p1, p2, (255, 255, 0), 2)
            cv2.putText(
                frame_bgr,
                lane_id,
                p1,
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 0),
                1,
                cv2.LINE_AA,
            )

    return frame_bgr


def load_video_capture(source: int | str = 0) -> cv2.VideoCapture:
    """
    Helper that opens a webcam or video file with sane defaults.
    """
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise RuntimeError(f"Unable to open video source: {source}")
    return cap


if __name__ == "__main__":
    # Simple demo for manual testing: python vehicle_detection.py
    cap = load_video_capture(0)
    detector = VehicleDetector()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        detections, emergency = detector.detect(frame)
        vis = draw_detections(frame, detections)

        if emergency:
            cv2.putText(
                vis,
                "EMERGENCY VEHICLE DETECTED",
                (30, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 0, 255),
                2,
                cv2.LINE_AA,
            )

        cv2.imshow("Vehicle Detection", vis)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

