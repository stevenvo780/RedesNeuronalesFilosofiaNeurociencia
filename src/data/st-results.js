// Resultados reales de ejecutar los archivos .st con `st` v2.6.0
// Generados el 2026-03-23

export const STArgGraph = {
  nodes: [
    { id: 'BRAIN', label: 'Cerebro es una\ncomputadora notable', x: 0 },
    { id: 'INFO',  label: 'La información puede\nprocesarse computacionalmente', x: 1 },
    { id: 'REPR',  label: 'Las representaciones internas\nson centrales', x: 2 },
    { id: 'MODEL', label: 'Las redes artificiales son\nmodelos epistémicos', x: 3 },
    { id: 'CONV',  label: 'Computación y biología\npueden converger', x: 4 },
  ],
  edges: [
    { from: 'BRAIN', to: 'INFO',  label: 'a1' },
    { from: 'INFO',  to: 'REPR',  label: 'a2' },
    { from: 'REPR',  to: 'MODEL', label: 'a15' },
    { from: 'MODEL', to: 'CONV',  label: 'via HIER→DEEP→CONV' },
  ],
  derives: [
    {
      conclusion: 'REPR',
      from: ['h1 (BRAIN)', 'a1 (BRAIN→INFO)', 'a2 (INFO→REPR)'],
      pattern: 'Silogismo hipotético + Modus Ponens',
      status: 'valid',
    },
    {
      conclusion: 'UNSUP',
      from: ['h2 (BACK)', 'a7 (BACK→LIMIT)', 'a8 (LIMIT→UNSUP)'],
      pattern: 'Silogismo hipotético + Modus Ponens',
      status: 'valid',
    },
    {
      conclusion: 'CONV',
      from: ['h3 (HIER)', 'a13 (HIER→DEEP)', 'a14 (DEEP→CONV)'],
      pattern: 'Silogismo hipotético + Modus Ponens',
      status: 'valid',
    },
  ],
}

export const STOntologyDerives = [
  {
    id: 'good-repr-econ',
    conclusion: 'EconomicalDescription(rep_alpha)',
    premises: ['ont_08: ∀x(GoodRepresentation(x) → EconomicalDescription(x))', 'ont_30: GoodRepresentation(rep_alpha)'],
    rule: 'UI: ∀xφ(x) ⊢ φ(a)',
    proof: [
      '1. ∀x(GoodRepresentation(x) → EconomicalDescription(x))  — Premisa (ont_08)',
      '2. GoodRepresentation(rep_alpha)  — Premisa (ont_30)',
      '3. EconomicalDescription(rep_alpha)  — Instanciación Universal (UI)',
    ],
    status: 'valid',
    readableConclusion: 'Una buena representación debe ser económica',
  },
  {
    id: 'good-repr-recon',
    conclusion: 'ReconstructiveCapacity(rep_alpha)',
    premises: ['ont_09: ∀x(GoodRepresentation(x) → ReconstructiveCapacity(x))', 'ont_30: GoodRepresentation(rep_alpha)'],
    rule: 'UI: ∀xφ(x) ⊢ φ(a)',
    proof: [
      '1. ∀x(GoodRepresentation(x) → ReconstructiveCapacity(x))  — Premisa (ont_09)',
      '2. GoodRepresentation(rep_alpha)  — Premisa (ont_30)',
      '3. ReconstructiveCapacity(rep_alpha)  — Instanciación Universal (UI)',
    ],
    status: 'valid',
    readableConclusion: 'Una buena representación debe permitir reconstrucción',
  },
  {
    id: 'pop-code-distributed',
    conclusion: 'DistributedCode(pop_code)',
    premises: ['ont_10: ∀x(PopulationCode(x) → DistributedCode(x))', 'ont_25: PopulationCode(pop_code)'],
    rule: 'UI: ∀xφ(x) ⊢ φ(a)',
    proof: [
      '1. ∀x(PopulationCode(x) → DistributedCode(x))  — Premisa (ont_10)',
      '2. PopulationCode(pop_code)  — Premisa (ont_25)',
      '3. DistributedCode(pop_code)  — Instanciación Universal (UI)',
    ],
    status: 'valid',
    readableConclusion: 'El código poblacional es distribuido',
  },
  {
    id: 'pop-code-robust',
    conclusion: 'RobustToLocalLoss(pop_code)',
    premises: ['ont_11: ∀x(PopulationCode(x) → RobustToLocalLoss(x))', 'ont_25: PopulationCode(pop_code)'],
    rule: 'UI: ∀xφ(x) ⊢ φ(a)',
    proof: [
      '1. ∀x(PopulationCode(x) → RobustToLocalLoss(x))  — Premisa (ont_11)',
      '2. PopulationCode(pop_code)  — Premisa (ont_25)',
      '3. RobustToLocalLoss(pop_code)  — Instanciación Universal (UI)',
    ],
    status: 'valid',
    readableConclusion: 'El código poblacional es robusto ante pérdida local',
  },
]

export const STTensionData = [
  {
    presupuesto: 'BRAIN_COMP — El cerebro puede tratarse como sistema computacionalmente inteligible',
    objecion: 'METAPHOR_ONLY — El cerebro-computadora puede ser solo una metáfora heurística',
    derive: 'METAPHOR_ONLY → ¬BRAIN_COMP · válida',
    modal: '◇(¬BRAIN_COMP) satisfacible en Modal K',
  },
  {
    presupuesto: 'INTERNAL_REPR — Las representaciones internas son entidades explicativas legítimas',
    objecion: 'REPR_INSTR — La representación puede ser un recurso instrumental, no una entidad real',
    derive: 'REPR_INSTR → ¬INTERNAL_REPR · válida',
    modal: '◇(¬INTERNAL_REPR) satisfacible en Modal K',
  },
  {
    presupuesto: 'BACK_BIO — La retropropagación es biológicamente plausible',
    objecion: 'BACK_IMPL — La retropropagación puede ser eficaz pero biológicamente implausible',
    derive: 'BACK_IMPL → ¬BACK_BIO · válida',
    modal: '◇(¬BACK_BIO) satisfacible en Modal K',
  },
  {
    presupuesto: 'CONV_STRONG — La convergencia computacional-biológica es fuerte y justificable',
    objecion: 'CONV_WEAK — La convergencia puede ser solo una esperanza programática',
    derive: 'CONV_WEAK → ¬CONV_STRONG · válida',
    modal: '◇(CONV_POSS) satisfacible en Modal K',
  },
]

export const STContradictions = [
  { formula: 'BRAIN_COMP ∧ ¬BRAIN_COMP', result: 'INSATISFACIBLE ⊘', note: 'La tensión es real, no decorativa' },
  { formula: 'INTERNAL_REPR ∧ ¬INTERNAL_REPR', result: 'INSATISFACIBLE ⊘', note: 'La crítica y el marco son genuinamente incompatibles' },
]

export const STModalResults = [
  { formula: '◇(CONV_POSS)', logic: 'Modal K', result: 'SATISFACIBLE', note: 'La convergencia es posible, no necesaria (□)' },
  { formula: '◇(INTERNAL_REPR)', logic: 'Modal K', result: 'SATISFACIBLE', note: 'Las representaciones internas son contingentes, no necesarias' },
  { formula: 'K(P) → P', logic: 'Epistémica S5', result: 'VÁLIDA', note: 'Axioma T: reflexividad del conocimiento' },
]

export const STInternalReprPaths = [
  'BRAIN_COMP → INFO_REAL → INTERNAL_REPR',
  'GOOD_METRIC → GOOD_ECON ∧ GOOD_RECON → INTERNAL_REPR',
  'ROBUST_REAL → INTERNAL_REPR',
  'SPATIAL_COMP → INTERNAL_REPR',
  'UNSUP_NEC → INTERNAL_REPR',
]
