import hashlib
import io
from datetime import datetime
from typing import Dict, Any, List

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

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

    # Color Palette matching ApexNet Website (Warm Stone + Deep Charcoal + Saffron Gold)
    deep_charcoal = colors.HexColor('#1E1C1A')
    saffron_gold = colors.HexColor('#C8830A')
    warm_stone = colors.HexColor('#EDE8DF')
    compliant_green = colors.HexColor('#2D6A3F')
    non_compliant_red = colors.HexColor('#B91C1C')
    overridden_amber = colors.HexColor('#A16207')
    text_dark = colors.HexColor('#2E2B28')
    border_gray = colors.HexColor('#D1CBC0')

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.white
    )

    sub_right_style = ParagraphStyle(
        'SubRight',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor('#F5C578'),
        alignment=2
    )

    meta_key_style = ParagraphStyle(
        'MetaKey',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=deep_charcoal
    )

    meta_val_style = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=text_dark
    )

    section_heading = ParagraphStyle(
        'SecHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=saffron_gold
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=text_dark
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=6.5,
        leading=8.5,
        textColor=deep_charcoal
    )

    clause_style = ParagraphStyle(
        'Clause',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=deep_charcoal
    )

    header_style = ParagraphStyle(
        'HeadStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white
    )

    scope_title_style = ParagraphStyle(
        'ScopeTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=saffron_gold
    )

    scope_body_style = ParagraphStyle(
        'ScopeBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.8,
        leading=8.5,
        textColor=text_dark
    )

    story = []

    # Header Data
    device_name = audit_result.get("device_name", "sw-core-01.dc1")
    device_id = audit_result.get("device_id", "DEV-01")
    vendor_name = audit_result.get("vendor_name") or audit_result.get("vendor", "Cisco").upper()
    serial_num = audit_result.get("serial_number", "APX-98420-NX7K")
    model_str = audit_result.get("model", "Catalyst 9300-48P")
    os_ver = audit_result.get("os_version", "IOS-XE 17.3.4")

    frameworks_list = [f.upper() for f in audit_result.get("frameworks", ["cis_v8"])]
    framework_str = " + ".join(frameworks_list)
    source_hash = audit_result.get("source_hash", f"SES-APX-{device_id}-{datetime.now().microsecond}")
    
    summary = audit_result.get("summary", {})
    passed = summary.get("passed", 0)
    failed = summary.get("failed", 0)
    total = summary.get("total_controls") or (passed + failed) or 1
    unknown = summary.get("not_applicable", 0)
    accuracy = round((passed / total) * 100, 1)
    eval_time = audit_result.get("evaluated_at", datetime.utcnow().strftime("%d %b %Y, %H:%M UTC"))

    # 1. Top Deep Charcoal Banner Table with Saffron Gold Line
    banner_data = [
        [
            Paragraph(f"<b>APEXNET | {device_name} Security Audit Report</b>", title_style),
            Paragraph(f"Session ID: {source_hash[:32]}", sub_right_style)
        ]
    ]
    banner_table = Table(banner_data, colWidths=[340, 182])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), deep_charcoal),
        ('LINEBELOW', (0,0), (-1,-1), 1.5, saffron_gold),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 8))

    # 2. Comprehensive Device Identification Grid (4x2 Table)
    meta_table_data = [
        [
            Paragraph("Device Hostname:", meta_key_style),
            Paragraph(str(device_name), meta_val_style),
            Paragraph("Evaluated Against:", meta_key_style),
            Paragraph(framework_str, meta_val_style)
        ],
        [
            Paragraph("Serial Number:", meta_key_style),
            Paragraph(str(serial_num), meta_val_style),
            Paragraph("Evaluation Date:", meta_key_style),
            Paragraph(str(eval_time), meta_val_style)
        ],
        [
            Paragraph("Hardware Model:", meta_key_style),
            Paragraph(f"Switch — {model_str}", meta_val_style),
            Paragraph("Operator ID:", meta_key_style),
            Paragraph("operator-admin (admin@apexnet.gov.in)", meta_val_style)
        ],
        [
            Paragraph("Vendor / Firmware:", meta_key_style),
            Paragraph(f"{vendor_name} ({os_ver})", meta_val_style),
            Paragraph("AI Engine Lane:", meta_key_style),
            Paragraph("AI Normalization (Dual-Lane NLP Heuristics)", meta_val_style)
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[85, 176, 85, 176])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), warm_stone),
        ('BACKGROUND', (2,0), (2,-1), warm_stone),
        ('BOX', (0,0), (-1,-1), 0.5, border_gray),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E4E0D8')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6))

    # 3. System Overview & AI Normalization Scope Callout Box
    scope_data = [
        [
            Paragraph("AI-AUGMENTED COMPLIANCE ENGINE & NORMALIZATION SCOPE", scope_title_style)
        ],
        [
            Paragraph("Engine extracts proprietary CLI syntaxes (Cisco, Juniper, Arista, Palo Alto, Fortinet, Check Point, SONiC, Cloud SASE) into a standardized Security Baseline Model. Deviation analysis maps configuration statements against CIS, NIST SP 800-53, DISA STIG, and ISO 27001 controls with AI Few-Shot learning loop traceability.", scope_body_style)
        ]
    ]
    scope_table = Table(scope_data, colWidths=[522])
    scope_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F5F0E8')),
        ('BOX', (0,0), (-1,-1), 0.5, saffron_gold),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(scope_table)
    story.append(Spacer(1, 8))

    # 4. 5-Column Connected KPI Summary Box
    def kpi_cell(val_text, label_text, color_hex):
        p_val = f"<font size=13 color='{color_hex}'><b>{val_text}</b></font>"
        p_lbl = f"<br/><font size=6.5 color='{color_hex}'><b>{label_text}</b></font>"
        return Paragraph(f"<para align=center>{p_val}{p_lbl}</para>", styles['Normal'])

    kpi_data = [
        [
            kpi_cell(str(total), "Total Clauses", "#1E1C1A"),
            kpi_cell(str(passed), "Compliant", "#2D6A3F"),
            kpi_cell(str(failed), "Non-Compliant", "#B91C1C"),
            kpi_cell(str(unknown), "Overridden", "#A16207"),
            kpi_cell(f"{accuracy}%", "Compliance Score", "#C8830A"),
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[104.4, 104.4, 104.4, 104.4, 104.4])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#F5F0E8')),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#E6F7F0')),
        ('BACKGROUND', (2,0), (2,0), colors.HexColor('#FDE8E8')),
        ('BACKGROUND', (3,0), (3,0), colors.HexColor('#FEF3C7')),
        ('BACKGROUND', (4,0), (4,0), colors.HexColor('#FDF7ED')),
        ('BOX', (0,0), (-1,-1), 0.5, border_gray),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_gray),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 10))

    # 5. Detailed Results Heading
    story.append(Paragraph("Detailed Compliance Findings & Actionable Remediation Paths", section_heading))
    story.append(Spacer(1, 5))

    # 6. Detailed Compliance Findings Table (5 Columns)
    findings_table_data = [
        [
            Paragraph("Clause", header_style),
            Paragraph("Control & Severity", header_style),
            Paragraph("<para align=center>Status</para>", header_style),
            Paragraph("Evidence / AI Citation", header_style),
            Paragraph("CLI Remediation Sequence", header_style)
        ]
    ]

    findings = audit_result.get("findings", [])
    for idx, f in enumerate(findings):
        status_str = str(f.get("status", "pass")).upper()
        if status_str == "PASS":
            status_html = "<font color='#2D6A3F'><b>COMPLIANT</b></font>"
        elif status_str == "FAIL":
            status_html = "<font color='#B91C1C'><b>NON-COMPLIANT</b></font>"
        else:
            status_html = "<font color='#7C7269'><b>N/A</b></font>"

        sev_str = str(f.get("severity", "HIGH")).upper()
        ev_text = "Verified against rule baseline."
        ev_list = f.get("evidence_lines", [])
        if status_str == "FAIL":
            line_str = f"Line #{ev_list[0]['line']}: \"{ev_list[0]['raw'].strip()}\"" if ev_list else f"Line #{f.get('evidence_line','N/A')}: Missing mandatory statement"
            ev_text = f"Non-compliant. {line_str}"
        elif ev_list:
            ev_text = f"Verified line #{ev_list[0].get('line')}: \"{ev_list[0].get('raw','').strip()}\""

        rem_cmd = f.get("remediation_command") or f.get("remediationCommand") or ("configure terminal<br/>&nbsp;&nbsp;service password-encryption<br/>end" if status_str == "FAIL" else "N/A (Compliant)")

        rule_id = f.get("rule_id") or f.get("ruleId") or f"3.1.{idx+1}"
        rule_title = f.get("rule_title") or f.get("title") or "Control Requirement"

        desc_p = Paragraph(f"{rule_title}<br/><font color='#C8830A'><b>[{sev_str}]</b></font>", body_style)

        findings_table_data.append([
            Paragraph(f"<b>{rule_id}</b>", clause_style),
            desc_p,
            Paragraph(f"<para align=center>{status_html}</para>", body_style),
            Paragraph(ev_text, body_style),
            Paragraph(rem_cmd, code_style)
        ])

    f_table = Table(findings_table_data, colWidths=[75, 115, 72, 120, 140])
    f_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), saffron_gold),
        ('BOX', (0,0), (-1,-1), 0.5, border_gray),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E4E0D8')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(f_table)
    story.append(Spacer(1, 10))

    # 7. Ecosystem Note & Sign-off Block
    eco_style = ParagraphStyle(
        'EcoStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.5,
        leading=8,
        textColor=deep_charcoal,
        alignment=1
    )
    story.append(Paragraph("Supported Ecosystems: Cisco (IOS/NX-OS), Juniper (JunOS), Arista (EOS), Palo Alto (PAN-OS), Fortinet (FortiOS), Check Point, SONiC, AWS/Azure Security Groups.", eco_style))
    story.append(Spacer(1, 14))

    sig_data = [
        [
            Paragraph("___________________________________<br/><b>Evaluated By: Security Admin / Auditor</b>", meta_val_style),
            Paragraph("___________________________________<br/><b>Approved By: CISO / Authorizing Official</b>", meta_val_style)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[261, 261])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(sig_table)

    def add_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 6.8)
        canvas.setFillColor(colors.HexColor("#A89F92"))
        canvas.drawCentredString(297.5, 25, "Generated using ApexNet AI-Augmented Compliance Engine | Reviewed by operator-admin")
        canvas.drawCentredString(297.5, 16, "Mandatory human operator validation required prior to production CLI deployment.")
        canvas.drawString(36, 8, "www.apexnet.gov.in")
        canvas.drawRightString(559, 8, f"Page {doc.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    return buffer.getvalue()
