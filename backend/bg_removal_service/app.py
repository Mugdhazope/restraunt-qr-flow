"""Small HTTP service: POST /remove → PNG with background removed (rembg, Python 3.12 image)."""
from __future__ import annotations

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import Response
from rembg import remove

app = FastAPI(title="Menu BG removal")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/remove")
async def remove_bg(file: UploadFile = File(...)) -> Response:
    data = await file.read()
    out = remove(data)
    return Response(content=out, media_type="image/png")
