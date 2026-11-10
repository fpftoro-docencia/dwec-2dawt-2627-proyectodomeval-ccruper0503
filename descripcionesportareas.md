# SportLog · Diario de Entrenamientos y Rendimiento Deportivo
## Registro Detallado de Tareas Realizadas (Sprint 1)

Este documento describe en profundidad el trabajo técnico y arquitectónico realizado en cada una de las tareas del proyecto **SportLog** (DWEC 2º DAWT, Curso 2026/2027) desde el inicio hasta el estado actual.

---

### Metodología y Entorno de Desarrollo
* **Estrategia Git & GitHub:** Flujo de ramas de características (`feature-branches`) partiendo de `main` con nombres normalizados (`sprint-1-<tarea>`), integración mediante **Pull Requests con Merge Commit**, y preservación intacta del historial de ramas en GitHub sin borrado destructivo.
* **Entorno de ejecución:** Docker DevContainer oficial en Linux (`Ubuntu`, Node.js v24, Vitest v5.1.0, ESLint v9, Playwright).
* **Gestión de proyecto:** Tablero Kanban en Trello sincronizado en tiempo real por API (*Por hacer* $\rightarrow$ *Haciendo* $\rightarrow$ *Hecho*).
* **Diseño & Maquetación:** HTML semántico y accesible (WAI-ARIA), Bootstrap 5.3 solo CSS (sin librerías JavaScript de Bootstrap para cumplir estrictamente con el enunciado del curso y programar la lógica DOM nativa en JavaScript ES Modules).

---

## Índice de Tareas Completadas

1. [S1-01: Documentación inicial y Definición de Hecho](#s1-01-documentación-inicial-y-definición-de-hecho)
2. [S1-02: Maquetación base de las 5 páginas y estilos](#s1-02-maquetación-base-de-las-5-páginas-y-estilos)
3. [S1-03: Sistema y módulo de avisos](#s1-03-sistema-y-módulo-de-avisos)
4. [S1-04: Módulo de datos de Usuarios con hash de contraseñas](#s1-04-módulo-de-datos-de-usuarios-con-hash-de-contraseñas)
5. [S1-05: Módulo de Sesión y control de acceso por roles](#s1-05-módulo-de-sesión-y-control-de-acceso-por-roles)
6. [S1-06: Formulario de Registro con feedback en tiempo real](#s1-06-formulario-de-registro-con-feedback-en-tiempo-real)
7. [S1-07: Formulario de Login y control de envíos](#s1-07-formulario-de-login-y-control-de-envíos)
8. [Estado Actual del Proyecto y Métricas](#estado-actual-del-proyecto-y-métricas)

---

### S1-01: Documentación inicial y Definición de Hecho
* **Rama:** `sprint-1-documentacion`
* **Commits:** `36a7a0e`, `f19597e`
* **Pull Request:** [PR #1](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/1)
* **Objetivo:**
  Definir la temática de la aplicación, modelar los campos de la entidad deportiva en el `README.md`, diseñar las reglas de validación del formulario de registro y establecer la arquitectura de las 5 páginas del sistema.
* **Qué se hizo:**
  1. **Elección de tema:** Selección de **SportLog** (Diario y seguimiento de entrenamientos y marcas deportivas).
  2. **Definición de la Entidad:** Se documentaron los campos principales: Título de sesión, Disciplina deportiva (desplegable), Fecha (máximo hoy), Duración en minutos (entero positivo), Competición oficial (checkbox condicional), Dorsal/Puesto (campo condicional), y Bloque dinámico de ejercicios y repeticiones.
  3. **Especificación del Registro:** Definición de requisitos para nombre de usuario único, correo electrónico con expresión regular, contraseña con requisitos mínimos (longitud, mayúscula, minúscula, número) y aceptación de términos y condiciones.
  4. **Mapa de páginas:** `index.html` (login público), `registro.html` (alta de usuarios), `listado.html` (historial privado), `ficha.html` (alta/edición de entrenamientos) y `usuarios.html` (panel de administración).

---

### S1-02: Maquetación base de las 5 páginas y estilos
* **Rama:** `sprint-1-maquetacion`
* **Commits:** `c673d7a`, `b4016c7`
* **Pull Request:** [PR #2](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/2)
* **Objetivo:**
  Crear la estructura HTML base de las 5 vistas de la aplicación con Bootstrap CSS y diseñar un tema visual moderno y deportivo.
* **Qué se hizo:**
  1. **Estructura HTML semántica:** Se maquetaron las 5 páginas utilizando elementos estándar (`<header>`, `<main>`, `<aside>`, `<nav>`, `<dialog>`, `<template>`, `<form>`).
  2. **Diseño Visual SportLog "Dark Pro Edition":**
     - Se dotó a la aplicación de un diseño oscuro de alto rendimiento en `css/estilos.css`, con paleta deportiva (naranja atlético `#ff5722`, fondos oscuros profundos `#0a0d14`, superficies `#121722` y bordes sutiles con translucidez).
     - Se añadieron widgets de telemetría deportiva visual en las pantallas de acceso y registro (gráfica SVG interactiva de ritmo y pulso cardíaco, métricas de min/km y kilocalorías).
     - Componentes adaptados para accesibilidad con contrastes calculados y regiones `role="status"` y `aria-live="polite"` para avisos y validaciones.

---

### S1-03: Sistema y módulo de avisos
* **Rama:** `sprint-1-avisos`
* **Commit:** `acebcf7`
* **Pull Request:** [PR #3](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/3)
* **Objetivo:**
  Implementar el sistema desacoplado de avisos y notificaciones en pantalla mediante eventos del DOM personalizados (`CustomEvent`), conforme al Requisito 8 del enunciado.
* **Qué se hizo:**
  1. **Creación de `js/avisos.js`:**
     - Función `lanzarAviso(elementoEmisor, mensaje, tipo)`: emite un `CustomEvent('aviso', { bubbles: true, detail: { mensaje, tipo } })` permitiendo que cualquier botón, formulario o campo dispare notificaciones sin acoplarse directamente a la vista.
     - Función `iniciarAvisos(documento, almacen)`: registra un oyente centralizado en `document` que captura los eventos y renderiza alertas Bootstrap en `#contenedor-avisos`.
     - Funciones de persistencia entre redirecciones (`guardarAvisoParaSiguientePagina` y `comprobarAvisoPendiente`): guardan temporalmente en `sessionStorage` alertas (como "¡Registro completado!") para mostrarlas al cargar la siguiente página tras la redirección.
  2. **Tests unitarios:** Se crearon 3 pruebas en `tests/unitarios/avisos.test.js` verificando el renderizado de alertas en el DOM, las clases de Bootstrap según el tipo (`alert-success`, `alert-danger`, etc.) y el ciclo de vida del aviso diferido.

---

### S1-04: Módulo de datos de Usuarios con hash de contraseñas
* **Rama:** `sprint-1-usuarios`
* **Commit:** `cc5a069`
* **Pull Request:** [PR #4](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/4)
* **Objetivo:**
  Crear la capa de datos de usuarios (`js/usuarios.js`), persistencia en `localStorage`, roles (`administrador` vs `usuario`) y resumen criptográfico SHA-256 usando la Web Crypto API (`js/clave.js`).
* **Qué se hizo:**
  1. **Creación de `js/usuarios.js`:**
     - Funciones `obtenerUsuarios` y `guardarUsuarios`: leen y serializan los usuarios en `localStorage` con clave `sportlog_usuarios`.
     - **Tolerancia a fallos:** Devuelve un array vacío `[]` de forma segura si la clave no existe o si los datos guardados en el navegador están estropeados (JSON corrupto o manipulado desde DevTools).
     - **Regla del primer usuario:** Si la lista de usuarios está vacía, el primer usuario que se registre recibe automáticamente el rol `'administrador'`; todos los posteriores reciben `'usuario'`.
     - **Criptografía segura:** Las contraseñas nunca se guardan en texto plano; se resumen de forma asíncrona mediante `resumirClave` (SHA-256 en hexadecimal).
     - Función `verificarCredenciales(identificador, clave, almacen)`: permite identificarse indistintamente por nombre de usuario o por correo electrónico, comparando de forma asíncrona el hash calculado con el almacenado.
  2. **Tests unitarios:** Se crearon 11 tests en `tests/unitarios/usuarios.test.js` utilizando `AlmacenFalso` simulando todas las casuísticas exigidas (persistencia, hashing, prevención de nombres duplicados, verificación de credenciales y tolerancia a JSON corrupto).

---

### S1-05: Módulo de Sesión y control de acceso por roles
* **Rama:** `sprint-1-sesion`
* **Commits:** `0e59dbb`, `bb4b841`
* **Integración:** Fusión local controlada con commit de merge `bb4b841` y push a `origin/main`.
* **Objetivo:**
  Implementar la gestión de la sesión activa en el navegador (`sessionStorage`) y los guardias de control de acceso para proteger páginas públicas, privadas y de administración (Requisitos 3, 4 y 7).
* **Qué se hizo:**
  1. **Creación de `js/sesion.js`:**
     - `obtenerSesion`, `iniciarSesion`, `cerrarSesion`, `haySesion`: manipulación segura de la sesión activa en `sessionStorage` con clave `sportlog_sesion`.
     - `esAdministrador`: comprueba si el usuario activo posee el rol de administrador.
     - `protegerPaginaPrivada`: si no hay sesión iniciada, expulsa a `index.html` mediante `location.replace`.
     - `protegerPaginaAdmin`: si no hay sesión, expulsa a `index.html`; si hay sesión pero no es administrador, redirige a `listado.html` y deja un aviso en `sessionStorage` informando de la denegación de acceso.
     - `configurarCabeceraPrivada`: inyecta el nombre y rol del usuario conectado en la barra de navegación y vincula el botón "Cerrar sesión" para limpiar la sesión y redirigir a `index.html`.
  2. **Tests unitarios:** Se escribieron 13 tests en `tests/unitarios/sesion.test.js` con espías `vi.fn()` para validar las redirecciones, protección de rutas y resiliencia ante JSON corrupto.

---

### S1-06: Formulario de Registro con feedback en tiempo real
* **Rama:** `sprint-1-registro`
* **Commit:** `568177d`
* **Pull Request:** [PR #5](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/5)
* **Objetivo:**
  Implementar la lógica completa de validación interactiva y alta de usuarios en `registro.html`, `js/validadores.js` y `js/paginas/registro.js` (Requisito 5).
* **Qué se hizo:**
  1. **Creación de `js/validadores.js`:**
     - Funciones puras e independientes del DOM: `validarNombreUsuario`, `validarCorreo`, `comprobarRequisitosClave`, `validarClave`, `validarRepeticionClave`, `validarTerminos`.
     - Uso de expresiones regulares avanzadas con soporte Unicode: `\p{Ll}` para minúsculas y `\p{Lu}` para mayúsculas con flag `u`.
  2. **Creación de `js/paginas/registro.js`:**
     - **Feedback visual interactivo en vivo (`input`):** Al escribir en la contraseña, actualiza dinámicamente una lista de 4 requisitos (longitud $\ge 8$, mayúscula, minúscula y número), alternando la clase CSS `.cumplido` e iconos de verificación.
     - **Validación al perder el foco (`blur`):** Comprobación en `localStorage` si el usuario ya existe o si el formato no es válido, mostrando el mensaje de error accesible inmediatamente.
     - **Control anti-doble envío:** Desactiva el botón de envío y bloquea pulsaciones adicionales o dobles clics durante el hashing asíncrono.
     - **Autologin y transición fluida:** Registra al usuario, inicia su sesión en `sessionStorage`, almacena un aviso de bienvenida y redirige automáticamente a `listado.html`.
  3. **Tests unitarios:** 32 pruebas con tablas parametrizadas `it.each` en `tests/unitarios/validadores.test.js` (casos válidos, casos límite y mensajes de motivo ante casos no válidos).

---

### S1-07: Formulario de Login y control de envíos
* **Rama:** `sprint-1-login`
* **Commit:** `c8a35dd`
* **Pull Request:** [PR #6](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-ccruper0503/pull/6)
* **Objetivo:**
  Implementar el controlador de autenticación de `index.html` en `js/paginas/login.js` y el control de envíos concurrentes (Requisito 6).
* **Qué se hizo:**
  1. **Creación de `js/paginas/login.js`:**
     - **Comprobación de sesión existente:** Si el usuario ya cuenta con una sesión activa en `sessionStorage`, se le redirige inmediatamente a `listado.html` sin mostrar el formulario.
     - **Oyente de avisos:** Inicializa el contenedor de alertas para mostrar mensajes pendientes o de error.
     - **Manejo de credenciales erróneas:** Si las credenciales no coinciden, se emite una alerta descriptiva mediante `lanzarAviso`, se vacía el campo de contraseña (`campoClave.value = ''`) y se le otorga automáticamente el foco con `campoClave.focus()`.
     - **Bloqueo de envíos duplicados:** Uso de la bandera de control `enviando = true` y desactivación del botón `botonLogin.disabled = true` durante el cálculo del hash SHA-256 para evitar peticiones duplicadas ante pulsaciones repetidas de Enter o doble clic.
     - **Acceso con éxito:** Guarda la sesión activa y redirige a `listado.html` con un aviso de bienvenida.
  2. **Enlace en el HTML:** Se vinculó el script como módulo ES6 al pie de `index.html`.
  3. **Tests unitarios:** Se crearon 5 pruebas en `tests/unitarios/login.test.js` cubriendo la redirección inicial, validación de campos vacíos, credenciales incorrectas, login correcto y el bloqueo de envíos duplicados.

---

## Estado Actual del Proyecto y Métricas

| Métrica | Estado | Detalle |
|---|:---:|---|
| **Tests Unitarios e Integración** | **69 / 69 en verde (100%)** | Vitest v5.1.0 ejecutado en el contenedor Linux |
| **ESLint** | **0 errores** | Configuración plana `eslint.config.js` |
| **Construcción de producción** | **Completada** | `npm run build` genera la carpeta `dist/` |
| **Pull Requests en GitHub** | **6 PRs fusionadas** | #1 (Doc), #2 (Maquetación), #3 (Avisos), #4 (Usuarios), #5 (Registro), #6 (Login) |
| **Tablero Trello** | **Actualizado** | Tarjetas S1-01 a S1-07 en la columna «Hecho» |

---

### Próximas Tareas Pendientes para Cerrar el Sprint 1
* **S1-08:** Reglas de calidad con ESLint y Prettier (ampliar reglas personalizadas y documentar en `README.md`).
* **S1-09:** Revisión y consolidación de la suite de tests unitarios.
* **S1-10:** Configuración del workflow de integración continua en GitHub Actions (`.github/workflows/ci.yml`).
* **S1-11:** Entrada del blog (`blog/README.md`), reflexión final del Sprint 1 y etiquetado de la versión (`v0.1`).
