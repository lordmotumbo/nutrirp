"""
Seed de exercícios pré-carregados para a biblioteca global do NutriRP.

Fonte das imagens/GIFs: yuhonas/free-exercise-db (domínio público)
URL base: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/

Cada exercício tem:
- name: nome em português
- name_en: nome original (para busca de imagem)
- muscle_group: grupo muscular principal
- difficulty: iniciante | intermediario | avancado
- equipment: equipamento necessário
- category: strength | cardio | flexibility | rehabilitation
- description: instruções de execução em português
- gif_id: ID do exercício no repositório free-exercise-db (para montar a URL do GIF)
"""

BASE_GIF_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"

EXERCISES = [
    # ── PEITO ─────────────────────────────────────────────────────────
    {
        "name": "Supino Reto com Barra",
        "muscle_group": "peito",
        "difficulty": "intermediario",
        "equipment": "barra",
        "category": "strength",
        "description": "Deite no banco, segure a barra com pegada um pouco mais larga que os ombros. Desça a barra até o peito controlando o movimento, depois empurre de volta à posição inicial. Mantenha os pés no chão e as costas levemente arqueadas.",
        "gif_id": "Barbell_Bench_Press_-_Medium_Grip",
    },
    {
        "name": "Supino Inclinado com Halteres",
        "muscle_group": "peito",
        "difficulty": "intermediario",
        "equipment": "halteres",
        "category": "strength",
        "description": "Deite em banco inclinado a 30-45°. Segure os halteres na altura do peito com cotovelos dobrados. Empurre os halteres para cima até os braços ficarem quase estendidos, depois desça controladamente.",
        "gif_id": "Dumbbell_Incline_Bench_Press",
    },
    {
        "name": "Flexão de Braço",
        "muscle_group": "peito",
        "difficulty": "iniciante",
        "equipment": "peso_corporal",
        "category": "strength",
        "description": "Posição de prancha com mãos na largura dos ombros. Dobre os cotovelos abaixando o corpo até o peito quase tocar o chão. Empurre de volta à posição inicial mantendo o corpo reto.",
        "gif_id": "Push-Up",
    },
    {
        "name": "Crucifixo com Halteres",
        "muscle_group": "peito",
        "difficulty": "iniciante",
        "equipment": "halteres",
        "category": "strength",
        "description": "Deite no banco com halteres acima do peito, cotovelos levemente dobrados. Abra os braços em arco até sentir o alongamento no peito, depois feche de volta à posição inicial.",
        "gif_id": "Dumbbell_Flyes",
    },
    {
        "name": "Supino Declinado com Barra",
        "muscle_group": "peito",
        "difficulty": "intermediario",
        "equipment": "barra",
        "category": "strength",
        "description": "Deite em banco declinado. Segure a barra com pegada média. Desça a barra até a parte inferior do peito e empurre de volta. Foca na porção inferior do peitoral.",
        "gif_id": "Barbell_Decline_Bench_Press",
    },

    # ── COSTAS ────────────────────────────────────────────────────────
    {
        "name": "Puxada Frontal na Polia",
        "muscle_group": "costas",
        "difficulty": "iniciante",
        "equipment": "máquina",
        "category": "strength",
        "description": "Sente-se na máquina de puxada, segure a barra com pegada pronada mais larga que os ombros. Puxe a barra até a altura do queixo, contraindo as costas. Retorne controladamente.",
        "gif_id": "Wide-Grip_Lat_Pulldown",
    },
    {
        "name": "Remada Curvada com Barra",
        "muscle_group": "costas",
        "difficulty": "intermediario",
        "equipment": "barra",
        "category": "strength",
        "description": "Incline o tronco a 45°, segure a barra com pegada pronada. Puxe a barra em direção ao abdômen, contraindo as escápulas. Desça controladamente.",
        "gif_id": "Barbell_Bent_Over_Row",
    },
    {
        "name": "Remada com Haltere",
        "muscle_group": "costas",
        "difficulty": "iniciante",
        "equipment": "halteres",
        "category": "strength",
        "description": "Apoie um joelho e mão no banco. Com o outro braço, puxe o haltere em direção ao quadril, mantendo o cotovelo próximo ao corpo. Desça controladamente.",
        "gif_id": "Dumbbell_One-Arm_Row",
    },
    {
        "name": "Barra Fixa (Pull-up)",
        "muscle_group": "costas",
        "difficulty": "avancado",
        "equipment": "barra",
        "category": "strength",
        "description": "Segure a barra com pegada pronada, mãos mais largas que os ombros. Puxe o corpo para cima até o queixo ultrapassar a barra. Desça controladamente.",
        "gif_id": "Wide-Grip_Pull-Up",
    },
    {
        "name": "Remada Sentado na Polia",
        "muscle_group": "costas",
        "difficulty": "iniciante",
        "equipment": "máquina",
        "category": "strength",
        "description": "Sente-se na máquina de remada, segure o cabo com as duas mãos. Puxe em direção ao abdômen mantendo as costas retas e contraindo as escápulas. Retorne controladamente.",
        "gif_id": "Seated_Cable_Rows",
    },

    # ── PERNAS ────────────────────────────────────────────────────────
    {
        "name": "Agachamento Livre",
        "muscle_group": "pernas",
        "difficulty": "intermediario",
        "equipment": "barra",
        "category": "strength",
        "description": "Posicione a barra nos trapézios, pés na largura dos ombros. Desça flexionando joelhos e quadril até as coxas ficarem paralelas ao chão. Suba empurrando o chão com os pés.",
        "gif_id": "Barbell_Full_Squat",
    },
    {
        "name": "Leg Press 45°",
        "muscle_group": "pernas",
        "difficulty": "iniciante",
        "equipment": "máquina",
        "category": "strength",
        "description": "Sente-se na máquina com os pés na plataforma na largura dos ombros. Dobre os joelhos até 90° e empurre de volta sem travar os joelhos no final.",
        "gif_id": "Leg_Press",
    },
    {
        "name": "Extensão de Pernas",
        "muscle_group": "pernas",
        "difficulty": "iniciante",
        "equipment": "máquina",
        "category": "strength",
        "description": "Sente-se na máquina com os tornozelos sob o apoio. Estenda as pernas até ficarem retas, contraindo o quadríceps. Desça controladamente.",
        "gif_id": "Leg_Extensions",
    },
    {
        "name": "Flexão de Pernas (Leg Curl)",
        "muscle_group": "pernas",
        "difficulty": "iniciante",
        "equipment": "máquina",
        "category": "strength",
        "description": "Deite de bruços na máquina com os tornozelos sob o apoio. Flexione os joelhos trazendo os calcanhares em direção aos glúteos. Retorne controladamente.",
        "gif_id": "Lying_Leg_Curls",
    },
    {
        "name": "Avanço (Lunge) com Halteres",
        "muscle_group": "pernas",
        "difficulty": "iniciante",
        "equipment": "halteres",
        "category": "strength",
        "description": "Em pé com halteres nas mãos, dê um passo à frente e desça o joelho traseiro em direção ao chão. Volte à posição inicial e alterne as pernas.",
        "gif_id": "Dumbbell_Lunges",
    },
    {
        "name": "Stiff com Barra",
        "muscle_group": "pernas",
        "difficulty": "intermediario",
        "equipment": "barra",
        "category": "strength",
        "description": "Em pé com a barra na frente das coxas, incline o tronco para frente mantendo as costas retas e joelhos levemente dobrados. Sinta o alongamento nos isquiotibiais e retorne.",
        "gif_id": "Stiff-Legged_Barbell_Deadlift",
    },
    {
        "name": "Panturrilha em Pé",
        "muscle_group": "panturrilha",
        "difficulty": "iniciante",
        "equipment": "máquina",
        "category": "strength",
        "description": "Em pé na máquina com os ombros sob os apoios, eleve os calcanhares o máximo possível contraindo as panturrilhas. Desça controladamente abaixo do nível da plataforma.",
        "gif_id": "Standing_Calf_Raises",
    },

    # ── OMBROS ────────────────────────────────────────────────────────
    {
        "name": "Desenvolvimento com Halteres",
        "muscle_group": "ombros",
        "difficulty": "iniciante",
        "equipment": "halteres",
        "category": "strength",
        "description": "Sente-se com halteres na altura dos ombros, cotovelos dobrados a 90°. Empurre os halteres para cima até os braços ficarem quase estendidos. Desça controladamente.",
        "gif_id": "Dumbbell_Shoulder_Press",
    },
    {
        "name": "Elevação Lateral com Halteres",
        "muscle_group": "ombros",
        "difficulty": "iniciante",
        "equipment": "halteres",
        "category": "strength",
        "description": "Em pé com halteres ao lado do corpo, eleve os braços lateralmente até a altura dos ombros com cotovelos levemente dobrados. Desça controladamente.",
        "gif_id": "Side_Lateral_Raise",
    },
    {
        "name": "Elevação Frontal com Halteres",
        "muscle_group": "ombros",
        "difficulty": "iniciante",
        "equipment": "halteres",
        "category": "strength",
        "description": "Em pé com halteres à frente das coxas, eleve um braço de cada vez até a altura dos ombros. Desça controladamente e alterne.",
        "gif_id": "Dumbbell_Front_Raise",
    },
    {
        "name": "Desenvolvimento Militar com Barra",
        "muscle_group": "ombros",
        "difficulty": "intermediario",
        "equipment": "barra",
        "category": "strength",
        "description": "Em pé ou sentado, segure a barra na frente do pescoço na altura dos ombros. Empurre a barra para cima até os braços ficarem estendidos. Desça controladamente.",
        "gif_id": "Barbell_Shoulder_Press",
    },
    {
        "name": "Encolhimento de Ombros com Halteres",
        "muscle_group": "ombros",
        "difficulty": "iniciante",
        "equipment": "halteres",
        "category": "strength",
        "description": "Em pé com halteres ao lado do corpo, eleve os ombros em direção às orelhas o máximo possível. Segure por 1 segundo e desça controladamente.",
        "gif_id": "Dumbbell_Shrug",
    },

    # ── BRAÇOS ────────────────────────────────────────────────────────
    {
        "name": "Rosca Direta com Barra",
        "muscle_group": "bracos",
        "difficulty": "iniciante",
        "equipment": "barra",
        "category": "strength",
        "description": "Em pé com a barra em pegada supinada, flexione os cotovelos trazendo a barra até a altura dos ombros. Desça controladamente sem balançar o tronco.",
        "gif_id": "Barbell_Curl",
    },
    {
        "name": "Rosca Alternada com Halteres",
        "muscle_group": "bracos",
        "difficulty": "iniciante",
        "equipment": "halteres",
        "category": "strength",
        "description": "Em pé com halteres ao lado do corpo, flexione um cotovelo de cada vez trazendo o haltere até o ombro. Alterne os braços mantendo o tronco estável.",
        "gif_id": "Dumbbell_Alternate_Bicep_Curl",
    },
    {
        "name": "Tríceps Testa com Barra",
        "muscle_group": "bracos",
        "difficulty": "intermediario",
        "equipment": "barra",
        "category": "strength",
        "description": "Deite no banco com a barra acima do peito, pegada fechada. Dobre os cotovelos abaixando a barra em direção à testa. Estenda de volta à posição inicial.",
        "gif_id": "Barbell_Lying_Triceps_Extension",
    },
    {
        "name": "Tríceps Pulley",
        "muscle_group": "bracos",
        "difficulty": "iniciante",
        "equipment": "máquina",
        "category": "strength",
        "description": "Em pé na polia alta, segure a corda ou barra com pegada pronada. Estenda os cotovelos empurrando para baixo até os braços ficarem retos. Retorne controladamente.",
        "gif_id": "Triceps_Pushdown",
    },
    {
        "name": "Rosca Martelo com Halteres",
        "muscle_group": "bracos",
        "difficulty": "iniciante",
        "equipment": "halteres",
        "category": "strength",
        "description": "Em pé com halteres em pegada neutra (polegar para cima), flexione os cotovelos alternadamente. Mantém o cotovelo fixo ao lado do corpo.",
        "gif_id": "Hammer_Curls",
    },
    {
        "name": "Mergulho no Banco (Tríceps)",
        "muscle_group": "bracos",
        "difficulty": "iniciante",
        "equipment": "peso_corporal",
        "category": "strength",
        "description": "Apoie as mãos no banco atrás de você com os pés à frente. Dobre os cotovelos descendo o corpo e empurre de volta à posição inicial.",
        "gif_id": "Bench_Dips",
    },

    # ── CORE ──────────────────────────────────────────────────────────
    {
        "name": "Abdominal Crunch",
        "muscle_group": "core",
        "difficulty": "iniciante",
        "equipment": "peso_corporal",
        "category": "strength",
        "description": "Deite de costas com joelhos dobrados. Coloque as mãos atrás da cabeça. Contraia o abdômen elevando os ombros do chão. Desça controladamente.",
        "gif_id": "Crunch",
    },
    {
        "name": "Prancha (Plank)",
        "muscle_group": "core",
        "difficulty": "iniciante",
        "equipment": "peso_corporal",
        "category": "strength",
        "description": "Apoie os antebraços e pontas dos pés no chão, mantendo o corpo reto como uma prancha. Contraia o abdômen e glúteos. Mantenha a posição pelo tempo determinado.",
        "gif_id": "Plank",
    },
    {
        "name": "Abdominal com Rotação",
        "muscle_group": "core",
        "difficulty": "iniciante",
        "equipment": "peso_corporal",
        "category": "strength",
        "description": "Deite de costas com joelhos dobrados. Eleve os ombros e gire o tronco levando o cotovelo em direção ao joelho oposto. Alterne os lados.",
        "gif_id": "Oblique_Crunches",
    },
    {
        "name": "Elevação de Pernas Deitado",
        "muscle_group": "core",
        "difficulty": "iniciante",
        "equipment": "peso_corporal",
        "category": "strength",
        "description": "Deite de costas com as mãos sob os glúteos. Mantenha as pernas retas e eleve-as até 90°. Desça controladamente sem tocar o chão.",
        "gif_id": "Flat_Bench_Lying_Leg_Raise",
    },
    {
        "name": "Russian Twist",
        "muscle_group": "core",
        "difficulty": "iniciante",
        "equipment": "peso_corporal",
        "category": "strength",
        "description": "Sente-se com joelhos dobrados e tronco inclinado a 45°. Gire o tronco de um lado para o outro tocando o chão com as mãos. Pode segurar um peso para aumentar a dificuldade.",
        "gif_id": "Russian_Twist",
    },

    # ── GLÚTEOS ───────────────────────────────────────────────────────
    {
        "name": "Hip Thrust com Barra",
        "muscle_group": "gluteos",
        "difficulty": "intermediario",
        "equipment": "barra",
        "category": "strength",
        "description": "Apoie as costas no banco com a barra sobre o quadril. Empurre o quadril para cima contraindo os glúteos até o corpo ficar paralelo ao chão. Desça controladamente.",
        "gif_id": "Barbell_Hip_Thrust",
    },
    {
        "name": "Glúteo no Cabo (Kickback)",
        "muscle_group": "gluteos",
        "difficulty": "iniciante",
        "equipment": "máquina",
        "category": "strength",
        "description": "Em pé na polia baixa com o tornozelo preso ao cabo. Empurre a perna para trás contraindo o glúteo. Retorne controladamente sem girar o quadril.",
        "gif_id": "Cable_Hip_Extension",
    },
    {
        "name": "Agachamento Sumô",
        "muscle_group": "gluteos",
        "difficulty": "iniciante",
        "equipment": "halteres",
        "category": "strength",
        "description": "Em pé com os pés mais afastados que os ombros e pontas dos pés viradas para fora. Segure um haltere com as duas mãos. Desça flexionando os joelhos e quadril.",
        "gif_id": "Dumbbell_Sumo_Squat",
    },

    # ── FULL BODY ─────────────────────────────────────────────────────
    {
        "name": "Levantamento Terra",
        "muscle_group": "full_body",
        "difficulty": "avancado",
        "equipment": "barra",
        "category": "strength",
        "description": "Com a barra no chão, posicione os pés na largura dos quadris. Agache e segure a barra. Levante empurrando o chão com os pés e estendendo quadril e joelhos simultaneamente.",
        "gif_id": "Barbell_Deadlift",
    },
    {
        "name": "Burpee",
        "muscle_group": "full_body",
        "difficulty": "intermediario",
        "equipment": "peso_corporal",
        "category": "cardio",
        "description": "Em pé, agache e apoie as mãos no chão. Jogue os pés para trás ficando em posição de flexão. Faça uma flexão, pule os pés de volta e salte com os braços acima da cabeça.",
        "gif_id": "Burpee",
    },
    {
        "name": "Kettlebell Swing",
        "muscle_group": "full_body",
        "difficulty": "intermediario",
        "equipment": "kettlebell",
        "category": "strength",
        "description": "Em pé com o kettlebell entre as pernas. Incline o tronco e balance o kettlebell para trás. Empurre o quadril para frente balançando o kettlebell até a altura dos ombros.",
        "gif_id": "Kettlebell_Swing",
    },
    {
        "name": "Agachamento com Salto",
        "muscle_group": "full_body",
        "difficulty": "intermediario",
        "equipment": "peso_corporal",
        "category": "cardio",
        "description": "Faça um agachamento e ao subir, salte o mais alto possível. Aterrisse suavemente voltando à posição de agachamento.",
        "gif_id": "Jump_Squat",
    },

    # ── CARDIO ────────────────────────────────────────────────────────
    {
        "name": "Mountain Climber",
        "muscle_group": "core",
        "difficulty": "intermediario",
        "equipment": "peso_corporal",
        "category": "cardio",
        "description": "Em posição de flexão, traga alternadamente os joelhos em direção ao peito em movimento rápido, como se estivesse escalando uma montanha.",
        "gif_id": "Mountain_Climber",
    },
    {
        "name": "Jumping Jack",
        "muscle_group": "full_body",
        "difficulty": "iniciante",
        "equipment": "peso_corporal",
        "category": "cardio",
        "description": "Em pé, salte abrindo as pernas e levantando os braços acima da cabeça simultaneamente. Salte de volta à posição inicial.",
        "gif_id": "Jumping_Jacks",
    },
    {
        "name": "Corda (Jump Rope)",
        "muscle_group": "full_body",
        "difficulty": "iniciante",
        "equipment": "corda",
        "category": "cardio",
        "description": "Segure as alças da corda e gire-a sobre a cabeça. Salte com os dois pés juntos cada vez que a corda passar por baixo. Mantenha os cotovelos próximos ao corpo.",
        "gif_id": "Jump_Rope",
    },

    # ── PANTURRILHA ───────────────────────────────────────────────────
    {
        "name": "Panturrilha Sentado",
        "muscle_group": "panturrilha",
        "difficulty": "iniciante",
        "equipment": "máquina",
        "category": "strength",
        "description": "Sente-se na máquina com os joelhos sob o apoio e pontas dos pés na plataforma. Eleve os calcanhares o máximo possível. Desça controladamente.",
        "gif_id": "Seated_Calf_Raise",
    },
    {
        "name": "Panturrilha no Leg Press",
        "muscle_group": "panturrilha",
        "difficulty": "iniciante",
        "equipment": "máquina",
        "category": "strength",
        "description": "No leg press, posicione apenas as pontas dos pés na parte inferior da plataforma. Estenda os tornozelos empurrando a plataforma. Retorne controladamente.",
        "gif_id": "Calf_Press_On_The_Leg_Press",
    },
]


def get_exercise_thumbnail(gif_id: str) -> str:
    """Retorna URL da imagem estática (frame 0) do exercício."""
    return f"{BASE_GIF_URL}/{gif_id}/0.jpg"


def get_exercise_gif(gif_id: str) -> str:
    """
    Retorna URL da imagem animada (frame 1) do exercício.
    O repositório free-exercise-db tem 2 frames por exercício (0.jpg e 1.jpg).
    No frontend, alternamos entre os dois para simular animação.
    """
    return f"{BASE_GIF_URL}/{gif_id}/1.jpg"


def build_seed_data():
    """Retorna lista de dicts prontos para inserir na exercise_library."""
    result = []
    for ex in EXERCISES:
        gif_id = ex.get("gif_id", "")
        result.append({
            "name": ex["name"],
            "description": ex.get("description", ""),
            "muscle_group": ex["muscle_group"],
            "difficulty": ex["difficulty"],
            "equipment": ex.get("equipment", ""),
            "category": ex.get("category", "strength"),
            "thumbnail": get_exercise_thumbnail(gif_id) if gif_id else None,
            "video_url": get_exercise_gif(gif_id) if gif_id else None,
            "is_active": True,
            "created_by": None,  # exercício global
        })
    return result
