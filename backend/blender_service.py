"""
Blender service manager for TrueDepth Extractor web service.
Manages the lifecycle of the Blender web service subprocess.
"""

import subprocess
import logging
import time
import signal
import sys
import requests
import atexit
from pathlib import Path
from typing import Optional

# Configure logging
logger = logging.getLogger(__name__)

# Configuration
BLENDER_SERVICE_PORT = 5001
BLENDER_SERVICE_HOST = "127.0.0.1"
BLENDER_SERVICE_URL = f"http://{BLENDER_SERVICE_HOST}:{BLENDER_SERVICE_PORT}"
TRUEDEPTH_PLUGIN_PATH = Path("/home/roman/true_depth_extractor_plugin")
WEB_SERVICE_SCRIPT = TRUEDEPTH_PLUGIN_PATH / "web_service.py"


class BlenderServiceManager:
    """Manager for the Blender web service subprocess."""

    def __init__(self, host: str = BLENDER_SERVICE_HOST, port: int = BLENDER_SERVICE_PORT):
        """
        Initialize the Blender service manager.

        Args:
            host: Host address for the service
            port: Port number for the service
        """
        self.host = host
        self.port = port
        self.url = f"http://{host}:{port}"
        self.process: Optional[subprocess.Popen] = None
        self._register_shutdown_handlers()

    def _register_shutdown_handlers(self) -> None:
        """Register handlers to clean up service on shutdown."""
        atexit.register(self.stop)
        signal.signal(signal.SIGTERM, lambda s, f: self.stop())
        signal.signal(signal.SIGINT, lambda s, f: self.stop())

    def is_running(self) -> bool:
        """
        Check if the Blender service is running and healthy.

        Returns:
            bool: True if service is running and healthy
        """
        try:
            response = requests.get(f"{self.url}/status", timeout=2)
            return response.status_code == 200
        except Exception:
            return False

    def _check_blender_plugins(self) -> bool:
        """
        Check if required Blender plugins are installed.

        Returns:
            bool: True if plugins are installed
        """
        import subprocess
        import sys

        check_script = """
import bpy
import sys

# Check if TrueDepth Extractor is installed
if not hasattr(bpy.context.scene, 'truedepth_extractor'):
    print("ERROR: TrueDepth Extractor plugin not installed")
    sys.exit(1)

# Check if TrueDepth (DepthGenius) is installed
if not hasattr(bpy.ops, 'depthgenius'):
    print("ERROR: TrueDepth plugin not installed")
    sys.exit(2)

print("OK: Plugins installed")
sys.exit(0)
"""

        try:
            result = subprocess.run(
                ['blender', '--background', '--python-expr', check_script],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0:
                return True
            elif result.returncode == 1:
                logger.error("TrueDepth Extractor plugin not installed in Blender")
                logger.error("Install from: /home/roman/true_depth_extractor_plugin/")
                return False
            elif result.returncode == 2:
                logger.error("TrueDepth (base) plugin not installed in Blender")
                logger.error("Please install the TrueDepth plugin first")
                return False
            else:
                return False

        except Exception as e:
            logger.warning(f"Could not check Blender plugins: {e}")
            return True  # Continue anyway

    def start(self) -> bool:
        """
        Start the Blender web service.

        Returns:
            bool: True if service started successfully
        """
        # Check if already running
        if self.is_running():
            logger.info(f"Blender service already running at {self.url}")
            return True

        # Validate script path
        if not WEB_SERVICE_SCRIPT.exists():
            logger.error(f"Blender service script not found: {WEB_SERVICE_SCRIPT}")
            return False

        # Note: 3D generation is currently disabled
        # TrueDepth extension requires Blender GUI mode for full functionality
        logger.info("Note: 3D model generation is currently disabled")
        logger.info("TrueDepth plugin requires GUI mode - use Blender manually for 3D models")
        return False  # Don't start service since it won't work headlessly

        try:
            logger.info(f"Starting Blender service on {self.host}:{self.port}...")

            # Start the web service as a subprocess
            self.process = subprocess.Popen(
                [
                    sys.executable,  # Use same Python interpreter
                    str(WEB_SERVICE_SCRIPT),
                    '--host', self.host,
                    '--port', str(self.port),
                    '--blender', 'blender'  # Assumes 'blender' is in PATH
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )

            # Wait for service to be ready (max 30 seconds)
            max_retries = 30
            for i in range(max_retries):
                time.sleep(1)
                if self.is_running():
                    logger.info(f"✓ Blender service started successfully at {self.url}")
                    return True

                # Check if process died
                if self.process.poll() is not None:
                    # Process terminated
                    stdout, stderr = self.process.communicate()
                    logger.error(f"Blender service failed to start:")
                    logger.error(f"STDOUT: {stdout}")
                    logger.error(f"STDERR: {stderr}")
                    return False

            logger.error("Blender service startup timeout")
            self.stop()
            return False

        except Exception as e:
            logger.error(f"Failed to start Blender service: {e}")
            return False

    def stop(self) -> None:
        """Stop the Blender web service."""
        if self.process is None:
            return

        logger.info("Stopping Blender service...")

        try:
            # Try graceful termination first
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
                logger.info("✓ Blender service stopped gracefully")
            except subprocess.TimeoutExpired:
                # Force kill if not terminated
                logger.warning("Blender service didn't stop gracefully, forcing kill...")
                self.process.kill()
                self.process.wait()
                logger.info("✓ Blender service killed")
        except Exception as e:
            logger.error(f"Error stopping Blender service: {e}")
        finally:
            self.process = None

    def restart(self) -> bool:
        """
        Restart the Blender web service.

        Returns:
            bool: True if service restarted successfully
        """
        logger.info("Restarting Blender service...")
        self.stop()
        time.sleep(2)
        return self.start()


# Global service manager instance
_service_manager: Optional[BlenderServiceManager] = None


def get_service_manager() -> BlenderServiceManager:
    """
    Get or create singleton service manager.

    Returns:
        BlenderServiceManager instance
    """
    global _service_manager
    if _service_manager is None:
        _service_manager = BlenderServiceManager()
    return _service_manager


def start_blender_service() -> bool:
    """
    Start the Blender web service.

    Returns:
        bool: True if service started successfully
    """
    manager = get_service_manager()
    return manager.start()


def stop_blender_service() -> None:
    """Stop the Blender web service."""
    manager = get_service_manager()
    manager.stop()


def is_blender_service_running() -> bool:
    """
    Check if Blender service is running.

    Returns:
        bool: True if service is running and healthy
    """
    manager = get_service_manager()
    return manager.is_running()
