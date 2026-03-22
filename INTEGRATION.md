# 🔌 Nuxt 3 to Django Integration Checklist

This guide ensures your frontend Nuxt 3 application connects smoothly with the Django REST API during local development.

---

## 1. Starting Both Servers
To test the application end-to-end, both development servers must be running simultaneously on their standard ports.

**Django Backend (Port :8000)**
```bash
cd clothing_detector
python manage.py runserver
```

**Nuxt 3 Frontend (Port :3000)**
```bash
cd clothing-detector-fe
npm run dev
```

---

## 2. Environment Variable Verification
The Nuxt front-end needs to know exactly where the Django API is hosted.

**1. Create your `.env`**
In the root directory of your `clothing-detector-fe` project, ensure `.env` contains:
```env
NUXT_PUBLIC_API_BASE=http://localhost:8000
```

**2. Verify variable loading**
To confirm Nuxt is reading the variable correctly during runtime, you can add this line to any page or component's `script setup` block:
```javascript
console.log('API Base:', useRuntimeConfig().public.apiBase)
```

---

## 3. CORS Confirmation
Because the frontend (port `3000`) and backend (port `8000`) run on entirely different origins, Django must explicitly allow Nuxt to communicate with it via **Cross-Origin Resource Sharing (CORS)**.

**What to check in Django's `settings.py`:**
Ensure `django-cors-headers` is installed, registered in `INSTALLED_APPS` and strictly added in the `MIDDLEWARE` block. Then configure:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

**How to verify in the browser Network tab:**
1. Open Developer Tools (F12) and switch to the **Network** tab.
2. Trigger an upload to fire the `POST /api/detect/` request.
3. Click the failing request. Look at the **Response Headers** payload specifically for:
   `Access-Control-Allow-Origin: http://localhost:3000`

> ⚠️ **Exact browser error for misconfigured CORS:**
> `Access to fetch at 'http://localhost:8000/api/detect/' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
> **Fix:** Double-check your Django `CORS_ALLOWED_ORIGINS` values and restart the `runserver` instance.

---

## 4. End-to-End Test Flow
Follow these exact steps to run a full integration cycle:

- **Step 1:** Upload a small JPG (`< 1MB`) with a person wearing distinctly visible clothing.
- **Step 2:** Click the **Detect Clothing** button.
- **Step 3:** **Expected Front-End Behavior:** A loading spinner overlay appears smoothly, followed by the annotated `<canvas>` image layout and the `<DetectionTable>` rendering.
- **Step 4:** Open your Django terminal window. Ascertain and confirm explicit `HTTP 200 OK` POST log lines for each active pipeline step.
- **Step 5:** Open your Supabase backend dashboard. Check your database to confirm a new row materialized correctly in the `detection_results` table and confirm the generated file landed correctly into the `clothing-detections` bucket.

---

## 5. Common Integration Errors & Fixes

If the flow breaks, these are the most frequent culprits mapping to their exact fixes:

- ❌ **`ERR_CONNECTION_REFUSED`**
  - *Symptom:* Immediate browser network failure.
  - *Fix:* Your Django server is not currently running or crashed silently. Restart it via `python manage.py runserver`.

- ❌ **`413 Request Entity Too Large`**
  - *Symptom:* Django blocks the incoming image directly.
  - *Fix:* Add `DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760` (10MB) and `FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760` inside your backend `settings.py`.

- ❌ **Image loads perfectly, but Canvas Bounding Boxes are wildly misaligned!**
  - *Symptom:* Box outlines seem to float awkwardly above or beside the actual subjects. 
  - *Fix:* This is a *coordinate scaling bug*. Ensure that your `<canvas>` scaling multiplier logic calculates against the image's physical DOM `getBoundingClientRect()` values rather than mapping directly against raw `img.naturalWidth` scaling.

- ❌ **"Network Error" in frontend, but Backend log terminal explicitly shows `HTTP 200 OK` return.**
  - *Symptom:* The database updates, but Nuxt fails to parse the response.
  - *Fix:* This is an opaque CORS issue. Django processed the POST safely along the backend route, but the browser's security layer intercepted and scrubbed the returning response from Nuxt because the CORS headers weren't properly appended.
