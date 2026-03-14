"""
CLI entrypoint that ties together:
- video capture
- vehicle detection
- lane counting
- density calculation
- dynamic signal timing
- emergency overrides

This runs locally and prints lane statistics and signal plan to the console,
optionally showing the annotated video.
"""

import argparse
import time
from typing import Dict

import cv2
import requests

from emergency_vehicle_detection import emergency_present, filter_non_emergency
from signal_controller import SignalController
from traffic_algorithm import compute_signal_plan, density_for_count
from vehicle_counter import LaneConfig, LaneCounter
from vehicle_detection import VehicleDetector, draw_detections, load_video_capture


def run_video_demo(
    source: str | int,
    show_window: bool = True,
    device: str = "cpu",
    lane_layout: str = "vertical_triplet",
    api_base: str | None = None,
    intersection_id: str | None = None,
) -> None:
    if lane_layout == "vertical_triplet":
        lane_configs = [
            LaneConfig("Lane A", (200, 0), (200, 720)),
            LaneConfig("Lane B", (640, 0), (640, 720)),
            LaneConfig("Lane C", (1080, 0), (1080, 720)),
        ]
    else:
        lane_configs = [
            LaneConfig("Lane A", (0, 200), (1280, 200)),
            LaneConfig("Lane B", (0, 540), (1280, 540)),
            LaneConfig("Lane C", (0, 880), (1280, 880)),
        ]

    lane_counter = LaneCounter(lane_configs)
    controller = SignalController()

    cap = load_video_capture(source)
    detector = VehicleDetector(device=device)

    prev_plan_print_time = 0.0
    prev_ingest_time = 0.0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("End of stream.")
            break

        detections, _ = detector.detect(frame)
        has_emergency = emergency_present(detections)
        normal_dets = filter_non_emergency(detections)

        counts_by_lane: Dict[str, int] = lane_counter.count_by_lane(normal_dets)
        plan = compute_signal_plan(counts_by_lane)

        if controller.decision is None:
            controller.load_decision(plan)

        if has_emergency:
            # Give priority green to the lane with highest count
            emergency_lane = plan.lane_order[0].lane_id
            controller.force_green_for_lane(emergency_lane, duration=60)

        state = controller.tick(1)

        # Optionally push counts into backend so dashboards reflect real camera data
        now = time.time()
        if api_base and intersection_id and now - prev_ingest_time >= 1.0:
            prev_ingest_time = now
            try:
                requests.post(
                    f"{api_base.rstrip('/')}/ingest-counts",
                    json={
                        "intersection_id": intersection_id,
                        "counts_by_lane": counts_by_lane,
                    },
                    timeout=0.3,
                )
            except Exception:
                # Swallow errors so the local demo keeps running even if backend is down
                pass

        # Console output every second
        if now - prev_plan_print_time >= 1.0:
            prev_plan_print_time = now
            for lane_id, count in counts_by_lane.items():
                density = density_for_count(count)
                print(f"{lane_id}: {count} vehicles -> {density.value}")
            for lane_id, lane_state in state.items():
                print(
                    f"Signal {lane_id}: {lane_state.color.value} "
                    f"({lane_state.remaining_seconds}s remaining)"
                )
            print("-" * 40)

        # Draw overlay
        lane_lines = {l.lane_id: (l.p1, l.p2) for l in lane_configs}
        vis = draw_detections(frame, detections, lane_polylines=lane_lines)

        for lane_id, lane_state in state.items():
            color = (0, 255, 0) if lane_state.color.value == "GREEN" else (0, 0, 255)
            cv2.putText(
                vis,
                f"{lane_id}: {lane_state.color.value}",
                (30, 40 + 30 * list(counts_by_lane.keys()).index(lane_id)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                color,
                2,
                cv2.LINE_AA,
            )

        if show_window:
            cv2.imshow("Smart Traffic Management - Demo", vis)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    cap.release()
    cv2.destroyAllWindows()


def main():
    parser = argparse.ArgumentParser(description="AI-Based Smart Traffic Management Demo")
    parser.add_argument(
        "--source",
        type=str,
        default="0",
        help="Video source: camera index (e.g. 0) or path to video file.",
    )
    parser.add_argument("--no-window", action="store_true", help="Disable OpenCV window.")
    parser.add_argument(
        "--device", type=str, default="cpu", help="YOLO device (cpu, cuda, mps, etc.)."
    )
    parser.add_argument(
        "--api-base",
        type=str,
        default=None,
        help="Optional FastAPI backend base URL (e.g. http://localhost:8000) to ingest counts.",
    )
    parser.add_argument(
        "--intersection-id",
        type=str,
        default="I1",
        help="Target intersection ID in the backend to update with counts (default: I1).",
    )
    args = parser.parse_args()

    try:
        source: str | int
        if len(args.source) == 1 and args.source.isdigit():
            source = int(args.source)
        else:
            source = args.source
        run_video_demo(
            source=source,
            show_window=not args.no_window,
            device=args.device,
            api_base=args.api_base,
            intersection_id=args.intersection_id,
        )
    except KeyboardInterrupt:
        print("Stopping...")


if __name__ == "__main__":
    main()

