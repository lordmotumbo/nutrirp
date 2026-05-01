from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from datetime import datetime


GREEN = colors.HexColor("#2E7D32")
LIGHT_GREEN = colors.HexColor("#E8F5E9")
DARK_GRAY = colors.HexColor("#333333")
MID_GRAY = colors.HexColor("#666666")


def generate_diet_pdf(diet, patient, nutritionist) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", parent=styles["Title"], textColor=GREEN, fontSize=20, spaceAfter=4)
    subtitle_style = ParagraphStyle("subtitle", parent=styles["Normal"], textColor=MID_GRAY, fontSize=10, spaceAfter=12)
    meal_title_style = ParagraphStyle("meal_title", parent=styles["Heading2"], textColor=GREEN, fontSize=13, spaceBefore=14, spaceAfter=6)
    normal_style = ParagraphStyle("normal", parent=styles["Normal"], textColor=DARK_GRAY, fontSize=10)
    small_style = ParagraphStyle("small", parent=styles["Normal"], textColor=MID_GRAY, fontSize=8)

    story = []

    # Cabeçalho
    story.append(Paragraph("NUTRIRP", title_style))
    story.append(Paragraph(f"Nutricionista: {nutritionist.name} | CRN: {nutritionist.crn or '-'}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=GREEN))
    story.append(Spacer(1, 0.3 * cm))

    # Dados do paciente
    story.append(Paragraph(f"<b>Paciente:</b> {patient.name}", normal_style))
    if patient.weight and patient.height:
        bmi = patient.weight / ((patient.height / 100) ** 2)
        story.append(Paragraph(
            f"<b>Peso:</b> {patient.weight} kg &nbsp;&nbsp; <b>Altura:</b> {patient.height} cm &nbsp;&nbsp; <b>IMC:</b> {bmi:.1f}",
            normal_style
        ))
    if patient.goal:
        goal_map = {
            "emagrecimento": "Emagrecimento",
            "ganho_massa": "Ganho de Massa",
            "manutencao": "Manutenção",
            "saude": "Saúde Geral",
        }
        story.append(Paragraph(f"<b>Objetivo:</b> {goal_map.get(patient.goal, patient.goal)}", normal_style))

    story.append(Spacer(1, 0.3 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
    story.append(Spacer(1, 0.3 * cm))

    # Título da dieta
    story.append(Paragraph(f"<b>{diet.title}</b>", meal_title_style))
    if diet.description:
        story.append(Paragraph(diet.description, normal_style))
    if diet.total_calories:
        story.append(Paragraph(f"<b>Total calórico estimado:</b> {diet.total_calories:.0f} kcal/dia", normal_style))
    story.append(Spacer(1, 0.4 * cm))

    # Refeições
    for meal in diet.meals:
        time_str = f" — {meal.time}" if meal.time else ""
        story.append(Paragraph(f"🍽 {meal.name}{time_str}", meal_title_style))

        if meal.foods:
            table_data = [["Alimento", "Qtd", "Unidade", "Kcal", "Prot", "Carb", "Gord"]]
            for food in meal.foods:
                table_data.append([
                    food.food_name,
                    str(food.quantity or ""),
                    food.unit or "",
                    f"{food.calories:.0f}" if food.calories else "",
                    f"{food.protein:.1f}g" if food.protein else "",
                    f"{food.carbs:.1f}g" if food.carbs else "",
                    f"{food.fat:.1f}g" if food.fat else "",
                ])

            table = Table(table_data, colWidths=[6 * cm, 1.5 * cm, 2 * cm, 1.5 * cm, 1.5 * cm, 1.5 * cm, 1.5 * cm])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), GREEN),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("FONTSIZE", (0, 1), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GREEN]),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(table)

        if meal.notes:
            story.append(Paragraph(f"<i>Obs: {meal.notes}</i>", small_style))
        story.append(Spacer(1, 0.2 * cm))

    # Rodapé
    story.append(Spacer(1, 0.5 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
    story.append(Paragraph(
        f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')} — NUTRIRP",
        small_style
    ))

    doc.build(story)
    return buffer.getvalue()
