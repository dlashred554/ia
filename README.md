# Estudio de vídeo IA — generación online

La app recibe un prompt, lo divide en escenas de hasta 5 segundos, genera cada clip online con **Wan 2.1 1.3B mediante Replicate** y después une los clips con ffmpeg en un único MP4 vertical 9:16.

## No necesitas instalar nada de IA en tu portátil

Solo necesitas un navegador y desplegar el proyecto en un servidor Node (por ejemplo, Render). La generación se ejecuta en Replicate, no en la GPU del portátil.

## Configuración

1. Crea una cuenta en Replicate y consigue un API token.
2. En el servicio donde despliegues la app, añade la variable secreta:
   `REPLICATE_API_TOKEN=tu_token`
3. Usa `VIDEO_PROVIDER=replicate`.
4. Despliega con:
   `npm install`
   y
   `npm start`.

**Nunca pongas el token dentro de GitHub ni en index.html.** Debe ser una variable secreta del servidor.

## Modelo

La app usa `wan-video/wan-2.1-1.3b`. El modelo genera vídeos de 5 segundos a 480p y admite formato vertical 9:16.

## Duraciones

Para vídeos de más de 5 segundos, el planificador crea varias escenas y las une automáticamente. Por ejemplo, 20 segundos son aproximadamente 4 generaciones del modelo.

## Coste

La generación online no es ilimitada gratis. El precio depende del modelo y del uso. Comprueba el precio actual en la página del modelo antes de generar muchos vídeos.

## Flujo

Navegador → tu servidor → Replicate → clips → ffmpeg → MP4 9:16 → navegador.
