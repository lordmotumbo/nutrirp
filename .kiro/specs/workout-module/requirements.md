# Documento de Requisitos — Módulo de Treinos Personalizados (workout-module)

## Introdução

O módulo de Treinos Personalizados expande o NutriRP com funcionalidades completas de prescrição e acompanhamento de treino para Personal Trainers. O módulo permite ao personal trainer criar planos de treino organizados em fichas por dia (A/B/C…), adicionar exercícios por grupo muscular a partir de uma biblioteca compartilhada, publicar o plano para o paciente e acompanhar a evolução via check-ins de sessão. O paciente acessa o treino do dia pelo portal `/paciente/`, executa a sessão e registra o check-in com RPE (escala de Borg 0–10), cargas utilizadas e observações.

O módulo se integra aos modelos já existentes (`WorkoutPlan`, `WorkoutSession`, `WorkoutExercise`, `ExerciseLibrary`, `CheckIn`) e ao router `/api/personal`, estendendo-os com os campos e endpoints necessários.

---

## Glossário

- **Personal_Trainer**: Profissional com papel `personal_trainer` no sistema NutriRP.
- **Paciente**: Usuário vinculado ao Personal_Trainer via `ProfessionalClient` ou `nutritionist_id`, com acesso ao portal `/paciente/`.
- **Plano**: Instância de `WorkoutPlan` — conjunto de sessões de treino prescrito para um Paciente.
- **Sessão**: Instância de `WorkoutSession` — ficha de treino de um dia (ex.: Treino A, Treino B, Treino C).
- **Exercício_Prescrito**: Instância de `WorkoutExercise` — exercício com séries, repetições, carga e notas dentro de uma Sessão.
- **Biblioteca**: Conjunto de registros `ExerciseLibrary` — exercícios globais (criados pela plataforma) e exercícios privados (criados pelo Personal_Trainer).
- **Check-in_de_Sessão**: Registro de execução de uma Sessão pelo Paciente, contendo RPE, cargas realizadas e observações.
- **RPE**: Rating of Perceived Exertion — escala de Borg 0–10 que representa o esforço percebido pelo Paciente durante a sessão.
- **Grupo_Muscular**: Classificação anatômica do exercício: `peito`, `costas`, `pernas`, `ombros`, `bracos`, `core`, `full_body`, `gluteos`, `panturrilha`.
- **Histórico_de_Carga**: Série temporal de cargas registradas pelo Paciente para um exercício específico ao longo dos check-ins.
- **Publicação**: Ato do Personal_Trainer de marcar um Plano como visível para o Paciente (`is_published = true`).
- **API**: Backend FastAPI em `/api/personal`.
- **Portal_Paciente**: Frontend em `/paciente/` acessado pelo Paciente com credenciais próprias.

---

## Requisitos

### Requisito 1: Criação e Gestão de Planos de Treino

**User Story:** Como Personal_Trainer, quero criar planos de treino para meus pacientes com título, objetivo, frequência semanal e período de vigência, para que eu possa organizar a prescrição de cada cliente.

#### Critérios de Aceitação

1. WHEN o Personal_Trainer envia uma requisição `POST /api/personal/plans` com `client_id`, `title` e `frequency_per_week` válidos, THE API SHALL criar o Plano e retornar o objeto criado com status HTTP 201.
2. WHEN o Personal_Trainer envia `POST /api/personal/plans` com `client_id` de um Paciente ao qual não está vinculado, THE API SHALL retornar HTTP 403.
3. THE API SHALL garantir que cada Plano pertence a exatamente um Personal_Trainer e a exatamente um Paciente.
4. WHEN o Personal_Trainer envia `PUT /api/personal/plans/{plan_id}` com dados válidos, THE API SHALL atualizar o Plano e retornar o objeto atualizado.
5. WHEN o Personal_Trainer envia `DELETE /api/personal/plans/{plan_id}`, THE API SHALL remover o Plano e todas as Sessões e Exercícios_Prescritos associados em cascata.
6. WHEN o Personal_Trainer envia `GET /api/personal/clients/{client_id}/plans`, THE API SHALL retornar apenas os Planos criados pelo Personal_Trainer autenticado para aquele Paciente.
7. WHEN o Personal_Trainer envia `POST /api/personal/plans/{plan_id}/publish`, THE API SHALL marcar o Plano com `is_published = true` e torná-lo visível para o Paciente.
8. IF o Personal_Trainer tentar publicar um Plano sem nenhuma Sessão cadastrada, THEN THE API SHALL retornar HTTP 422 com mensagem descritiva.

---

### Requisito 2: Organização de Sessões por Dia (Fichas A/B/C)

**User Story:** Como Personal_Trainer, quero organizar o plano em sessões nomeadas (Treino A, Treino B, Treino C…), para que o Paciente saiba qual ficha executar em cada dia.

#### Critérios de Aceitação

1. WHEN o Personal_Trainer envia `POST /api/personal/sessions` com `plan_id` válido e `name` não vazio, THE API SHALL criar a Sessão e retornar o objeto com status HTTP 201.
2. THE API SHALL ordenar as Sessões de um Plano pelo campo `order_index` em ordem crescente ao retornar `GET /api/personal/plans/{plan_id}`.
3. WHEN o Personal_Trainer envia `PUT /api/personal/sessions/{session_id}` com novo `order_index`, THE API SHALL atualizar a posição da Sessão sem alterar as demais Sessões do Plano.
4. WHEN o Personal_Trainer envia `DELETE /api/personal/sessions/{session_id}`, THE API SHALL remover a Sessão e todos os Exercícios_Prescritos associados em cascata.
5. THE API SHALL permitir que um Plano contenha entre 1 e 7 Sessões.
6. IF o Personal_Trainer tentar criar uma Sessão em um Plano que não lhe pertence, THEN THE API SHALL retornar HTTP 403.

---

### Requisito 3: Adição de Exercícios por Grupo Muscular

**User Story:** Como Personal_Trainer, quero adicionar exercícios a cada sessão classificados por grupo muscular, com séries, repetições, carga e notas de execução, para que o Paciente saiba exatamente o que realizar.

#### Critérios de Aceitação

1. WHEN o Personal_Trainer envia `POST /api/personal/exercises` com `session_id` válido e ao menos `exercise_id` ou `exercise_name` preenchido, THE API SHALL criar o Exercício_Prescrito e retornar o objeto com status HTTP 201.
2. THE API SHALL ordenar os Exercícios_Prescritos de uma Sessão pelo campo `order_index` em ordem crescente.
3. WHEN o Personal_Trainer envia `PUT /api/personal/exercises/{exercise_id}` com campos válidos, THE API SHALL atualizar o Exercício_Prescrito.
4. WHEN o Personal_Trainer envia `DELETE /api/personal/exercises/{exercise_id}`, THE API SHALL remover o Exercício_Prescrito sem afetar outros exercícios da Sessão.
5. THE API SHALL aceitar `reps` como string para suportar faixas (ex.: `"8-12"`) e valores fixos (ex.: `"15"`).
6. THE API SHALL aceitar `load` como string para suportar formatos variados (ex.: `"20kg"`, `"60% 1RM"`, `"peso corporal"`).
7. WHERE o Personal_Trainer fornecer `exercise_id`, THE API SHALL validar que o exercício existe na Biblioteca e está ativo (`is_active = true`).
8. THE API SHALL associar o `muscle_group` do exercício da Biblioteca ao Exercício_Prescrito para permitir filtragem por grupo muscular na visualização do treino.

---

### Requisito 4: Biblioteca de Exercícios

**User Story:** Como Personal_Trainer, quero acessar e gerenciar uma biblioteca de exercícios com descrição, grupo muscular, dificuldade e mídia de execução, para que eu possa prescrever exercícios com instruções claras para o Paciente.

#### Critérios de Aceitação

1. WHEN o Personal_Trainer envia `GET /api/personal/exercises/library` sem filtros, THE API SHALL retornar todos os exercícios globais e os exercícios privados criados pelo Personal_Trainer autenticado.
2. WHEN o Personal_Trainer envia `GET /api/personal/exercises/library?q={termo}`, THE API SHALL retornar exercícios cujo `name` contenha o termo (busca case-insensitive).
3. WHEN o Personal_Trainer envia `GET /api/personal/exercises/library?muscle_group={grupo}`, THE API SHALL retornar apenas exercícios do grupo muscular especificado.
4. WHEN o Personal_Trainer envia `POST /api/personal/exercises/library` com `name` e `muscle_group` válidos, THE API SHALL criar o exercício com `created_by = user.id` e retornar o objeto com status HTTP 201.
5. THE API SHALL aceitar `video_url` e `thumbnail` como URLs opcionais para mídia de execução.
6. WHEN o Personal_Trainer envia `DELETE /api/personal/exercises/library/{exercise_id}` para um exercício de sua autoria, THE API SHALL marcar o exercício como `is_active = false` (soft delete).
7. IF o Personal_Trainer tentar deletar um exercício global (sem `created_by`), THEN THE API SHALL retornar HTTP 403.
8. WHEN o Paciente autenticado envia `GET /api/patient/exercises/library?exercise_id={id}`, THE API SHALL retornar os detalhes do exercício incluindo `description`, `video_url` e `thumbnail`.

---

### Requisito 5: Visualização do Treino pelo Paciente

**User Story:** Como Paciente, quero visualizar o plano de treino ativo prescrito pelo meu Personal_Trainer no portal `/paciente/`, para que eu saiba quais exercícios realizar em cada sessão.

#### Critérios de Aceitação

1. WHEN o Paciente autenticado envia `GET /api/patient/workout/active-plan`, THE API SHALL retornar o Plano ativo mais recente (`is_active = true`, `is_published = true`) com todas as Sessões e Exercícios_Prescritos aninhados.
2. IF não existir Plano ativo publicado para o Paciente, THEN THE API SHALL retornar HTTP 404 com mensagem descritiva.
3. THE API SHALL incluir no retorno do Exercício_Prescrito os campos `exercise_name`, `muscle_group`, `sets`, `reps`, `load`, `rest_time`, `execution_notes` e o link de mídia (`video_url`, `thumbnail`) quando disponíveis.
4. WHILE o Paciente estiver visualizando uma Sessão, THE Portal_Paciente SHALL exibir os exercícios agrupados por `muscle_group`.
5. THE Portal_Paciente SHALL exibir as Sessões do Plano em ordem crescente de `order_index`.

---

### Requisito 6: Registro de Check-in de Sessão pelo Paciente

**User Story:** Como Paciente, quero registrar a execução de uma sessão de treino informando RPE, cargas utilizadas e observações, para que meu Personal_Trainer acompanhe minha evolução.

#### Critérios de Aceitação

1. WHEN o Paciente autenticado envia `POST /api/patient/workout/checkin` com `session_id`, `rpe` e `performed_at` válidos, THE API SHALL criar o Check-in_de_Sessão e retornar o objeto com status HTTP 201.
2. THE API SHALL aceitar `rpe` como inteiro no intervalo fechado [0, 10].
3. IF o Paciente enviar `rpe` fora do intervalo [0, 10], THEN THE API SHALL retornar HTTP 422 com mensagem descritiva.
4. THE API SHALL aceitar `exercise_logs` como lista de objetos `{exercise_id, sets_done, reps_done, load_used, notes}` representando a execução real de cada exercício.
5. WHEN o Paciente envia um Check-in_de_Sessão, THE API SHALL associar o registro ao `patient_id` extraído do token de autenticação, sem aceitar `patient_id` no corpo da requisição.
6. THE API SHALL permitir que o Paciente registre no máximo um Check-in_de_Sessão por Sessão por dia calendário.
7. IF o Paciente tentar registrar um segundo Check-in_de_Sessão para a mesma Sessão no mesmo dia, THEN THE API SHALL retornar HTTP 409 com mensagem descritiva.
8. WHEN o Paciente envia `GET /api/patient/workout/checkins`, THE API SHALL retornar os Check-ins_de_Sessão do Paciente autenticado em ordem decrescente de `performed_at`.

---

### Requisito 7: RPE (Escala de Borg 0–10)

**User Story:** Como Paciente, quero informar meu esforço percebido (RPE) ao final de cada sessão de treino, para que o Personal_Trainer avalie a intensidade do treino prescrito.

#### Critérios de Aceitação

1. THE API SHALL armazenar o `rpe` como inteiro no campo `rpe` do Check-in_de_Sessão.
2. WHEN o Personal_Trainer envia `GET /api/personal/clients/{client_id}/session-checkins`, THE API SHALL retornar os Check-ins_de_Sessão do Paciente incluindo o campo `rpe`.
3. THE Portal_Paciente SHALL exibir a escala RPE como seletor visual de 0 a 10 com rótulos descritivos (0 = Repouso, 5 = Moderado, 10 = Máximo).
4. WHEN o Personal_Trainer visualiza o histórico de check-ins de um Paciente, THE Portal_Personal SHALL exibir a média de RPE por Sessão ao longo do tempo.

---

### Requisito 8: Histórico de Evolução de Carga por Exercício

**User Story:** Como Personal_Trainer e como Paciente, quero visualizar o histórico de cargas utilizadas em cada exercício ao longo do tempo, para que seja possível acompanhar a progressão de carga.

#### Critérios de Aceitação

1. WHEN o Personal_Trainer envia `GET /api/personal/clients/{client_id}/exercise-history/{exercise_id}`, THE API SHALL retornar a lista de registros `{performed_at, load_used, reps_done, sets_done, rpe}` em ordem crescente de `performed_at`.
2. WHEN o Paciente envia `GET /api/patient/workout/exercise-history/{exercise_id}`, THE API SHALL retornar o mesmo Histórico_de_Carga para o Paciente autenticado.
3. THE API SHALL incluir apenas registros provenientes de Check-ins_de_Sessão onde `exercise_id` corresponde ao exercício solicitado.
4. IF não existirem registros para o exercício solicitado, THEN THE API SHALL retornar uma lista vazia com status HTTP 200.
5. THE Portal_Paciente SHALL exibir o Histórico_de_Carga como gráfico de linha com `performed_at` no eixo X e `load_used` (valor numérico extraído) no eixo Y.

---

### Requisito 9: Busca e Filtragem na Biblioteca de Exercícios

**User Story:** Como Personal_Trainer, quero buscar exercícios na biblioteca por nome e grupo muscular, para que eu encontre rapidamente o exercício desejado ao montar uma sessão.

#### Critérios de Aceitação

1. WHEN o Personal_Trainer envia `GET /api/personal/exercises/library?q={termo}&muscle_group={grupo}`, THE API SHALL retornar exercícios que satisfaçam simultaneamente ambos os filtros.
2. THE API SHALL retornar resultados em ordem alfabética por `name`.
3. THE API SHALL limitar a resposta a 100 exercícios por requisição.
4. WHEN o Personal_Trainer envia `GET /api/personal/exercises/library` sem filtros, THE API SHALL retornar todos os exercícios ativos disponíveis para o Personal_Trainer autenticado.
5. THE API SHALL aceitar os seguintes valores para `muscle_group`: `peito`, `costas`, `pernas`, `ombros`, `bracos`, `core`, `full_body`, `gluteos`, `panturrilha`.
6. IF o Personal_Trainer enviar `muscle_group` com valor não reconhecido, THEN THE API SHALL retornar HTTP 422 com a lista de valores válidos.

---

### Requisito 10: Controle de Acesso e Isolamento de Dados

**User Story:** Como administrador do sistema, quero garantir que cada profissional acesse apenas os dados de seus próprios pacientes e planos, para que a privacidade e a segurança dos dados sejam preservadas.

#### Critérios de Aceitação

1. THE API SHALL rejeitar com HTTP 401 qualquer requisição aos endpoints do módulo de treino que não contenha token de autenticação válido.
2. THE API SHALL rejeitar com HTTP 403 qualquer tentativa de um Personal_Trainer acessar Planos, Sessões ou Exercícios_Prescritos de outro Personal_Trainer.
3. THE API SHALL rejeitar com HTTP 403 qualquer tentativa de um Paciente acessar dados de treino de outro Paciente.
4. WHEN um Paciente é desvinculado de um Personal_Trainer (`ProfessionalClient.is_active = false`), THE API SHALL impedir que o Personal_Trainer crie novos Planos para esse Paciente, retornando HTTP 403.
5. THE API SHALL permitir que um Paciente acesse apenas os Planos publicados (`is_published = true`) pelo Personal_Trainer vinculado.

