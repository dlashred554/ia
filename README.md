# Estudio de vídeo IA

Escribes un prompt, eliges duración y estilo, y la app genera un MP4 vertical (1080×1920, 9:16).
Vídeos cortos = un clip. Vídeos largos = escenas planificadas automáticamente, generadas una a una y unidas con ffmpeg.

## Estructura
```
server.js            API + servidor web + orquestación de trabajos
lib/planner.js       Divide el prompt en escenas (con "biblia visual" para continuidad)
lib/ffmpeg.js        Normaliza clips a 9:16 y los une (ffmpeg-static, sin instalar nada)
providers/           Proveedores intercambiables (mock, replicate)
public/index.html    Interfaz
.env.example  render.yaml  package.json
```

## Ejecutar en local
1. Instala Node 18 o superior.
2. `npm install`
3. `cp .env.example .env`
4. `npm start` y abre http://localhost:3000

Por defecto usa `VIDEO_PROVIDER=mock`: **no genera vídeo con IA**, solo clips de prueba para verificar el flujo completo.

## Activar generación real con IA (Replicate)
1. Crea una cuenta en https://replicate.com y un token en https://replicate.com/account/api-tokens
2. En `.env`:
   ```
   VIDEO_PROVIDER=replicate
   REPLICATE_API_TOKEN=tu_token
   REPLICATE_MODEL=minimax/video-01
   CLIP_SECONDS=6
   ```
3. Reinicia.

**Variable obligatoria: `REPLICATE_API_TOKEN`.**
Antes de usar un modelo, abre su página en Replicate y comprueba: precio por clip, duración real del clip (`CLIP_SECONDS`) y parámetros aceptados (puedes pasarlos en `REPLICATE_EXTRA_INPUT` como JSON). La app solo envía `prompt` más lo que pongas ahí.

## Costes y límites (importante)
- Replicate da créditos limitados y luego cobra por uso; la disponibilidad depende de tu cuenta. No hay generación ilimitada.
- Cada escena es una llamada de pago: 3 minutos con clips de 6 s ≈ 30 clips. La interfaz muestra el número estimado antes de generar.
- Las escenas se generan en secuencia para respetar límites de peticiones (con reintentos ante error 429).
- `MAX_TOTAL_SECONDS` (180 por defecto) limita la duración total.

## Desplegar en Render
1. Sube la carpeta a un repositorio de GitHub.
2. En Render: **New → Blueprint** y selecciona el repo (usa `render.yaml`), o **New → Web Service** con Build `npm install` y Start `npm start`.
3. En *Environment* añade `REPLICATE_API_TOKEN` y cambia `VIDEO_PROVIDER` a `replicate`.
4. Notas del plan gratuito: el disco es efímero (los vídeos se pierden al reiniciar; descárgalos) y el servicio se duerme por inactividad. Los vídeos largos tardan minutos y ffmpeg usa CPU y RAM (512 MB puede quedarse justo).

## Añadir otro proveedor
Crea `providers/mi-proveedor.js` exportando:
```js
{ name, requiresApiKey, envVar, clipSeconds, notice, isConfigured(), async generateClip({ prompt, seconds, outPath }) }
```
`generateClip` debe guardar un MP4 en `outPath`. Regístralo en `providers/index.js` y usa `VIDEO_PROVIDER=mi-proveedor`.

## Limitaciones actuales
- La continuidad entre escenas se logra repitiendo personajes, estilo y escenario en cada prompt. No es perfecta; para más consistencia se puede usar imagen-a-vídeo con el último fotograma de cada escena (requiere un modelo que lo soporte).
- El planificador de escenas es heurístico (no usa un LLM).
- No hay audio, cola de trabajos persistente ni cuentas de usuario.
