export const SECTIONS = [
  { id: 0,  key: 's00', title: 'Intro — animación cerebro',         duration: 0,    color: '#7c6dfa' },
  { id: 1,  key: 's01', title: 'Apertura filosófica',             duration: 60,   color: '#7c6dfa' },
  { id: 2,  key: 's02', title: 'La neurona real',                  duration: 90,   color: '#06b6d4' },
  { id: 3,  key: 's03', title: 'La neurona artificial',            duration: 90,   color: '#06b6d4' },
  { id: 4,  key: 's04', title: 'Arquitectura de tres capas',       duration: 120,  color: '#8b5cf6' },
  { id: 5,  key: 's05', title: 'Entrenamiento: 4 pasos',           duration: 120,  color: '#f59e0b' },
  { id: 6,  key: 's06', title: 'Retropropagación',                 duration: 120,  color: '#f59e0b' },
  { id: 7,  key: 's07', title: 'Alcances + crítica',               duration: 90,   color: '#ef4444' },
  { id: 8,  key: 's08', title: 'Límites',                          duration: 60,   color: '#ef4444' },
  { id: 9,  key: 's09', title: 'Aprendizaje no supervisado',       duration: 180,  color: '#22c55e' },
  { id: 10, key: 's10', title: 'Repr. distribuidas + recurrentes', duration: 60,   color: '#22c55e' },
  { id: 11, key: 's11', title: 'Códigos demográficos',             duration: 90,   color: '#a78bfa' },
  { id: 12,  key: 's12',  title: 'De 1992 a hoy',                    duration: 120,  color: '#7c6dfa' },
  { id: 13,  key: 's12b', title: 'Convergencia empírica',            duration: 90,   color: '#22c55e' },
  { id: 14,  key: 's12c', title: '¿Por qué no emergencia?',          duration: 120,  color: '#ef4444' },
  { id: 15,  key: 's13',  title: 'Cierre argumental',                duration: 120,  color: '#7c6dfa' },
]

export const TOTAL_DURATION = SECTIONS.reduce((s, x) => s + x.duration, 0) // 1410s = 23.5min
