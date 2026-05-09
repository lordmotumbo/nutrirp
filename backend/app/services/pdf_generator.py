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


# ─────────────────────────────────────────────────────────────────────
# Helpers compartilhados
# ─────────────────────────────────────────────────────────────────────

def _header(story, s, title: str, professional_name: str, reg: str = ""):
    story.append(Paragraph("NUTRIRP", s["title"]))
    story.append(Paragraph(f"{professional_name}{(' | ' + reg) if reg else ''}", s["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=GREEN, spaceAfter=6))
    story.append(Paragraph(title, s["section"]))
    story.append(Spacer(1, 0.2*cm))


def _patient_block(story, s, patient):
    goal_map = {"emagrecimento": "Emagrecimento", "ganho_massa": "Ganho de Massa",
                "manutencao": "Manutenção", "saude": "Saúde Geral"}
    rows = [["Paciente", patient.name]]
    if patient.email:
        rows.append(["E-mail", patient.email])
    if patient.phone:
        rows.append(["Telefone", patient.phone])
    if patient.weight and patient.height:
        bmi = patient.weight / ((patient.height / 100) ** 2)
        rows.append(["Peso / Altura / IMC", f"{patient.weight} kg / {patient.height} cm / {bmi:.1f}"])
    if patient.goal:
        rows.append(["Objetivo", goal_map.get(patient.goal, patient.goal)])
    t = Table(rows, colWidths=[4*cm, 13*cm])
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), GREEN),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E0E0E0")),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.4*cm))


def _footer(story, s):
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E0E0E0")))
    story.append(Paragraph(
        f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')} — NUTRIRP",
        s["center"]
    ))


def _simple_table(rows, col_widths, header_row=True):
    """Cria tabela estilizada. rows[0] é o cabeçalho se header_row=True."""
    t = Table(rows, colWidths=col_widths)
    style = [
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E0E0E0")),
        ("ROWBACKGROUNDS", (0, 1 if header_row else 0), (-1, -1), [WHITE, LIGHT_GREEN]),
    ]
    if header_row:
        style += [
            ("BACKGROUND", (0, 0), (-1, 0), GREEN),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
    t.setStyle(TableStyle(style))
    return t


# ─────────────────────────────────────────────────────────────────────
# PDF — Anamnese
# ─────────────────────────────────────────────────────────────────────

def generate_anamnese_pdf(anamnese, patient, professional) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title=f"Anamnese - {patient.name}",
    )
    s = _styles()
    story = []

    reg = ""
    if getattr(professional, "crn", None):
        reg = f"CRN: {professional.crn}"
    elif getattr(professional, "cref", None):
        reg = f"CREF: {professional.cref}"
    elif getattr(professional, "crefito", None):
        reg = f"CREFITO: {professional.crefito}"

    _header(story, s, "Anamnese", professional.name, reg)
    _patient_block(story, s, patient)

    def row(label, value):
        return [label, str(value) if value else "—"]

    # Hábitos alimentares
    story.append(Paragraph("Hábitos Alimentares", s["section"]))
    rows = [
        row("Refeições por dia", anamnese.meals_per_day),
        row("Ingestão de água", anamnese.water_intake),
        row("Atividade física", anamnese.physical_activity),
        row("Frequência de atividade", anamnese.activity_frequency),
    ]
    story.append(_simple_table(rows, [5*cm, 12*cm], header_row=False))
    story.append(Spacer(1, 0.3*cm))

    # Histórico de saúde
    story.append(Paragraph("Histórico de Saúde", s["section"]))
    health_rows = [
        row("Patologias / Condições", anamnese.pathologies),
        row("Medicamentos em uso", anamnese.medications),
        row("Alergias", anamnese.allergies),
        row("Intolerâncias alimentares", anamnese.food_intolerances),
        row("Preferências alimentares", anamnese.food_preferences),
        row("Aversões alimentares", anamnese.food_aversions),
    ]
    story.append(_simple_table(health_rows, [5*cm, 12*cm], header_row=False))
    story.append(Spacer(1, 0.3*cm))

    # Hábitos de vida
    story.append(Paragraph("Hábitos de Vida", s["section"]))
    life_rows = [
        row("Horas de sono", f"{anamnese.sleep_hours}h" if anamnese.sleep_hours else None),
        row("Nível de estresse", anamnese.stress_level),
        row("Consumo de álcool", anamnese.alcohol),
        row("Tabagismo", anamnese.smoking),
    ]
    story.append(_simple_table(life_rows, [5*cm, 12*cm], header_row=False))

    # Observações
    if anamnese.notes:
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph("Observações", s["section"]))
        story.append(Paragraph(anamnese.notes, s["normal"]))

    # Respostas extras
    if anamnese.extra_answers:
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph("Informações Adicionais", s["section"]))
        if isinstance(anamnese.extra_answers, dict):
            extra_rows = [[k, str(v)] for k, v in anamnese.extra_answers.items()]
            story.append(_simple_table(extra_rows, [5*cm, 12*cm], header_row=False))

    _footer(story, s)
    doc.build(story)
    return buffer.getvalue()


# ─────────────────────────────────────────────────────────────────────
# PDF — Antropometria
# ─────────────────────────────────────────────────────────────────────

def generate_anthropometry_pdf(record, patient, professional) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title=f"Antropometria - {patient.name}",
    )
    s = _styles()
    story = []

    reg = ""
    if getattr(professional, "crn", None):
        reg = f"CRN: {professional.crn}"
    elif getattr(professional, "cref", None):
        reg = f"CREF: {professional.cref}"
    elif getattr(professional, "crefito", None):
        reg = f"CREFITO: {professional.crefito}"

    _header(story, s, "Avaliação Antropométrica", professional.name, reg)
    _patient_block(story, s, patient)

    def val(v, unit=""):
        return f"{v} {unit}".strip() if v is not None else "—"

    # Resultados calculados — destaque
    story.append(Paragraph("Resultados", s["section"]))
    results = [
        ["Indicador", "Valor", "Referência"],
        ["IMC", val(record.bmi, "kg/m²"),
         "< 18.5 Baixo | 18.5–24.9 Normal | 25–29.9 Sobrepeso | ≥ 30 Obesidade"],
        ["% Gordura Corporal", val(record.body_fat_pct, "%"),
         "H: 10–20% | M: 18–28% (adultos saudáveis)"],
        ["Massa Gorda", val(record.fat_mass, "kg"), "—"],
        ["Massa Magra", val(record.lean_mass, "kg"), "—"],
        ["Relação Cintura/Quadril", val(record.waist_hip_ratio),
         "H: < 0.90 | M: < 0.85"],
        ["TMB (Metabolismo Basal)", val(record.bmr, "kcal/dia"), "—"],
        ["GET (Gasto Energético Total)", val(record.tdee, "kcal/dia"), "—"],
    ]
    t = Table(results, colWidths=[5*cm, 3*cm, 9*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GREEN]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E0E0E0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.4*cm))

    # Medidas básicas
    story.append(Paragraph("Medidas Básicas", s["section"]))
    basic = [
        ["Peso", val(record.weight, "kg"), "Altura", val(record.height, "cm"), "Idade", val(record.age, "anos")],
    ]
    t2 = Table(basic, colWidths=[2.5*cm, 3*cm, 2.5*cm, 3*cm, 2.5*cm, 3*cm])
    t2.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTNAME", (4, 0), (4, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), GREEN),
        ("TEXTCOLOR", (2, 0), (2, -1), GREEN),
        ("TEXTCOLOR", (4, 0), (4, -1), GREEN),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E0E0E0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
    ]))
    story.append(t2)
    story.append(Spacer(1, 0.3*cm))

    # Dobras cutâneas
    folds = {
        "Tríceps": record.triceps, "Bíceps": record.biceps,
        "Subescapular": record.subscapular, "Suprailíaca": record.suprailiac,
        "Abdominal": record.abdominal, "Coxa": record.thigh,
        "Panturrilha": record.calf, "Peitoral": record.chest,
        "Axilar Médio": record.midaxillary,
    }
    filled_folds = [(k, v) for k, v in folds.items() if v is not None]
    if filled_folds:
        story.append(Paragraph("Dobras Cutâneas (mm)", s["section"]))
        fold_rows = [["Dobra", "Valor (mm)"] * (len(filled_folds) // 2 + 1)]
        # Organiza em 2 colunas
        pairs = []
        for i in range(0, len(filled_folds), 2):
            row_data = [filled_folds[i][0], val(filled_folds[i][1], "mm")]
            if i + 1 < len(filled_folds):
                row_data += [filled_folds[i+1][0], val(filled_folds[i+1][1], "mm")]
            else:
                row_data += ["", ""]
            pairs.append(row_data)
        tf = Table([["Dobra", "mm", "Dobra", "mm"]] + pairs, colWidths=[4*cm, 3*cm, 4*cm, 3*cm])
        tf.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), GREEN),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GREEN]),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E0E0E0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(tf)
        story.append(Spacer(1, 0.3*cm))

    # Circunferências
    circs = {
        "Cintura": record.waist, "Quadril": record.hip,
        "Pescoço": record.neck, "Braço": record.arm,
        "Antebraço": record.forearm, "Coxa": record.thigh_circ,
        "Panturrilha": record.calf_circ,
    }
    filled_circs = [(k, v) for k, v in circs.items() if v is not None]
    if filled_circs:
        story.append(Paragraph("Circunferências (cm)", s["section"]))
        pairs_c = []
        for i in range(0, len(filled_circs), 2):
            row_data = [filled_circs[i][0], val(filled_circs[i][1], "cm")]
            if i + 1 < len(filled_circs):
                row_data += [filled_circs[i+1][0], val(filled_circs[i+1][1], "cm")]
            else:
                row_data += ["", ""]
            pairs_c.append(row_data)
        tc = Table([["Medida", "cm", "Medida", "cm"]] + pairs_c, colWidths=[4*cm, 3*cm, 4*cm, 3*cm])
        tc.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), GREEN),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GREEN]),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E0E0E0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(tc)

    if record.notes:
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph("Observações", s["section"]))
        story.append(Paragraph(record.notes, s["normal"]))

    _footer(story, s)
    doc.build(story)
    return buffer.getvalue()


# ─────────────────────────────────────────────────────────────────────
# PDF — Suplementos
# ─────────────────────────────────────────────────────────────────────

def generate_supplements_pdf(supplements, patient, professional) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title=f"Suplementos - {patient.name}",
    )
    s = _styles()
    story = []

    reg = ""
    if getattr(professional, "crn", None):
        reg = f"CRN: {professional.crn}"
    elif getattr(professional, "cref", None):
        reg = f"CREF: {professional.cref}"
    elif getattr(professional, "crefito", None):
        reg = f"CREFITO: {professional.crefito}"

    _header(story, s, "Prescrição de Suplementos e Fitoterápicos", professional.name, reg)
    _patient_block(story, s, patient)

    if not supplements:
        story.append(Paragraph("Nenhum suplemento prescrito.", s["normal"]))
    else:
        for i, sup in enumerate(supplements):
            block = []
            block.append(Paragraph(f"{i+1}. {sup.name}", s["section"]))

            info_rows = []
            if sup.type:
                info_rows.append(["Tipo", sup.type.capitalize()])
            if sup.dosage:
                info_rows.append(["Dosagem", sup.dosage])
            if sup.frequency:
                info_rows.append(["Frequência", sup.frequency])
            if sup.timing:
                info_rows.append(["Horário / Momento", sup.timing])
            if sup.duration:
                info_rows.append(["Duração", sup.duration])
            if sup.brand:
                info_rows.append(["Marca sugerida", sup.brand])

            if info_rows:
                t = Table(info_rows, colWidths=[5*cm, 12*cm])
                t.setStyle(TableStyle([
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("TEXTCOLOR", (0, 0), (0, -1), GREEN),
                    ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, LIGHT_GREEN]),
                    ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E0E0E0")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]))
                block.append(t)

            if sup.justification:
                block.append(Spacer(1, 0.15*cm))
                block.append(Paragraph(f"<b>Justificativa:</b> {sup.justification}", s["normal"]))
            if sup.contraindications:
                block.append(Paragraph(
                    f"<b>Contraindicações:</b> {sup.contraindications}",
                    ParagraphStyle("warn", parent=s["normal"], textColor=colors.HexColor("#C62828"))
                ))

            block.append(Spacer(1, 0.3*cm))
            story.append(KeepTogether(block))

    _footer(story, s)
    doc.build(story)
    return buffer.getvalue()

