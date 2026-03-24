// Resultados ST validados — extraídos de PlanPresentacion.md
// Fuente: archivos .st en ST_Hinton_Ontologia/, validados con st v2.6.0

export const ST_ONTOLOGIA = {
  id: '01_Ontologia_Base',
  type: 'FOL',
  status: 'SATISFACIBLE',
  derives: [
    {
      id: 'ont_repr_econ',
      conclusion: 'GoodRepresentation(rep_alpha) → EconomicalDescription(rep_alpha)',
      via: 'ont_08 + ont_30 · UI: ∀xφ(x) ⊢ φ(a)',
      valid: true,
      natural: 'Si rep_alpha es una buena representación, entonces provee una descripción económica. Derivado por instanciación universal del axioma ont_08 sobre el testigo rep_alpha.',
    },
    {
      id: 'ont_repr_recon',
      conclusion: 'GoodRepresentation(rep_alpha) → ReconstructiveCapacity(rep_alpha)',
      via: 'ont_09 + ont_30 · UI: ∀xφ(x) ⊢ φ(a)',
      valid: true,
      natural: 'Si rep_alpha es una buena representación, entonces tiene capacidad reconstructiva. Derivado por instanciación universal del axioma ont_09 sobre rep_alpha.',
    },
    {
      id: 'ont_pop_dist',
      conclusion: 'PopulationCode(pop_code) → DistributedCode(pop_code)',
      via: 'ont_10 + ont_25 · UI: ∀xφ(x) ⊢ φ(a)',
      valid: true,
      natural: 'Todo código poblacional es un código distribuido. El experimento de Sparks lo ilustra: la información no reside en una sola neurona sino en el promedio de la población.',
    },
    {
      id: 'ont_pop_robust',
      conclusion: 'PopulationCode(pop_code) → RobustToLocalLoss(pop_code)',
      via: 'ont_11 + ont_25 · UI: ∀xφ(x) ⊢ φ(a)',
      valid: true,
      natural: 'Todo código poblacional es robusto frente a pérdida local de neuronas. Perder neuronas al azar tiene poco efecto sobre el promedio de la población.',
    },
  ],
}

export const ST_ARGUMENTO = {
  id: '02_Argumento_Global',
  type: 'Proposicional',
  chains: [
    { formula: 'BRAIN → INFO → REPR', valid: true, pattern: 'silogismo hipotético + modus ponens' },
    { formula: 'BACK → MODEL → IDEAL → EPI', valid: true, pattern: 'modus ponens encadenado' },
    { formula: 'BACK → LIMIT → UNSUP', valid: true, pattern: 'silogismo hipotético + modus ponens' },
    { formula: 'HIER → DEEP → CONV', valid: true, pattern: 'silogismo hipotético + modus ponens' },
  ],
  contingent: [
    { formula: 'GOOD → (ECON ∧ RECON)', valuations: '5/8 verdaderas', note: 'compromiso empírico, no verdad lógica' },
    { formula: '(BACK→LIMIT) → (LIMIT→UNSUP)', valuations: '6/8 verdaderas', note: 'contingente' },
  ],
  nodes: [
    { id: 'CEREBRO', label: 'CEREBRO', x: 0 },
    { id: 'INFO', label: 'INFORMACIÓN', x: 1 },
    { id: 'REPR', label: 'REPRESENTACIÓN', x: 2 },
    { id: 'MODELO', label: 'MODELO', x: 3 },
    { id: 'CONV', label: 'CONVERGENCIA', x: 4 },
  ],
  edges: [
    { source: 'CEREBRO', target: 'INFO' },
    { source: 'INFO', target: 'REPR' },
    { source: 'REPR', target: 'MODELO' },
    { source: 'MODELO', target: 'CONV' },
  ],
}

export const ST_PRESUPUESTOS = {
  id: '05_Presupuestos_Expandidos',
  type: 'Proposicional + Epistémica S5 + Modal K',
  paths: [
    'BRAIN_COMP → INFO_REAL → INTERNAL_REPR',
    'GOOD_METRIC → GOOD_ECON ∧ GOOD_RECON → INTERNAL_REPR',
    'ROBUST_REAL → INTERNAL_REPR',
    'SPATIAL_COMP → INTERNAL_REPR',
    'UNSUP_NEC → INTERNAL_REPR',
  ],
  epistemic: [
    { formula: 'K(P) → P', valid: true, system: 'S5', note: 'Axioma T: reflexividad del conocimiento' },
  ],
  modal: [
    { formula: '◇(CONV_POSS)', status: 'satisfacible', system: 'Modal K' },
    { formula: '◇(INTERNAL_REPR)', status: 'satisfacible', system: 'Modal K' },
  ],
}

export const ST_EMERGENCIA = {
  id: '07_Emergencia_vs_Reduccion',
  type: 'Proposicional + Modal K',
  thesis: 'REDUCT_INFO ∥ EMERG_WEAK — logically compatible positions',
  derivations: [
    {
      id: 'emerg_formal',
      conclusion: 'DISTRIBUTED_REPR → ¬(P = Σ Nᵢ) → EMERG_WEAK',
      via: 'Definición formal: si P no se deriva de partes individuales, P es emergente (débil)',
      valid: true,
      natural: 'Las representaciones distribuidas de Hinton satisfacen la definición formal de emergencia débil: la propiedad P del conjunto no está contenida en ninguna unidad Nᵢ individual.',
    },
    {
      id: 'reduct_info_move',
      conclusion: 'P = g(R) → REDUCT_INFO',
      via: 'Si P es función completa de R (pesos), entonces P es reducible a R en principio',
      valid: true,
      natural: 'Hinton asume implícitamente que toda propiedad cognitiva P es función de la configuración de pesos R. Esto es reduccionismo informacional: no hay surplus ontológico.',
    },
    {
      id: 'epist_irreduc',
      conclusion: 'P ← R ∧ (P ↚ {Nᵢ}) → ONTO_EPIST',
      via: 'P es derivable de R pero no predecible desde partes individuales sin simular R',
      valid: true,
      natural: 'La bifurcación onto-epistémica: ontológicamente todo es R (monismo), pero epistémicamente P no puede predecirse sin simular la red completa. Kim (1999) argumentaría que esto es inestable.',
    },
    {
      id: 'continuous_emerg',
      conclusion: '∂P/∂t ≠ 0 → CONT_EMERG',
      via: 'En cada paso de entrenamiento, P cambia continuamente con R — no hay salto cualitativo discreto',
      valid: true,
      natural: 'La emergencia en redes neuronales es continua: las propiedades emergentes varían suavemente con cada actualización de pesos. Esto no es ni emergencia fuerte clásica ni reducción simple.',
    },
  ],
  tensions: [
    {
      id: 'emerg_reduct',
      presupuesto: 'REDUCT_INFO',
      presupuestoLabel: 'Toda propiedad P es función de R — reducible en principio',
      objecion: 'EMERG_WEAK',
      objecionLabel: 'P no es predecible desde {Nᵢ} sin simular R — irreducible en práctica',
      presupuestoCheck: true,
      objecionCheck: 'satisfacible',
    },
    {
      id: 'silence_ontological',
      presupuesto: 'EMERG_SILENCE',
      presupuestoLabel: 'Hinton nunca menciona emergencia — la reemplaza por "información"',
      objecion: 'DISTRIBUTED_REPR → EMERG_WEAK',
      objecionLabel: 'Pero sus representaciones distribuidas SON emergentes por definición',
      presupuestoCheck: true,
      objecionCheck: 'válida',
    },
  ],
  compatibility: {
    formula: 'REDUCT_INFO ∥ EMERG_WEAK',
    status: 'SATISFACIBLE',
    note: 'Ambas posiciones son lógicamente compatibles. El monismo ontológico (todo es R) convive con la emergencia epistémica (P no se predice sin simular). La tensión no es lógica sino filosófica: Kim (1999) vs. funcionalismo.',
  },
}

export const ST_CRITICA = {
  id: '06_Critica_Ontologica',
  type: 'Proposicional + Epistémica S5 + Modal K',
  objections: [
    { formula: 'METAPHOR_ONLY → ¬BRAIN_COMP', valid: true },
    { formula: 'REPR_INSTR → ¬INTERNAL_REPR', valid: true },
    { formula: 'BACK_IMPL → ¬BACK_BIO', valid: true },
    { formula: 'METRIC_UNSTABLE → ¬GOOD_METRIC', valid: true },
    { formula: 'CONV_WEAK → ¬CONV_STRONG', valid: true },
  ],
  contradictions: [
    { formula: 'BRAIN_COMP ∧ ¬BRAIN_COMP', status: 'INSATISFACIBLE' },
    { formula: 'INTERNAL_REPR ∧ ¬INTERNAL_REPR', status: 'INSATISFACIBLE' },
  ],
  possibilities: [
    { formula: '◇(¬BRAIN_COMP)', status: 'satisfacible', system: 'Modal K' },
    { formula: '◇(¬INTERNAL_REPR)', status: 'satisfacible', system: 'Modal K' },
    { formula: '◇(¬IDEAL_OK)', status: 'satisfacible', system: 'Modal K' },
  ],
  tensions: [
    {
      id: 'brain_comp',
      presupuesto: 'BRAIN_COMP',
      presupuestoLabel: 'El cerebro es computacionalmente inteligible',
      objecion: '◇(¬BRAIN_COMP)',
      objecionLabel: 'Lógicamente posible que no lo sea',
      presupuestoCheck: true,
      objecionCheck: 'satisfacible',
    },
    {
      id: 'internal_repr',
      presupuesto: 'INTERNAL_REPR',
      presupuestoLabel: 'Las representaciones internas son reales',
      objecion: 'REPR_INSTR → ¬INTERNAL_REPR',
      objecionLabel: 'Si son instrumentales, no son reales',
      presupuestoCheck: true,
      objecionCheck: 'válida',
    },
    {
      id: 'back_bio',
      presupuesto: 'BACK_BIO',
      presupuestoLabel: 'La retropropagación es biológicamente plausible',
      objecion: 'BACK_IMPL → ¬BACK_BIO',
      objecionLabel: 'La implementación implica su implausibilidad biológica',
      presupuestoCheck: true,
      objecionCheck: 'válida',
    },
  ],
}

// ── Definiciones en lenguaje natural de cada variable proposicional ────────────
export const VAR_DEFINITIONS = {
  BRAIN_COMP:    'El cerebro puede tratarse como un sistema computacionalmente inteligible. Es el presupuesto ontológico fundacional del conexionismo — posiblemente verdadero, pero no lógicamente necesario.',
  INTERNAL_REPR: 'Las representaciones internas (las activaciones en capas ocultas) son entidades explicativas legítimas, no meros artefactos del modelo. Sin esto, la red "funciona" pero no "explica".',
  BACK_BIO:      'La retropropagación tiene un análogo biológicamente plausible en el cerebro. Cuestionado: requiere simetría de pesos y señal de error global que no se han identificado en neuronas reales.',
  GOOD_METRIC:   'Existe una métrica válida para evaluar representaciones: económica (pocas unidades activas) + reconstructiva (se puede recuperar el input). Sin esta métrica, "buena representación" es indefinida.',
  CONV_STRONG:   'La convergencia entre computación y biología es empíricamente fuerte y justificable — no solo una esperanza programática. Andersen & Zipser (1988) son la evidencia más sólida disponible.',
  METAPHOR_ONLY: 'El modelo cerebro-computadora es solo una metáfora heurística de época (cf. Daugman 1992), sin compromiso ontológico real sobre cómo funciona el cerebro.',
  REPR_INSTR:    'La representación es un recurso instrumental del modelo — útil para predecir, pero sin referente real en el sistema cognitivo. Posición instrumentalista (vs. realista).',
  BACK_IMPL:     'La retropropagación es computacionalmente eficaz pero biológicamente implausible. Su éxito como herramienta no implica que el cerebro haga algo similar.',
  CONV_WEAK:     'La convergencia es solo una esperanza programática — un resultado que el programa de investigación aspira a lograr, no algo ya establecido empíricamente.',
  INFO_REAL:     'El procesamiento de información es una descripción real del cerebro, no solo una metáfora conveniente del lenguaje cognitivo.',
  GOOD_ECON:     'Una buena representación es económica: describe el input con muchos menos parámetros que el input mismo (compresión significativa).',
  GOOD_RECON:    'Una buena representación es reconstructiva: a partir de la representación es posible recuperar aproximadamente el input original.',
  ROBUST_REAL:   'La robustez ante pérdida de neuronas es una propiedad real de los códigos poblacionales biológicos, demostrada en el experimento de Sparks (colículo superior).',
  SPATIAL_COMP:  'El procesamiento espacial (orientación, posición) es computacionalmente modelable con redes artificiales — apoyado por Andersen & Zipser.',
  UNSUP_NEC:     'El aprendizaje no supervisado es necesario para capturar la estructura estadística del mundo sin instructor externo — motivación directa de PCA, Kohonen y Hebb.',
  REDUCT_INFO:   'Reduccionismo informacional: toda propiedad cognitiva P es función de los pesos R = {wᵢⱼ}. No hay surplus ontológico. La emergencia es solo una descripción de nivel superior, no una propiedad metafísica nueva.',
  EMERG_WEAK:    'Emergentismo epistémico débil: P es determinada por {Nᵢ, R} pero no predecible desde ningún subconjunto propio sin simular el sistema completo. Reducible en principio, irreducible en práctica.',
  EMERG_SILENCE: 'Hinton (1992) no menciona la emergencia ni una vez. Reemplaza el vocabulario emergentista por vocabulario informacional (representación distribuida, codificación, patrones). Decisión ontológica implícita.',
  ONTO_EPIST:    'Bifurcación onto-epistémica: monismo ontológico (todo es R/pesos) + emergencia epistémica (P no es predecible sin simular R). Posición filosóficamente inestable según Kim (1999).',
  CONT_EMERG:    'Emergencia continua: en cada paso de entrenamiento ∂P/∂t ≠ 0 — las propiedades emergentes cambian suavemente, sin saltos cualitativos. Ontología de gradiente, no de niveles.',
}

// ── Resumen ST en lenguaje natural ─────────────────────────────────────────────
export const ST_RESUMEN_NATURAL = `El motor ST validó la estructura lógica del argumento de Hinton (1992) en tres niveles:

1. VÁLIDO (proposicional): Las conclusiones principales se siguen necesariamente de las premisas. Si aceptas que el cerebro es computacionalmente inteligible (BRAIN_COMP) y que hay procesamiento real de información (INFO_REAL), entonces las representaciones internas son centrales (INTERNAL_REPR). Esta cadena es lógicamente sólida.

2. SATISFACIBLE pero no necesario (Modal K): La convergencia entre cerebro y red artificial es posible (◇CONV_POSS), pero no necesaria (¬□CONV). Esto significa que Hinton hace una apuesta empírica, no una afirmación lógicamente inevitable. Que las redes funcionen bien no prueba que el cerebro funcione igual.

3. CONTINGENTE (empírico): Los presupuestos centrales — BRAIN_COMP, INTERNAL_REPR, BACK_BIO — son empíricamente cuestionables. Las objeciones (METAPHOR_ONLY, REPR_INSTR, BACK_IMPL) son lógicamente compatibles y no han sido refutadas. La tensión no es decorativa: es una apertura filosófica real que el texto de 1992 no cierra.

Conclusión ST: El argumento de Hinton es formalmente coherente pero descansa en presupuestos que podrían ser falsos. Su valor es programático — abre un programa de investigación progresivo — no demostrativo.`

// ── Supuestos activos por slide ────────────────────────────────────────────────
export const SLIDE_SUPUESTOS = {
  S01: {
    slide: 'Apertura — ¿El cerebro es una computadora?',
    presupuestos: ['BRAIN_COMP', 'METAPHOR_ONLY'],
    tension: 'brain_comp',
    nota: 'Esta slide pone en juego el presupuesto fundacional: ¿el cerebro es computacionalmente inteligible o es solo una metáfora útil? Daugman (1992) sugiere que cada época interpreta el cerebro con su tecnología dominante — lo que no refuta BRAIN_COMP, pero lo relativiza históricamente.',
  },
  S02: {
    slide: 'Neurona real — Biología vs. artificialidad',
    presupuestos: ['BRAIN_COMP'],
    tension: 'brain_comp',
    nota: 'Mostrar la neurona biológica y luego la artificial presupone que la comparación es pertinente — que hay suficiente analogía estructural para que una explique la otra. Este es BRAIN_COMP en su versión más directa.',
  },
  S03: {
    slide: 'Neurona artificial — Idealización',
    presupuestos: ['BRAIN_COMP', 'GOOD_METRIC'],
    tension: 'brain_comp',
    nota: 'La idealización (suma ponderada + sigmoide) es ya una decisión teórica. Presupone que la biología puede simplificarse sin perder lo esencial (BRAIN_COMP) y que los pesos capturan algo significativo sobre representación (GOOD_METRIC).',
  },
  S04: {
    slide: 'Arquitectura MLP — Capas y forward pass',
    presupuestos: ['BRAIN_COMP', 'INTERNAL_REPR'],
    tension: 'internal_repr',
    nota: 'Las capas ocultas son la apuesta central de INTERNAL_REPR: se asume que las activaciones de la capa 2 representan algo real sobre el input, no son solo transformaciones matemáticas intermedias.',
  },
  S05: {
    slide: 'Entrenamiento supervisado — Ciclo de 4 fases',
    presupuestos: ['BACK_BIO', 'GOOD_METRIC'],
    tension: 'back_bio',
    nota: 'El entrenamiento supervisado presupone que existe una señal de error válida (GOOD_METRIC) y que el ajuste de pesos tiene algún análogo biológico (BACK_BIO). Sin BACK_BIO, el entrenamiento es útil como ingeniería pero no como modelo del cerebro.',
  },
  S06: {
    slide: 'Retropropagación — Gradientes y plausibilidad',
    presupuestos: ['BACK_BIO'],
    tension: 'back_bio',
    nota: 'Esta slide expone directamente el presupuesto más cuestionado. La retropropagación requiere simetría de pesos y acceso global al error — nada de esto tiene un mecanismo neural conocido. BACK_BIO está bajo máxima tensión aquí.',
  },
  S07: {
    slide: 'Alcances y crítica — ¿Explica o solo funciona?',
    presupuestos: ['BRAIN_COMP', 'INTERNAL_REPR', 'CONV_STRONG'],
    tension: 'internal_repr',
    nota: 'La pregunta central de esta slide es exactamente la tensión entre INTERNAL_REPR y REPR_INSTR. Un clasificador que funciona bien no necesariamente "representa" en el sentido filosófico. Daugman cierra el círculo: el éxito funcional no valida la ontología.',
  },
  S08: {
    slide: 'Límites — Los 4 problemas de la retropropagación',
    presupuestos: ['BACK_BIO', 'GOOD_METRIC', 'CONV_STRONG'],
    tension: 'back_bio',
    nota: 'Los cuatro límites (supervisor, costo O(n³), mínimos locales, implausibilidad biológica) atacan directamente BACK_BIO y CONV_STRONG. Esta es la slide más crítica: señala que el programa de investigación tiene obstáculos empíricos no resueltos.',
  },
  S09: {
    slide: 'Aprendizaje no supervisado — PCA, Kohonen, Hebb',
    presupuestos: ['INTERNAL_REPR', 'GOOD_METRIC', 'UNSUP_NEC'],
    tension: 'internal_repr',
    nota: 'El aprendizaje no supervisado presupone UNSUP_NEC (la estructura existe sin supervisor) y que las representaciones emergentes son significativas (INTERNAL_REPR). Hebb es el más biológicamente plausible; PCA y Kohonen son más instrumentales.',
  },
  S10: {
    slide: 'Representaciones distribuidas — Local vs. distribuida',
    presupuestos: ['INTERNAL_REPR', 'BRAIN_COMP'],
    tension: 'internal_repr',
    nota: 'La representación distribuida es la tesis más fuerte de INTERNAL_REPR: el conocimiento no está en neuronas individuales sino en patrones. Esto conecta directamente con Bechtel (2001) y su pregunta sobre qué constituye una representación.',
  },
  S11: {
    slide: 'Códigos demográficos — Experimento de Sparks',
    presupuestos: ['INTERNAL_REPR', 'ROBUST_REAL', 'BRAIN_COMP'],
    tension: 'internal_repr',
    nota: 'Evidencia biológica directa: el experimento de Sparks apoya ROBUST_REAL e INTERNAL_REPR en el colículo superior. Pero atención: confirma que hay código poblacional, no que sea idéntico al mecanismo de las redes artificiales.',
  },
  S12: {
    slide: 'De 1992 a hoy — Historia y realizabilidad múltiple',
    presupuestos: ['CONV_STRONG', 'BRAIN_COMP'],
    tension: 'brain_comp',
    nota: 'La historia 1992–2024 es ambivalente: el programa conexionista fue enormemente exitoso como ingeniería, pero ¿siguió siendo progresivo como neurofilosofía? Putnam/Fodor (realizabilidad múltiple) abren la posibilidad de que BRAIN_COMP no requiera identidad de implementación.',
  },
  S12b: {
    slide: 'Convergencia — Andersen & Zipser',
    presupuestos: ['CONV_STRONG', 'INTERNAL_REPR', 'SPATIAL_COMP'],
    tension: 'brain_comp',
    nota: 'La evidencia más fuerte a favor de CONV_STRONG: redes entrenadas en tareas espaciales desarrollan unidades similares a neuronas parietales. Pero cuidado: similaridad no es identidad. ◇CONV_POSS es satisfacible; □CONV no lo es.',
  },
  S12c: {
    slide: '¿Por qué no emergencia? — El silencio ontológico de Hinton',
    presupuestos: ['REDUCT_INFO', 'EMERG_WEAK', 'INTERNAL_REPR', 'ONTO_EPIST'],
    tension: 'emerg_reduct',
    nota: 'Hinton evita la emergencia reemplazándola por lenguaje informacional. Pero sus representaciones distribuidas satisfacen la definición formal de emergencia débil: P ≠ ΣNᵢ. El resultado es una posición filosóficamente rica pero inestable: monismo ontológico + emergencia epistémica. Kim (1999) argumentaría que esta combinación es insostenible — o P es real y causalmente eficaz, o es un epifenómeno descriptivo.',
  },
  S13: {
    slide: 'Cierre argumental — Tesis, arco, pregunta',
    presupuestos: ['BRAIN_COMP', 'INTERNAL_REPR', 'BACK_BIO', 'CONV_STRONG'],
    tension: 'brain_comp',
    nota: 'Todos los presupuestos están en juego. La tesis central no afirma que el cerebro sea una red neuronal — afirma que las redes son una apuesta en un programa de investigación. Su valor explicativo depende de si el programa genera predicciones nuevas, corroborables y sorprendentes sobre cognición real.',
  },
}

export const HINTON_CONTEXT = `
TEXTO DE REFERENCIA
Hinton, G. E. (1992). "How Neural Networks Learn from Experience." Scientific American, 267(3), 144-151.
IMPORTANTE: Es un artículo de divulgación científica (Scientific American), no un paper técnico. Su estatus es de propuesta programática dirigida a público amplio.

TESIS CENTRAL
La red neuronal artificial no es una descripción del cerebro, sino una apuesta en un programa de investigación (en sentido lakatosiano). Su valor explicativo — no solo instrumental — depende de si ese programa genera predicciones nuevas y corroborables sobre cognición real.

ESTRUCTURA DE LA PRESENTACIÓN (13 slides)
S01-Apertura: El cerebro ¿es una computadora o es una apuesta? Contexto: Daugman → Hinton → Bechtel.
S02-Neurona real: Visualización 3D interactiva. Comparación biológica-artificial.
S03-Neurona artificial: Pesos ajustables, funciones sigmoidal/lineal/umbral.
S04-Arquitectura: Red MLP 2→8→8→1 en vivo con TensorFlow.js.
S05-Entrenamiento: Ciclo de 4 fases (Presentar→Evaluar→Calcular EP→Actualizar).
S06-Retropropagación: Flujo forward/backward, gradientes, timeline histórico (Werbos 1974 → Hinton 1986).
S07-Alcances+Crítica: Clasificador MNIST en vivo. Pregunta: ¿explica o solo funciona? Cierre con Daugman.
S08-Límites: 4 límites analíticos + alternativa hebbiana + superficie 3D de error.
S09-No supervisado: PCA, Competitivo, Kohonen SOM, Hebb — visualizaciones animadas.
S10-Repr. distribuidas: Local vs. distribuida vs. sparse. RNNs. Puente a Bechtel.
S11-Códigos demográficos: Experimento de Sparks, cálculo poblacional, ojo de mono interactivo.
S12-De 1992 a hoy: Timeline histórico + Putnam/Fodor (realizabilidad múltiple) + interpretabilidad.
S13-Cierre argumental: Tesis central, arco Daugman-Hinton-Bechtel, pregunta para discusión.

CONCEPTOS TÉCNICOS CLAVE
- Neurona artificial: suma ponderada de entradas → función de activación → salida
- Retropropagación: propaga el error desde la salida hacia capas anteriores via regla de la cadena
- Representación distribuida: el conocimiento está en patrones de activación, no en unidades individuales
- Buena representación: económica (baja descripción de las unidades ocultas) + reconstructiva (la entrada puede recuperarse)
- Aprendizaje hebbiano: "neuronas que se disparan juntas, se conectan juntas" (Hebb 1949). No requiere señal de error externa. Oja (1982) implementó PCA con reglas hebbianas locales.
- Códigos demográficos: la información reside en el promedio de la actividad de una población (experimento de Sparks con colículo superior de mono)
- Sparse coding (Barlow): subconjunto pequeño de neuronas activas — equilibrio entre economía y decodificabilidad

LOS 4 LÍMITES DE LA RETROPROPAGACIÓN
1. Requiere instructor con salida correcta (supervisado)
2. Tiempo de aprendizaje O(n³) — crece más rápido que el tamaño de la red
3. Riesgo de mínimos locales — el espacio de error no es convexo
4. Implausibilidad biológica — requiere simetría de pesos bidireccional y señal de error global sin mecanismo neural conocido

CONVERGENCIA EMPÍRICA: ANDERSEN & ZIPSER
Redes entrenadas con retropropagación para tareas de coordenadas espaciales desarrollaron unidades con campos receptivos similares a neuronas de corteza parietal de mono (área 7a). Esto NO prueba que el cerebro use retropropagación, pero SÍ muestra que el tipo de representaciones que emergen es compatible con lo biológico. Es la evidencia empírica más fuerte del paper.

CONEXIONES CON OTROS AUTORES DEL CURSO
- Daugman (1992): cada época interpreta el cerebro con su metáfora tecnológica dominante (hidráulica→relojería→telégrafo→computadora). El éxito funcional de la red no la diferencia de metáforas anteriores — solo la hace más potente.
- Bechtel (2001): defiende una noción funcional e informacional de representación (regulador de Watt). La pregunta: ¿las unidades ocultas de una red "representan" en el sentido de Bechtel?
- Putnam/Fodor: realizabilidad múltiple — un mismo estado mental puede realizarse en sustratos distintos. Si es verdad, silicio y carbono son equivalentes. Si el sustrato importa (embodiment, emergencia), la equivalencia se rompe.
- Lakatos: programa de investigación progresivo (predice hechos nuevos) vs. degenerativo (solo explica lo conocido). El conexionismo de 2024: ¿sigue siendo progresivo como neurofilosofía, o se convirtió en ingeniería pura?

TEOREMA DE APROXIMACIÓN UNIVERSAL (Cybenko 1989)
Una MLP con una sola capa oculta y función sigmoidal puede aproximar cualquier función continua arbitrariamente bien. Implicación filosófica: si puede aproximar cualquier función, ¿qué significa que "explique" una función cognitiva específica?

TENSIÓN FILOSÓFICA CENTRAL
BRAIN_COMP es un compromiso ontológico fuerte — posiblemente verdadero, pero no lógicamente necesario. ◇(¬BRAIN_COMP) es satisfacible en Modal K. La convergencia es posible, no necesaria.
`
