# Estado del Proyecto: SportLog

- **Última actualización:** 19/11/2026
- **Versión del documento:** 2.0.0
- **Responsable del proyecto:** Equipo de Desarrollo DWEC (2º DAWT)
- **Versión actual de código:** `v0.2` (Sprint 2 Completado)

---

## 📋 Resumen Ejecutivo

**SportLog** es una aplicación web *client-first* diseñada para que deportistas y atletas registren, analicen y den seguimiento a sus sesiones de entrenamiento (fuerza, carrera, ciclismo, natación) y marcas personales sin depender de servidores externos ni comprometer su privacidad. Toda la persistencia y la lógica de validación se ejecutan localmente en el navegador del usuario.

> **Estado global actual:** El **Sprint 2 (v0.2)** está 100% completado, probado y fusionado en `main`, con CRUD completo aislado por usuario, ficha con campo condicional y grupo dinámico, validación en tiempo real en captura/burbuja, listado con *debounce* y `<dialog>`, zona de administración de roles, pirámide de pruebas completa (203 unitarios, 11 integración, 2 E2E con Playwright), cobertura del `97,76 %` en funciones puras y pipeline CI completo (`Calidad` → `Tests` → `E2E`).

---

## 🎯 Objetivos y Alcance

### Objetivos principales
1. **Gestión de Identidad y Roles (Sprint 1 - Completado):** Registro interactivo, login con cifrado SHA-256 vía Web Crypto API, control de sesiones en `sessionStorage` y autorización por roles (`administrador` vs `usuario`).
2. **CRUD Completo de Sesiones Deportivas (Sprint 2 - Completado):** Alta, edición, borrado con confirmación modal (`<dialog>`) y visualización de entrenamientos en `localStorage`, garantizando aislamiento por usuario.
3. **Listado, Búsqueda y Paginación (Sprint 2 - Completado):** Vista de tarjetas construida desde `<template>` con búsqueda reactiva con *debounce*, filtro por disciplina y paginación navegable mediante URL (`URLSearchParams`).
4. **Zona de Administración (Sprint 2 - Completado):** Panel exclusivo para administradores (`usuarios.html`) para buscar, filtrar, paginar usuarios y cambiar roles con seguridad.
5. **Despliegue Continuo y Entrega (Sprint 3 - Pendiente):** Publicación automática en Vercel con Deployment Checks, vistas previas probadas (`despliegue.yml`), prueba de humo (`e2e/humo.spec.js`), `release.yml`, JSDoc completo y Release `v1.0`.

### Fuera de alcance (Anti-Scope Creep)
- ❌ **No backend propio / No bases de datos remotas:** Todo debe residir en `localStorage` y `sessionStorage`.
- ❌ **No frameworks JS:** Prohibido usar React, Vue, Angular, Svelte o similares. Todo debe ser Vanilla JavaScript estándar (ES Modules).
- ❌ **No librerías JS externas para lógica o UI:** Prohibido importar librerías externas de validación, utilidades (lodash) o componentes (Bootstrap JS, jQuery).
- ❌ **No sincronización en la nube multi-dispositivo:** Es una arquitectura estrictamente local y privada.

### Criterios de éxito
- 100% de pruebas unitarias pasando en Vitest con cobertura superior al 90%.
- Cero advertencias y cero errores en `npm run lint` (ESLint) y `npm run format:check` (Prettier).
- Pipeline de GitHub Actions ejecutando trabajos encadenados en verde en cada commit y Pull Request.
- Cumplimiento estricto de accesibilidad WAI-ARIA (regiones en vivo, foco accesible y navegación por teclado).

---

## 🏗️ Arquitectura y Stack

### Stack técnico detallado

| Componente | Tecnología / Herramienta | Versión | Uso en el proyecto |
|---|---|:---:|---|
| **Lenguaje** | JavaScript ES Modules (Vanilla) | ES2024 | Lógica de negocio, controladores y validadores |
| **Maquetación** | HTML5 Semántico + WAI-ARIA | Estándar | Estructura accesible de las 5 páginas y templates |
| **Estilos** | Bootstrap (CSS únicamente) + CSS Custom | 5.3.8 | Diseño responsivo *Dark Pro Edition* |
| **Criptografía** | Web Crypto API (`crypto.subtle`) | Nativa | Hashing SHA-256 asíncrono de contraseñas |
| **Test Runner** | Vitest + Happy-DOM | 5.1.0 | Pruebas unitarias e integración en memoria |
| **E2E Testing** | Playwright | 1.63.0 | Pruebas de extremo a extremo y smoke tests |
| **Linter** | ESLint (Flat Config `eslint.config.js`) | 10.12.0 | Reglas de calidad y detección estática de bugs |
| **Formateador** | Prettier | 3.9.9 | Formateo estricto de JS, CSS, HTML, JSON y Markdown |
| **Documentación**| JSDoc | 4.0.5 | Generación de documentación técnica desde código |
| **Entorno** | Docker DevContainer en Linux | Ubuntu / Node 24 | Entorno de desarrollo reproducible |
| **CI / CD** | GitHub Actions | v4 | Pipeline automatizado de calidad y tests |

### Arquitectura de capas y módulos

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Capas de la Aplicación                        │
└────────────────────────────────────────────────────────────────────────┘
 [Vistas HTML]          index.html, registro.html, listado.html, ficha.html, usuarios.html
       │
 [Controladores DOM]    js/paginas/login.js, js/paginas/registro.js (inyección de dependencias)
       │
 [Lógica & Servicios]   js/validadores.js, js/avisos.js (CustomEvent)
       │
 [Seguridad & Datos]    js/sesion.js, js/usuarios.js, js/clave.js (Web Crypto API)
       │
 [Almacenamiento]       localStorage ('sportlog_usuarios'), sessionStorage ('sportlog_sesion')
```

### Estructura del repositorio

```text
├── .devcontainer/             # Configuración del contenedor Docker (Node 24, puertos)
├── .github/workflows/         # Pipeline de Integración Continua (ci.yml)
├── css/
│   └── estilos.css            # Estilos personalizados (tema oscuro deportivo, telemetría)
├── js/
│   ├── paginas/               # Controladores acoplados al DOM por página
│   │   ├── login.js           # Controlador de index.html
│   │   └── registro.js        # Controlador de registro.html
│   ├── avisos.js              # Sistema desacoplado de notificaciones (CustomEvent)
│   ├── clave.js               # Resumen criptográfico SHA-256 (Web Crypto)
│   ├── sesion.js              # Gestión de sesión activa y guardias de navegación
│   ├── usuarios.js            # Repositorio de usuarios y control de roles
│   └── validadores.js         # Funciones puras de validación con regex Unicode
├── scripts/
│   └── construir.js           # Generación del bundle distribuible en dist/
├── tests/
│   ├── AlmacenFalso.js        # Doble de pruebas en memoria para Storage
│   ├── integracion/           # Pruebas integradas
│   └── unitarios/             # Pruebas unitarias aisladas (74 tests en verde)
├── blog/
│   └── README.md              # Diario de aprendizaje y problemas conceptuales
├── index.html                 # Login público
├── registro.html              # Registro público
├── listado.html               # Panel privado de entrenamientos
├── ficha.html                 # Formulario de alta/edición de sesión deportiva
├── usuarios.html              # Panel de administración de usuarios
└── README.md                  # Portada y documentación oficial de entrega
```

### Decisiones Técnicas Clave (ADR simplificados)

1. **ADR-01: Prohibición de Bootstrap JS**
   - *Contexto:* El enunciado exige evaluar manipulación nativa del DOM y gestión de eventos en JavaScript.
   - *Decisión:* Usar exclusivamente `bootstrap.min.css` para el grid y estilos base; cualquier interacción (modales, alertas, diálogos) se implementa con elementos nativos como `<dialog>` y `CustomEvent`.
   - *Consecuencias:* Código 100% puro, sin dependencias pesadas de terceros en ejecución y total control sobre el ciclo de vida del DOM.

2. **ADR-02: Inyección de Dependencias en Controladores de Página**
   - *Contexto:* Testear funciones que acceden directamente a `window.localStorage`, `document` o `location.replace` genera acoplamiento e imposibilita pruebas paralelas limpias.
   - *Decisión:* Los controladores aceptan un objeto de opciones `{ documento, almacenUsuarios, almacenSesion, navegar }` con valores por defecto al entorno global del navegador.
   - *Consecuencias:* En los tests unitarios se inyectan instancias limpias de `AlmacenFalso` y espías `vi.fn()` sin mockear de forma invasiva los objetos globales.

3. **ADR-03: Criptografía SHA-256 con Web Crypto API**
   - *Contexto:* Las contraseñas jamás deben almacenarse en texto plano, pero el proyecto no tiene backend.
   - *Decisión:* Emplear `crypto.subtle.digest('SHA-256', ...)` encapsulado en `js/clave.js`. Al ser asíncrono, se implementan banderas de estado (`enviando = true`) y desactivación del botón para evitar condiciones de carrera por dobles envíos.
   - *Consecuencias:* Almacenamiento seguro en el cliente y prevención probada contra envíos concurrentes.

---

## ✅ Completado

- [x] **S1-01: Documentación inicial y Definición de Hecho** — (10/11/2026) — Modelado de la entidad en `README.md`, especificación de validaciones del registro y arquitectura de las 5 páginas. PR #1.
- [x] **S1-02: Maquetación base de las 5 páginas y estilos** — (10/11/2026) — HTML5 semántico de las 5 vistas y diseño visual deportivo *Dark Pro Edition* (`css/estilos.css`) con telemetría SVG. PR #2.
- [x] **S1-03: Sistema y módulo de avisos** — (10/11/2026) — Creación de `js/avisos.js` con `CustomEvent('aviso')`, persistencia temporal para redirecciones en `sessionStorage` y 3 tests unitarios. PR #3.
- [x] **S1-04: Módulo de datos de usuarios y hash** — (10/11/2026) — Creación de `js/usuarios.js`, persistencia en `localStorage`, asignación de rol administrador al primer usuario, tolerancia a JSON corrupto y 11 tests. PR #4.
- [x] **S1-05: Módulo de sesión y control de acceso** — (10/11/2026) — Creación de `js/sesion.js`, control de rutas públicas/privadas/admin, cierre de sesión y 13 tests.
- [x] **S1-06: Formulario de registro con feedback interactivo** — (10/11/2026) — Creación de `js/validadores.js` (regex Unicode `\p{Ll}`/`\p{Lu}`), feedback dinámico al escribir contraseña en `js/paginas/registro.js`, validación on blur, anti-doble envío y 32 tests con `it.each`. PR #5.
- [x] **S1-07: Formulario de login y control de envíos** — (10/11/2026) — Creación de `js/paginas/login.js`, redirección directa si ya hay sesión, verificación con SHA-256, vaciado/foco en contraseña errónea, bloqueo de doble clic y 5 tests. PR #6.
- [x] **S1-08: Reglas de calidad con ESLint y Prettier** — (10/11/2026) — Inclusión de `camelcase`, `curly`, `no-console` en `eslint.config.js`, formateo global con Prettier y documentación en `README.md`. PR #7.
- [x] **S1-09: Tests unitarios de usuarios, sesión y validadores** — (10/11/2026) — Consolidación de la suite con `tests/unitarios/registro.test.js` (74 tests unitarios e integración en verde). PR #8.
- [x] **S1-10: Workflow de GitHub Actions (Paso 1)** — (10/11/2026) — Creación de `.github/workflows/ci.yml` con trabajos encadenados `Calidad` y `Tests` en `ubuntu-latest`. PR #9.
- [x] **S1-11: Entrada del blog y cierre del Sprint 1 (v0.1)** — (10/11/2026) — Redacción de `blog/README.md`, reflexión final en `README.md`, creación y push del tag `v0.1`. PR #10.
- [x] **Post-S1: Dinamización de vistas y registro continuo** — (11/11/2026) — Limpieza de datos estáticos en `listado.html` y `usuarios.html`, creación de controladores `listado.js` y `usuarios.js`, y habilitación de registro continuo para administradores. PR #11.
- [x] **S2-01: Módulo de datos de Entidades y almacenamiento por usuario** — (12/11/2026) — Creación de `js/entrenamientos.js`, aislamiento por usuario con clave `sportlog_entrenamientos_<usuario>`, UUID v4, fechas ISO, CRUD puro, resiliencia a JSON corrupto y 14 tests unitarios en `tests/unitarios/entrenamientos.test.js`. PR #12.
- [x] **S2-02: Validadores de la entidad deportiva con expresiones regulares** — (12/11/2026) — Creación de `js/validadores-entidad.js` con ritmo de carrera (regex + control lógico de segundos y límites fisiológicos), series/repeticiones, frecuencia cardíaca, mapa `validadoresEntidad` y 52 tests unitarios con `it.each` en `tests/unitarios/validadores-entidad.test.js`. PR #13.
- [x] **S2-03: Módulo de Paginación pura y navegación por URL** — (12/11/2026) — Creación de `js/paginacion.js` con función pura `paginar`, corrección de límites, generación de controles accesibles, delegación de eventos (`closest`) y sincronización en URL con `URLSearchParams` y `history.replaceState`. 15 tests unitarios en `tests/unitarios/paginacion.test.js`. PR #14.
- [x] **S2-04: Formulario de Ficha - Alta y edición con campo condicional** — (12/11/2026) — Implementación de `js/paginas/ficha.js` y conexión en `ficha.html`. Modo alta vs edición (`?id=...`), campo condicional interactivo con `hidden` y `disabled`, fecha máxima de hoy por código, lectura con `FormData` y redirección con aviso. 7 tests unitarios en `tests/unitarios/ficha.test.js`. PR #15.
- [x] **S2-05: Formulario de Ficha - Grupo dinámico de ejercicios y duración horas/minutos** — (12/11/2026) — Plantilla `<template id="plantilla-ejercicio">` con límites de 1 a 5 ejercicios, botones interactivos desactivados en extremos, IDs dinámicos y enlaces de accesibilidad (`htmlFor`, `aria-describedby`), extracción con `FormData.getAll()`, cálculo matemático automático de horas y minutos a minutos totales (`#duracion`), y 9 tests unitarios en `tests/unitarios/ficha.test.js`. PR #16.
- [x] **S2-06: Sistema de validación en tiempo real en los 3 formularios** — (17/11/2026) — Creación de `js/validacion-formularios.js` (`iniciarValidacionFormulario`, `validadoresFormulario`) e integración en `index.html`, `registro.html` y `ficha.html` con `novalidate`, `data-validar`, `data-depende-de`, `setCustomValidity`, `aria-describedby`, `aria-invalid`, `is-invalid`/`invalid-feedback` y foco en el primer error. 183 tests unitarios en verde. PR #17.
- [x] **S2-07: Listado de entrenamientos con buscador con debounce y borrado modal** — (18/11/2026) — Implementación de `js/paginas/listado.js` y `listado.html`: KPIs, tarjetas desde `<template>` sin `innerHTML`, filtro por disciplina, buscador sin tildes con *debounce*, paginación por URL, borrado con `<dialog>` nativo y 12 tests unitarios. PR #18.
- [x] **S2-08: Zona de administración de usuarios y gestión de roles** — (18/11/2026) — Implementación de `js/paginas/usuarios.js` y `usuarios.html`: guarda `protegerPaginaAdmin`, listado paginado desde `<template>`, buscador y filtro por rol, cambio de rol con `<dialog>`, bloqueo del propio botón del admin actual y 10 tests unitarios. PR #19.
- [x] **S2-09: Tests de integración de páginas y pirámide de pruebas** — (19/11/2026) — Pruebas de integración en `tests/integracion/` cargando HTML reales con `tests/pagina.js` (`ficha.test.js`, `listado.test.js`, `usuarios.test.js`), ajuste `step="any"` en `#distancia` en `ficha.html`, y configuración de umbral de cobertura ≥ 90 % en `vitest.config.js`. 214 tests en verde. PR #21.
- [x] **S2-10: Pruebas End-to-End con Playwright** — (19/11/2026) — Recorridos completos en `e2e/` (`ayudas.js`, `sesion.spec.js`, `crud.spec.js`) con selectores accesibles y rutas relativas pasando en Chromium contra `serve`. PR #22.
- [x] **S2-11: Integración continua completa (Paso 2) y cierre del Sprint 2 (v0.2)** — (19/11/2026) — Pipeline CI en `.github/workflows/ci.yml` (`Calidad` → `Tests` con `coverage` + artefacto → `E2E` con Playwright + artefacto en fallo, y `concurrency`), entrada Sprint 2 en `blog/README.md`, secciones de `README.md` y etiqueta `v0.2`. PR #23.

---

## 🚧 En Progreso

- [ ] **Sprint 3 (v1.0): Despliegue continuo en Vercel, pruebas contra lo desplegado, Release y entrega final:**
  - *Estado:* Sprint 2 (`v0.2`) cerrado e integrado en `main`.
  - *Siguiente paso inmediato:* Conectar el repositorio en Vercel (`npm run build` / `dist`), configurar Deployment Checks y crear `.github/workflows/despliegue.yml`, `e2e/humo.spec.js` y `.github/workflows/release.yml`.

---

## 📌 Pendiente (Backlog)

### Sprint 2 · v0.2 (Completado)
- [x] **S2-01: Módulo de datos de Entidades y almacenamiento por usuario** — Completado en PR #12
- [x] **S2-02: Validadores de la entidad deportiva con expresiones regulares** — Completado en PR #13
- [x] **S2-03: Módulo de Paginación pura y navegación por URL** — Completado en PR #14
- [x] **S2-04: Formulario de Ficha - Alta y edición con campo condicional** — Completado en PR #15
- [x] **S2-05: Formulario de Ficha - Grupo dinámico de ejercicios y duración horas/min** — Completado en PR #16
- [x] **S2-06: Sistema de validación en tiempo real en los 3 formularios** — Completado en PR #17
- [x] **S2-07: Listado de entrenamientos con buscador con debounce y borrado modal** — Completado en PR #18
- [x] **S2-08: Zona de administración de usuarios y gestión de roles** — Completado en PR #19
- [x] **S2-09: Tests de integración de páginas y pirámide de pruebas** — Completado en PR #21
- [x] **S2-10: Pruebas End-to-End con Playwright** — Completado en PR #22
- [x] **S2-11: Integración continua completa (Paso 2) y cierre del Sprint 2 (v0.2)** — Completado en PR #23

### Must have (Sprint 3 · v1.0)
- [ ] **S3-01: Despliegue en Vercel y Deployment Checks (Requisitos 24-25):** Proyecto en Vercel (`npm run build`, salida `dist`), desactivar protección de despliegues y exigir `Calidad`, `Tests`, `E2E` y `E2E desplegado`.
- [ ] **S3-02: Workflow de pruebas contra lo desplegado (`.github/workflows/despliegue.yml`):** Ejecutar `npm run e2e` con `BASE_URL` en cada evento `deployment_status` con `state == 'success'`.
- [ ] **S3-03: Prueba de humo y Releases (`.github/workflows/release.yml`, `e2e/humo.spec.js`):** Al subir un tag `v*`, ejecutar `Comprobar` → `Humo` → `Release` adjuntando `dist/` comprimido.
- [ ] **S3-04: Evidencias, JSDoc completo, blog Sprint 3 y entrega `v1.0` (Requisitos 28-29):** Capturas `img/pr-comprobaciones.png` y `img/vercel-retenido.png`, versión retenida demostrada, `npm run docs` (`@listens`, `@fires`, `@typedef`, `@example`), entrada Sprint 3 en `blog/README.md` y tag `v1.0`.

### Nice to have (Mejoras opcionales)
- [ ] **Exportación / Importación de entrenamientos:** Descarga de sesiones en archivo JSON local para copias de seguridad personales. — Prioridad: Baja — Dep: CRUD
- [ ] **Gráfica interactiva de progresión semanal:** Renderizado de barras SVG calculadas dinámicamente con las horas acumuladas de entrenamiento. — Prioridad: Baja — Dep: CRUD

---

## ⛔ Restricciones y "NO Hacer"

### Reglas estrictas del proyecto
1. 🛑 **CERO JavaScript de Bootstrap:** Está terminantemente prohibido cargar `bootstrap.bundle.min.js`. Cualquier comportamiento dinámico (alertas, modales, menús) debe ser programado en JavaScript nativo.
2. 🛑 **CERO APIs remotas o llamadas de red externas:** Prohibido usar `fetch` o `axios` a APIs externas. Todo se almacena y consulta en `localStorage` / `sessionStorage`.
3. 🛑 **No usar `innerHTML` para inyectar datos de usuario:** Utilizar siempre `textContent`, creación de nodos con `document.createElement` o clonado seguro de `<template>` para prevenir vulnerabilidades XSS.
4. 🛑 **No usar variables globales:** Prohibido declarar variables en el ámbito de `window`. Todo debe organizarse en ES Modules (`export` / `import`).
5. 🛑 **No borrar ramas en GitHub:** Las ramas de características integradas (`sprint-1-*`) deben preservarse remotamente como evidencia de desarrollo continuo exigida por la corrección docente.
6. 🛑 **No hacer merge directo a `main`:** Todo cambio debe entrar a `main` mediante Pull Request con **Merge Commit** (`gh pr merge <id> --merge --delete-branch=false`) y con los checks de CI en verde.
7. 🛑 **Respetar codificación UTF-8:** No usar utilidades de PowerShell que alteren la codificación a ANSI o corrompan caracteres con tildes o eñes.

### Antipatrones prohibidos
- **Acoplamiento directo al Storage:** No llamar a `localStorage.getItem` directamente en la vista; pasar siempre por los métodos exportados de la capa de datos (`usuarios.js`, `sesion.js`).
- **Validación tardía:** No esperar al submit para avisar de errores simples; proporcionar feedback en `blur` o en `input` (cuando aplique, como en los requisitos de contraseña).
- **Hardcodear selectores mágicos repetidos:** Centralizar la referencia a elementos del DOM al inicializar los controladores.

---

## 🐛 Problemas Conocidos / Deuda Técnica

1. **Simulación de seguridad en el cliente:**
   - *Detalle:* Aunque se usa SHA-256 para no guardar texto plano, un usuario con conocimientos puede manipular el `sessionStorage` desde las DevTools para asignarse temporalmente `rol: "administrador"`.
   - *Mitigación:* Está documentado en el `README.md` como una limitación inherente a las arquitecturas puramente estáticas sin backend autenticado.
2. **Normalización de saltos de línea Windows / Linux:**
   - *Detalle:* Al trabajar en Windows con Git y ejecutar en el contenedor Linux, Git advierte ocasionalmente de conversiones CRLF/LF.
   - *Mitigación:* Se ha configurado `git config core.autocrlf input` y se mantiene Prettier formateando todo el proyecto.

---

## 🔄 Cómo Continuar (Guía para la siguiente IA / sesión)

### Próximos 3 pasos concretos a ejecutar (Sprint 3)
1. **Conectar el repositorio en Vercel** (Framework `Other`, Build `npm run build`, Output `dist`) y desactivar *Vercel Authentication* para vistas previas públicas.
2. **Configurar Deployment Checks en Vercel** exigiendo `Calidad`, `Tests`, `E2E` y `E2E desplegado`.
3. **Implementar `.github/workflows/despliegue.yml`, `e2e/humo.spec.js` y `.github/workflows/release.yml`** para cerrar el despliegue continuo y la Release `v1.0`.

### Comandos de entorno

```bash
# Entrar al contenedor / ejecutar desde el host (si el contenedor está activo):
docker exec -w /workspaces/dwec-2dawt-2627-proyectodomeval-ccruper0503 e6aa7e5a832a npm test

# Pasar el linter estricto:
docker exec -w /workspaces/dwec-2dawt-2627-proyectodomeval-ccruper0503 e6aa7e5a832a npm run lint

# Comprobar formateo con Prettier:
docker exec -w /workspaces/dwec-2dawt-2627-proyectodomeval-ccruper0503 e6aa7e5a832a npm run format:check

# Autoformatear código:
docker exec -w /workspaces/dwec-2dawt-2627-proyectodomeval-ccruper0503 e6aa7e5a832a npx prettier --write .

# Comprobar cobertura de tests:
docker exec -w /workspaces/dwec-2dawt-2627-proyectodomeval-ccruper0503 e6aa7e5a832a npm run coverage

# Compilar para producción (carpeta dist/):
docker exec -w /workspaces/dwec-2dawt-2627-proyectodomeval-ccruper0503 e6aa7e5a832a npm run build
```

### Archivos clave a revisar antes de tocar código
1. [`ENUNCIADO.md`](file:///c:/Users/ccruper0503/Documents/dwec-2dawt-2627-proyectodomeval-ccruper0503/ENUNCIADO.md): Apartado «Sprint 2 · El CRUD, la zona de administración y la integración continua completa» (Requisitos 13 a 23).
2. [`README.md`](file:///c:/Users/ccruper0503/Documents/dwec-2dawt-2627-proyectodomeval-ccruper0503/README.md): Sección `### La entidad` (campos aprobados y tipos de control).
3. [`js/sesion.js`](file:///c:/Users/ccruper0503/Documents/dwec-2dawt-2627-proyectodomeval-ccruper0503/js/sesion.js): Funciones de guardia `protegerPaginaPrivada` y `protegerPaginaAdmin`.
4. [`tests/AlmacenFalso.js`](file:///c:/Users/ccruper0503/Documents/dwec-2dawt-2627-proyectodomeval-ccruper0503/tests/AlmacenFalso.js): Clase que simula el `Storage` para pruebas.

### Preguntas abiertas / Decisiones de usuario
- *Campo condicional de la entidad:* Confirmar si en `ficha.html` la casilla "¿Competición oficial?" mostrará exclusivamente el campo "Dorsal o posición" o si añadirá también "Nombre del evento".
- *Máximo de ejercicios en el bloque dinámico:* Se diseñará para admitir entre 1 y 5 ejercicios (series, repeticiones y carga).

---

## 📝 Convenciones de Trabajo

- **Commits:** Nombres convencionales referenciando la tarea del sprint:
  `S<sprint>-<num>: <Descripción clara en infinitivo o presente>`  
  *Ejemplo:* `S1-06: Formulario de registro con validacion interactiva y feedback`
- **Ramas:** Siempre creadas desde `main` actualizado:
  `sprint-<num>-<caracteristica>`  
  *Ejemplo:* `sprint-2-entidades`, `sprint-2-listado`
- **Integración:** Siempre mediante Pull Request en GitHub:
  `gh pr create --base main --head <rama> --title "..." --body "..."`  
  `gh pr merge <num> --merge --delete-branch=false`
- **Trello:** Mover siempre la tarjeta a **«Haciendo»** al empezar la tarea y a **«Hecho»** únicamente tras fusionar la PR y verificar los tests.

---

## 📚 Referencias

- **Repositorio Oficial:** `https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503`
- **Servidor Local de Pruebas:** `http://localhost:3901`
- **Tablero Kanban:** [Trello SportLog DWEC](https://trello.com/invite/b/6aec9ce9063c16b7c0047ea8/ATTI178831c6a60f25f26ec0e00a2054500d26E02A60/dwec-sportlog)
- **Historial de Pull Requests:**
  - [PR #1: S1-01 Documentación](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/1)
  - [PR #2: S1-02 Maquetación base](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/2)
  - [PR #3: S1-03 Sistema de avisos](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/3)
  - [PR #4: S1-04 Módulo de usuarios](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/4)
  - [PR #5: S1-06 Formulario de registro](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/5)
  - [PR #6: S1-07 Formulario de login](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/6)
  - [PR #7: S1-08 Calidad ESLint y Prettier](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/7)
  - [PR #8: S1-09 Tests unitarios consolidados](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/8)
  - [PR #9: S1-10 Workflow CI GitHub Actions](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/9)
  - [PR #10: S1-11 Cierre de Sprint 1 (v0.1)](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/10)
  - [PR #11: Dinamización de vistas y registro continuo](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/11)
  - [PR #12: S2-01 Módulo de entrenamientos](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/12)
  - [PR #13: S2-02 Validadores de entidad](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/13)
  - [PR #14: S2-03 Paginación pura y URL](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/14)
  - [PR #15: S2-04 Ficha base y campo condicional](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/15)
  - [PR #16: S2-05 Ficha grupo dinámico y duración](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/16)
  - [PR #17: S2-06 Validación en tiempo real](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/17)
  - [PR #18: S2-07 Listado con debounce y diálogo](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/18)
  - [PR #19: S2-08 Administración de usuarios y roles](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/19)
  - [PR #20: Documentación del README hasta S2-08](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/20)
  - [PR #21: S2-09 Tests de integración y cobertura](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/21)
  - [PR #22: S2-10 Pruebas E2E con Playwright](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/22)
  - [PR #23: S2-11 Pipeline CI Paso 2 y cierre Sprint 2 (v0.2)](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/23)

---

## 🕒 Historial de Cambios del Documento

| Fecha | Versión | Cambio realizado | Responsable |
|:---:|:---:|---|:---:|
| 19/11/2026 | 2.0.0 | Cierre completo del Sprint 2 (`v0.2`), limpieza de backlog duplicado y planificación de Sprint 3 (`v1.0`). | Lead Architect (Pair AI) |
| 10/11/2026 | 1.1.0 | Creación y sincronización de las 11 tarjetas de Trello para el Sprint 2 (S2-01 a S2-11) y actualización del backlog. | Lead Architect (Pair AI) |
| 10/11/2026 | 1.0.0 | Creación inicial del documento tras el cierre y etiquetado del Sprint 1 (`v0.1`). | Lead Architect (Pair AI) |

<!--
INSTRUCCIONES PARA LA IA QUE LEA ESTE ARCHIVO:
1. Trata este documento como la fuente única de verdad del proyecto SportLog.
2. NO modifiques el código sin comprobar previamente que cumple con la sección "⛔ Restricciones y NO Hacer".
3. NO añadas frameworks JS ni librerías JS externas en runtime (prohibido Bootstrap JS).
4. Sigue la metodología de ramas de características y Pull Requests con Merge Commit sin borrar ramas.
5. Mantén siempre el 100% de los tests pasando en Vitest y 0 errores en ESLint y Prettier.
6. Actualiza este archivo cada vez que completes un hito o cambies el estado de un sprint.
-->
