"""
Sistema de compartilhamento de pacientes entre profissionais.

Qualquer profissional pode compartilhar um paciente com outro profissional.
O receptor recebe acesso aos dados relevantes para sua área:
  - nutritionist  → dados nutricionais (dieta, anamnese, exames, antropometria, metas)
  - personal_trainer → treinos, check-ins, evolução corporal, restrições físicas
  - physiotherapist  → prontuários, restrições físicas, evolução corporal
  - all            → todos os dados acima (compartilhamento total)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.models.professional_client import ProfessionalClient
from app.models.patient import Patient
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/share", tags=["Compartilhamento"])

# Dados que cada role recebe ao ser compartilhado
ROLE_DATA_MAP = {
    "nutritionist": [
        "dados_pessoais", "anamnese", "dieta", "exames",
        "suplementos", "antropometria", "metas", "diario",
    ],
    "personal_trainer": [
        "dados_pessoais", "treinos", "checkins",
        "evolucao_corporal", "restricoes", "metas",
    ],
    "physiotherapist": [
        "dados_pessoais", "prontuarios", "restricoes",
        "evolucao_corporal", "anamnese",
    ],
    "all": [
        "dados_pessoais", "anamnese", "dieta", "exames",
        "suplementos", "antropometria", "metas", "diario",
        "treinos", "checkins", "evolucao_corporal",
        "restricoes", "prontuarios",
    ],
}

DATA_LABELS = {
    "dados_pessoais": "Dados pessoais e clínicos",
    "anamnese": "Anamnese",
    "dieta": "Plano alimentar",
    "exames": "Exames laboratoriais",
    "suplementos": "Suplementos",
    "antropometria": "Antropometria",
    "metas": "Metas",
    "diario": "Diário do paciente",
    "treinos": "Planos de treino",
    "checkins": "Check-ins",
    "evolucao_corporal": "Evolução corporal",
    "restricoes": "Restrições físicas",
    "prontuarios": "Prontuários fisioterapêuticos",
}

ROLE_LABELS = {
    "nutritionist": "Nutricionista",
    "personal_trainer": "Personal Trainer",
    "physiotherapist": "Fisioterapeuta",
}


class ShareIn(BaseModel):
    patient_id: int
    target_professional_email: str   # email do profissional que vai receber
    target_role: str                 # role que o receptor terá (nutritionist | personal_trainer | physiotherapist | all)
    message: Optional[str] = None   # mensagem opcional para o receptor


class ShareOut(BaseModel):
    id: int
    patient_id: int
    patient_name: str
    professional_id: int
    professional_name: str
    role: str
    shared_by_id: int
    shared_by_name: str
    shared_data: List[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


def _can_access_patient(patient_id: int, user: User, db: Session) -> Patient:
    """Verifica se o profissional tem acesso ao paciente (dono ou compartilhado)."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Paciente não encontrado")

    # É o nutricionista original
    if patient.nutritionist_id == user.id:
        return patient

    # Tem vínculo ativo
    link = db.query(ProfessionalClient).filter(
        ProfessionalClient.professional_id == user.id,
        ProfessionalClient.client_id == patient_id,
        ProfessionalClient.is_active == True,
    ).first()
    if link:
        return patient

    raise HTTPException(403, "Você não tem acesso a este paciente")


@router.post("/patient", status_code=201)
def share_patient(
    data: ShareIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Compartilha um paciente com outro profissional pelo email.
    O receptor recebe acesso aos dados da área especificada.
    """
    # Verifica se quem compartilha tem acesso ao paciente
    patient = _can_access_patient(data.patient_id, user, db)

    # Valida o role alvo
    if data.target_role not in ROLE_DATA_MAP:
        raise HTTPException(400, f"Role inválido. Use: {', '.join(ROLE_DATA_MAP.keys())}")

    # Busca o profissional receptor pelo email
    target = db.query(User).filter(
        User.email == data.target_professional_email,
        User.is_active == True,
    ).first()
    if not target:
        raise HTTPException(404, f"Profissional com email '{data.target_professional_email}' não encontrado no sistema")

    if target.id == user.id:
        raise HTTPException(400, "Você não pode compartilhar com você mesmo")

    # Verifica se já existe vínculo ativo
    existing = db.query(ProfessionalClient).filter(
        ProfessionalClient.professional_id == target.id,
        ProfessionalClient.client_id == data.patient_id,
        ProfessionalClient.is_active == True,
    ).first()
    if existing:
        # Atualiza o role se mudou
        existing.role = data.target_role
        existing.shared_by_id = user.id
        existing.shared_data = ",".join(ROLE_DATA_MAP[data.target_role])
        db.commit()
        return {
            "ok": True,
            "message": f"Acesso de {target.name} atualizado para {ROLE_LABELS.get(data.target_role, data.target_role)}",
            "patient_name": patient.name,
            "shared_with": target.name,
            "shared_data": ROLE_DATA_MAP[data.target_role],
        }

    # Cria novo vínculo
    link = ProfessionalClient(
        professional_id=target.id,
        client_id=data.patient_id,
        role=data.target_role,
        shared_by_id=user.id,
        shared_data=",".join(ROLE_DATA_MAP[data.target_role]),
    )
    db.add(link)

    # Envia notificação via chat interno (se houver paciente com nutricionista)
    try:
        from app.models.messaging import ChatMessage
        msg = ChatMessage(
            patient_id=data.patient_id,
            nutritionist_id=patient.nutritionist_id,
            sender="nutritionist",
            message=(
                f"📋 O paciente {patient.name} foi compartilhado com {target.name} "
                f"({ROLE_LABELS.get(data.target_role, data.target_role)}).\n"
                f"Dados compartilhados: {', '.join(DATA_LABELS.get(d, d) for d in ROLE_DATA_MAP[data.target_role][:3])}..."
                + (f"\n\nMensagem: {data.message}" if data.message else "")
            ),
        )
        db.add(msg)
    except Exception:
        pass

    db.commit()

    return {
        "ok": True,
        "message": f"Paciente compartilhado com {target.name} com sucesso!",
        "patient_name": patient.name,
        "shared_with": target.name,
        "shared_with_role": ROLE_LABELS.get(target.role, target.role),
        "access_role": ROLE_LABELS.get(data.target_role, data.target_role),
        "shared_data": ROLE_DATA_MAP[data.target_role],
        "data_labels": [DATA_LABELS.get(d, d) for d in ROLE_DATA_MAP[data.target_role]],
    }


@router.get("/patient/{patient_id}/professionals")
def list_patient_professionals(
    patient_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Lista todos os profissionais com acesso ao paciente."""
    _can_access_patient(patient_id, user, db)

    links = db.query(ProfessionalClient).filter(
        ProfessionalClient.client_id == patient_id,
        ProfessionalClient.is_active == True,
    ).all()

    result = []
    for link in links:
        prof = db.query(User).filter(User.id == link.professional_id).first()
        if prof:
            shared_data = link.shared_data.split(",") if getattr(link, "shared_data", None) else ROLE_DATA_MAP.get(link.role, [])
            result.append({
                "link_id": link.id,
                "professional_id": prof.id,
                "professional_name": prof.name,
                "professional_email": prof.email,
                "professional_role": prof.role,
                "access_role": link.role,
                "access_role_label": ROLE_LABELS.get(link.role, link.role),
                "shared_data": shared_data,
                "data_labels": [DATA_LABELS.get(d, d) for d in shared_data],
                "created_at": link.created_at,
            })

    # Inclui o nutricionista original
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if patient:
        owner = db.query(User).filter(User.id == patient.nutritionist_id).first()
        if owner and owner.id != user.id:
            result.insert(0, {
                "link_id": None,
                "professional_id": owner.id,
                "professional_name": owner.name,
                "professional_email": owner.email,
                "professional_role": owner.role,
                "access_role": "owner",
                "access_role_label": "Responsável principal",
                "shared_data": ROLE_DATA_MAP["all"],
                "data_labels": [DATA_LABELS.get(d, d) for d in ROLE_DATA_MAP["all"]],
                "created_at": None,
            })

    return result


@router.delete("/patient/{patient_id}/professional/{link_id}", status_code=204)
def revoke_share(
    patient_id: int,
    link_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Remove o acesso de um profissional ao paciente."""
    _can_access_patient(patient_id, user, db)

    link = db.query(ProfessionalClient).filter(
        ProfessionalClient.id == link_id,
        ProfessionalClient.client_id == patient_id,
    ).first()
    if not link:
        raise HTTPException(404, "Vínculo não encontrado")

    link.is_active = False
    db.commit()


@router.get("/my-shared-patients")
def list_shared_with_me(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Lista pacientes que foram compartilhados com o profissional atual."""
    links = db.query(ProfessionalClient).filter(
        ProfessionalClient.professional_id == user.id,
        ProfessionalClient.is_active == True,
    ).all()

    result = []
    for link in links:
        patient = db.query(Patient).filter(Patient.id == link.client_id).first()
        if patient:
            shared_data = link.shared_data.split(",") if getattr(link, "shared_data", None) else ROLE_DATA_MAP.get(link.role, [])
            result.append({
                "patient_id": patient.id,
                "patient_name": patient.name,
                "patient_weight": patient.weight,
                "patient_height": patient.height,
                "patient_goal": patient.goal,
                "access_role": link.role,
                "access_role_label": ROLE_LABELS.get(link.role, link.role),
                "shared_data": shared_data,
                "data_labels": [DATA_LABELS.get(d, d) for d in shared_data],
                "link_id": link.id,
                "created_at": link.created_at,
            })
    return result


@router.get("/preview/{target_role}")
def preview_shared_data(target_role: str):
    """Retorna quais dados serão compartilhados para um determinado role."""
    if target_role not in ROLE_DATA_MAP:
        raise HTTPException(400, f"Role inválido. Use: {', '.join(ROLE_DATA_MAP.keys())}")
    return {
        "role": target_role,
        "role_label": ROLE_LABELS.get(target_role, target_role),
        "shared_data": ROLE_DATA_MAP[target_role],
        "data_labels": [DATA_LABELS.get(d, d) for d in ROLE_DATA_MAP[target_role]],
    }
