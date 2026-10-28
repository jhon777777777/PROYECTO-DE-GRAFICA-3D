# RailLab 3D — Tren con iluminación y sombras dinámicas

**Proyecto académico de Ingeniería de Sistemas · Computación Gráfica**  
WebGL2, GLSL ES 3.00, JavaScript ES6, clases/atributos, sin Three.js y sin paquetes de producción.

## Ejecutar

1. **Extraer** el ZIP (no abrir `index.html` directamente como `file://`).
2. Abrir la carpeta extraída en **Visual Studio Code**.
3. Abrir la página mediante **Live Server**; o ejecutar desde la raíz del proyecto:
   ```bash
   python -m http.server 8000
   ```
4. Visitar **http://localhost:8000** con Chrome, Edge o Firefox que admita **WebGL2**.
5. En la barra lateral, cambiar la hora entre 00:00 y 23:45, utilizar los botones Amanecer / Mediodía / Atardecer / Noche, y observar la dirección e intensidad de las sombras solares.

**Requisitos:** navegador compatible con WebGL2 y aceleración gráfica disponible. La tipografía usa Google Fonts de forma opcional; si no hay conexión se usa la fuente local del sistema. Las texturas JPG sí están incluidas en el ZIP.

## Controles disponibles

| Panel | Control | Comportamiento |
|---|---|---|
| Operación del tren | Velocidad angular (0–1.8 rad/s) | Modifica el atributo `train.velocidadAngular` |
| Operación del tren | Tamaño / número de vagones | Escala los vehículos / crea o elimina objetos Wagon |
| Operación del tren | Pausa y reinicio | Congela o reinicia el avance del tren |
| Ciclo solar | Hora del día (0–23:45) | Recalcula altura y dirección solar, colores de cielo y luz |
| Ciclo solar | Avance automático | La hora simulada se actualiza continuamente |
| Iluminación | Intensidad del sol | Escala la componente direccional del shader |
| Iluminación | Luz ambiental | Aclara u oscurece todos los materiales |
| Iluminación | Sombras / fuerza de sombra | Activa el shadow mapping o modifica su contraste |
| Iluminación | Luz según hora | Faro/poste más intensos de noche; reducidos de día |
| Escenario | Árboles / edificaciones | Agrega o elimina objetos al grafo de escena |
| Personaje | Corredor / tamaño / cabello | Controla visibilidad, animación, escalas de geometrías |
| Cámara | Arrastre / rueda / presets | OrbitControls y PerspectiveCamera |
| Telemetría | FPS, objetos, vueltas, progreso | Presenta valores calculados durante la simulación |

## ¿Cómo funcionan las sombras reales?

`js/core/Renderer.js` dibuja **dos pasadas** cuando el Sol está sobre el horizonte:

1. **Pasada de profundidad:** una cámara ortográfica mira al escenario desde la dirección del Sol y guarda un mapa de profundidad `DEPTH_COMPONENT24` (2048×2048) en un framebuffer.
2. **Pasada normal de color:** el Fragment Shader transforma el punto del mundo al sistema de la cámara solar, consulta nueve muestras del mapa (PCF 3×3) y reduce **solo la luz solar** cuando el punto está oculto. Se mantienen la luz ambiental y los focos puntuales.

El Sol se mueve de **06:00 (este/horizonte)** hasta **12:00 (alto)** y baja hasta **18:00 (horizonte)**. La altitud es una aproximación artística, no un cálculo astronómico real para Puno. La sombra cambia de dirección y se alarga cerca del horizonte. Durante la noche se omite la pasada de sombras y se activan las luces artificiales.

**Limitaciones:** iluminación y modelos estilizados; los focos no proyectan sus propias sombras, solo el Sol. No hay física ni colisiones ferroviarias. La separación de vagones sigue un desfase angular, no el cálculo de longitud de arco. En equipos sin soporte de depth framebuffer, se continúa mostrando la escena, pero sin sombras solares; la interfaz indica la limitación.

## Guía de clases y archivos

| Archivo | Clase | Qué cambiar |
|---|---|---|
| `js/main.js` | `TrainApplication` | Inicialización y composición de escenas |
| `js/ui/DashboardPanel.js` | `DashboardPanel` | Controles y vínculos de la barra lateral |
| `js/systems/DayNightCycle.js` | `DayNightCycle` | Hora simulada, color del cielo, luz, sombras y encendido automático |
| `js/core/Renderer.js` | `Renderer` | Shaders, framebuffer, depth map, WebGL2 |
| `js/math/Matrix4.js` | `Matrix4` | Proyecciones, transformaciones 3D |
| `js/core/Object3D.js` | `Object3D` | Atributos position, rotation, scale; parent/children |
| `js/core/Scene.js` | `Scene` | Raíz de objetos |
| `js/core/Geometry.js` | `Geometry` | Vértices, índices y atributos de GPU |
| `js/materials/BasicMaterial.js` | `BasicMaterial` | Materiales y modo emisivo |
| `js/objects/Mesh.js` | `Mesh` | Unión de geometría/material/transformación; `castShadow` |
| `js/objects/Train.js` | `Train` | Velocidad, recorrido elíptico, vagones y ruedas |
| `js/objects/Locomotive.js` | `Locomotive` | Piezas de locomotora y faro móvil |
| `js/objects/Wagon.js` | `Wagon` | Piezas y ruedas de vagones |
| `js/objects/RailwayLamp.js` | `RailwayLamp` | Modelo de cada poste, foco y luz conmutable |
| `js/objects/RailwayEnvironment.js` | `RailwayEnvironment` | Estación, túnel, vía con dos rieles, árboles, edificaciones |
| `js/objects/HomeroRunner.js` | `HomeroRunner` | Movimiento articulado y tamaño de cabello |
| `js/controls/OrbitControls.js` | `OrbitControls` | Ángulos orbitales y zoom |
| `css/style.css` | — | Estilo del panel, interfaz, tamaños y diseño adaptativo |
| `index.html` | — | Estructura visual y elementos de control |

Documentación ampliada: `docs/GUIA_DEL_PROYECTO.md`.

## Pruebas

Para ejecutar los tests de lógica con Node.js (opcional, **no necesario para ejecutar la aplicación**):

```bash
npm test
node tests/test_renderer_mock.mjs
```

Se prueban matemáticas, geometrías, jerarquías, objetos, ciclo de día/noche y las llamadas del renderizador usando una implementación simulada de WebGL. **La compilación gráfica real de GLSL requiere un navegador WebGL2**.

## Diseño orientado a objetos — Paso 16

Este proyecto sigue las capas `Matrix4`, `Object3D`, `Scene`, `Geometry`, `BasicMaterial`, `Mesh`, `PerspectiveCamera` y `Renderer`, tal como explica la guía del **Paso 16: De código monolítico a mini motor gráfico**. Añade clases de aplicación, sol, control de UI y personaje, reutilizando los mismos principios de herencia y composición.


## Novedad v2.1 — Ocho postes y faro controlable

- **Ocho postes reales en la escena**, cuatro en cada lado del óvalo, separados del trazado ferroviario. Cada uno está construido con `RailwayLamp` (columna, brazo, cabezal, foco y luz puntual).
- **Interruptor general** «Ocho postes de la vía»: apaga/enciende el conjunto y cambia el aspecto del foco, además de su contribución de iluminación en GLSL.
- **Ocho interruptores individuales** etiquetados Poste 01–08: permiten un encendido selectivo. Al apagar y volver a encender el interruptor general se conservan las preferencias individuales.
- **Faro del tren independiente**, conmutado por `Locomotive.setHeadlightEnabled(enabled)`, que afecta a la lente visible y a la luz puntual que sigue a la locomotora.
- **Brillo adaptado a la hora**: la iluminación artificial es más intensa al anochecer, pero los interruptores generales e individuales siempre permiten apagarla.
- Cada poste corresponde a un `PointLight` con atributos `enabled`, `intensity`, `color` y su transformación 3D. `Renderer` envía las ocho posiciones y sus intensidades al fragment shader.

**Archivos para estudiar o modificar:**

| Tarea | Clase y ubicación |
|---|---|
| Cambiar posición y distribución de los 8 postes | `RailwayEnvironment.buildStreetLamps()` |
| Modificar altura o aspecto de cada poste | `RailwayLamp.build()` y atributo `height` |
| Apagar o prender postes | `RailwayEnvironment.setAllPostLights()` / `setPostLightEnabled()` |
| Apagar o prender el faro | `Locomotive.setHeadlightEnabled()` |
| Modificar iluminación efectiva | `Renderer.createProgram()` (8 luces puntuales GLSL) |
| Conectar interruptores del panel | `DashboardPanel.registerControls()` |

**Nota:** el mapa de sombras sigue correspondiendo al Sol. Las luces de los ocho postes y del faro iluminan el terreno y los objetos, pero **no generan sombras puntuales propias** (para ello se necesitarían mapas de sombras adicionales). 
