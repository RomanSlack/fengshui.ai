# Camera & Tooltip Settings Guide

## 📷 Camera Position Settings

**File:** `/frontend/components/ModelViewer3DWithTooltips.tsx`

### Camera Starting Position (Line 307)
```tsx
<PerspectiveCamera makeDefault position={[0, 0, 25]} />
//                                      [X, Y, Z]
```

**How to adjust:**
- **X axis** (first number): Left (-) / Right (+)
  - `0` = centered horizontally ✓
- **Y axis** (second number): Down (-) / Up (+)
  - `0` = centered vertically ✓
- **Z axis** (third number): Distance from mesh
  - `25` = **current setting** (facing directly at mesh)
  - Increase for further away (e.g., `30`, `35`)
  - Decrease for closer (e.g., `20`, `18`)

**Current:** `[0, 0, 25]` - Camera facing directly front-on at mesh, 25 units away

---

## 🎮 Camera Movement Restrictions (Lines 312-320)

```tsx
<OrbitControls
  enableDamping
  dampingFactor={0.05}      // Smoothness of movement (0.01-0.2)
  enablePan={false}          // Disable panning (locked)
  minDistance={10}           // Closest zoom (adjust this)
  maxDistance={40}           // Furthest zoom (adjust this)
  maxPolarAngle={Math.PI/2}  // Don't go below floor
  minPolarAngle={Math.PI/6}  // Don't go too high
/>
```

**Zoom Range:**
- `minDistance={10}` - Can't zoom closer than 10 units
- `maxDistance={40}` - Can't zoom further than 40 units

**Rotation Limits:**
- `maxPolarAngle={Math.PI/2}` - Can't rotate below horizontal (90°)
- `minPolarAngle={Math.PI/6}` - Can't rotate above 30° from top

---

## 🔍 Tooltip Size Settings

### Icon Size (Lines 184-207)

**Distance Scaling Factor (Line 186):**
```tsx
<Html
  center
  distanceFactor={6}  // Controls size relative to distance
/>
```
- **Lower number** = Larger icons (e.g., `4`, `5`)
- **Higher number** = Smaller icons (e.g., `8`, `10`)
- **Current:** `6` (medium-large)

**Icon Circle Size (Line 200):**
```tsx
<div className="w-16 h-16 ... text-2xl">
//              ^^^^^^ icon size   ^^^^ text size
```
- Icon dimensions: `w-16 h-16` (64px × 64px)
- Text size: `text-2xl` (24px)
- To adjust: Change to `w-20 h-20 text-3xl` for larger, or `w-12 h-12 text-xl` for smaller

### Tooltip Card Size (Lines 219-267)

**Card Width (Line 222):**
```tsx
<div className="... w-96 ...">
//                    ^^^^ card width
```
- Current: `w-96` (384px wide)
- Larger: `w-[28rem]` (448px) or `w-[32rem]` (512px)
- Smaller: `w-80` (320px)

**Card Padding (Line 228):**
```tsx
<div className="... p-8 ...">
//                    ^^ padding
```
- Current: `p-8` (32px all sides)
- More spacious: `p-10` or `p-12`
- More compact: `p-6`

**Icon Badge Size (Line 241):**
```tsx
<div className="... w-14 h-14 ... text-2xl">
//                    ^^^^^^^^      ^^^^^^^ badge text
```
- Current: `w-14 h-14` (56px × 56px), `text-2xl`
- Adjust proportionally with card size

**Title Size (Line 247):**
```tsx
<div className="font-bold text-2xl ...">
//                        ^^^^^^^^ title size
```
- Current: `text-2xl`
- Larger: `text-3xl` or `text-4xl`

**Message Size (Line 256):**
```tsx
<div className="text-xl ...">
//              ^^^^^^^ message size
```
- Current: `text-xl`
- Larger: `text-2xl`
- Smaller: `text-lg`

---

## 🎯 Quick Adjustment Recipes

### "Make everything bigger"
```tsx
// Icons
distanceFactor={4}
className="w-20 h-20 ... text-3xl"

// Cards
className="... w-[28rem] ..."
className="... p-10 ..."
className="... text-3xl ..." // title
className="... text-2xl ..." // message
```

### "Make everything smaller"
```tsx
// Icons
distanceFactor={8}
className="w-12 h-12 ... text-xl"

// Cards
className="... w-72 ..."
className="... p-6 ..."
className="... text-xl ..." // title
className="... text-lg ..." // message
```

### "Start camera further away"
```tsx
<PerspectiveCamera makeDefault position={[0, 0, 35]} />
//                                            ^^ increase this
```

### "Allow more zoom range"
```tsx
<OrbitControls
  minDistance={5}   // Can get closer
  maxDistance={50}  // Can go further
/>
```

---

## 📐 Current Settings Summary

| Setting | Current Value | Description |
|---------|---------------|-------------|
| **Camera Position** | `[0, 0, 25]` | Facing directly at mesh, 25 units away |
| **Min Zoom** | `10` units | Closest the user can zoom |
| **Max Zoom** | `40` units | Furthest the user can zoom |
| **Icon Distance Factor** | `6` | Size scaling with distance |
| **Icon Size** | `w-16 h-16` (64px) | Info circle dimensions |
| **Icon Text** | `text-2xl` (24px) | "i" letter size |
| **Card Width** | `w-96` (384px) | Tooltip card width |
| **Card Padding** | `p-8` (32px) | Inside spacing |
| **Badge Size** | `w-14 h-14` (56px) | Check/X/! icon circle |
| **Title Size** | `text-2xl` (24px) | Object class name |
| **Message Size** | `text-xl` (20px) | Feng shui insight text |

---

## 🔄 Changes Made

### ✅ Completed Adjustments:
1. **Camera position:** Changed from `[0, 5, 15]` to `[0, 0, 25]`
   - Now faces directly at mesh (no angle)
   - Starting distance increased for better view

2. **Zoom range:** Changed from `5-25` to `10-40`
   - More room to zoom out
   - Prevents getting too close

3. **Icon size:** Increased from `w-10 h-10` to `w-16 h-16`
   - 64px instead of 40px
   - Text increased to `text-2xl`

4. **Icon distance factor:** Changed from `10` to `6`
   - Makes icons appear larger in 3D space

5. **Card width:** Increased from `w-80` to `w-96`
   - 384px instead of 320px

6. **Card padding:** Increased from `p-6` to `p-8`
   - More breathing room

7. **Badge size:** Increased from `w-11 h-11` to `w-14 h-14`
   - Better visibility

8. **Typography:** Increased all text sizes by one level
   - Title: `text-xl` → `text-2xl`
   - Message: `text-lg` → `text-xl`

---

## 🧪 Testing Tips

1. **Camera position:** Adjust Z value in increments of 5 (`20`, `25`, `30`, `35`)
2. **Icon size:** Test `distanceFactor` values: `4` (large), `6` (medium), `8` (small)
3. **Zoom limits:** Ensure `minDistance` < camera Z position < `maxDistance`
4. **Card sizing:** Keep width proportional to viewport (`w-96` ≈ 25% of 1920px)

All settings are in one file: `ModelViewer3DWithTooltips.tsx` - no other files need editing!
