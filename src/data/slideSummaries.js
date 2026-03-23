// Summaries shown to mobile users as readable cards (one per slide).
// Each entry matches the SLIDES array index in App.jsx.

export const SLIDE_SUMMARIES = [
  {
    title: 'Introducción',
    emoji: '🧠',
    hook: '',
    bullets: ['Animación de apertura', 'Contexto visual del curso'],
  },
  {
    title: 'Apertura filosófica',
    emoji: '🎯',
    hook: 'La máquina… que aprende… a ser… cerebro.',
    bullets: [
      'Hinton instala un marco computacional-representacional con compromisos ontológicos fuertes.',
      'Mapa argumental ST: CEREBRO → INFORMACIÓN → REPRESENTACIÓN → MODELO → CONVERGENCIA.',
      'La pregunta central: ¿descripción o apuesta?',
    ],
  },
  {
    title: 'La neurona real',
    emoji: '⚡',
    hook: '¿Dónde vive la información?',
    bullets: [
      'Dendrita → soma → axón → terminal sináptica.',
      'El potencial de acción viaja por el axón y libera neurotransmisores en la sinapsis.',
      'La información está distribuida en la eficacia de miles de sinapsis.',
      'Aprender = cambiar la eficacia sináptica.',
    ],
  },
  {
    title: 'La neurona artificial',
    emoji: '🔢',
    hook: 'Hinton no copia la neurona — la idealiza.',
    bullets: [
      'Suma ponderada → función de transferencia → salida.',
      'Tres funciones comparadas: lineal, umbral, sigmoide.',
      'Se perdió geometría, química y temporalidad: idealización deliberada.',
      'La idealización, aunque burda, es poderosa.',
    ],
  },
  {
    title: 'Arquitectura de tres capas',
    emoji: '🏗️',
    hook: 'Las unidades ocultas descubren solas qué representar.',
    bullets: [
      'Red 2→8→8→1 con TensorFlow.js en vivo.',
      'Los pesos codifican qué rasgos detecta cada unidad oculta.',
      'Nadie les dice qué detectar — lo descubren por entrenamiento.',
      'Teorema de Aproximación Universal (Cybenko 1989): poder expresivo ≠ poder explicativo.',
    ],
  },
  {
    title: 'Entrenamiento supervisado',
    emoji: '📉',
    hook: 'El aprendizaje no es magia — es una curva de error cayendo.',
    bullets: [
      '4 fases: PRESENTAR → EVALUAR → CALCULAR ERROR → ACTUALIZAR pesos.',
      'El error cae en tiempo real (frontera de decisión en dataset espiral).',
      'Control de velocidad para ver el proceso paso a paso.',
      'La complejidad como posicionalidad — el cambio persiste.',
    ],
  },
  {
    title: 'Retropropagación',
    emoji: '🔄',
    hook: 'Werbos 1974 → Rumelhart 1982 → Hinton 1986. ¿Por qué costó 12 años?',
    bullets: [
      'Flujo forward (verde →) vs. flujo de error backward (rojo ←).',
      '4 fórmulas: EA, EI, EW, EA propagado.',
      'Los pesos que más cambian se iluminan.',
      'Andersen y Zipser: las unidades ocultas entrenadas se parecen a neuronas reales.',
    ],
  },
  {
    title: 'Alcances + primera crítica',
    emoji: '⚖️',
    hook: '¿Está explicando cómo aprende el cerebro, o simplemente funciona?',
    bullets: [
      'Reconoce dígitos, predice tasas, detecta células precancerosas.',
      'Tensión ST: BRAIN_COMP vs. ◇(¬BRAIN_COMP) — la tesis es contingente.',
      'INTERNAL_REPR vs. REPR_INSTR → ¬INTERNAL_REPR.',
      'BACK_BIO vs. BACK_IMPL → ¬BACK_BIO.',
      '⊘ La contradicción es insatisfacible: la tensión es real.',
    ],
  },
  {
    title: 'Límites del modelo',
    emoji: '🚧',
    hook: 'Hinton mismo los dice. No hay que ir lejos para encontrar las grietas.',
    bullets: [
      '1. Requiere instructor con la salida correcta.',
      '2. El tiempo de aprendizaje crece más rápido que la red.',
      '3. Riesgo de mínimos locales.',
      '4. Retropropagación no tiene mecanismo biológico conocido.',
    ],
  },
  {
    title: 'Aprendizaje no supervisado',
    emoji: '🌀',
    hook: '¿Cómo puede una red representar el mundo si nadie le dice qué es?',
    bullets: [
      'Buena representación: económica + reconstructiva (contingente, no necesario).',
      'PCA: compresión cooperativa a pocos parámetros.',
      'Competitivo/Kohonen: una unidad gana, mapa topográfico.',
      'ST: GoodRepresentation → EconomicalDescription ∧ ReconstructiveCapacity.',
    ],
  },
  {
    title: 'Repr. distribuidas y recurrentes',
    emoji: '🌐',
    hook: '¿Cuántas neuronas para representar un concepto? ¿Una? ¿Mil?',
    bullets: [
      'Distribuida: muchas unidades activas juntas (PCA).',
      'Local: una sola unidad activa (competitivo).',
      'Intermedia (Barlow sparse): pocos activos, reconstrucción buena.',
      'Redes recurrentes: el flujo vuelve atrás → atractores y dinámica temporal.',
    ],
  },
  {
    title: 'Códigos demográficos',
    emoji: '👁️',
    hook: 'Sparks anestesió neuronas: el ojo se movió al promedio de las que quedaban.',
    bullets: [
      'Bump de actividad distribuida sobre una población.',
      'El código es el promedio ponderado — no una sola neurona.',
      'Robustez: perder neuronas al azar apenas afecta el resultado.',
      'ST: PopulationCode → DistributedCode ∧ RobustToLocalLoss.',
    ],
  },
  {
    title: 'De 1992 a hoy',
    emoji: '📅',
    hook: 'Treinta años después: ¿computación y biología convergieron?',
    bullets: [
      'Línea: 1943 McCulloch-Pitts → 1992 Hinton → 2017 Transformers → 2024 LLMs.',
      'Leyes de escala de Kaplan: más parámetros → menos pérdida.',
      'Funcionalismo (Putnam): la función, no el material, define el estado mental.',
      'Tensión: si el sustrato importa, la equivalencia se rompe.',
    ],
  },
  {
    title: 'Convergencia empírica',
    emoji: '🔬',
    hook: 'La convergencia entre redes artificiales y biología: evidencia reciente.',
    bullets: [
      'Interpretabilidad mecanicista: qué computan las capas internas.',
      'Similitud representacional entre redes profundas y corteza visual.',
      'El problema difícil de la conciencia sigue abierto.',
      '◇(CONV_POSS) satisfacible — la convergencia es posible, no necesaria.',
    ],
  },
  {
    title: 'Cierre argumental',
    emoji: '🏁',
    hook: 'Hinton apuesta, no demuestra. Los ST lo hacen visible.',
    bullets: [
      'INTERNAL_REPR se sostiene desde 5 caminos independientes.',
      '◇(¬BRAIN_COMP) — la tesis computacional del cerebro es contingente.',
      'El problema difícil de la conciencia y la ausencia de experiencia subjetiva.',
      'Programa de investigación lakatosiano: fértil, no infalible.',
    ],
  },
]
