from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime

# Paleta de cores
GREEN = colors.HexColor("#2E7D32")
LIGHT_GREEN = colors.HexColor("#E8F5E9")
DARK_GRAY = colors.HexColor("#212121")
MID_GRAY = colors.HexColor("#616161")
LIGHT_GRAY = colors.HexColor("#F5F5F5")
WHITE = colors.white


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("t", parent=base["Title"], textColor=GREEN, fontSize=22, spaceAfter=2, leading=26),
        "subtitle": ParagraphStyle("s", parent=base["Normal"], textColor=MID_GRAY, fontSize=9, spaceAfter=10),
        "section": ParagraphStyle("sec", parent=base["Heading2"], textColor=GREEN, fontSize=12, spaceBefore=12, spaceAfter=4),
        "normal": ParagraphStyle("n", parent=base["Normal"], textColor=DARK_GRAY, fontSize=9, leading=13),
        "small": ParagraphStyle("sm", parent=base["Normal"], textColor=MID_GRAY, fontSize=7, leading=10),
        "bold": ParagraphStyle("b", parent=base["Normal"], textColor=DARK_GRAY, fontSize=9, leading=13, fontName="Helvetica-Bold"),
        "center": ParagraphStyle("c", parent=base["Normal"], textColor=MID_GRAY, fontSize=8, alignment=TA_CENTER),
    }


def generate_diet_pdf(diet, patient, nutritionist) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title=f"Plano Alimentar - {patient.name}",
    )
    s = _styles()
    story = []

    # ── Cabeçalho ────────────────────────────────────────────────────
    story.append(Paragraph("NUTRIRP", s["title"]))
    crn = f" | CRN: {nutritionist.crn}" if nutritionist.crn else ""
    story.append(Paragraph(f"Nutricionista: <b>{nutritionist.name}</b>{crn}", s["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=GREEN, spaceAfter=6))

    # ── Dados do paciente ─────────────────────────────────────────────
    goal_map = {"emagrecimento": "Emagrecimento", "ganho_massa": "Ganho de Massa",
                "manutencao": "Manutenção", "saude": "Saúde Geral"}

    patient_data = [["Paciente", patient.name]]
    if patient.weight and patient.height:
        bmi = patient.weight / ((patient.height / 100) ** 2)
        patient_data.append(["Peso / Altura / IMC",
                              f"{patient.weight} kg / {patient.height} cm / {bmi:.1f}"])
    if patient.goal:
        patient_data.append(["Objetivo", goal_map.get(patient.goal, patient.goal)])
    if patient.phone:
        patient_data.append(["Telefone", patient.phone])

    pt = Table(patient_data, colWidths=[4*cm, 13*cm])
    pt.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), GREEN),
        ("TEXTCOLOR", (1, 0), (1, -1), DARK_GRAY),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E0E0E0")),
    ]))
    story.append(pt)
    story.append(Spacer(1, 0.4*cm))

    # ── Título da dieta ───────────────────────────────────────────────
    story.append(Paragraph(diet.title, s["section"]))
    if diet.description:
        story.append(Paragraph(diet.description, s["normal"]))

    # Totais
    if diet.total_calories:
        story.append(Spacer(1, 0.2*cm))
        totals_data = [["Total calórico estimado", f"{diet.total_calories:.0f} kcal/dia"]]
        tt = Table(totals_data, colWidths=[6*cm, 11*cm])
        tt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), GREEN),
            ("TEXTCOLOR", (0, 0), (0, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(tt)

    story.append(Spacer(1, 0.3*cm))

    # ── Refeições ─────────────────────────────────────────────────────
    for meal in (diet.meals or []):
        time_str = f" — {meal.time}" if meal.time else ""
        meal_block = []
        meal_block.append(Paragraph(f"🍽 {meal.name}{time_str}", s["section"]))

        if meal.foods:
            header = [["Alimento", "Qtd", "Unid.", "kcal", "Prot", "Carb", "Gord"]]
            rows = []
            for food in meal.foods:
                rows.append([
                    food.food_name or "",
                    str(food.quantity or ""),
                    food.unit or "",
                    f"{food.calories:.0f}" if food.calories else "—",
                    f"{food.protein:.1f}g" if food.protein else "—",
                    f"{food.carbs:.1f}g" if food.carbs else "—",
                    f"{food.fat:.1f}g" if food.fat else "—",
                ])
            table = Table(header + rows, colWidths=[5.5*cm, 1.5*cm, 2*cm, 1.5*cm, 1.5*cm, 1.5*cm, 1.5*cm])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), GREEN),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GREEN]),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E0E0E0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))
            meal_block.append(table)

        if meal.notes:
            meal_block.append(Paragraph(f"<i>Obs: {meal.notes}</i>", s["small"]))

        meal_block.append(Spacer(1, 0.2*cm))
        story.append(KeepTogether(meal_block))

    # ── Rodapé ────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E0E0E0")))
    story.append(Paragraph(
        f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')} — NUTRIRP | Sistema para Nutricionistas",
        s["center"]
    ))

    doc.build(story)
    return buffer.getvalue()
