"""Relatórios completos em PDF para o nutricionista."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.models.appointment import Appointment, Evolution
from app.models.anthropometry import Anthropometry
from app.models.exam import ExamResult, Supplement
from app.models.financial import PatientGoal
from app.services.auth import get_current_user
from app.services.pdf_generator import generate_diet_pdf
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from io import BytesIO
from datetime import datetime

router = APIRouter(prefix="/api/reports", tags=["Relatórios"])

GREEN = colors.HexColor("#2E7D32")
LIGHT_GREEN = colors.HexColor("#E8F5E9")


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("t", parent=base["Title"], textColor=GREEN, fontSize=18, spaceAfter=4),
        "section": ParagraphStyle("s", parent=base["Heading2"], textColor=GREEN, fontSize=12, spaceBefore=10, spaceAfter=4),
        "normal": ParagraphStyle("n", parent=base["Normal"], fontSize=9, leading=13),
        "small": ParagraphStyle("sm", parent=base["Normal"], fontSize=7, textColor=colors.HexColor("#666"), leading=10),
        "center": ParagraphStyle("c", parent=base["Normal"], fontSize=8, alignment=1, textColor=colors.HexColor("#666")),
    }


@router.get("/patient/{patient_id}/full")
def full_patient_report(
    patient_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.nutritionist_id == user.id).first()
    if not patient:
        raise HTTPException(404, "Paciente não encontrado")

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    s = _styles()
    story = []

    # Cabeçalho
    story.append(Paragraph("NUTRIRP — Relatório do Paciente", s["title"]))
    crn = f" | CRN: {user.crn}" if user.crn else ""
    story.append(Paragraph(f"Nutricionista: {user.name}{crn} | Gerado em {datetime.now().strftime('%d/%m/%Y %H:%M')}", s["small"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=GREEN, spaceAfter=8))

    # Dados pessoais
    story.append(Paragraph("Dados do Paciente", s["section"]))
    goal_map = {"emagrecimento": "Emagrecimento", "ganho_massa": "Ganho de Massa", "manutencao": "Manutenção", "saude": "Saúde Geral"}
    rows = [
        ["Nome", patient.name],
        ["Objetivo", goal_map.get(patient.goal or "", patient.goal or "—")],
        ["Peso", f"{patient.weight} kg" if patient.weight else "—"],
        ["Altura", f"{patient.height} cm" if patient.height else "—"],
        ["Telefone", patient.phone or "—"],
        ["E-mail", patient.email or "—"],
    ]
    if patient.weight and patient.height:
        bmi = patient.weight / ((patient.height / 100) ** 2)
        rows.append(["IMC", f"{bmi:.1f}"])
    t = Table(rows, colWidths=[4*cm, 13*cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), GREEN),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, LIGHT_GREEN]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E0E0E0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(t)

    # Evolução de peso
    evolutions = db.query(Evolution).filter(Evolution.patient_id == patient_id).order_by(Evolution.recorded_at).all()
    if evolutions:
        story.append(Paragraph("Evolução de Peso", s["section"]))
        evo_rows = [["Data", "Peso (kg)", "% Gordura", "Massa Magra (kg)", "Observações"]]
        for e in evolutions:
            evo_rows.append([
                e.recorded_at.strftime("%d/%m/%Y") if e.recorded_at else "—",
                str(e.weight or "—"),
                str(e.body_fat or "—"),
                str(e.muscle_mass or "—"),
                e.notes or "—",
            ])
        et = Table(evo_rows, colWidths=[3*cm, 3*cm, 3*cm, 3.5*cm, 4.5*cm])
        et.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), GREEN),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GREEN]),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E0E0E0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(et)

    # Exames
    exams = db.query(ExamResult).filter(ExamResult.patient_id == patient_id).order_by(ExamResult.recorded_at.desc()).limit(20).all()
    if exams:
        story.append(Paragraph("Exames Laboratoriais", s["section"]))
        exam_rows = [["Exame", "Valor", "Unidade", "Status", "Análise"]]
        status_colors = {"normal": colors.HexColor("#2E7D32"), "alto": colors.HexColor("#C62828"), "baixo": colors.HexColor("#E65100")}
        for ex in exams:
            exam_rows.append([ex.exam_name, ex.value or "—", ex.unit or "—", ex.status or "—", (ex.analysis or "—")[:50]])
        ext = Table(exam_rows, colWidths=[4*cm, 2*cm, 2*cm, 2*cm, 7*cm])
        ext.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), GREEN),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GREEN]),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E0E0E0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(ext)

    # Suplementos ativos
    supps = db.query(Supplement).filter(Supplement.patient_id == patient_id, Supplement.is_active == True).all()
    if supps:
        story.append(Paragraph("Suplementos e Fitoterápicos", s["section"]))
        supp_rows = [["Nome", "Tipo", "Dosagem", "Frequência", "Horário"]]
        for sp in supps:
            supp_rows.append([sp.name, sp.type or "—", sp.dosage or "—", sp.frequency or "—", sp.timing or "—"])
        st = Table(supp_rows, colWidths=[4*cm, 3*cm, 3*cm, 3*cm, 4*cm])
        st.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), GREEN),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GREEN]),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E0E0E0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(st)

    # Metas
    goals = db.query(PatientGoal).filter(PatientGoal.patient_id == patient_id).all()
    if goals:
        story.append(Paragraph("Metas", s["section"]))
        goal_rows = [["Meta", "Valor Alvo", "Atual", "Unidade", "Status"]]
        for g in goals:
            goal_rows.append([g.title, str(g.target_value or "—"), str(g.current_value or "—"), g.unit or "—", g.status])
        gt = Table(goal_rows, colWidths=[5*cm, 3*cm, 3*cm, 2*cm, 4*cm])
        gt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), GREEN),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GREEN]),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E0E0E0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(gt)

    # Rodapé
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E0E0E0")))
    story.append(Paragraph(f"NUTRIRP — {datetime.now().strftime('%d/%m/%Y %H:%M')}", s["center"]))

    doc.build(story)
    filename = f"relatorio_{patient.name.replace(' ', '_')}.pdf"
    return Response(content=buffer.getvalue(), media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


# ── Pré-consultas para o nutricionista ───────────────────────────────
@router.get("/preconsult/patient/{patient_id}")
def list_preconsult(patient_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.models.preconsult import PreConsultForm
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.nutritionist_id == user.id).first()
    if not patient:
        raise HTTPException(404)
    return db.query(PreConsultForm).filter(PreConsultForm.patient_id == patient_id).order_by(PreConsultForm.created_at.desc()).all()


@router.put("/preconsult/{form_id}/review")
def mark_reviewed(form_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.models.preconsult import PreConsultForm
    form = db.query(PreConsultForm).filter(PreConsultForm.id == form_id).first()
    if not form:
        raise HTTPException(404)
    form.is_reviewed = True
    db.commit()
    return form
