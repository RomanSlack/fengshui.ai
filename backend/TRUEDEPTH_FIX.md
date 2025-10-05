# TrueDepth 3D Generation Fix

## Current Issue

The 3D generation feature is **almost working** but TrueDepth needs its dependencies installed.

**Current error:**
```
ERROR: Failed to generate depth map: No module named 'cv2'
```

This means TrueDepth's Python dependencies (OpenCV, etc.) are not installed in Blender's environment.

---

## ✅ What's Already Fixed

1. ✅ Blender service starts correctly
2. ✅ Both TrueDepth and TrueDepth Extractor load in headless mode
3. ✅ All operators and scene properties are available
4. ✅ GPU mode enabled for faster processing
5. ✅ Background task processing works
6. ✅ Image upload and analysis pipeline works

❌ **Only missing:** TrueDepth dependencies (opencv-python, etc.)

---

## 🔧 Quick Fix (5 minutes)

### Step 1: Install TrueDepth Dependencies

Open Blender in **GUI mode** and run TrueDepth once to let it install dependencies:

1. **Open Blender** (regular GUI, not headless)
   ```bash
   blender
   ```

2. **Load a test image:**
   - Press `N` to open sidebar
   - Click "TrueDepth" tab (NOT "TrueDepth Extract")
   - Click "Load Image" → select any image (e.g., from `/home/roman/fengshui.ai/backend/results/`)

3. **Generate depth map:**
   - Click "Generate Depth Map"
   - **IMPORTANT:** This will trigger dependency installation
   - You may see prompts about installing packages - **click Yes/Allow**
   - Wait for it to complete (may take 1-2 minutes first time)

4. **Verify it worked:**
   - If you see a depth map appear → Success! Dependencies are installed
   - Close Blender

### Step 2: Restart Your Backend

```bash
cd /home/roman/fengshui.ai/backend
python main.py
```

You should now see:
```
INFO: Starting Blender 3D generation service...
INFO: ✓ Blender service started successfully
INFO: ✓ Blender service is ready
```

### Step 3: Test 3D Generation

1. Upload an image via the frontend
2. Check backend logs - you should see:
   ```
   INFO: 3D model generation queued as background task
   INFO: Starting background 3D model generation...
   INFO: Sending request to Blender service: model=vits, device=gpu, detail=10
   INFO: ✓ 3D model generated: .../room_renders/room_model_....fbx
   ```

3. Check output folder:
   ```bash
   ls -lh /home/roman/fengshui.ai/backend/room_renders/
   ```

---

## 🔍 Alternative: Manual Dependency Installation

If the GUI method doesn't work, install dependencies manually:

### Find TrueDepth's Python

```bash
# Check which Python TrueDepth uses
blender --background --python-expr "import sys; print(sys.executable)"
```

### Install OpenCV

```bash
# If TrueDepth uses Blender's Python:
/snap/blender/6559/4.5/python/bin/python3.11 -m pip install opencv-python opencv-contrib-python

# Or if it uses system Python:
pip install opencv-python opencv-contrib-python
```

### Test It

```bash
blender --background --python-expr "import cv2; print('✓ OpenCV installed:', cv2.__version__)"
```

Should output:
```
✓ OpenCV installed: 4.x.x
```

---

## 🧪 Verify Everything Works

### Test Blender Service Directly

```bash
curl -X POST http://localhost:5001/process \
  -F "image=@/home/roman/fengshui.ai/backend/results/detection_XXXXX.jpg" \
  -F "model=vits" \
  -F "device=gpu" \
  -F "detail=10"
```

Should return:
```json
{
  "success": true,
  "fbx_url": "/download/detection_XXXXX_depth_mesh.fbx",
  "message": "Processing complete"
}
```

### Test End-to-End

1. Start backend: `python main.py`
2. Upload image via frontend
3. Check logs for success message
4. Verify FBX files in `/home/roman/fengshui.ai/backend/room_renders/`

---

## 📊 Expected Performance

| Component | Time |
|-----------|------|
| Image upload | <1s |
| Object detection (YOLO) | 1-2s |
| Feng Shui analysis (Gemini) | 2-3s |
| **Response returned** | **~3s** |
| 3D generation (background) | 5-15s |
| **Total with 3D** | **~18s** |

**Note:** 3D generation happens in the background, so the user gets their Feng Shui analysis immediately.

---

## 🎯 Configuration

### GPU vs CPU

Edit `/home/roman/fengshui.ai/backend/main.py` line 134:

```python
# Current (GPU - faster):
'gpu',   # Use GPU for faster processing

# Alternative (CPU - more compatible):
'cpu',   # Use CPU (slower but works everywhere)
```

### Model Quality

Line 133 in `main.py`:
```python
'vits',  # Fast (recommended)
'vitb',  # Better quality
'vitl',  # Best quality (slow)
```

---

## ❓ Troubleshooting

### "TrueDepth not found in Blender GUI"

**Solution:**
```bash
# Open Blender
blender

# Install TrueDepth extension:
# Edit → Preferences → Get Extensions
# Search: "TrueDepth"
# Click Install
```

### "Blender service won't start"

**Check:**
```bash
# Is port 5001 available?
lsof -i :5001

# Is Blender accessible?
blender --version

# Test manually:
python3 /home/roman/true_depth_extractor_plugin/web_service.py --port 5001
```

### "Still getting cv2 errors"

**Debug:**
```bash
# Check what Python packages Blender sees:
blender --background --python-expr "
import sys
print('Python:', sys.executable)
print('Path:', sys.path)
try:
    import cv2
    print('✓ cv2 found')
except:
    print('✗ cv2 missing')
"
```

---

## 📝 Summary

**What's Working:**
- ✅ Backend FastAPI server
- ✅ YOLO object detection
- ✅ Gemini Feng Shui analysis
- ✅ Blender service startup
- ✅ Addon loading in headless mode
- ✅ Background task processing

**What Needs Setup:**
- ❌ TrueDepth dependencies (opencv-python)

**Fix:**
1. Open Blender GUI
2. Run TrueDepth once to install deps
3. Restart backend
4. Test - should work!

---

## 🚀 After Fix

Once TrueDepth dependencies are installed, the complete pipeline will work:

```
User uploads image
    ↓
Object detection (YOLO) → finds furniture
    ↓
Feng Shui analysis (Gemini) → generates advice
    ↓
[Response sent to user - ~3 seconds total]
    ↓
[Background] 3D model generation (TrueDepth + Blender)
    ↓
[Background] FBX file saved to room_renders/
    ↓
[Done in ~18 seconds total]
```

The user gets their analysis immediately, and the 3D model is ready shortly after!
