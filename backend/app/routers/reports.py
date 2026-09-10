from fastapi import APIRouter, HTTPException, Response
from app.store import store
from app.services.reporting import generate_pdf_report

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/pdf/{audit_id}")
async def download_audit_pdf(audit_id: str):
    audit_data = store.get_audit_by_id(audit_id)
    if not audit_data:
        raise HTTPException(status_code=404, detail="Audit report not found")

    pdf_bytes = generate_pdf_report(audit_data)
    clean_name = audit_data.get("device_name", "Device").replace(" ", "_")
    filename = f"ApexNet_Audit_{clean_name}_{audit_id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
            "Cache-Control": "no-cache, no-store, must-revalidate"
        }
    )
