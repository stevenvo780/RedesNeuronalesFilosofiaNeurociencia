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
Texto de referencia: Hinton, G. E. (1992). How Neural Networks Learn from Experience. Scientific American, 267(3), 144-151.

Tesis central: El cerebro es una computadora notable que aprende creando representaciones internas del mundo a través del ajuste de pesos sinápticos.

Conceptos clave:
- Representaciones distribuidas: la información se almacena distribuida en múltiples unidades, no en una sola
- Buena representación: económica (pocos recursos para describir las unidades ocultas) y reconstructiva (la entrada puede recuperarse desde las ocultas)
- Retropropagación: algoritmo de aprendizaje supervisado que propaga el error hacia atrás para ajustar los pesos
- Aprendizaje no supervisado: componentes principales, competitivo (Kohonen), sparse coding (Barlow)
- Códigos demográficos: un concepto se representa en la actividad distribuida de una población de neuronas (experimento de Sparks con el ojo de mono)
- Convergencia computación/biología: Andersen y Zipser mostraron que redes entrenadas con retropropagación desarrollan unidades similares a neuronas reales de corteza visual

Límites reconocidos por el propio Hinton:
1. Requiere instructor con la salida correcta (supervisado)
2. Tiempo de aprendizaje crece más rápido que el tamaño de la red
3. Riesgo de mínimos locales
4. Retropropagación no es biológicamente plausible (envía errores por las mismas conexiones, sin mecanismo biológico conocido)

Tensión filosófica central: La tesis computacional del cerebro (BRAIN_COMP) es un compromiso ontológico fuerte — posiblemente verdadero, pero no lógicamente necesario (◇¬BRAIN_COMP es satisfacible en Modal K).
`
