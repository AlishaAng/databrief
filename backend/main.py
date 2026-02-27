from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import os
from agent import explain_data

app = FastAPI()

# Allow the React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "DataBrief backend is running"}


@app.post("/report")
async def generate_report(
    file: UploadFile = File(...),
    mode: str = Form(default="summary")
):
    """
    Accepts a CSV file and report mode.
    Profiles the data locally and returns an AI-generated report.
    The file is deleted immediately after processing.
    """

    # Validate file type
    if not file.filename.endswith(".csv"):
        return JSONResponse(
            status_code=400,
            content={"error": "Only CSV files are supported right now."}
        )

    # Save to a temp file — deleted immediately after
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
            contents = await file.read()
            tmp.write(contents)
            temp_path = tmp.name

        try:
            profile, report = explain_data(temp_path, mode=mode)
        finally:
            # Always delete — even if something goes wrong
            os.remove(temp_path)

        return {
            "filename": file.filename,
            "mode": mode,
            "profile": profile,
            "report": report,
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )