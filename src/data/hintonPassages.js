export const HINTON_PASSAGES = {
  s02: {
    section: 'Neuronas biológicas y neuronas artificiales',
    topic: 'Neurona biológica y plasticidad sináptica',
    pdfPage: 2,
    excerpt: [
      'Una neurona típica del cerebro humano recoge señales procedentes de otras a través de una pléyade de delicadas estructuras llamadas dendritas. La neurona emite impulsos de actividad eléctrica a lo largo de una fibra delgada y larga, denominada axón, que se escinde en millares de ramificaciones.',
      'En la extremidad de cada rama, una estructura llamada sinapsis convierte la actividad procedente del axón en efectos eléctricos que inhiben o provocan actividad en las neuronas a las que está conectado.',
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
      'Cada unidad convierte la pauta de actividades que en ella ingresan en una única actividad de egreso. Primero, cada actividad aferente es multiplicada por un coeficiente de ponderación; después, la unidad utiliza una función de transferencia entrada-salida, que transforma el ingreso total en actividad de salida.',
    ],
  },
  s04: {
    section: 'Redes de tres capas',
    topic: 'Capas ocultas y arquitectura trietápica',
    pdfPage: 3,
    excerpt: [
      'El más común de todos los tipos de red neuronal artificial organiza sus elementos en tres niveles o estratos: una capa de unidades de entrada está conectada a un estrato de unidades "ocultas", conectadas a su vez a las unidades del nivel de salida.',
      'La actividad de cada unidad oculta está determinada por las actividades de las unidades de entrada y por los pesos de las conexiones entre las unidades de entrada y las unidades ocultas. Análogamente, la conducta de las unidades de salida es función de la actividad de las ocultas y de los pesos que median entre las unidades ocultas y las de salida.',
      'Este sencillo tipo de red posee interés porque las unidades ocultas tienen libertad para construir sus propias representaciones de la entrada. Por modificación de los pesos, una unidad oculta puede decidir el papel que representa.',
    ],
  },
  s05: {
    section: 'Entrenamiento de una red',
    topic: 'Aprendizaje supervisado y ajuste de pesos',
    pdfPage: 3,
    excerpt: [
      'Cabe enseñar a una red trietápica para que realice una tarea particular por el siguiente procedimiento. Primero le presentamos a la red una tanda de ejemplos de entrenamiento, ejemplos que consisten en patrones de actividades de las unidades de entrada más los patrones correspondientes que deseamos exhiban las unidades de salida.',
      'Determinamos después hasta qué punto existe concordancia entre el egreso real de la red y la salida deseada; por último se modifican los pesos de cada conexión, buscando que la red consiga una mejor aproximación de la salida deseada.',
      'Para entrenar a la red, le presentamos una imagen de un dígito y comparamos la actividad real de las unidades de salida con la actividad deseada. Calculamos seguidamente el error, definido como la suma de los cuadrados de las discrepancias entre actividades reales y deseadas; cambiamos ahora el peso de cada conexión, al objeto de reducir el error.',
    ],
  },
  s06: {
    section: 'El algoritmo de retropropagación',
    topic: 'Error de actividad, error de peso y retropropagación',
    pdfPage: '3-4',
    excerpt: [
      'Para poner en práctica tal procedimiento, la magnitud de la modificación de cada peso debería ser proporcional a la tasa relativa de variación del error con respecto a la variación de ese peso. Esta cantidad, que se llama "derivada respecto al peso", o simplemente EP, es difícil de calcular eficientemente.',
      'Hacia 1974, Paul J. Werbos ideó un procedimiento mucho más eficiente para calcular el EP. Tal procedimiento, hoy conocido por algoritmo de retropropagación, se ha convertido en uno de los principales instrumentos para el entrenamiento de redes neuronales.',
      'El algoritmo computa cada EP hallando primero el "error de actividad", EA, tasa de variación del error al cambiar el nivel de actividad de una unidad. Después de calcular todos los EA de una capa, podemos calcular de igual manera los EA correspondientes a las restantes capas, pasando de una capa a otra en sentido opuesto al de propagación de actividades a través de la red. De aquí el nombre de retropropagación.',
    ],
  },
  s07: {
    section: 'Lo que hizo posible la retropropagación',
    topic: 'Éxito empírico y valor explicativo del modelo',
    pdfPage: '4-5',
    excerpt: [
      'El algoritmo de retropropagación ha demostrado poseer una sorprendente eficacia para entrenar redes neuronales poliestratificadas y conseguir que éstas desempeñen un amplio abanico de tareas. El algoritmo es de máxima utilidad en situaciones donde la entrada y la salida guardan relación no lineal y hay abundante provisión de datos de entrenamiento.',
      'Valiéndose del algoritmo, los investigadores han producido redes neuronales que reconocen dígitos manuscritos, predicen las tasas cambiarias de las divisas y optimizan el rendimiento de ciertos procesos químicos. El algoritmo ha sido utilizado incluso para entrenar redes que identifican células precancerosas en frotis de Pap o capaces de ajustar el espejo de un telescopio para compensar y eliminar las distorsiones de naturaleza atmosférica.',
      'En cuanto teoría del aprendizaje real de las neuronas biológicas, la retropropagación ha sido recibida con división de opiniones. Por una parte, el algoritmo ha supuesto una valiosa aportación a nivel abstracto y es francamente eficiente en la creación de representaciones verosímiles en las unidades ocultas.',
    ],
  },
  s08: {
    section: 'Alcances y límites de la retropropagación como teoría biológica',
    topic: 'Escalabilidad y objeción biológica central',
    pdfPage: 6,
    excerpt: [
      'De mayor entidad es el problema que plantea la velocidad del algoritmo de retropropagación. El tiempo invertido en calcular, para un ejemplo dado, las derivadas del error respecto a los pesos es proporcional al tamaño de la red; además, cuanto mayor es la red, más ejemplos y mayor es el número de veces que se han de corregir los pesos.',
      'Por consiguiente, el tiempo de aprendizaje crece mucho más rápidamente que el tamaño de la red.',
      'Pero la objeción más seria que suscita la retropropagación en cuanto modelo del aprendizaje real es que requiere de un instructor que proporcione la salida deseada para ejemplo de entrenamiento. Las personas, por el contrario, pueden aprender casi todo sin auxilio de instructores y aprendemos a comprender frases o escenas visuales sin instrucciones explícitas de ninguna clase.',
    ],
  },
  s09: {
    section: 'Aprendizaje no supervisado',
    topic: 'Aprender sin maestro y calidad de la representación',
    pdfPage: '6-7',
    excerpt: [
      '¿Cómo podría una red adquirir representaciones internas apropiadas del mundo, si carece al empezar de conocimientos y de maestro? Cuando se le presenta a la red una gran colección de patrones de entrada sin que se le dé información sobre lo que debe hacer con ellos, la red se encuentra, aparentemente, libre de problema bien definido que resolver.',
      'No obstante, los investigadores han diseñado varios procedimientos de uso general, no supervisados, que pueden ajustar adecuadamente los pesos de la red.',
      'Todos estos procedimientos comparten dos características: apelan, implícita o explícitamente, a cierta noción de la calidad de la representación y funcionan cambiando los pesos para mejorar la representación extraída por las unidades ocultas. En general, las representaciones de calidad se distinguen por admitir una descripción muy económica y contener, no obstante, información suficiente para reconstruir una entrada con buena aproximación.',
    ],
  },
  s10: {
    section: 'Representaciones distribuidas, competitivas e intermedias',
    topic: 'Del código distribuido al competitivo',
    pdfPage: '7-8',
    excerpt: [
      'Existen dos métodos sencillos para el descubrimiento de códigos económicos que permitan una reconstrucción bastante exacta de la entrada. Son éstos el aprendizaje de componentes principales y el aprendizaje competitivo.',
      'Cuando una red neuronal se sirve del aprendizaje por componentes principales, un pequeño número de unidades ocultas coopera en la representación de la pauta de entrada. En los métodos basados en componentes principales, las unidades ocultas cooperan y la representación de cada pauta de entrada resulta distribuida por todas ellas.',
      'En el aprendizaje competitivo, contrariamente, un gran número de unidades ocultas pugnan entre sí, con lo que finalmente se utiliza una sola unidad oculta para la representación de un patrón de entrada determinado. Pero es probable que los algoritmos más potentes e interesantes ocupen alguna posición intermedia entre los extremos correspondientes a representaciones distribuidas puras y representaciones puramente locales.',
    ],
  },
  s11: {
    section: 'Códigos demográficos o códigos poblacionales',
    topic: 'Codificación poblacional y robustez',
    pdfPage: '8-9',
    excerpt: [
      'Parece como si el cerebro utilizase los denominados "códigos demográficos", en los cuales la información es representada mediante toda una población de neuronas activas.',
      'Mientras estudiaban en monos el mecanismo en virtud del cual el cerebro indica a los ojos en qué dirección han de moverse, hallaron que el movimiento se encuentra codificado por las actividades de toda una población de células, cada una de las cuales representa un movimiento ocular un poco diferente. El movimiento resultante corresponde al promedio de todos los codificados por las células activas.',
      'La codificación poblacional resulta atractiva porque sigue funcionando, aun cuando se lesionen algunas neuronas. Ello se debe a que la pérdida de un subconjunto de neuronas tomado al azar tiene escasos efectos sobre el promedio de la población.',
    ],
  },
  s12: {
    section: 'Jerarquías de codificación, profundidad y recurrencia',
    topic: 'Representaciones progresivas y redes recurrentes',
    pdfPage: 9,
    excerpt: [
      'Utilizando aprendizaje no supervisado para la extracción de una jerarquía de representaciones de economía creciente habría que acelerar mucho la velocidad de aprendizaje en redes grandes multietápicas. Cada etapa de la red adapta los pesos de sus líneas de ingreso con el propósito de lograr que su representación sea superior a la de la etapa precedente.',
      'Tal estrategia elimina muchas de las interacciones entre pesos, responsables de que el aprendizaje por retropropagación sea muy lento en redes profundas y poliestratificadas.',
      'Otra posibilidad importante reside en las redes cuya actividad fluye en bucles cerrados. Tales redes recurrentes pueden alcanzar estados estacionarios o exhibir una dinámica temporal compleja, utilizable quizá para producir un comportamiento secuencial.',
    ],
  },
  s12b: {
    section: 'Convergencia empírica con la neurociencia',
    topic: 'Andersen-Zipser y semejanza con neuronas reales',
    pdfPage: 5,
    excerpt: [
      'En el campo de las neurociencias, Richard Andersen y David Zipser han demostrado que el algoritmo de retropropagación constituye un instrumento útil para explicar la función de ciertas neuronas de la corteza cerebral.',
      'Estos investigadores aplicaron la retropropagación en el entrenamiento de una red neuronal que habría de responder a estímulos visuales.',
      'Hallaron después que las respuestas de las unidades ocultas se asemejaban sorprendentemente a las de neuronas auténticas responsables de la conversión de información visual procedente de la retina a formas más adecuadas para áreas visuales ubicadas más profundamente en el cerebro.',
    ],
  },
  s13: {
    section: 'Conclusión',
    topic: 'Convergencia futura entre modelos y evolución',
    pdfPage: 9,
    excerpt: [
      'Aunque los investigadores han desarrollado potentes algoritmos de aprendizaje, de gran valor práctico, seguimos sin saber cuáles son las representaciones y procedimientos de aprendizaje de que se sirve el cerebro.',
      'Pero antes o después, los estudios computacionales del aprendizaje en redes neuronales artificiales acabarán por converger en los métodos descubiertos por evolución.',
      'Cuando así acontezca, muchísimos datos empíricos concernientes al cerebro comenzarán súbitamente a adquirir sentido y se tornarán factibles muchas aplicaciones desconocidas de las redes neuronales.',
    ],
  },
}

export const HINTON_PASSAGE_SOURCE = '2b - Hinton - Redes Neuronales que Aprenden de la Experiencia.pdf'
