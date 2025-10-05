import os
import re
import io
import uuid
import shlex
import cv2
import subprocess
import random
import pathlib
import numpy as np
import trimesh
from ultralytics import YOLO
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI(title="glb generator")

SHELL_COMMAND_TEMPLATE = (
    "python -m scripts.inference_midi "
    "--rgb {input} "
    "--seg {mask} "
    '--output-dir "{out_glb_dir}"'
)
OUT_GLB_BASENAME_DEFAULT = "output.glb"
SHELL_TIMEOUT_SEC = 60 * 15


# =====================================
# Helpers
# =====================================
def safe_filename(name: str) -> str:
    return re.sub(r"[^\w\-.]+", "_", name).strip("_") or "item"


def generate_segmentation_mask_yolo(input_path: str, output_path: str, model_name: str):
    """YOLOv8 instance segmentation that writes a colored mask."""
    model = YOLO(model_name)
    img = cv2.imread(input_path)
    if img is None:
        raise HTTPException(status_code=400, detail=f"Cannot read image: {input_path}")
    h, w, _ = img.shape
    results = model(img, verbose=False)
    mask_img = np.zeros((h, w, 3), dtype=np.uint8)
    if results and results[0].masks is not None:
        for i, mask_data in enumerate(results[0].masks.data):
            color = (random.randint(50, 255), random.randint(50, 255), random.randint(50, 255))
            mask_np = mask_data.cpu().numpy()
            mask_resized = cv2.resize(mask_np, (w, h), interpolation=cv2.INTER_NEAREST)
            binary = (mask_resized * 255).astype(np.uint8)
            color_layer = np.zeros_like(mask_img)
            color_layer[binary == 255] = color
            mask_img = np.where(color_layer != [0, 0, 0], color_layer, mask_img)
    cv2.imwrite(output_path, mask_img)


def split_scene_geometry_to_glbs(input_glb_path: str, out_dir: str):
    """Splits one GLB per geometry."""
    os.makedirs(out_dir, exist_ok=True)
    scene = trimesh.load(input_glb_path)
    written = []
    for geom_name, geom in scene.geometry.items():
        if not isinstance(geom, trimesh.Trimesh):
            continue
        mesh = geom.copy()
        sc = trimesh.Scene()
        sc.add_geometry(mesh, node_name=geom_name)
        out_path = os.path.join(out_dir, f"{safe_filename(geom_name)}.glb")
        sc.export(out_path)
        written.append(out_path)
    return written


# =====================================
# Endpoint
# =====================================
@app.post("/process")
async def process(
    image: UploadFile = File(...),
    model_name: str = Form("yolov8s-seg.pt"),
    shell_command: str = Form(SHELL_COMMAND_TEMPLATE),
    out_glb_basename: str = Form(OUT_GLB_BASENAME_DEFAULT),
):
    # Working directories
    job_id = uuid.uuid4().hex[:8]
    job_dir = pathlib.Path("jobs") / job_id
    inp_dir = job_dir / "inputs"
    out_dir = job_dir / "outputs"
    mask_dir = job_dir / "masks"
    glb_dir = job_dir / "split_glbs"
    for d in (inp_dir, out_dir, mask_dir, glb_dir):
        d.mkdir(parents=True, exist_ok=True)

    # Save uploaded image
    input_path = inp_dir / safe_filename(image.filename)
    with open(input_path, "wb") as f:
        f.write(await image.read())

    # Run segmentation
    mask_path = mask_dir / f"{input_path.stem}_seg.png"
    generate_segmentation_mask_yolo(str(input_path), str(mask_path), model_name)

    # Run the shell command (blocking)
    out_glb_path = out_dir / out_glb_basename
    cmd = shell_command.format(
        input=str(input_path),
        mask=str(mask_path),
        out_glb_dir=str(out_dir),
        out_glb=str(out_glb_path),
    )
    print(f"Running: {cmd}")
    proc = subprocess.run(
        cmd,
        shell=True,
        cwd=str(pathlib.Path(__file__).parent.resolve()),  # run from project root
        capture_output=True,
        text=True,
        timeout=SHELL_TIMEOUT_SEC,
    )
    if proc.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Shell command failed",
                "stdout": proc.stdout,
                "stderr": proc.stderr,
                "command": cmd,
            },
        )

    # Split GLB geometry
    if not out_glb_path.exists():
        raise HTTPException(status_code=404, detail="Output GLB not found.")
    written = split_scene_geometry_to_glbs(str(out_glb_path), str(glb_dir))

    return JSONResponse(
        {
            "job_id": job_id,
        }
    )
