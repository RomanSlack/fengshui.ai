"""
Object detection module using YOLOv11 for furniture and room arrangement analysis.
Detects objects in bedroom and living space images.
"""

import io
import json
import logging
from typing import List, Dict, Any, Tuple
from pathlib import Path
from datetime import datetime
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO
import cv2

# Configure logging
logger = logging.getLogger(__name__)

# Model path - will download automatically on first run
MODEL_NAME = "yolo11x.pt"  # YOLOv11 XL model (most accurate)
MODEL_CACHE_DIR = Path(__file__).parent / "models"
RESULTS_DIR = Path(__file__).parent / "results"


class ObjectDetector:
    """YOLOv11-based object detector for room furniture and arrangement analysis."""

    def __init__(self, model_name: str = MODEL_NAME):
        """
        Initialize the object detector.

        Args:
            model_name: YOLO model to use (default: yolo11n.pt)
        """
        self.model_name = model_name
        self.model = None
        self._load_model()

    def _load_model(self) -> None:
        """Load the YOLO model with error handling."""
        try:
            # Create model cache and results directories if they don't exist
            MODEL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
            RESULTS_DIR.mkdir(parents=True, exist_ok=True)

            # Load model (will auto-download if not present)
            self.model = YOLO(self.model_name)
            logger.info(f"Successfully loaded YOLO model: {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise

    def detect_objects(self, image_data: bytes, confidence_threshold: float = 0.25) -> List[Dict[str, Any]]:
        """
        Detect objects in an image.

        Args:
            image_data: Raw image bytes
            confidence_threshold: Minimum confidence score for detections (0-1)

        Returns:
            List of detected objects with format:
            [
                {
                    "class": "bed",
                    "confidence": 0.95,
                    "bbox": {
                        "x1": 100.5,
                        "y1": 200.3,
                        "x2": 500.7,
                        "y2": 600.9,
                        "width": 400.2,
                        "height": 400.6
                    },
                    "center": {"x": 300.6, "y": 400.6}
                },
                ...
            ]
        """
        try:
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_data))

            # Convert to RGB if necessary (handle RGBA, grayscale, etc.)
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Run inference (max_det=20 allows up to 20 detections)
            results = self.model(image, conf=confidence_threshold, max_det=20, verbose=False)

            # Parse results
            detections = []
            for result in results:
                boxes = result.boxes
                for i in range(len(boxes)):
                    # Get bounding box coordinates (xyxy format)
                    bbox = boxes.xyxy[i].cpu().numpy()
                    x1, y1, x2, y2 = bbox

                    # Get class and confidence
                    class_id = int(boxes.cls[i].cpu().numpy())
                    confidence = float(boxes.conf[i].cpu().numpy())
                    class_name = result.names[class_id]

                    # Calculate additional metrics
                    width = x2 - x1
                    height = y2 - y1
                    center_x = (x1 + x2) / 2
                    center_y = (y1 + y2) / 2

                    detection = {
                        "class": class_name,
                        "confidence": round(confidence, 3),
                        "bbox": {
                            "x1": round(float(x1), 2),
                            "y1": round(float(y1), 2),
                            "x2": round(float(x2), 2),
                            "y2": round(float(y2), 2),
                            "width": round(float(width), 2),
                            "height": round(float(height), 2)
                        },
                        "center": {
                            "x": round(float(center_x), 2),
                            "y": round(float(center_y), 2)
                        }
                    }
                    detections.append(detection)

            logger.info(f"Detected {len(detections)} objects in image")
            return detections

        except Exception as e:
            logger.error(f"Error during object detection: {e}")
            raise

    def draw_bounding_boxes(self, image_data: bytes, detections: List[Dict[str, Any]]) -> Image.Image:
        """
        Draw bounding boxes on image with labels.

        Args:
            image_data: Raw image bytes
            detections: List of detection results from detect_objects()

        Returns:
            PIL Image with bounding boxes drawn
        """
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_data))
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Create drawing context
        draw = ImageDraw.Draw(image)

        # Try to use a decent font, fall back to default if not available
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
        except:
            font = ImageFont.load_default()

        # Color palette for different classes
        colors = [
            (255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0),
            (255, 0, 255), (0, 255, 255), (128, 0, 0), (0, 128, 0),
            (0, 0, 128), (128, 128, 0), (128, 0, 128), (0, 128, 128)
        ]

        # Draw each detection
        for i, det in enumerate(detections):
            bbox = det['bbox']
            x1, y1, x2, y2 = bbox['x1'], bbox['y1'], bbox['x2'], bbox['y2']

            # Get color for this detection
            color = colors[i % len(colors)]

            # Draw rectangle
            draw.rectangle([x1, y1, x2, y2], outline=color, width=3)

            # Draw label with background
            label = f"{det['class']} {det['confidence']:.2f}"

            # Get text bounding box for background
            bbox_text = draw.textbbox((x1, y1 - 20), label, font=font)
            draw.rectangle(bbox_text, fill=color)
            draw.text((x1, y1 - 20), label, fill=(255, 255, 255), font=font)

        return image

    def save_results(
        self,
        image_data: bytes,
        detections: List[Dict[str, Any]],
        timestamp: str = None
    ) -> Tuple[str, str]:
        """
        Save detection results to JSON file and annotated image.

        Args:
            image_data: Raw image bytes
            detections: List of detection results
            timestamp: Optional timestamp string (generated if not provided)

        Returns:
            Tuple of (json_file_path, image_file_path)
        """
        if timestamp is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")

        # Create annotated image
        annotated_image = self.draw_bounding_boxes(image_data, detections)

        # Save annotated image
        image_path = RESULTS_DIR / f"detection_{timestamp}.jpg"
        annotated_image.save(image_path, quality=95)
        logger.info(f"Saved annotated image to: {image_path}")

        # Prepare JSON data
        results_data = {
            "timestamp": timestamp,
            "image_file": str(image_path.name),
            "total_detections": len(detections),
            "detections": detections
        }

        # Save JSON results
        json_path = RESULTS_DIR / f"detection_{timestamp}.json"
        with open(json_path, 'w') as f:
            json.dump(results_data, f, indent=2)
        logger.info(f"Saved detection results to: {json_path}")

        return str(json_path), str(image_path)


# Singleton instance for reuse across requests
_detector_instance = None


def get_detector() -> ObjectDetector:
    """
    Get or create singleton detector instance.
    Ensures model is loaded only once for performance.

    Returns:
        ObjectDetector instance
    """
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = ObjectDetector()
    return _detector_instance


def detect_room_objects(image_data: bytes, save_results: bool = True) -> Tuple[List[Dict[str, Any]], str, str]:
    """
    Convenience function to detect objects in room images.

    Args:
        image_data: Raw image bytes
        save_results: Whether to save annotated image and JSON results (default: True)

    Returns:
        Tuple of (detections, json_path, image_path)
        - detections: List of detected objects with coordinates
        - json_path: Path to saved JSON file (empty string if save_results=False)
        - image_path: Path to saved annotated image (empty string if save_results=False)
    """
    detector = get_detector()
    detections = detector.detect_objects(image_data)

    json_path = ""
    image_path = ""

    if save_results:
        json_path, image_path = detector.save_results(image_data, detections)

    return detections, json_path, image_path
