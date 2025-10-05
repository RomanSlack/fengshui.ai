# Blender 3D Generation Setup Guide

This guide will help you set up the 3D model generation feature for FengShui.ai.

## Prerequisites

- Blender 3.0+ installed (already done ✓ - found at `/snap/bin/blender`)
- Backend dependencies installed (already done ✓)

## Required Blender Plugins

The 3D generation feature requires two Blender plugins:

1. **TrueDepth** (base plugin) - AI depth estimation
2. **TrueDepth Extractor** (automation plugin) - Automated FBX export

---

## Installation Steps

### Step 1: Install TrueDepth Plugin

You need to install the TrueDepth plugin first. This is the base plugin that provides depth estimation AI.

**Option A: If you have the TrueDepth plugin file**
1. Open Blender
2. Go to: `Edit → Preferences → Add-ons`
3. Click `Install...`
4. Browse to the TrueDepth plugin file
5. Click `Install Add-on`
6. Enable the "TrueDepth" checkbox

**Option B: Install from Blender Extensions (if available)**
1. Open Blender
2. Go to: `Edit → Preferences → Add-ons`
3. Search for "TrueDepth" or "DepthGenius"
4. Click Install
5. Enable the plugin

**Note:** If you don't have the TrueDepth plugin, you may need to:
- Download it from the official source
- Check Blender Extensions marketplace
- Or contact the plugin provider

### Step 2: Install TrueDepth Extractor Plugin

This plugin is already on your system at:
```
/home/roman/true_depth_extractor_plugin/__init__.py
```

**Installation:**
1. Open Blender
2. Go to: `Edit → Preferences → Add-ons`
3. Click `Install...`
4. Navigate to: `/home/roman/true_depth_extractor_plugin/`
5. Select: `__init__.py`
6. Click `Install Add-on`
7. Find "Import-Export: TrueDepth Extractor" in the list
8. Enable the checkbox next to it

### Step 3: Verify Installation

**Method 1: Check in Blender UI**
1. Open Blender
2. Press `N` in the 3D Viewport to open the sidebar
3. You should see a "TrueDepth Extract" tab
4. Click it to verify the panel appears

**Method 2: Check via command line**
```bash
blender --background --python-expr "
import bpy
import sys

# Check TrueDepth Extractor
if hasattr(bpy.context.scene, 'truedepth_extractor'):
    print('✓ TrueDepth Extractor installed')
else:
    print('✗ TrueDepth Extractor NOT installed')
    sys.exit(1)

# Check TrueDepth base
if hasattr(bpy.ops, 'depthgenius'):
    print('✓ TrueDepth (base) installed')
else:
    print('✗ TrueDepth (base) NOT installed')
    sys.exit(2)

print('All plugins ready!')
"
```

If both checks pass, you'll see:
```
✓ TrueDepth Extractor installed
✓ TrueDepth (base) installed
All plugins ready!
```

### Step 4: Restart Backend

After installing the plugins:
1. Stop your FastAPI backend (Ctrl+C)
2. Restart it: `python main.py` or `uvicorn main:app --reload --port 8000`

You should see:
```
INFO:     Starting Blender 3D generation service...
INFO:     Checking Blender plugins...
INFO:     Starting Blender service on 127.0.0.1:5001...
INFO:     ✓ Blender service started successfully at http://127.0.0.1:5001
INFO:     ✓ Blender service is ready
```

---

## Testing

### Test the 3D Generation

1. Upload an image via the frontend
2. Check backend logs for:
   ```
   INFO: 3D model generation queued as background task
   INFO: Starting background 3D model generation...
   INFO: Sending request to Blender service: model=vits, device=gpu, detail=10
   INFO: ✓ 3D model generated: /home/roman/fengshui.ai/backend/room_renders/room_model_....fbx
   ```

3. Check the output folder:
   ```bash
   ls -lh /home/roman/fengshui.ai/backend/room_renders/
   ```

You should see FBX files generated.

---

## Troubleshooting

### Error: "TrueDepth Extractor plugin not found"

**Solution:**
- Install the TrueDepth Extractor plugin following Step 2
- Make sure to enable it after installation
- Restart Blender if the plugin was just installed

### Error: "TrueDepth plugin not installed"

**Solution:**
- Install the TrueDepth (base) plugin following Step 1
- This is the AI depth estimation plugin
- It's required for the Extractor to work

### Error: "Blender service returned error: 500"

**Causes:**
- Plugins not installed (see above)
- Blender can't access GPU (if using GPU mode)
- Image format not supported

**Solutions:**
1. Check plugin installation (see Verify Installation above)
2. If using GPU mode, make sure CUDA/OpenCL is available
3. Try with CPU mode (change `'gpu'` to `'cpu'` in `backend/main.py:134`)

### Error: "Processing timeout"

**Solution:**
- Increase timeout in `backend/model_generation.py` (currently 300 seconds)
- Use smaller model size ('vits' instead of 'vitl')
- Reduce mesh detail (lower than 10)

### Blender service won't start

**Check:**
```bash
# Test Blender
blender --version

# Test web service script
python3 /home/roman/true_depth_extractor_plugin/web_service.py --help

# Check if port 5001 is available
lsof -i :5001
```

---

## Configuration

### GPU vs CPU

Edit `/home/roman/fengshui.ai/backend/main.py` line 134:

```python
# For GPU (faster):
'gpu',   # Use GPU for faster processing

# For CPU (more compatible):
'cpu',   # Use CPU (slower but works everywhere)
```

### Model Quality

In `main.py` line 133, you can change:
- `'vits'` - Fastest (recommended for production)
- `'vitb'` - Balanced quality/speed
- `'vitl'` - Best quality (slowest)

### Mesh Detail

In `main.py`, change the `detail` parameter when calling `generate_room_model()`:
- `5-10` - Fast, lower quality
- `10-15` - Good balance (recommended)
- `15-30` - High quality (slower)
- `30-50` - Very high quality (very slow)

---

## Support

If you continue to have issues:

1. Check Blender version: `blender --version` (requires 3.0+)
2. Verify plugins in Blender UI
3. Check backend logs for detailed error messages
4. Test Blender service directly:
   ```bash
   curl http://localhost:5001/status
   ```

For more details, see:
- `/home/roman/true_depth_extractor_plugin/README.md`
- `/home/roman/true_depth_extractor_plugin/INSTALL.md`
- `/home/roman/true_depth_extractor_plugin/API_DOCS.md`
