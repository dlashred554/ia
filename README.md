# Estudio de vídeo IA — modo local

La app recibe un prompt, lo divide en escenas, pide cada clip a ComfyUI instalado en tu propio PC y después une los clips con ffmpeg.

## Importante

Tu GTX 1650 Ti de 4 GB de VRAM es demasiado limitada para modelos de vídeo modernos como Wan2.1 T2V-1.3B, que requiere alrededor de 8.19 GB de VRAM. Esta versión usa una ruta más ligera basada en AnimateDiff-Lightning + un checkpoint SD1.5.

## Preparación

1. Instala ComfyUI para Windows con soporte NVIDIA.
2. Instala ComfyUI-AnimateDiff-Evolved y ComfyUI-VideoHelperSuite.
3. Coloca un checkpoint SD1.5 compatible en ComfyUI/models/checkpoints/.
4. Coloca animatediff_lightning_4step_comfyui.safetensors en ComfyUI/custom_nodes/ComfyUI-AnimateDiff-Evolved/models/.
5. Arranca ComfyUI en http://127.0.0.1:8188.
6. En este repositorio ejecuta npm install y después npm start.
7. Abre http://localhost:3000.

## Qué hace

El prompt se divide en clips cortos. Cada clip se genera en tu GPU y después ffmpeg los une en un MP4 vertical.

## Importante

Si usas Render u otro servidor web, ese servidor NO puede acceder a la GPU de tu portátil. Para usar tu GTX 1650 Ti, esta aplicación debe ejecutarse en localhost.

Con 4 GB de VRAM puede haber errores de memoria. Mantén clips cortos y resolución moderada.