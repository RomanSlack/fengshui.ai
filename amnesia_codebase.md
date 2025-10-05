# FengShui.ai - Codebase Guide

> **Quick orientation guide for AI agents (and humans) joining this project**

## 🎯 What This Is

**FengShui.ai** is an AI-powered interior design analysis tool that evaluates rooms using traditional feng shui principles. Users upload a photo of their room and receive:

1. **Feng Shui Score** (1-10) with detailed analysis
2. **Interactive Object Tooltips** - hover over detected furniture to see specific insights
3. **3D Room Model** - generated FBX mesh from the photo (optional, background process)

The vibe is **zen, calm, and meditative** - everything flows slowly with graceful transitions.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND (Next.js)          Port 3000              │
│  - Zen design system (slow transitions, soft UI)    │
│  - Auth0 authentication                             │
│  - Echo payment integration (3 free uploads)        │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTTP/REST
                   ▼
┌─────────────────────────────────────────────────────┐
│  BACKEND (FastAPI)           Port 8000              │
│  - YOLOv11x object detection                        │
│  - Gemini 2.5 Flash feng shui analysis              │
│  - 3D model generation (background)                 │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ HTTP
                   ▼
┌─────────────────────────────────────────────────────┐
│  BLENDER SERVICE             Port 5001              │
│  - TrueDepth Extractor plugin                       │
│  - Image → Depth Map → 3D Mesh → FBX               │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
fengshui.ai/
├── frontend/                 # Next.js App Router (TypeScript)
│   ├── app/
│   │   ├── page.tsx         # Landing page (breathing background)
│   │   ├── upload/page.tsx  # Main analysis page
│   │   └── viewer/page.tsx  # 3D model viewer
│   ├── components/          # React components
│   │   ├── FengShuiVisualization.tsx  # Interactive tooltips
│   │   ├── CircularProgress.tsx       # Score wheel
│   │   ├── Embedded3DViewer.tsx       # 3D model display
│   │   └── TopNav.tsx                 # Navigation
│   └── STYLE_GUIDE.md       # **READ THIS** - Design system rules
│
├── backend/                  # FastAPI (Python)
│   ├── main.py              # Main API server + /analyze endpoint
│   ├── object_detection.py  # YOLOv11x wrapper (singleton pattern)
│   ├── model_generation.py  # 3D generation via Blender service
│   ├── blender_service.py   # Blender subprocess manager
│   ├── results/             # Saved detection images + JSON
│   └── room_renders/        # Generated FBX files
│
├── .env                      # API keys (GOOGLE_API_KEY)
└── amnesia_codebase.md      # This file
```

---

## 🔄 Data Flow (Complete Request Lifecycle)

### **Step 1: User Uploads Image**
```
Frontend: /upload → POST /analyze/ (FormData with image)
```

### **Step 2: Backend Processing (Parallel)**
```python
# main.py /analyze/ endpoint does 3 things:

1. Object Detection (YOLO)
   - Detects furniture/objects in image
   - Returns: class, confidence, bbox, center coordinates
   - Saves annotated image to /results/

2. Feng Shui Analysis (Gemini)
   - Receives image + detected objects list
   - Returns: score, strengths, weaknesses, suggestions, object_tooltips
   - Tooltips are linked to objects by index

3. 3D Model Generation (Background Task)
   - Queued as BackgroundTask (non-blocking)
   - Returns model_id immediately
   - Status: pending → processing → completed/failed
```

### **Step 3: Frontend Rendering**
```typescript
// Response structure:
{
  score: 8,
  overall_analysis: "Your room has good energy flow...",
  strengths: [...],
  weaknesses: [...],
  suggestions: [...],
  tooltips: [
    {
      object_class: "bed",
      object_index: 0,
      type: "good" | "bad" | "neutral",
      message: "Bed placement promotes rest...",
      coordinates: { bbox: {...}, center: {...} }
    }
  ],
  model_3d: {
    model_id: "20251004_123456_789012",
    status: "pending"
  }
}
```

### **Step 4: 3D Model Polling (Optional)**
```
Frontend polls: GET /models/status/{model_id}
When complete: GET /models/{filename} downloads FBX
```

---

## 🎨 Frontend Design Rules

**ALWAYS READ**: `frontend/STYLE_GUIDE.md` before making UI changes.

**Key Principles:**
- **Transitions**: 1000ms for page changes, 500ms for interactions
- **Colors**: zen-sage (green), zen-pine (dark green), zen-cloud (cream)
- **Spacing**: Generous whitespace (`space-y-12` between sections)
- **Corners**: Soft and rounded (`rounded-2xl`, `rounded-3xl`, `rounded-full`)
- **Fonts**: `font-light` by default, serif for headings
- **Shadows**: Layered but soft (`shadow-lg`, `shadow-2xl`)

**Common Patterns:**
```tsx
// Page fade transitions
const [fadeIn, setFadeIn] = useState(false);
useEffect(() => setFadeIn(true), []);
<main className={`transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>

// Button styling
<button className="px-12 py-5 rounded-full bg-zen-sage/90 hover:bg-zen-sage
                   transition-all duration-500 shadow-2xl hover:scale-105">

// Card containers
<div className="bg-white rounded-2xl shadow-lg p-8">
```

---

## 🔧 Backend Technical Details

### **Object Detection** (`object_detection.py`)
- **Model**: YOLOv11x (most accurate, auto-downloads on first run)
- **Confidence**: 0.25 threshold
- **Max Objects**: 20 per image
- **Output**: JSON + annotated image saved to `/results/`
- **Pattern**: Singleton detector instance for performance

### **Feng Shui Analysis** (`main.py` - `call_gemini_fengshui()`)
- **Model**: Gemini 2.5 Flash
- **Input**: Image + detected objects list
- **Temperature**: 0.3 (more deterministic)
- **Output**: Structured JSON (enforced via `response_mime_type`)
- **Tooltip Matching**: Links Gemini tooltips to YOLO objects by index

### **3D Generation** (`model_generation.py`)
- **Service**: Blender subprocess on port 5001
- **Plugin**: TrueDepth Extractor (depth map → mesh)
- **Models**: vits (fast), vitb, vitl (accurate)
- **Device**: CPU for background tasks, GPU optional
- **Format**: FBX export saved to `/room_renders/`
- **Lifecycle**: Managed by FastAPI lifespan (starts on boot, stops on shutdown)

---

## 🚀 How to Run

### **Prerequisites**
```bash
# Backend dependencies
pip install -r backend/requirements.txt

# Frontend dependencies
cd frontend && npm install

# Environment variables
# Create .env in root with: GOOGLE_API_KEY=your_key_here
```

### **Start Services**
```bash
# Terminal 1: Backend (includes Blender service auto-start)
cd backend
python main.py  # or: uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev  # Port 3000
```

### **Access**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/docs` (FastAPI auto-docs)
- Blender Service: `http://localhost:5001/status` (auto-managed)

---

## 🧩 Key Integration Points

### **Auth & Payments**
- **Auth0**: Google OAuth login (mandatory modal on `/upload`)
- **Echo SDK**: Payment gateway for credits (3 free, then $0.01 per analysis)
- **Paywall Toggle**: `localStorage.getItem('fengshui_paywall_enabled')` for testing

### **API Endpoints**
```
POST   /analyze/              # Upload image, get analysis + model_id
GET    /models/status/{id}    # Check 3D generation status
GET    /models/{filename}     # Download FBX file
```

### **State Management**
- **Frontend**: React useState/useEffect (no Redux/Zustand)
- **Backend**: In-memory dict `model_generation_status` (ephemeral)

---

## 🎯 Common Development Tasks

### **Adding New Feng Shui Analysis Features**
1. Modify prompt in `main.py` → `call_gemini_fengshui()`
2. Update response schema in `AnalysisResult` interface (`upload/page.tsx`)
3. Add UI rendering in `upload/page.tsx` results section

### **Modifying Object Detection**
1. Adjust confidence/max_det in `object_detection.py` → `detect_objects()`
2. Results auto-save to `/backend/results/` (JSON + annotated image)

### **Changing UI Design**
1. **MUST READ** `frontend/STYLE_GUIDE.md` first
2. Use existing Tailwind classes matching the zen aesthetic
3. Keep transitions slow (500-1000ms)

### **3D Generation Tweaks**
1. Model quality: Change `model='vits'` to `'vitb'` or `'vitl'` in `model_generation.py`
2. Mesh detail: Adjust `detail=10` parameter (5-50 range)
3. Service issues: Check Blender logs, restart with `blender_service.restart()`

---

## 🐛 Troubleshooting

**3D Generation Not Working?**
- Check: `http://localhost:5001/status` returns 200
- Logs: Backend will show Blender service startup messages
- Plugin: TrueDepth Extractor must be installed in Blender

**YOLO Model Not Loading?**
- First run downloads `yolo11x.pt` (~220MB)
- Check `backend/yolo11x.pt` exists

**Gemini API Errors?**
- Verify `GOOGLE_API_KEY` in `.env` file
- Check API quota: https://aistudio.google.com/app/apikey

**Frontend Transitions Choppy?**
- This is intentional - slow transitions (1000ms) for zen feel
- Don't reduce below 500ms (violates design philosophy)

---

## 📝 Code Style Notes

**Backend (Python)**
- Singleton pattern for heavy objects (YOLO model, generators)
- Async/await for background tasks
- Comprehensive logging (use `logger.info()`)
- Type hints everywhere

**Frontend (TypeScript)**
- "use client" for all interactive components
- Parallel reads for multiple file operations
- Fade transitions on mount/unmount
- Descriptive state variable names

---

## 🎓 Philosophy

This project balances:
- **Modern AI** (YOLO, Gemini, depth mapping)
- **Ancient wisdom** (feng shui principles)
- **Zen aesthetics** (slow, flowing, breathing UI)

When in doubt, ask: "Does this feel calm and harmonious?" If yes, you're on the right path. 🌿
