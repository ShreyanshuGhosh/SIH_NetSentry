import hashlib
import io
from datetime import datetime
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable

def generate_pdf_report(audit_result: Dict[str, Any]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#0F172A')
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748B')
    )

    section_heading = ParagraphStyle(
        'SecHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0F172A')
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#334155')
    )

    code_style = ParagraphStyle(
        'Code',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#0F766E')
    )

    story = []

    # Header
    device_name = audit_result.get("device_name", "Network Device")
    platform = audit_result.get("platform", "Router / Switch")
    vendor = audit_result.get("vendor", "Multi-Vendor").replace("_", " ").upper()
    source_hash = audit_result.get("source_hash", "UNKNOWN_HASH")
    summary = audit_result.get("summary", {})
    score = summary.get("compliance_score", 0)
    passed = summary.get("passed", 0)
    failed = summary.get("failed", 0)
    dedup_total = summary.get("deduplicated_controls", 0)
    eval_time = audit_result.get("evaluated_at", datetime.now().isoformat())

    # Generate document cryptographic verification hash
    doc_crypto_data = f"{source_hash}:{score}:{eval_time}:{audit_result.get('audit_id')}"
    doc_checksum = hashlib.sha256(doc_crypto_data.encode("utf-8")).hexdigest()

    story.append(Paragraph("NETSENTRY - NETWORK SECURITY COMPLIANCE AUDIT REPORT", title_style))
    story.append(Paragraph("SIH 2026 | Problem Statement: SIH26155 | NTRO, Government of India", subtitle_style))
    story.append(Paragraph(f"Document SHA-256 Checksum: <font name='Courier'>{doc_checksum}</font>", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=12))

    # Executive Scorecard Banner
    score_color = colors.HexColor('#16A34A') if score >= 80 else (colors.HexColor('#D97706') if score >= 60 else colors.HexColor('#DC2626'))
    
    score_table_data = [
        [
            Paragraph(f"<font size=24 color='{score_color.hexval()}'><b>{score}%</b></font><br/><font size=8 color='#64748B'>COMPLIANCE SCORE</font>", styles['Normal']),
            Paragraph(f"<b>Device:</b> {device_name}<br/><b>Platform:</b> {platform}<br/><b>Vendor:</b> {vendor}", body_style),
            Paragraph(f"<b>Audit Timestamp:</b> {eval_time}<br/><b>Evaluated Controls:</b> {dedup_total} (Deduplicated)<br/><b>Verdicts:</b> <font color='#16A34A'><b>{passed} PASS</b></font> / <font color='#DC2626'><b>{failed} FAIL</b></font>", body_style)
        ]
    ]
    score_table = Table(score_table_data, colWidths=[120, 200, 200])
    score_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 14))

    # Section: Detailed Findings Table
    story.append(Paragraph("1. Detailed Rule Compliance Findings & Line-Level Evidence", section_heading))
    story.append(Spacer(1, 6))

    findings_table_data = [
        [
            Paragraph("<b>Control ID</b>", body_style),
            Paragraph("<b>Security Requirement</b>", body_style),
            Paragraph("<b>Severity</b>", body_style),
            Paragraph("<b>Verdict</b>", body_style),
            Paragraph("<b>Line Evidence</b>", body_style)
        ]
    ]

    findings = audit_result.get("findings", [])
    for f in findings:
        status_str = f.get("status", "pass").upper()
        status_color = "#16A34A" if status_str == "PASS" else "#DC2626"
        sev = f.get("severity", "medium").upper()
        
        ev_text = "Omitted in config (Negative check)"
        ev_list = f.get("evidence_lines", [])
        if ev_list and len(ev_list) > 0:
            first = ev_list[0]
            raw_snippet = str(first.get("raw", "")).strip()[:35]
            ev_text = f"L#{first.get('line')}: {raw_snippet}"

        findings_table_data.append([
            Paragraph(f"<b>{f.get('rule_id')}</b>", body_style),
            Paragraph(f.get("rule_title", "Control"), body_style),
            Paragraph(sev, body_style),
            Paragraph(f"<font color='{status_color}'><b>{status_str}</b></font>", body_style),
            Paragraph(ev_text, code_style)
        ])

    f_table = Table(findings_table_data, colWidths=[65, 175, 45, 45, 190])
    f_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(f_table)
    story.append(Spacer(1, 14))

    # Section: Vendor Remediation CLI Sequences
    story.append(Paragraph("2. Actionable Vendor CLI Remediation Sequences", section_heading))
    story.append(Spacer(1, 6))

    fail_findings = [f for f in findings if f.get("status", "").lower() == "fail"]
    if not fail_findings:
        story.append(Paragraph("Zero non-compliant controls detected. System satisfies mandatory baseline requirements.", body_style))
    else:
        remed_table_data = [
            [
                Paragraph("<b>Control ID</b>", body_style),
                Paragraph("<b>Requirement</b>", body_style),
                Paragraph("<b>Vendor CLI Fix Command Sequence</b>", body_style)
            ]
        ]
        for f in fail_findings:
            cmd = f.get("remediation_command", "Consult vendor guide").replace("\n", "<br/>")
            remed_table_data.append([
                Paragraph(f"<b>{f.get('rule_id')}</b>", body_style),
                Paragraph(f.get("rule_title", ""), body_style),
                Paragraph(f"<font name='Courier' color='#047857'>{cmd}</font>", body_style)
            ])

        r_table = Table(remed_table_data, colWidths=[70, 150, 300])
        r_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('BACKGROUND', (2,1), (2,-1), colors.HexColor('#F8FAFC')),
        ]))
        story.append(r_table)

    doc.build(story)
    return buffer.getvalue()
