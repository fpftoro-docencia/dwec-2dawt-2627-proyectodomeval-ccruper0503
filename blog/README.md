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
