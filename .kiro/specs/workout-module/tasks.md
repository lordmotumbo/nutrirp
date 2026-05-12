# Plano de Implementação — Módulo de Treinos Personalizados (workout-module)

## Visão Geral

Implementação incremental do módulo de treinos: extensão dos modelos existentes, migrações de banco, novos endpoints backend (personal.py + patient_workout.py), componentes frontend do Personal Trainer e do Portal do Paciente, integração de rotas e testes de propriedade com Hypothesis.

## Tarefas

- [x] 1. Estender modelos e adicionar migrações de banco de dados
  - [x] 1.1 Adicionar campo `is_published` ao modelo `WorkoutPlan` em `app/models/workout.py`
    - Adicionar `is_published = Column(Boolean, default=False)` à classe `WorkoutPlan`
    - _Requirements: 1.7, 10.5_

  - [x] 1.2 Adicionar campo `muscle_group` ao modelo `WorkoutExercise` em `app/models/workout.py`
    - Adicionar `muscle_group = Column(String(100), nullable=True)` à classe `WorkoutExercise`
    - _Requirements: 3.8_

  - [x] 1.3 Criar modelo `SessionCheckin` em `app/models/workout.py`
    - Implementar a classe com campos: `id`, `patient_id`, `session_id`, `plan_id`, `rpe`, `performed_at`, `duration_minutes`, `notes`, `exercise_logs` (JSON), `created_at`
    - Adicionar relacionamentos com `Patient`, `WorkoutSession` e `WorkoutPlan`
    - _Requirements: 6.1, 6.4, 7.1_

  - [x] 1.4 Adicionar migrações ao `run_migrations()` em `app/main.py`
    - Adicionar à lista `column_migrations`: `("workout_plans", "is_published", "BOOLEAN DEFAULT FALSE")` e `("workout_exercises", "muscle_group", "VARCHAR(100)")`
    - Adicionar criação da tabela `session_checkins` (versões PostgreSQL e SQLite) à lista `new_tables`
    - Importar `SessionCheckin` no topo de `main.py` junto aos demais modelos de workout
    - _Requirements: 1.7, 3.8, 6.1_

  - [ ]* 1.5 Escrever testes de exemplo para os modelos estendidos
    - Verificar que `WorkoutPlan` é criado com `is_published=False` por padrão
    - Verificar que `WorkoutExercise` aceita `muscle_group` nulo e não nulo
    - Verificar que `SessionCheckin` persiste e recupera `exercise_logs` como JSON
    - _Requirements: 1.7, 3.8, 6.1_

- [-] 2. Implementar endpoints do Personal Trainer em `app/routers/personal.py`
  - [x] 2.1 Implementar `POST /api/personal/plans/{plan_id}/publish`
    - Verificar que o plano pertence ao profissional autenticado (403 se não)
    - Verificar que o plano possui ao menos uma sessão (422 com mensagem descritiva se não)
    - Marcar `is_published = True` e retornar o plano atualizado
    - _Requirements: 1.7, 1.8_

  - [ ]* 2.2 Escrever teste de propriedade para publicação de plano (Property 2)
    - **Property 2: Plano visível ao paciente somente após publicação**
    - **Validates: Requirements 1.7, 5.1, 5.2, 10.5**
    - Usar `st.booleans()` para `is_published` e `st.booleans()` para `is_active`; verificar que o endpoint do paciente retorna 404 quando `is_published=False`

  - [x] 2.3 Implementar `GET /api/personal/clients/{client_id}/session-checkins`
    - Verificar acesso do profissional ao paciente via `_get_client()`
    - Retornar `SessionCheckin` do paciente em ordem decrescente de `performed_at`
    - Incluir campo `rpe` na resposta
    - _Requirements: 7.2, 7.4_

  - [x] 2.4 Implementar `GET /api/personal/clients/{client_id}/exercise-history/{exercise_id}`
    - Verificar acesso do profissional ao paciente
    - Extrair de `SessionCheckin.exercise_logs` (JSON) os registros onde `exercise_id` corresponde ao solicitado
    - Retornar lista `{performed_at, load_used, reps_done, sets_done, rpe}` em ordem crescente de `performed_at`
    - Retornar lista vazia (HTTP 200) se não houver registros
    - _Requirements: 8.1, 8.3, 8.4_

  - [ ]* 2.5 Escrever teste de propriedade para histórico de carga (Property 9)
    - **Property 9: Histórico de carga filtrado por exercício**
    - **Validates: Requirements 8.1, 8.2, 8.3**
    - Gerar múltiplos `exercise_id` em `exercise_logs`; verificar que apenas registros do `exercise_id` solicitado aparecem na resposta, em ordem crescente de `performed_at`

  - [ ]* 2.6 Escrever teste de propriedade para isolamento de dados entre profissionais (Property 4)
    - **Property 4: Isolamento de dados entre profissionais**
    - **Validates: Requirements 1.6, 10.2**
    - Criar dois profissionais com planos distintos; verificar que profissional B recebe 403 ao acessar planos do profissional A

- [ ] 3. Checkpoint — Testar endpoints do Personal Trainer
  - Garantir que todos os testes passam. Verificar manualmente via `/docs` (Swagger) os novos endpoints. Perguntar ao usuário se há dúvidas antes de continuar.

- [-] 4. Criar router `app/routers/patient_workout.py` e registrá-lo em `main.py`
  - [ ] 4.1 Criar o arquivo `app/routers/patient_workout.py` com o router base
    - Definir `router = APIRouter(prefix="/api/patient", tags=["Portal Paciente — Treino"])`
    - Reutilizar o helper `get_current_patient` importado de `patient_portal.py` (ou replicar o padrão de autenticação via `nutrirp_patient_token`)
    - _Requirements: 5.1, 6.1, 10.1_

  - [x] 4.2 Implementar `GET /api/patient/workout/active-plan`
    - Buscar o `WorkoutPlan` mais recente com `is_active=True` e `is_published=True` para o `patient_id` do token
    - Retornar plano com sessões (ordenadas por `order_index`) e exercícios (ordenados por `order_index`) aninhados, incluindo `exercise_name`, `muscle_group`, `sets`, `reps`, `load`, `rest_time`, `execution_notes`, `video_url`, `thumbnail`
    - Retornar HTTP 404 com mensagem `"Nenhum plano de treino ativo publicado"` se não existir
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 4.3 Implementar `POST /api/patient/workout/checkin`
    - Definir schema Pydantic com `session_id`, `rpe: int = Field(ge=0, le=10)`, `performed_at`, `duration_minutes`, `notes`, `exercise_logs`
    - Extrair `patient_id` do token (não aceitar no corpo)
    - Verificar unicidade: se já existir `SessionCheckin` com mesmo `session_id` e `performed_at` no mesmo dia calendário, retornar HTTP 409
    - Persistir e retornar o objeto criado com HTTP 201
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7_

  - [ ]* 4.4 Escrever teste de propriedade para validação de RPE (Property 1)
    - **Property 1: RPE sempre no intervalo [0, 10]**
    - **Validates: Requirements 6.2, 6.3, 7.1**
    - Usar `st.integers()` para gerar valores dentro e fora de [0, 10]; verificar HTTP 201 para [0,10] e HTTP 422 para valores fora do intervalo

  - [ ]* 4.5 Escrever teste de propriedade para unicidade de check-in (Property 3)
    - **Property 3: Unicidade de check-in por sessão por dia**
    - **Validates: Requirements 6.6, 6.7**
    - Usar `st.datetimes()` para gerar dois `performed_at` no mesmo dia calendário; verificar que a segunda criação retorna HTTP 409

  - [x] 4.6 Implementar `GET /api/patient/workout/checkins`
    - Retornar `SessionCheckin` do paciente autenticado em ordem decrescente de `performed_at`
    - _Requirements: 6.8_

  - [x] 4.7 Implementar `GET /api/patient/workout/exercise-history/{exercise_id}`
    - Extrair de `SessionCheckin.exercise_logs` os registros do paciente autenticado onde `exercise_id` corresponde
    - Retornar lista `{performed_at, load_used, reps_done, sets_done, rpe}` em ordem crescente de `performed_at`
    - _Requirements: 8.2, 8.3, 8.4_

  - [x] 4.8 Implementar `GET /api/patient/exercises/library`
    - Aceitar query param `exercise_id`; retornar detalhes do exercício incluindo `description`, `video_url`, `thumbnail`
    - _Requirements: 4.8_

  - [ ]* 4.9 Escrever teste de propriedade para isolamento de dados entre pacientes (Property 5)
    - **Property 5: Isolamento de dados entre pacientes**
    - **Validates: Requirements 6.5, 6.8, 10.3**
    - Criar dois pacientes com check-ins distintos; verificar que paciente B não vê check-ins do paciente A

  - [ ]* 4.10 Escrever teste de propriedade para autenticação obrigatória (Property 10)
    - **Property 10: Autenticação obrigatória em todos os endpoints**
    - **Validates: Requirements 10.1**
    - Usar `st.sampled_from(ALL_WORKOUT_ENDPOINTS)` para iterar sobre todos os endpoints do módulo sem token; verificar HTTP 401 em todos

  - [x] 4.11 Registrar `patient_workout.router` em `app/main.py`
    - Adicionar `from app.routers import patient_workout` na seção de imports
    - Adicionar `app.include_router(patient_workout.router)` após o router `personal`
    - _Requirements: 5.1, 6.1_

- [ ] 5. Checkpoint — Testar endpoints do Portal do Paciente
  - Garantir que todos os testes passam. Verificar via `/docs` os endpoints `/api/patient/workout/*`. Perguntar ao usuário se há dúvidas antes de continuar.

- [-] 6. Implementar componentes frontend do Personal Trainer
  - [x] 6.1 Criar `src/pages/personal/PersonalWorkoutBuilder.jsx`
    - Carregar plano via `GET /api/personal/plans/{planId}` com sessões e exercícios aninhados
    - Exibir sessões (Treino A/B/C) em ordem de `order_index` com botões para adicionar, renomear e reordenar
    - Para cada sessão, listar exercícios agrupados por `muscle_group` com campos editáveis (séries, reps, carga, notas)
    - Botão "Adicionar exercício" abre `ExerciseLibraryModal`
    - Botão "Publicar plano" chama `POST /api/personal/plans/{planId}/publish`; exibir feedback via `react-hot-toast`
    - Exibir badge de status (publicado / rascunho) no cabeçalho do plano
    - _Requirements: 1.7, 2.1, 2.2, 3.1, 3.2, 5.4_

  - [x] 6.2 Criar `src/components/ExerciseLibraryModal.jsx`
    - Modal com campo de busca por nome (`q`) e filtro por `muscle_group` (select com os 9 valores válidos)
    - Chamar `GET /api/personal/exercises/library` com debounce na busca
    - Exibir lista de exercícios com nome, grupo muscular, dificuldade e thumbnail (se disponível)
    - Ao selecionar exercício, invocar callback `onSelect(exercise)` e fechar o modal
    - _Requirements: 4.1, 4.2, 4.3, 9.1, 9.2, 9.3_

  - [ ]* 6.3 Escrever teste de propriedade para filtragem combinada na biblioteca (Property 8)
    - **Property 8: Filtragem combinada na biblioteca de exercícios**
    - **Validates: Requirements 4.2, 4.3, 9.1, 9.2**
    - Usar `st.text()` para `q` e `st.sampled_from(VALID_MUSCLE_GROUPS)` para `muscle_group`; verificar que todos os resultados satisfazem simultaneamente ambos os filtros

  - [x] 6.4 Criar `src/components/SessionCheckinHistory.jsx`
    - Receber `clientId` como prop; carregar dados via `GET /api/personal/clients/{clientId}/session-checkins`
    - Exibir lista de check-ins com data, nome da sessão, RPE e resumo de `exercise_logs`
    - Exibir média de RPE por sessão ao longo do tempo (agrupamento por `session_id`)
    - _Requirements: 7.2, 7.4_

  - [x] 6.5 Integrar `SessionCheckinHistory` e link para `PersonalWorkoutBuilder` em `PersonalClientDetail.jsx`
    - Na seção "Planos de Treino", alterar o link "Ver treino" para apontar para `/personal/plans/:planId`
    - Adicionar seção "Check-ins de Sessão" usando o componente `SessionCheckinHistory`
    - _Requirements: 7.4_

- [ ] 7. Implementar componentes frontend do Portal do Paciente
  - [x] 7.1 Criar `src/pages/patient/PatientWorkout.jsx`
    - Chamar `GET /api/patient/workout/active-plan` com token `nutrirp_patient_token`
    - Exibir sessões do plano em ordem de `order_index` como abas ou cards expansíveis
    - Dentro de cada sessão, agrupar exercícios por `muscle_group` com nome, séries, reps, carga e link para detalhe
    - Botão "Iniciar sessão" em cada card de sessão navega para `/paciente/workout/checkin/:sessionId`
    - Exibir mensagem amigável se não houver plano publicado (HTTP 404)
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

  - [x] 7.2 Criar `src/pages/patient/PatientWorkoutCheckin.jsx`
    - Receber `sessionId` via `useParams`; carregar exercícios da sessão a partir do plano ativo
    - Exibir seletor visual de RPE (0–10) com rótulos: 0 = Repouso, 5 = Moderado, 10 = Máximo
    - Para cada exercício da sessão, exibir campos editáveis: `sets_done`, `reps_done`, `load_used`, `notes`
    - Campos de `duration_minutes` e `notes` gerais da sessão
    - Ao submeter, chamar `POST /api/patient/workout/checkin`; exibir feedback via toast e redirecionar para `/paciente/workout`
    - Tratar HTTP 409 (check-in duplicado) com mensagem descritiva
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.3_

  - [x] 7.3 Criar `src/pages/patient/PatientExerciseDetail.jsx`
    - Receber `exerciseId` via `useParams`; chamar `GET /api/patient/exercises/library?exercise_id={id}`
    - Exibir nome, grupo muscular, dificuldade, descrição e vídeo/gif (se disponível via `video_url` ou `thumbnail`)
    - Exibir histórico de carga como gráfico de linha usando dados de `GET /api/patient/workout/exercise-history/{exerciseId}`
    - Eixo X: `performed_at`; eixo Y: valor numérico extraído de `load_used`
    - _Requirements: 4.8, 8.2, 8.5_

- [ ] 8. Adicionar rotas em `App.jsx` e `spa-routes.cjs`
  - [x] 8.1 Adicionar rotas do Personal Trainer em `src/App.jsx`
    - Importar `PersonalWorkoutBuilder` de `./pages/personal/PersonalWorkoutBuilder`
    - Adicionar dentro do bloco de rotas privadas: `<Route path="personal/plans/:planId" element={<PersonalWorkoutBuilder />} />`
    - _Requirements: 1.7, 2.1, 3.1_

  - [x] 8.2 Adicionar rotas do Portal do Paciente em `src/App.jsx`
    - Importar `PatientWorkout`, `PatientWorkoutCheckin`, `PatientExerciseDetail`
    - Adicionar no bloco `/paciente`:
      - `<Route path="/paciente/workout" element={<PatientWorkout />} />`
      - `<Route path="/paciente/workout/checkin/:sessionId" element={<PatientWorkoutCheckin />} />`
      - `<Route path="/paciente/workout/exercise/:exerciseId" element={<PatientExerciseDetail />} />`
    - _Requirements: 5.1, 6.1, 4.8_

  - [x] 8.3 Adicionar rotas do paciente em `scripts/spa-routes.cjs`
    - Adicionar ao array `routes`: `'paciente/workout'`, `'paciente/workout/checkin'`, `'paciente/workout/exercise'`
    - _Requirements: 5.1_

  - [x] 8.4 Adicionar link "Treino" no menu do `PatientDashboard.jsx`
    - Adicionar item `{ to: '/paciente/workout', icon: Dumbbell, label: 'Treino', color: 'bg-indigo-50 text-indigo-700' }` ao array `menu`
    - Importar `Dumbbell` de `lucide-react`
    - _Requirements: 5.1_

- [-] 9. Escrever testes de propriedade restantes e testes de exemplo
  - [ ]* 9.1 Escrever teste de propriedade para herança de muscle_group (Property 6)
    - **Property 6: Herança de muscle_group da biblioteca**
    - **Validates: Requirements 3.8**
    - Usar `st.sampled_from(VALID_MUSCLE_GROUPS)` para gerar exercícios na biblioteca; verificar que `WorkoutExercise.muscle_group` é igual ao `ExerciseLibrary.muscle_group` quando `exercise_id` é fornecido

  - [ ]* 9.2 Escrever teste de propriedade para ordenação de sessões e exercícios (Property 7)
    - **Property 7: Ordenação de sessões e exercícios por order_index**
    - **Validates: Requirements 2.2, 3.2, 5.5**
    - Usar `st.lists(st.integers())` para gerar `order_index` em ordem aleatória; verificar que a resposta da API retorna sessões e exercícios em ordem crescente de `order_index`

  - [ ]* 9.3 Escrever testes de exemplo para casos de borda prioritários
    - Publicar plano sem sessões → HTTP 422
    - RPE = 0 e RPE = 10 (limites inclusivos) → HTTP 201
    - RPE = -1 e RPE = 11 → HTTP 422
    - Segundo check-in na mesma sessão no mesmo dia → HTTP 409
    - Segundo check-in na mesma sessão em dia diferente → HTTP 201
    - Plano com 7 sessões (máximo) → aceito; 8ª sessão → HTTP 422
    - Exercício com `exercise_id` inativo → HTTP 422
    - Paciente sem plano publicado → HTTP 404
    - Histórico de exercício sem registros → lista vazia, HTTP 200
    - `muscle_group` inválido → HTTP 422 com lista de valores válidos
    - _Requirements: 1.8, 2.5, 3.7, 4.6, 6.3, 6.7, 9.6_

- [x] 10. Checkpoint final — Garantir que todos os testes passam
  - Executar `pytest` na pasta `backend/` e verificar que todos os testes passam
  - Verificar que não há erros de importação em `main.py` após as alterações
  - Perguntar ao usuário se há dúvidas ou ajustes antes de encerrar.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia os requisitos específicos para rastreabilidade
- Os checkpoints garantem validação incremental a cada fase
- Os testes de propriedade (Hypothesis) validam invariantes universais com ≥ 100 iterações
- Os testes de exemplo cobrem casos de borda específicos listados no design
- O campo `exercise_logs` é armazenado como JSON/TEXT no banco; no SQLAlchemy usar `Column(JSON)` (PostgreSQL) — para SQLite o ORM serializa automaticamente
- A autenticação do paciente usa `nutrirp_patient_token` no `localStorage` e o header `Authorization: Bearer <token>` nos endpoints `/api/patient/*`
