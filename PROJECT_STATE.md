# Estado del Proyecto: SportLog

- **Última actualización:** 10/11/2026
- **Versión del documento:** 1.0.0
- **Responsable del proyecto:** Equipo de Desarrollo DWEC (2º DAWT)
- **Versión actual de código:** `v0.1` (Sprint 1 Completado)

---

## 📋 Resumen Ejecutivo

**SportLog** es una aplicación web *client-first* diseñada para que deportistas y atletas registren, analicen y den seguimiento a sus sesiones de entrenamiento (fuerza, carrera, ciclismo, natación) y marcas personales sin depender de servidores externos ni comprometer su privacidad. Toda la persistencia y la lógica de validación se ejecutan localmente en el navegador del usuario.

> **Estado global actual:** El **Sprint 1 (v0.1)** está 100% completado, probado y fusionado en `main`, contando con autenticación segura cliente (SHA-256), roles de usuario, sistema desacoplado de avisos accesibles, validación interactiva y un pipeline de CI en GitHub Actions en verde.

---

## 🎯 Objetivos y Alcance

### Objetivos principales
1. **Gestión de Identidad y Roles (Sprint 1 - Completado):** Registro interactivo, login con cifrado SHA-256 vía Web Crypto API, control de sesiones en `sessionStorage` y autorización por roles (`administrador` vs `usuario`).
2. **CRUD Completo de Sesiones Deportivas (Sprint 2 - Pendiente):** Alta, edición, borrado con confirmación modal (`<dialog>`) y visualización de entrenamientos en `localStorage`, garantizando aislamiento por usuario.
3. **Listado, Búsqueda y Paginación (Sprint 2 - Pendiente):** Vista tabular y de tarjetas construida desde `<template>` con búsqueda reactiva con *debounce*, ordenación y paginación navegable mediante URL (`URLSearchParams`).
4. **Zona de Administración (Sprint 2 - Pendiente):** Panel exclusivo para administradores (`usuarios.html`) para auditar usuarios y cambiar roles.
5. **Despliegue Continuo y E2E (Sprint 3 - Pendiente):** Publicación automática en Vercel, suite de pruebas end-to-end con Playwright y auditoría de accesibilidad.

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

---

## 🚧 En Progreso

- [ ] **Sprint 2 (v0.2): CRUD de Entidades, Administración y CI Completa:**
  - *Estado:* Tareas S2-01 y S2-02 completadas e integradas en `main` (PR #12 y PR #13).
  - *Siguiente paso inmediato:* Comenzar con la tarea `S2-03: Módulo de Paginación pura y navegación por URL` en la rama `sprint-2-paginacion`.

---

## 📌 Pendiente (Backlog)

### Must have (Tarjetas planificadas para Sprint 2 · v0.2)
- [x] **S2-01: Módulo de datos de Entidades y almacenamiento por usuario** — Prioridad: Alta — Dep: S1-04, S1-05 (Completado en PR #12)
- [x] **S2-02: Validadores de la entidad deportiva con expresiones regulares** — Prioridad: Alta — Dep: Ninguna (Completado en PR #13)
- [ ] **S2-03: Módulo de Paginación pura y navegación por URL** — Prioridad: Alta — Dep: Ninguna
- [ ] **S2-04: Formulario de Ficha - Alta y edición con campo condicional** — Prioridad: Alta — Dep: S2-01, S2-02
- [ ] **S2-05: Formulario de Ficha - Grupo dinámico de ejercicios** — Prioridad: Alta — Dep: S2-04
- [ ] **S2-06: Sistema de validación en tiempo real en los 3 formularios** — Prioridad: Alta — Dep: S2-02, S2-04
- [ ] **S2-07: Listado de entrenamientos con buscador con debounce y borrado modal** — Prioridad: Alta — Dep: S2-01, S2-03
- [ ] **S2-08: Zona de administración de usuarios y gestión de roles** — Prioridad: Alta — Dep: S1-04, S1-05, S2-03
- [ ] **S2-09: Tests de integración de páginas y pirámide de pruebas** — Prioridad: Alta — Dep: S2-04, S2-07, S2-08
- [ ] **S2-10: Pruebas End-to-End con Playwright** — Prioridad: Alta — Dep: S2-07, S2-08, S2-09
- [ ] **S2-11: Integración continua completa (Paso 2) y cierre del Sprint 2 (v0.2)** — Prioridad: Alta — Dep: S2-01 a S2-10

### Should have (Sprint 3 · v1.0)
- [ ] **Despliegue Continuo en Vercel (Requisitos 24-25):** Configuración de despliegue automatizado, chequeos de compilación y verificación de rutas limpias. — Prioridad: Media — Dep: Sprint 2
- [ ] **Pruebas End-to-End completas:** Cobertura de flujos críticos con Playwright contra la web desplegada. — Prioridad: Media — Dep: Despliegue

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

### Próximos 3 pasos concretos a ejecutar
1. **Crear la rama para el modelo de datos de entrenamientos del Sprint 2:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b sprint-2-entidades
   ```
2. **Definir el módulo de datos `js/entrenamientos.js`:**
   - Implementar las funciones de persistencia: `obtenerEntrenamientos(usuario, almacen)`, `guardarEntrenamientos(usuario, lista, almacen)`, `crearEntrenamiento(usuario, datos, almacen)` con IDs generados mediante `crypto.randomUUID()`.
   - Asegurar tolerancia a JSON corrupto en `localStorage`.
3. **Escribir sus tests unitarios correspondientes en `tests/unitarios/entrenamientos.test.js`** utilizando `AlmacenFalso` antes de avanzar a los controladores de la interfaz.

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

---

## 🕒 Historial de Cambios del Documento

| Fecha | Versión | Cambio realizado | Responsable |
|:---:|:---:|---|:---:|
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
