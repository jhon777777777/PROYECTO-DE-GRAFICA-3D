# Guía de estudio y demostración — RailLab 3D

## 1. Título y finalidad

**Simulación ferroviaria 3D con control temporal de iluminación y sombras usando programación orientada a objetos.**

Carrera: Ingeniería de Sistemas · Área: Computación Gráfica.

**Objetivo principal:** aplicar matrices 4×4, mallas procedurales, shaders, jerarquías de transformaciones, renderizado WebGL2, cámaras y programación modular para un tren animado con iluminación dependiente de la hora del día.

## 2. Relación con el Paso 16 del material de clase

La guía recomienda reemplazar funciones monolíticas con estas responsabilidades:

```text
Scene (hereda Object3D)
├── RailwayEnvironment (hereda Object3D)
│   ├── Terreno / Vía / Estación / Túnel → Mesh
│   ├── Árboles / Edificios → Object3D con Mesh hijos
│   └── RailwayLamp × 8 (cada uno contiene PointLight)
├── Train (hereda Object3D)
│   ├── Locomotive (hereda Object3D)
│   │   ├── Cuerpo, cabina, caldera → Mesh
│   │   ├── Wheel × 6 → Object3D con Mesh hijos
│   │   └── PointLight (faro)
│   └── Wagon × N → Object3D con Mesh y Wheel
└── HomeroRunner (hereda Object3D)
    ├── Cuerpo / cabeza / cabello → Object3D con Mesh hijos
    └── Brazos / piernas → Object3D con Mesh hijos

Renderer.render(Scene, PerspectiveCamera)
├── scene.updateMatrixWorld()
├── calcula matriz del Sol
├── renderiza mapa de profundidad (si hay luz solar)
└── renderiza colores, texturas, iluminación y sombras
```

En particular, **Object3D** almacena `position`, `rotation`, `scale`, `parent`, `children`, `matrix`, `matrixWorld` y `visible`. `Renderer` es la única clase que llama directamente a WebGL2. `TrainApplication` organiza las clases sin manipular buffers.

## 3. Controlar la velocidad

**Archivo:** `js/objects/Train.js`.

Atributo inicial:

```js
this.velocidadAngular = .45;
```

Cada cuadro, la clase `Train` usa el delta de tiempo para actualizar el ángulo de desplazamiento.

```js
this.angulo += dt * this.velocidadAngular;
```

**Desde el panel:** `DashboardPanel` modifica `train.velocidadAngular` al mover `#trainSpeed`. Si la velocidad es cero, el tren se detiene sobre la vía, pero el resto de la aplicación sigue activo.

Las coordenadas elípticas son:

\[x(t) = 7\cos(t), \quad z(t)=4\sin(t)\]

La derivada proporciona la dirección tangente con `Math.atan2(-7 sin(t), 4 cos(t))`.

## 4. Hora del día y posición solar

**Archivo:** `js/systems/DayNightCycle.js`.

Atributos: `hour`, `auto`, `minutesPerSecond`, `ambientBase`, `sunMultiplier`, `shadowStrength`, `shadowsEnabled`, `automaticLamps`.

- `cycle.setHour(7)` → amanecer, sombras largas.
- `cycle.setHour(12)` → mediodía, sol alto, sombras más cortas.
- `cycle.setHour(17)` → atardecer, luz cálida, sombras largas.
- `cycle.setHour(22)` → noche, luz solar cero y focos encendidos.

El modelo aproximado de altura solar es:

\[h = \max(0, \sin(\pi(hora-6)/12))\]

La dirección del Sol se actualiza al cambiar el deslizador. Se envía como uniforme `uSunDirection` a GLSL.

## 5. Luz ambiental, ocho postes y faro conmutable

**Archivo:** `js/core/Renderer.js`, Fragment Shader.

La composición considera:

```text
Color del material × (iluminación ambiental
                     + luz solar difusa × visibilidad por sombra
                     + luz puntual del faro
                     + 8 luces puntuales de los postes)
```

Los parámetros de iluminación se modifican desde el panel, sin recompilar shaders:

```js
cycle.ambientBase = .5;    // aumentar luz ambiental
cycle.sunMultiplier = 1.2; // aumentar intensidad solar
cycle.apply();
```

Durante la noche, el control automático aumenta la contribución del faro y los ocho postes.

## 6. Sombras reales en dos pasadas

El sistema utiliza **shadow mapping**:

1. `Renderer.prepareShadowMap()` prepara una textura de profundidad `DEPTH_COMPONENT24` y un framebuffer.
2. `Renderer.makeLightMatrix()` combina `Matrix4.lookAt()` con `Matrix4.ortografica()` para observar la escena desde el Sol.
3. `Renderer.drawShadowObjects()` dibuja en la textura de profundidad las mallas con `castShadow=true`.
4. El shader de color calcula la coordenada de sombra y compara la profundidad del fragmento con el valor almacenado.
5. El método **PCF 3×3** promedia nueve comparaciones para suavizar el contorno de la sombra.

El mapa de sombras solo representa la luz **direccional solar**. Las luces del faro y de los ocho postes se modelan como fuentes puntuales sin sombras propias.

Atributos:

- `renderer.shadowsEnabled`: activa/desactiva la pasada solar.
- `renderer.shadowStrength`: mezcla sombra y luz entre 0 y 1.
- `mesh.castShadow`: si una malla bloquea la luz solar.

## 7. Agregar objetos o modificar el escenario

**Archivo:** `js/objects/RailwayEnvironment.js`.

Ya existen `setTreeCount(count)` y `setBuildingCount(count)`, que construyen o retiran nodos `Object3D`. Para otro edificio, agregar una nueva geometría usando `addPart(...)` como en `buildStation()` o `setBuildingCount()`.

La barra lateral se conecta con el objeto mediante:

```js
this.onRange('trees', n => app.environment.setTreeCount(n), n => String(n));
```

## 8. Personaje y cabello

**Archivo:** `js/objects/HomeroRunner.js`.

Atributos importantes: `hairSize`, `characterSize`, `runningSpeed`, `elapsed`.

Los brazos y las piernas heredan la posición del cuerpo mediante la jerarquía. `setHairSize()` escala únicamente el nodo `hair`, sin alterar la geometría original.

```js
app.runner.setHairSize(1.2);
app.runner.setSize(1.4);
app.runner.runningSpeed = 1.5;
```

## 9. Panel lateral

**Archivo:** `js/ui/DashboardPanel.js`.

- `onRange()` asigna un callback a cada control deslizante.
- `onCheck()` asigna un callback a cada checkbox.
- `registerControls()` conecta UI y clases.
- `renderStats()` muestra FPS, hora, objetos y vueltas.

Para agregar un nuevo control: poner un `<input>` identificado en `index.html`; después enlazarlo en `registerControls()` con la propiedad o el método que lo manipula.

## 10. Demostración propuesta para exposición (4 minutos)

1. **POO (45 s):** describir `Scene`, `Object3D`, `Mesh`, `Material`, `Geometry` y `Renderer`.
2. **Tren (45 s):** cambiar la velocidad y agregar vagones; explicar la elipse paramétrica.
3. **Ciclo solar (90 s):** colocar 07:00, 12:00, 17:00 y 22:00; explicar cómo cambian altura solar, dirección, color del cielo y luces puntuales.
4. **Sombras (40 s):** activar/desactivar y ajustar intensidad; explicar las dos pasadas al framebuffer.
5. **Panel (20 s):** agregar árboles, cambiar cámara y demostrar el cabello del personaje.

## 11. Verificación y límites de resultados

Se incluyen pruebas automatizadas con Node.js de geometría, jerarquías, tren, reloj y un renderizador WebGL simulado. La ejecución real de shaders y el resultado final dependen del navegador y GPU. El proyecto no intenta reproducir la posición astronómica real del Sol; ofrece un ciclo artístico controlado para mostrar cómo afecta a las sombras y a la iluminación.


## 12. Ocho postes con control independiente — versión 2.1

Se generan ocho objetos `RailwayLamp` en el método `RailwayEnvironment.buildStreetLamps()`: cuatro sobre el lado +Z de la vía y cuatro sobre el lado -Z. Cada instancia contiene una columna y un brazo, una lente con material conmutable y un objeto `PointLight`.

El panel usa `#postLightToggle` para el interruptor general, `#headlightToggle` para el faro y ocho entradas `data-pole="0"` hasta `data-pole="7"` para los postes individuales.

En `RailwayEnvironment`:

```js
setAllPostLights(false);       // apaga todos los postes
setAllPostLights(true);        // recupera las selecciones previas
setPostLightEnabled(2, false); // apaga solo el tercer poste
```

En `Locomotive`:

```js
setHeadlightEnabled(false);    // apaga el faro móvil
setHeadlightEnabled(true);     // vuelve a encenderlo
```

El `Renderer` recibe la lista `streetlights` y envía al shader las ocho posiciones (`uPostLightPositions`) y sus intensidades (`uPostLightIntensities`). Cuando un poste está apagado su intensidad es cero, mientras que su lente usa un material no emisivo. De igual forma, el faro deja de emitir luz y su lente cambia de material.

**Demostración en clase:** elige 22:00 en el reloj, apaga los ocho postes y verifica que disminuye la iluminación del terreno; enciende solo Poste 01 y Poste 05; por último apaga el faro del tren sin modificar los postes. 
