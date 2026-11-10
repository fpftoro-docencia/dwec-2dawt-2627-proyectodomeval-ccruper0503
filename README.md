# Nombre de tu aplicación

<!-- Sprint 2: la insignia de tu workflow, con tu organización y tu repositorio. -->
![Integración continua](https://github.com/<organización>/<repositorio>/actions/workflows/ci.yml/badge.svg)

<!-- Completa cada sección a medida que avanzas en los sprints. Borra los comentarios como este
     cuando termines. Este README es también la portada de la documentación que genera `npm run docs`.
     No cambies los títulos de las secciones (##): la corrección los busca por su nombre. -->

## Mi proyecto

SportLog es una aplicación web para deportistas que permite registrar, planificar y analizar entrenamientos y sesiones deportivas individuales, controlando disciplinas, tiempos, ejercicios y marcas personales.
**Web publicada:** <!-- https://<proyecto>.vercel.app -->

### La entidad

<!-- Sprint 2 (puedes adelantarla en el sprint 1). Una fila por campo, con los mínimos del requisito 13:
     marca el campo condicional y el grupo dinámico (con su mínimo y su máximo). -->

| Campo | Control | Obligatorio | Regla de validación | Mensaje si no se cumple |
|-------|---------|:-----------:|---------------------|-------------------------|
|Titulo de la sesión |Texto | Si| De 3 a 50 caracteres|El título debe tener entre 3 y 50 caracteres |
| Disciplina deportiva|Desplegable | Si| Opción válida| Selecciona una disciplina deportiva válida|
| Fecha del entrenamiento  | Fecha| Si| No posterior a la fecha actual|La fecha no puede ser futura |
|Duración ( minutos ) | Número| Si| Entero positivo entre 1 y  mins|Introduce una duración válida (entre 1 y 720 min) |
| ¿Competicion oficial?| Casilla| No| Booleano|- |
|Dorsal o posicion | Texto|Solo si es competición| Entre 1 y 20 caracteres| Introduce el dorsal o puesto conseguido|
| Bloque de ejercicios| Texto y Numero| Si ( min 1)| Nombre del ejecicio no vacío y series/repeticiones válidas|Añade al menos un ejercicio a la sesión |

### El registro de usuarios

| Campo | Control | Regla | Mensaje |
|-------|---------|-------|---------|
| Nombre de usuario | Texto (`input text`) | Alfanumérico y guiones (3-15 caracteres), único | El usuario debe tener de 3 a 15 caracteres y no estar ocupado |
| Correo electrónico | Email (`input email`) | Formato de correo válido | Introduce un correo electrónico válido |
| Contraseña | Contraseña (`input password`) | Mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula y 1 número | La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula y cifra |
| Repetir contraseña | Contraseña (`input password`) | Debe coincidir con la contraseña | Las contraseñas deben coincidir |
| Acepto términos | Casilla (`input checkbox`) | Obligatorio marcarla | Debes aceptar los términos y condiciones |



### Páginas

| Página | Acceso | Qué hace |
|--------|--------|----------|
| `index.html` | Pública | Formulario de inicio de sesión. Si ya hay sesión activa, redirige a `listado.html`. |
| `registro.html` | Pública | Registro de nuevos usuarios con comprobador de contraseña. El primer usuario es administrador. |
| `listado.html` | Usuarios | Pantalla principal privada: listado de entrenamientos con buscador y paginación. |
| `ficha.html` | Usuarios | Formulario para crear o editar una sesión de entrenamiento deportivo. |
| `usuarios.html` | Administradores | Zona de administración exclusiva para gestionar usuarios y sus roles. |

## Arquitectura y módulos

<!-- 1. Un diagrama (Mermaid) de tus módulos y de qué usa cada uno.
     2. Tabla con cada módulo: qué hace, si usa el DOM y qué exporta.
     3. Cómo están hechos tus objetos (funciones fábrica o clases) y qué patrones de diseño usas
        (al menos dos): dónde y por qué.
     4. Cómo reciben las páginas lo que necesitan (almacenamiento, sesión, navegación) y por qué así
        se pueden probar.
     5. Qué documenta tu JSDoc y cómo se genera la documentación (`npm run docs`). -->

## Cómo ejecutarlo

<!-- Cómo abrir el proyecto en el Dev Container y ver la web, y cómo pasar los tests, la cobertura,
     las pruebas de extremo a extremo, ESLint y Prettier, generar la documentación y preparar la web
     publicable (`npm run build`). -->

## Almacenamiento y sesión

<!-- 1. Tabla con cada clave que usas: dónde está (localStorage o sessionStorage), qué guarda y un
        ejemplo de su contenido.
     2. Por qué cada dato va donde va.
     3. Cómo guardas el rol y cómo proteges las páginas por sesión y por rol.
     4. Por qué este inicio de sesión NO es seguro: qué podría hacer alguien con las DevTools y cómo
        se hace en una aplicación real. -->

## Funcionalidad y formularios

<!-- Una subsección por parte de la aplicación (sesión y registro, listado y paginación, ficha,
     zona de administración): qué hace y cómo lo has resuelto. Incluye:
     - cómo lees los datos (FormData: get, getAll), cómo creas y numeras el grupo dinámico, cómo
       funciona el campo condicional, qué atributos pones desde el código y cómo rellenas el
       formulario al editar;
     - la validación: cuándo validas cada campo, de dónde salen los mensajes (validity,
       setCustomValidity y tus validadores), qué haces para que los errores sean accesibles y cómo
       evitas el doble envío;
     - las expresiones regulares: tabla con cada una, en qué validador está, qué acepta (un ejemplo)
       y qué significan sus partes y sus flags; qué parte de la validación hace la expresión y qué
       parte el código. -->

## Eventos

### Eventos en el HTML

<!-- Qué consigues con el HTML sin escribir oyentes (envío con Intro, novalidate y los atributos de
     validación, dialog, label for…) y por qué no usas atributos on…. -->

### Tipos de eventos

<!-- Tabla con los eventos que usas y por qué has elegido cada uno frente a otros parecidos
     (submit frente a click, input frente a change, blur frente a focusout…). -->

### Propagación

<!-- 1. Tabla con TODOS tus oyentes: evento, dónde lo registras, en qué fase actúa
        (captura, objetivo o burbuja) y para qué.
     2. Dónde usas la delegación y qué ganas con ella.
     3. Tu uso de la captura y por qué no servía la burbuja.
     4. Si usas stopPropagation, por qué. -->

## Pruebas y cobertura

<!-- 1. Tabla de la pirámide: tipo (unitario, de integración o de extremo a extremo), fichero,
        qué prueba y cuántos tests tiene. Por qué cada cosa se prueba en ese nivel y no en otro.
     2. Cómo simulas al usuario (eventos, requestSubmit), los servicios (AlmacenFalso, el resumen
        de la contraseña, la navegación) y el tiempo (temporizadores falsos).
     3. Cómo se ejecutan las mismas pruebas de extremo a extremo con serve y contra la web
        desplegada (BASE_URL).
     4. Pega la salida de `npm run coverage` (con el resumen de la cobertura) y de `npm run e2e`.
        Explica qué umbral has puesto, a qué ficheros y qué queda sin probar y por qué. -->

## Integración continua

### ESLint y Prettier

Para asegurar la máxima calidad de código, coherencia de estilo y prevención temprana de defectos, se han añadido tres reglas adicionales a la configuración plana de `eslint.config.js`:

1. **`camelcase` (`'error'`):**
   - **Qué comprueba:** Obliga a que todos los identificadores de variables, funciones y propiedades sigan la convención `camelCase` estándar de JavaScript.
   - **Por qué la queremos:** Evita mezclas de convenciones (`snake_case` o `PascalCase` inadecuados) y mantiene una nomenclatura homogénea y profesional en todo el repositorio.

2. **`curly` (`'error'`):**
   - **Qué comprueba:** Exige el uso explícito de llaves `{ ... }` en todas las estructuras de control (`if`, `else`, `for`, `while`), prohibiendo sentencias condicionales de una sola línea sin llaves.
   - **Por qué la queremos:** Previene errores de lógica graves provocados por añadir sentencias posteriores pensando que forman parte del bloque condicional cuando en realidad quedan fuera.

3. **`no-console` (`['error', { allow: ['warn', 'error'] }]`):**
   - **Qué comprueba:** Prohíbe el uso de `console.log` en el código fuente de la aplicación, permitiendo únicamente `console.warn` y `console.error` para situaciones anómalas justificadas. Además, se define una excepción en la configuración para ficheros de utilidades de construcción (`scripts/**/*.js`).
   - **Por qué la queremos:** Asegura que no queden llamadas residuales de depuración en producción que ensucien la consola del navegador del usuario o expongan información interna.

#### Salida de verificación de ESLint (`npm run lint`):
```text
> mi-aplicacion@1.0.0 lint
> eslint .
```

#### Salida de comprobación de estilo con Prettier (`npm run format:check`):
```text
> mi-aplicacion@1.0.0 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
```

#### Problema real identificado y resuelto con el depurador de las DevTools:
Durante la implementación de la autenticación asíncrona con la Web Crypto API (`crypto.subtle.digest`), al probar el envío del formulario con el teclado (pulsaciones rápidas de `Enter`), descubrimos en la pestaña **Sources** y **Event Listener Breakpoints** de las DevTools que el evento `submit` se disparaba repetidamente antes de completarse el hashing de la contraseña. Esto provocaba ejecuciones concurrentes de `verificarCredenciales` e intentos de doble inserción en el almacenamiento.  
**Solución aplicada:** Se introdujo una bandera de control de estado en el ciclo de vida del formulario (`let enviando = false;`) y la desactivación inmediata del botón (`botonLogin.disabled = true;`), ignorando cualquier envío concurrente hasta que la promesa criptográfica se resuelva.

### El workflow

El flujo de integración continua está configurado en `.github/workflows/ci.yml`. Se ejecuta automáticamente ante cada `push` y en cada `pull_request` dirigido a la rama `main`, garantizando que ningún código roto o con estilo no conforme entre en el tronco principal. Cuenta con permisos restringidos de solo lectura (`permissions: contents: read`).

| Trabajo | Espera a | Pasos | Artefacto |
|---------|----------|-------|-----------|
| `Calidad` | — | 1. Checkout del repositorio (`actions/checkout@v4`).<br>2. Configuración de Node.js 24 con caché npm (`actions/setup-node@v4`).<br>3. Instalación limpia (`npm ci`).<br>4. Verificación de reglas de ESLint (`npm run lint`).<br>5. Verificación de formateo con Prettier (`npm run format:check`). | — |
| `Tests` | `Calidad` | 1. Checkout del código.<br>2. Configuración de Node.js 24 y caché npm.<br>3. Instalación de dependencias (`npm ci`).<br>4. Ejecución de suite de pruebas unitarias e integración con Vitest (`npm test`). | — *(Sprint 2)* |
| `E2E` *(Sprint 2)* | `Tests` | Pruebas de extremo a extremo con Playwright. | `playwright-report/` *(si falla)* |

**¿Por qué están en este orden?**  
El trabajo de `Calidad` es muy rápido y descarta errores sintácticos, variables no utilizadas o incoherencias de estilo en segundos. El trabajo de `Tests` requiere más tiempo y cómputo; al depender de `Calidad` mediante `needs: Calidad`, nos aseguramos de no malgastar minutos de Actions ejecutando pruebas si el código ya contiene fallos básicos de estilo o reglas estáticas incumplidas.

## Despliegue continuo

<!-- Sprint 3. 1. Cómo has configurado Vercel: build, carpeta de salida, protección de los
        despliegues y Deployment Checks (qué comprobaciones exige y por qué).
     2. Qué hacen despliegue.yml y release.yml, y qué comprueba tu prueba de humo.
     3. El camino de un cambio, con tus palabras: desde tu git push en una rama hasta que se ve en
        la web, qué se comprueba en cada paso y qué pasa si algo falla. -->

**Web publicada:** <!-- https://<proyecto>.vercel.app -->

| Evidencia | Enlace | Captura |
|-----------|--------|---------|
| *Pull request* con su vista previa y `E2E desplegado` | <!-- enlace a la pull request --> | `img/pr-comprobaciones.png` |
| Versión retenida por Vercel | <!-- enlace a la ejecución en rojo --> | `img/vercel-retenido.png` |
| Release `v1.0` | <!-- enlace a la Release --> | — |

<!-- Qué rompiste a propósito para la versión retenida, qué viste en Vercel y cómo comprobaste que la
     web seguía con la versión anterior. -->

## Organización del trabajo

### Definición de Hecho

<!-- Sprint 1. Tu lista de condiciones para dar una tarea por terminada. Cada una tiene que poder
     comprobarse. Si la cambias en algún sprint, di qué cambiaste y por qué. -->

Para dar una tarea por terminada en el tablero y poder fusionar su rama a main:
- [ ] El código pasa `npm run lint` y `npm run format:check` sin avisos ni errores.
- [ ] La funcionalidad está probada con tests de Vitest y todos pasan en verde (`npm test`).
- [ ] No se utilizan librerías de terceros en JavaScript ni APIs remotas.
- [ ] Se comprueba la seguridad de sesión y los permisos de usuario/administrador.
- [ ] La Pull Request en GitHub tiene el workflow de integración continua en verde.

### Sprints

<!-- Una fila por sprint. La reflexión: qué salió bien, qué no, qué cambias para el siguiente
     (cuatro o cinco líneas, sobre tu trabajo y no sobre el enunciado). -->

| Sprint | *Tag* | Qué incluye | Reflexión |
|--------|-------|-------------|-----------|
| 1 | `v0.1` | | |
| 2 | `v0.2` | | |
| 3 | `v1.0` | | |

**Tablero de Trello:** <!-- enlace (compartido con el profesor) -->
https://trello.com/invite/b/6aec9ce9063c16b7c0047ea8/ATTI178831c6a60f25f26ec0e00a2054500d26E02A60/dwec-sportlog

**Blog del proyecto:** [blog/README.md](blog/README.md) <!-- dificultades y problemas conceptuales de cada sprint -->

### Ramas y versiones

<!-- 1. Tabla con tus ramas: nombre, qué funcionalidad y enlace a su pull request.
     2. Si integras con merge o con rebase, y por qué.
     3. Qué deja fuera tu .gitignore y por qué. -->

| Rama | Funcionalidad | *Pull request* |
|------|---------------|----------------|
| `sprint-1-maquetacion` | Maquetación base de las 5 páginas y estilos | [#2](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/2) |
| `sprint-1-avisos` | Módulo de avisos y CustomEvent | [#3](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/3) |
| `sprint-1-usuarios` | Módulo de usuarios con hash SHA-256, roles y tests | [#4](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/4) |
**Versión de entrega:** `v1.0`
