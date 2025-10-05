"""
3D Model generation module using TrueDepth Extractor via web service.
Converts room images into 3D FBX meshes with depth information.
"""

import io
import logging
import requests
from typing import Tuple, Optional
from pathlib import Path
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

# Configuration
BLENDER_SERVICE_URL = "http://localhost:5001"
RENDER_OUTPUT_DIR = Path(__file__).parent / "room_renders"


class ModelGenerator:
    """3D model generator using TrueDepth Extractor service."""

    def __init__(self, service_url: str = BLENDER_SERVICE_URL):
        """
        Initialize the model generator.

        Args:
            service_url: URL of the TrueDepth Extractor web service
        """
        self.service_url = service_url
        self._ensure_output_dir()

    def _ensure_output_dir(self) -> None:
        """Create output directory if it doesn't exist."""
        RENDER_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    def check_service_health(self) -> bool:
        """
        Check if the Blender service is running and healthy.

        Returns:
            bool: True if service is running, False otherwise
        """
        try:
            response = requests.get(f"{self.service_url}/status", timeout=2)
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Blender service health check failed: {e}")
            return False

    def generate_3d_model(
        self,
        image_data: bytes,
        model: str = 'vits',
        device: str = 'cpu',
        detail: int = 10,
        strength: float = 0.6,
        save_results: bool = True
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Generate 3D FBX model from image data.

        Args:
            image_data: Raw image bytes
            model: Model size: 'vits', 'vitb', 'vitl' (default: 'vits')
            device: Processing device: 'cpu', 'gpu' (default: 'cpu')
            detail: Mesh subdivisions 5-50 (default: 10)
            strength: Depth strength 0.0-2.0 (default: 0.6)
            save_results: Whether to save results to disk (default: True)

        Returns:
            Tuple of (fbx_path, message)
            - fbx_path: Path to saved FBX file (None if failed)
            - message: Success or error message
        """
        try:
            # Check if service is available
            if not self.check_service_health():
                logger.error("Blender service is not running or not healthy")
                return None, "3D generation service unavailable"

            # Prepare image file for upload
            files = {
                'image': ('image.jpg', io.BytesIO(image_data), 'image/jpeg')
            }

            # Prepare form data
            data = {
                'model': model,
                'device': device,
                'detail': str(detail),
                'strength': str(strength)
            }

            logger.info(f"Sending request to Blender service: model={model}, device={device}, detail={detail}")

            # Send request to Blender service
            response = requests.post(
                f"{self.service_url}/process",
                files=files,
                data=data,
                timeout=300  # 5 minute timeout for processing
            )

            if response.status_code != 200:
                # Try to get detailed error message from response
                try:
                    error_data = response.json()
                    error_detail = error_data.get('message', 'Unknown error')
                    error_msg = f"Blender service error ({response.status_code}): {error_detail}"
                except:
                    error_msg = f"Blender service returned error: {response.status_code} - {response.text[:200]}"

                logger.error(error_msg)
                return None, error_msg

            result = response.json()

            if not result.get('success'):
                error_msg = result.get('message', 'Unknown error')
                logger.error(f"3D generation failed: {error_msg}")
                return None, error_msg

            # Download the FBX file
            fbx_url = result.get('fbx_url')
            if not fbx_url:
                logger.error("No FBX URL in response")
                return None, "No FBX file generated"

            logger.info(f"Downloading FBX from: {fbx_url}")

            # Download FBX file
            fbx_response = requests.get(f"{self.service_url}{fbx_url}", timeout=30)

            if fbx_response.status_code != 200:
                logger.error(f"Failed to download FBX: {fbx_response.status_code}")
                return None, "Failed to download 3D model"

            # Save FBX file if requested
            if save_results:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                fbx_filename = f"room_model_{timestamp}.fbx"
                fbx_path = RENDER_OUTPUT_DIR / fbx_filename

                with open(fbx_path, 'wb') as f:
                    f.write(fbx_response.content)

                logger.info(f"Saved 3D model to: {fbx_path}")
                return str(fbx_path), "3D model generated successfully"
            else:
                return None, "3D model generated (not saved)"

        except requests.Timeout:
            logger.error("3D generation request timed out")
            return None, "3D generation timed out (processing took too long)"
        except Exception as e:
            logger.error(f"Error during 3D model generation: {e}")
            return None, f"3D generation error: {str(e)}"


# Singleton instance for reuse across requests
_generator_instance = None


def get_generator() -> ModelGenerator:
    """
    Get or create singleton generator instance.
    Ensures generator is initialized only once.

    Returns:
        ModelGenerator instance
    """
    global _generator_instance
    if _generator_instance is None:
        _generator_instance = ModelGenerator()
    return _generator_instance


def generate_room_model(
    image_data: bytes,
    model: str = 'vits',
    device: str = 'cpu',
    save_results: bool = True
) -> Tuple[Optional[str], Optional[str]]:
    """
    Convenience function to generate 3D room model.

    Args:
        image_data: Raw image bytes
        model: Model size (default: 'vits' for speed)
        device: Processing device (default: 'cpu')
        save_results: Whether to save results (default: True)

    Returns:
        Tuple of (fbx_path, message)
        - fbx_path: Path to saved FBX file (None if failed)
        - message: Success or error message
    """
    generator = get_generator()
    return generator.generate_3d_model(
        image_data=image_data,
        model=model,
        device=device,
        detail=10,
        strength=0.6,
        save_results=save_results
    )
