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
