export const HINTON_PASSAGES = {
  s02: {
    section: 'Neuronas biológicas y neuronas artificiales',
    topic: 'Neurona biológica y plasticidad sináptica',
    pdfPage: 2,
    excerpt: [
      'Una neurona típica del cerebro humano recoge señales procedentes de otras a través de una pléyade de delicadas estructuras llamadas dendritas.',
      'Cuando las señales excitadoras que una neurona recibe alcanzan suficiente intensidad frente a las señales inhibidoras, la neurona envía a lo largo de su axón un breve impulso de actividad eléctrica. El aprendizaje se produce por variación de la efectividad de las sinapsis.',
    ],
  },
  s03: {
    section: 'Neuronas biológicas y neuronas artificiales',
    topic: 'Idealización de la neurona artificial',
    pdfPage: 2,
    excerpt: [
      'Las redes de neuronas artificiales se componen típicamente de "unidades" interconectadas, que cumplen el rol de modelo de neurona. La función de la sinapsis es modelizada atribuyendo a cada conexión un peso modificable.',
      'Ninguna red artificial trata de reflejar, en todo su pormenor, la geometría de axones y dendritas; la señal eléctrica de salida de una neurona queda expresada por un solo número que representa la frecuencia de disparo de la neurona, vale decir, su actividad.',
    ],
  },
  s04: {
    section: 'Redes de tres capas',
    topic: 'Capas ocultas y arquitectura',
    pdfPage: 3,
    excerpt: [
      'El más común de todos los tipos de red neuronal artificial organiza sus elementos en tres niveles o estratos: una capa de unidades de entrada está conectada a un estrato de unidades "ocultas", conectadas a su vez a las unidades del nivel de salida.',
      'Este sencillo tipo de red posee interés porque las unidades ocultas tienen libertad para construir sus propias representaciones de la entrada.',
    ],
  },
  s05: {
    section: 'Entrenamiento de una red',
    topic: 'Aprendizaje supervisado',
    pdfPage: 3,
    excerpt: [
      'Cabe enseñar a una red trietápica para que realice una tarea particular, por el siguiente procedimiento.',
      'Determinamos después hasta qué punto existe concordancia entre el egreso real de la red y la salida deseada; por último se modifican los pesos de cada conexión, buscando que la red consiga una mejor aproximación de la salida deseada.',
    ],
  },
  s06: {
    section: 'El algoritmo de retropropagación',
    topic: 'Propagación del error',
    pdfPage: '3-4',
    excerpt: [
      'El algoritmo computa cada EP hallando primero el "error de actividad", EA, tasa de variación del error al cambiar el nivel de actividad de una unidad.',
      'Después de calcular todos los EA de la capa oculta inmediatamente subyacente a la de salida, podemos calcular de igual manera los EA correspondientes a las restantes capas, pasando de una capa a otra en sentido opuesto al de propagación de actividades a través de la red. De aquí el nombre de retropropagación.',
    ],
  },
  s07: {
    section: 'Lo que hizo posible la retropropagación',
    topic: 'Alcance empírico del modelo',
    pdfPage: '4-5',
    excerpt: [
      'Valiéndose del algoritmo, los investigadores han producido redes neuronales que reconocen dígitos manuscritos, predicen las tasas cambiarias de las divisas y optimizan el rendimiento de ciertos procesos químicos.',
      'En el campo de las neurociencias, Richard Andersen y David Zipser han demostrado que el algoritmo de retropropagación constituye un instrumento útil para explicar la función de ciertas neuronas de la corteza cerebral.',
    ],
  },
  s08: {
    section: 'Alcances y límites de la retropropagación como teoría biológica',
    topic: 'Crítica biológica',
    pdfPage: 6,
    excerpt: [
      'Pero la objeción más seria que suscita la retropropagación en cuanto modelo del aprendizaje real es que requiere de un instructor que proporcione la salida deseada para ejemplo de entrenamiento.',
      'Las personas, por el contrario, pueden aprender casi todo sin auxilio de instructores. Aprendemos a comprender frases o escenas visuales sin instrucciones explícitas de ninguna clase.',
    ],
  },
  s09: {
    section: 'Aprendizaje no supervisado',
    topic: 'Giro hacia la autoorganización',
    pdfPage: 6,
    excerpt: [
      '¿Cómo podría una red adquirir representaciones internas apropiadas del mundo, si carece al empezar de conocimientos y de maestro?',
      'Todos estos procedimientos comparten dos características: apelan, implícita o explícitamente, a cierta noción de la calidad de la representación y funcionan cambiando los pesos para mejorar la representación extraída por las unidades ocultas.',
    ],
  },
  s10: {
    section: 'Mapas de Kohonen y representaciones intermedias',
    topic: 'Distribución intermedia de la representación',
    pdfPage: '7-8',
    excerpt: [
      'Podemos clasificar los algoritmos de aprendizaje no supervisado atendiendo al tipo de representación creado por ellos. En los métodos basados en componentes principales, las unidades ocultas cooperan y la representación de cada pauta de entrada resulta distribuida por todas ellas.',
      'Pero es probable que los algoritmos más potentes e interesantes ocupen alguna posición intermedia entre los extremos correspondientes a representaciones distribuidas puras y representaciones puramente locales.',
    ],
  },
  s11: {
    section: 'Códigos demográficos o códigos poblacionales',
    topic: 'Codificación poblacional',
    pdfPage: 8,
    excerpt: [
      'Parece como si el cerebro utilizase los denominados "códigos demográficos", en los cuales la información es representada mediante toda una población de neuronas activas.',
      'La codificación poblacional resulta atractiva porque sigue funcionando, aun cuando se lesionen algunas neuronas.',
    ],
  },
  s12: {
    section: 'Redes profundas y redes recurrentes',
    topic: 'Proyección hacia modelos posteriores',
    pdfPage: 9,
    excerpt: [
      'Tal estrategia elimina muchas de las interacciones entre pesos, responsables de que el aprendizaje por retropropagación sea muy lento en redes profundas y poliestratificadas.',
      'Otra posibilidad importante reside en las redes cuya actividad fluye en bucles cerrados. Tales redes recurrentes pueden alcanzar estados estacionarios o exhibir una dinámica temporal compleja, utilizable quizá para producir un comportamiento secuencial.',
    ],
  },
  s12b: {
    section: 'Lo que hizo posible la retropropagación',
    topic: 'Convergencia entre modelo y neurociencia',
    pdfPage: 5,
    excerpt: [
      'Richard Andersen y David Zipser han demostrado que el algoritmo de retropropagación constituye un instrumento útil para explicar la función de ciertas neuronas de la corteza cerebral.',
      'Hallaron después que las respuestas de las unidades ocultas se asemejaban sorprendentemente a las de neuronas auténticas responsables de la conversión de información visual procedente de la retina a formas más adecuadas para áreas visuales ubicadas más profundamente en el cerebro.',
    ],
  },
  s13: {
    section: 'Conclusión',
    topic: 'Apuesta final de Hinton',
    pdfPage: 9,
    excerpt: [
      'Pero antes o después, los estudios computacionales del aprendizaje en redes neuronales artificiales acabarán por converger en los métodos descubiertos por evolución.',
      'Cuando así acontezca, muchísimos datos empíricos concernientes al cerebro comenzarán súbitamente a adquirir sentido y se tornarán factibles muchas aplicaciones desconocidas de las redes neuronales.',
    ],
  },
}

export const HINTON_PASSAGE_SOURCE = '2b - Hinton - Redes Neuronales que Aprenden de la Experiencia.pdf'
