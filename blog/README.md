# Blog del proyecto

## 10/11/2026 · Sprint 1 · Cimientos arquitectónicos, seguridad con Web Crypto y flujo de calidad

### Dificultades y cómo las resolví

El primer reto importante surgió al integrar la función criptográfica `resumirClave` de la Web Crypto API (`crypto.subtle.digest`). Al ser una operación asíncrona que devuelve una promesa, descubrimos durante las pruebas que un usuario impaciente que pulsara la tecla Enter repetidamente o hiciera doble clic rápido en el botón de envío disparaba varias ejecuciones paralelas de `verificarCredenciales` o `registrarUsuario`. Esto provocaba condiciones de carrera y mensajes de error anómalos. Lo solucionamos implementando un estado de bloqueo en el formulario con una variable booleana `let enviando = false;` y desactivando el botón de envío en el DOM (`boton.disabled = true;`) en cuanto se inicia el proceso, liberándolo solo tras completarse la validación.

La segunda dificultad consistió en diseñar un sistema de notificaciones accesible que no requiriese acoplar cada componente con el contenedor visual de avisos. Además, al registrarnos o iniciar sesión con éxito, la aplicación realiza una redirección inmediata mediante `location.replace('listado.html')`, lo que destruía el DOM actual antes de que el usuario pudiese leer la confirmación. Resolvimos este problema desacoplando la emisión mediante un evento personalizado `CustomEvent('aviso', { bubbles: true, detail: { mensaje, tipo } })` con un único oyente centralizado en `document`, e implementando un almacenamiento temporal en `sessionStorage` (`sportlog_aviso_pendiente`) para los avisos diferidos, de modo que la página receptora compruebe y muestre automáticamente el mensaje nada más cargar.

La tercera dificultad apareció al comprobar los requisitos de las contraseñas con caracteres acentuados o propios del español como la «ñ» o tildes. Las expresiones regulares tradicionales `[a-z]` y `[A-Z]` fallaban con letras como «Á» o «é», tratando contraseñas seguras como si no tuvieran mayúsculas o minúsculas. Lo resolvimos adoptando las propiedades Unicode modernas `\p{Ll}` (letras minúsculas) y `\p{Lu}` (letras mayúsculas) con el indicador `u` en la expresión regular en `js/validadores.js`, garantizando una validación inclusiva y robusta.

### Problemas conceptuales

Un concepto que al principio resultaba confuso era la diferencia práctica y arquitectónica entre `localStorage` y `sessionStorage`, y por qué la sesión de usuario no debía guardarse junto con los usuarios registrados. `localStorage` persiste de forma indefinida en el navegador, lo que lo hace idóneo para la base de datos de usuarios (`sportlog_usuarios`), pero guardar allí la sesión provocaría que múltiples pestañas o ventanas compartieran la misma sesión de manera persistente incluso tras cerrar el navegador. `sessionStorage` está acotado estrictamente a la pestaña activa; si el usuario cierra la pestaña o ventana, la sesión expira inmediatamente. Por eso en `js/sesion.js` almacenamos la sesión activa en `sessionStorage`:

```javascript
// js/sesion.js (Líneas 41-47)
export function iniciarSesion(usuario, almacen = sessionStorage) {
  const datos = {
    nombreUsuario: usuario.nombreUsuario,
    rol: usuario.rol,
  };
  almacen.setItem(CLAVE_ALMACEN_SESION, JSON.stringify(datos));
}
```

Otro concepto fundamental aprendido ha sido la **inyección de dependencias** para hacer el código 100% testeable sin depender del entorno real del navegador. Al principio pensábamos que para probar funciones de lectura o guardado en Vitest era obligatorio interactuar con el objeto global `window.localStorage` (lo que crearía dependencias cruzadas entre tests). Al parametrizar el almacenamiento (`almacen = localStorage`) y la función de navegación (`navegar = (url) => location.replace(url)`), pudimos pasar instancias limpias de `AlmacenFalso` y espías de función `vi.fn()` en los tests unitarios. De este modo, podemos verificar que una función redirige correctamente a `listado.html` simplemente comprobando que `navegar` fue llamada con ese argumento, sin alterar la ventana real del navegador.

## 19/11/2026 · Sprint 2 · Validación en captura, pruebas reales en Happy-DOM y Playwright con selectores accesibles

### Dificultades y cómo las resolví

La primera dificultad apareció al escribir las pruebas de integración de `ficha.html` cargando el HTML real con `cargarPagina('ficha.html')` en `happy-dom`. Los tests unitarios previos pasaban sin problemas, pero el test de integración no guardaba el entrenamiento aunque todos los campos parecían válidos. Al inspeccionar la implementación de `ValidityState` en `happy-dom`, descubrimos que valida `step="0.01"` haciendo `Number(value) % Number(step) !== 0`. En aritmética binaria IEEE-754, `21.1 % 0.01` da un residuo distinto de cero (`9.8e-16`), por lo que `happy-dom` marcaba `stepMismatch = true` en cualquier distancia positiva. La solución fue usar `step="any"` en `#distancia` en `ficha.html`, lo que permite decimales arbitrarios en navegadores reales y evita el falso positivo de `stepMismatch`.

La segunda dificultad surgió al construir las pruebas de extremo a extremo con Playwright en `e2e/crud.spec.js`. Al comprobar que la distancia del nuevo entrenamiento aparecía en el listado con `page.getByText('21.1 km')`, Playwright falló por *strict mode violation* porque el texto `21.1 km` aparecía tanto en la tarjeta KPI superior (*Distancia Total*) como en la tarjeta del listado. Lo resolvimos acotando el localizador al *landmark* semántico correspondiente: `page.getByRole('region', { name: 'Listado de entrenamientos' }).getByText('21.1 km')`, manteniendo selectores accesibles sin recurrir a clases CSS frágiles.

La tercera dificultad fue evitar errores de validación sobre campos ocultos al implementar el bloque condicional de competición en `ficha.html`. Si ocultábamos el contenedor únicamente con `hidden`, el navegador seguía validando los atributos `required` internos e impedía enviar el formulario cuando no era competición. La solución fue combinar `hidden` en el bloque contenedor con `disabled = true` en `#nombre-competicion` y `#dorsal`, limpiando además su valor y revalidando al desmarcar la casilla para que ni se validen ni se incluyan en `FormData`.

### Problemas conceptuales

Un concepto clave de este sprint ha sido **por qué `blur` necesita la fase de captura mientras `input` y `click` usan delegación en burbuja**. A diferencia de `input` o `click`, el evento `blur` **no burbujea** hacia los elementos padre. Si registráramos `formulario.addEventListener('blur', ...)` en fase de burbuja, el formulario nunca se enteraría de que el usuario ha salido de un `<input>`. Al pasar `true` como tercer parámetro en `js/validacion-formularios.js`, el formulario intercepta el evento durante la bajada hacia el campo objetivo, cubriendo tanto campos iniciales como las filas añadidas dinámicamente en el grupo de ejercicios:

```javascript
// js/validacion-formularios.js (Líneas 421-424)
// `blur` no burbujea: se escucha en fase de captura para cubrir campos estáticos y dinámicos
formulario.addEventListener('blur', manejarBlur, true);
formulario.addEventListener('input', manejarCambio);
formulario.addEventListener('change', manejarCambio);
```

Otro concepto fundamental ha sido distinguir los **tres niveles de la pirámide de pruebas** y qué papel cumple cada uno:
- **Unitarias:** prueban funciones puras y capas de datos aisladas (`paginar`, validadores con `it.each`, `entrenamientos.js` con `AlmacenFalso`) en milisegundos.
- **Integración:** cargan el `<body>` real de cada página HTML en `happy-dom` (`tests/pagina.js`) conectando sus controladores reales con `AlmacenFalso`, `vi.fn()` y `vi.useFakeTimers()` para comprobar el *debounce* del buscador o la validación al salir/escribir sin levantar un navegador real.
- **Extremo a extremo (Playwright):** arrancan la web servida con `serve` en Chromium real y verifican recorridos completos de usuario (`registro` -> `usuarios` -> `cerrar sesión` -> `login` y ciclo completo de `CRUD` sobreviviendo a `page.reload()`).

Finalmente, en `ci.yml` comprendimos el valor de `needs` y `concurrency`: encadenar `Calidad -> Tests -> E2E` evita instalar Chromium y ejecutar Playwright si ya ha fallado ESLint o el umbral de cobertura, mientras que `concurrency` con `cancel-in-progress: true` agrupado por `${{ github.workflow }}-${{ github.ref }}` cancela ejecuciones obsoletas cuando se suben commits seguidos en una misma rama.
