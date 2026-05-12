# Design Técnico — Módulo de Treinos Personalizados (workout-module)

## Visão Geral

O módulo `workout-module` expande o NutriRP com um ciclo completo de prescrição e acompanhamento de treino: o Personal Trainer cria planos organizados em fichas (A/B/C), publica para o paciente, e o paciente registra a execução via check-in com RPE e cargas. O módulo se integra ao backend FastAPI existente e ao portal do paciente em `/paciente/`.

### Fluxo principal

```
Personal Trainer                     Paciente
      │                                  │
      ├─ Cria WorkoutPlan                │
      ├─ Adiciona WorkoutSessions        │
      ├─ Adiciona WorkoutExercises       │
      ├─ Publica plano ──────────────────┤
      │                                  ├─ Visualiza plano ativo
      │                                  ├─ Executa sessão
      │                                  ├─ Registra SessionCheckin (RPE + cargas)
      ├─ Consulta histórico ─────────────┤
      └─ Analisa evolução de carga       └─ Visualiza histórico de carga
```

### Tecnologias utilizadas

| Camada | Tecnologia |
|--------|-----------|
| Backend | FastAPI + SQLAlchemy + PostgreSQL/SQLite |
| Frontend | React + Vite + Tailwind CSS |
| Autenticação | JWT — profissional: `nutrirp_token`, paciente: `nutrirp_patient_token` |
| Testes | pytest + Hypothesis (property-based testing) |

---

## Arquitetura

O módulo segue a arquitetura em camadas já estabelecida no NutriRP:

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React)                                           │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │  Personal Trainer    │  │  Portal do Paciente          │ │
│  │  PersonalWorkoutBuilder  │  PatientWorkout             │ │
│  │  ExerciseLibraryModal│  │  PatientWorkoutCheckin       │ │
│  │  SessionCheckinHistory│  │  PatientExerciseDetail      │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│  Backend (FastAPI)                                          │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │  /api/personal       │  │  /api/patient/workout        │ │
│  │  personal.py (ext.)  │  │  patient_workout.py (novo)   │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Models: WorkoutPlan, WorkoutSession, WorkoutExercise,  │ │
│  │          ExerciseLibrary, SessionCheckin                │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │ SQLAlchemy ORM
┌─────────────────────────────────────────────────────────────┐
│  Banco de Dados (PostgreSQL / SQLite)                       │
└─────────────────────────────────────────────────────────────┘
```

### Decisões de arquitetura

**Router separado para o portal do paciente**: Os endpoints `/api/patient/workout/*` ficam em `app/routers/patient_workout.py` (novo arquivo), seguindo o padrão de `patient_portal.py`. Isso mantém separação clara de responsabilidades e autenticação.

**Extensão dos modelos existentes**: `WorkoutPlan` recebe `is_published`, `WorkoutExercise` recebe `muscle_group`. O novo modelo `SessionCheckin` é criado em `workout.py` para não fragmentar os modelos de treino.

**`exercise_logs` como JSON**: Os logs de execução por exercício são armazenados como campo JSON em `SessionCheckin`, evitando uma tabela extra para dados que são sempre lidos/escritos em conjunto com o check-in.

---

## Componentes e Interfaces

### Backend — Novos endpoints

#### Router `/api/personal` (extensão de `personal.py`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/personal/plans/{plan_id}/publish` | Publica plano para o paciente |
| `GET` | `/api/personal/clients/{client_id}/session-checkins` | Lista check-ins de sessão do paciente |
| `GET` | `/api/personal/clients/{client_id}/exercise-history/{exercise_id}` | Histórico de carga de um exercício |

#### Router `/api/patient/workout` (novo `patient_workout.py`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/patient/workout/active-plan` | Plano ativo publicado com sessões e exercícios |
| `POST` | `/api/patient/workout/checkin` | Registra check-in de sessão |
| `GET` | `/api/patient/workout/checkins` | Lista check-ins do paciente autenticado |
| `GET` | `/api/patient/workout/exercise-history/{exercise_id}` | Histórico de carga do paciente |
| `GET` | `/api/patient/exercises/library` | Detalhes de exercício da biblioteca |

### Frontend — Componentes do Personal Trainer

| Componente | Localização | Responsabilidade |
|-----------|-------------|-----------------|
| `PersonalWorkoutBuilder` | `src/pages/personal/PersonalWorkoutBuilder.jsx` | Editor completo de plano: sessões A/B/C, exercícios por grupo muscular, publicação |
| `ExerciseLibraryModal` | `src/components/ExerciseLibraryModal.jsx` | Modal de busca na biblioteca com filtros e preview de mídia |
| `SessionCheckinHistory` | `src/components/SessionCheckinHistory.jsx` | Histórico de check-ins de sessão com RPE e cargas por exercício |

### Frontend — Componentes do Portal do Paciente

| Componente | Localização | Responsabilidade |
|-----------|-------------|-----------------|
| `PatientWorkout` | `src/pages/patient/PatientWorkout.jsx` | Visualização do treino ativo com sessões e exercícios agrupados por grupo muscular |
| `PatientWorkoutCheckin` | `src/pages/patient/PatientWorkoutCheckin.jsx` | Formulário de check-in com seletor visual de RPE (0–10) e cargas por exercício |
| `PatientExerciseDetail` | `src/pages/patient/PatientExerciseDetail.jsx` | Detalhe do exercício com vídeo/gif e instruções de execução |

### Integração de rotas (App.jsx)

Novas rotas a adicionar:

```jsx
// Personal Trainer
<Route path="personal/plans/:planId" element={<PersonalWorkoutBuilder />} />

// Portal do Paciente
<Route path="/paciente/workout" element={<PatientWorkout />} />
<Route path="/paciente/workout/checkin/:sessionId" element={<PatientWorkoutCheckin />} />
<Route path="/paciente/workout/exercise/:exerciseId" element={<PatientExerciseDetail />} />
```

---

## Modelos de Dados

### Extensões dos modelos existentes

#### `WorkoutPlan` — adicionar campo `is_published`

```python
# app/models/workout.py — WorkoutPlan
is_published = Column(Boolean, default=False)
# Migração: ALTER TABLE workout_plans ADD COLUMN is_published BOOLEAN DEFAULT FALSE
```

#### `WorkoutExercise` — adicionar campo `muscle_group`

```python
# app/models/workout.py — WorkoutExercise
muscle_group = Column(String(100), nullable=True)
# Herdado de ExerciseLibrary.muscle_group quando exercise_id é fornecido
# Migração: ALTER TABLE workout_exercises ADD COLUMN muscle_group VARCHAR(100)
```

### Novo modelo `SessionCheckin`

```python
class SessionCheckin(Base):
    """Check-in de execução de uma sessão de treino pelo paciente."""
    __tablename__ = "session_checkins"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("workout_plans.id"), nullable=False)

    rpe = Column(Integer, nullable=False)           # 0–10 (escala de Borg)
    performed_at = Column(DateTime, nullable=False)  # data/hora da execução
    duration_minutes = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

    # Lista de logs por exercício: [{exercise_id, exercise_name, sets_done,
    #                                reps_done, load_used, notes}]
    exercise_logs = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", foreign_keys=[patient_id])
    session = relationship("WorkoutSession", foreign_keys=[session_id])
    plan = relationship("WorkoutPlan", foreign_keys=[plan_id])
```

### Estrutura do campo `exercise_logs` (JSON)

```json
[
  {
    "exercise_id": 42,
    "exercise_name": "Supino Reto",
    "sets_done": 3,
    "reps_done": "10",
    "load_used": "60kg",
    "notes": "Senti leve desconforto no ombro direito"
  },
  {
    "exercise_id": 17,
    "exercise_name": "Agachamento Livre",
    "sets_done": 4,
    "reps_done": "8-10",
    "load_used": "80kg",
    "notes": null
  }
]
```

### Diagrama de relacionamentos

```
WorkoutPlan (is_published) ──< WorkoutSession ──< WorkoutExercise (muscle_group)
     │                              │                      │
     │                              │               ExerciseLibrary
     │                              │
     └──────────────────────────────┤
                                    │
                              SessionCheckin
                              (patient_id, session_id, plan_id,
                               rpe, performed_at, exercise_logs JSON)
```

### Migração de banco de dados

As seguintes migrações serão adicionadas ao `run_migrations()` em `main.py`:

```python
# Colunas novas em tabelas existentes
("workout_plans", "is_published", "BOOLEAN DEFAULT FALSE"),
("workout_exercises", "muscle_group", "VARCHAR(100)"),

# Nova tabela session_checkins (PostgreSQL)
"""CREATE TABLE IF NOT EXISTS session_checkins (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    session_id INTEGER NOT NULL REFERENCES workout_sessions(id),
    plan_id INTEGER NOT NULL REFERENCES workout_plans(id),
    rpe INTEGER NOT NULL CHECK (rpe >= 0 AND rpe <= 10),
    performed_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER,
    notes TEXT,
    exercise_logs TEXT,
    created_at TIMESTAMP DEFAULT NOW()
)"""

# Nova tabela session_checkins (SQLite)
"""CREATE TABLE IF NOT EXISTS session_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id),
    session_id INTEGER NOT NULL REFERENCES workout_sessions(id),
    plan_id INTEGER NOT NULL REFERENCES workout_plans(id),
    rpe INTEGER NOT NULL,
    performed_at DATETIME NOT NULL,
    duration_minutes INTEGER,
    notes TEXT,
    exercise_logs TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)"""
```

---

## Propriedades de Corretude

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas do sistema — essencialmente, uma declaração formal sobre o que o sistema deve fazer. As propriedades servem como ponte entre especificações legíveis por humanos e garantias de corretude verificáveis por máquina.*

### Property 1: RPE sempre no intervalo [0, 10]

*Para qualquer* valor inteiro `rpe` enviado pelo paciente no check-in de sessão, se `rpe` estiver no intervalo fechado [0, 10], o sistema SHALL aceitar o check-in (HTTP 201); se `rpe` estiver fora desse intervalo, o sistema SHALL rejeitar com HTTP 422.

**Validates: Requirements 6.2, 6.3, 7.1**

### Property 2: Plano visível ao paciente somente após publicação

*Para qualquer* `WorkoutPlan`, o endpoint `GET /api/patient/workout/active-plan` SHALL retornar o plano se e somente se `is_published = true` E `is_active = true`. Um plano com `is_published = false` SHALL resultar em HTTP 404 para o paciente, independentemente de qualquer outro campo.

**Validates: Requirements 1.7, 5.1, 5.2, 10.5**

### Property 3: Unicidade de check-in por sessão por dia

*Para qualquer* paciente autenticado e qualquer `session_id`, se já existir um `SessionCheckin` com o mesmo `session_id` e com `performed_at` no mesmo dia calendário (UTC), uma segunda tentativa de criação SHALL retornar HTTP 409. O número de check-ins para a mesma (sessão, dia) SHALL ser no máximo 1.

**Validates: Requirements 6.6, 6.7**

### Property 4: Isolamento de dados entre profissionais

*Para qualquer* `WorkoutPlan`, `WorkoutSession` ou `WorkoutExercise` criado pelo profissional A, qualquer tentativa de acesso (GET, PUT, DELETE) pelo profissional B (onde B ≠ A) SHALL retornar HTTP 403. O conjunto de planos retornados por `GET /api/personal/clients/{client_id}/plans` SHALL conter apenas planos cujo `professional_id` corresponde ao profissional autenticado.

**Validates: Requirements 1.6, 10.2**

### Property 5: Isolamento de dados entre pacientes

*Para qualquer* `SessionCheckin` criado pelo paciente A, o endpoint `GET /api/patient/workout/checkins` autenticado como paciente B (onde B ≠ A) SHALL NOT incluir esse check-in na resposta. O `patient_id` de cada check-in retornado SHALL sempre corresponder ao paciente autenticado.

**Validates: Requirements 6.5, 6.8, 10.3**

### Property 6: Herança de muscle_group da biblioteca

*Para qualquer* `WorkoutExercise` criado com `exercise_id` referenciando um `ExerciseLibrary` que possui `muscle_group` não nulo, o campo `muscle_group` do `WorkoutExercise` SHALL ser igual ao `muscle_group` do exercício correspondente na biblioteca.

**Validates: Requirements 3.8**

### Property 7: Ordenação de sessões e exercícios por order_index

*Para qualquer* `WorkoutPlan` com N sessões, a lista de sessões retornada SHALL estar em ordem crescente de `order_index` (i.e., `sessions[i].order_index ≤ sessions[i+1].order_index` para todo i). O mesmo invariante SHALL valer para `WorkoutExercise` dentro de cada sessão.

**Validates: Requirements 2.2, 3.2, 5.5**

### Property 8: Filtragem combinada na biblioteca de exercícios

*Para qualquer* combinação de filtros `q` (termo de busca) e `muscle_group` enviados a `GET /api/personal/exercises/library`, todos os exercícios retornados SHALL satisfazer simultaneamente: (a) `name` contém `q` de forma case-insensitive, e (b) `muscle_group` é igual ao filtro. Nenhum exercício retornado SHALL violar qualquer um dos filtros ativos.

**Validates: Requirements 4.2, 4.3, 9.1, 9.2**

### Property 9: Histórico de carga filtrado por exercício

*Para qualquer* `exercise_id` solicitado em `GET /api/personal/clients/{client_id}/exercise-history/{exercise_id}` ou `GET /api/patient/workout/exercise-history/{exercise_id}`, todos os registros retornados SHALL conter `exercise_id` igual ao solicitado. Nenhum registro de outro exercício SHALL aparecer na resposta. A lista SHALL estar em ordem crescente de `performed_at`.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 10: Autenticação obrigatória em todos os endpoints

*Para qualquer* endpoint do módulo de treino (tanto `/api/personal/*` quanto `/api/patient/workout/*`), uma requisição sem token de autenticação válido SHALL retornar HTTP 401. Isso deve valer para qualquer combinação de método HTTP e path dentro do módulo.

**Validates: Requirements 10.1**

---

## Tratamento de Erros

### Tabela de erros por cenário

| Cenário | HTTP Status | Mensagem |
|---------|-------------|---------|
| Token ausente ou inválido | 401 | `"Token de autenticação inválido ou ausente"` |
| Profissional sem acesso ao paciente | 403 | `"Sem acesso a este paciente"` |
| Profissional tentando acessar plano de outro | 403 | `"Sem acesso a este plano"` |
| Paciente tentando acessar dados de outro | 403 | `"Acesso negado"` |
| Plano não encontrado | 404 | `"Plano não encontrado"` |
| Nenhum plano ativo publicado | 404 | `"Nenhum plano de treino ativo publicado"` |
| Publicar plano sem sessões | 422 | `"O plano deve ter ao menos uma sessão antes de ser publicado"` |
| RPE fora do intervalo [0, 10] | 422 | `"RPE deve ser um inteiro entre 0 e 10"` |
| muscle_group inválido | 422 | `"Valor inválido para muscle_group. Valores aceitos: peito, costas, pernas, ombros, bracos, core, full_body, gluteos, panturrilha"` |
| Check-in duplicado (mesma sessão, mesmo dia) | 409 | `"Já existe um check-in para esta sessão hoje"` |
| exercise_id inexistente ou inativo | 422 | `"Exercício não encontrado na biblioteca ou inativo"` |
| Tentativa de deletar exercício global | 403 | `"Não é possível remover exercícios globais da plataforma"` |

### Estratégia de validação

**Backend (Pydantic + FastAPI)**:
- `rpe`: `Field(ge=0, le=10)` no schema Pydantic — validação automática com mensagem descritiva
- `muscle_group`: `Literal[...]` com os 9 valores válidos — validação automática
- `exercise_id`: verificação explícita no handler antes de persistir
- Unicidade de check-in: query antes do INSERT, retorna 409 se já existir

**Frontend**:
- Seletor visual de RPE (0–10) impede valores inválidos por design
- Formulário de check-in desabilita submissão se campos obrigatórios estiverem vazios
- Feedback imediato via `react-hot-toast` para erros da API

---

## Estratégia de Testes

### Abordagem dual

O módulo utiliza dois tipos complementares de teste:

1. **Testes de propriedade** (Hypothesis): verificam invariantes universais com 100+ iterações de inputs gerados aleatoriamente
2. **Testes de exemplo** (pytest): verificam comportamentos específicos, casos de borda e integrações

### Configuração de property-based testing

**Biblioteca**: [Hypothesis](https://hypothesis.readthedocs.io/) para Python

```python
# Configuração mínima por teste de propriedade
from hypothesis import given, settings, strategies as st

@settings(max_examples=100)
@given(...)
def test_property_name(...):
    ...
```

**Tag de rastreabilidade** (comentário em cada teste de propriedade):
```python
# Feature: workout-module, Property N: <texto da propriedade>
```

### Testes de propriedade (Hypothesis)

Cada propriedade do design corresponde a um teste de propriedade:

| Teste | Propriedade | Geradores |
|-------|-------------|-----------|
| `test_rpe_range_validation` | Property 1 | `st.integers()` — inclui valores dentro e fora de [0,10] |
| `test_plan_visibility_requires_publish` | Property 2 | `st.booleans()` para `is_published`, `st.booleans()` para `is_active` |
| `test_checkin_uniqueness_per_session_per_day` | Property 3 | `st.datetimes()` para `performed_at` no mesmo dia |
| `test_professional_data_isolation` | Property 4 | Dois profissionais com planos distintos |
| `test_patient_data_isolation` | Property 5 | Dois pacientes com check-ins distintos |
| `test_muscle_group_inheritance` | Property 6 | `st.sampled_from(VALID_MUSCLE_GROUPS)` |
| `test_sessions_ordered_by_order_index` | Property 7 | `st.lists(st.integers())` para `order_index` |
| `test_library_combined_filter` | Property 8 | `st.text()` para `q`, `st.sampled_from(VALID_MUSCLE_GROUPS)` para `muscle_group` |
| `test_exercise_history_filtered_by_id` | Property 9 | Múltiplos `exercise_id` em `exercise_logs` |
| `test_authentication_required` | Property 10 | `st.sampled_from(ALL_WORKOUT_ENDPOINTS)` |

### Testes de exemplo (pytest)

```
tests/
  test_workout_plans.py       — CRUD de planos, publicação, cascata
  test_workout_sessions.py    — CRUD de sessões, ordenação, limite 1-7
  test_workout_exercises.py   — CRUD de exercícios, validação exercise_id
  test_exercise_library.py    — busca, filtros, soft delete, acesso global
  test_session_checkins.py    — criação, duplicata, histórico
  test_patient_workout.py     — endpoints do portal do paciente
  test_access_control.py      — 401/403 em todos os endpoints
  test_properties.py          — testes de propriedade (Hypothesis)
```

### Casos de borda prioritários

- Publicar plano sem sessões → 422
- RPE = 0 e RPE = 10 (limites inclusivos) → aceitos
- RPE = -1 e RPE = 11 → 422
- Segundo check-in na mesma sessão no mesmo dia → 409
- Segundo check-in na mesma sessão em dia diferente → 201
- Plano com 7 sessões (máximo) → aceito; 8ª sessão → 422
- Exercício com `exercise_id` inativo → 422
- Paciente sem plano publicado → 404
- Histórico de exercício sem registros → lista vazia, 200
- `muscle_group` inválido → 422 com lista de valores válidos

### Cobertura mínima esperada

- Todos os endpoints novos: ≥ 90% de cobertura de linhas
- Cada propriedade de corretude: ≥ 100 iterações via Hypothesis
- Todos os cenários de erro da tabela acima: cobertos por testes de exemplo
