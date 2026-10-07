# 🎧 Gym Audio Lobby

Lobby de **audio en tiempo real** para el navegador: varias personas entran a la
misma sala y hablan entre ellas con sus audífonos. Pensado para usar en el gym
cada uno desde su teléfono. Se despliega en **Netlify** y usa **LiveKit** como
motor de voz (WebRTC / SFU, escala a muchas personas).

## Cómo funciona

```
Navegador (React + livekit-client)
        │  1) POST /api/token { room, name }
        ▼
Netlify Function (netlify/functions/token.ts)
        │  2) firma un JWT de LiveKit con el API secret
        ▼
LiveKit (SFU)  ◀── 3) el navegador se conecta con el token y el audio viaja P2P/SFU
```

- El **API secret nunca llega al navegador**: solo viaja un token de corta vida (2 h).
- El audio **no** pasa por Netlify: LiveKit lo reparte directamente.

> ⚠️ **Limitación de la web móvil:** al bloquear la pantalla o cambiar de app, el
> navegador suele pausar el audio. Para probar/usar la idea mientras tienen la
> pestaña abierta funciona de sobra. El audio en segundo plano real requiere una
> app nativa (siguiente fase del proyecto).

## Requisitos

- Node.js 20+ (probado con v22).
- Una cuenta de [LiveKit Cloud](https://cloud.livekit.io) (tier gratis) **o** un
  servidor LiveKit self-hosted.

## Configuración local

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia el archivo de ejemplo y rellena tus credenciales de LiveKit Cloud
   (Settings → Keys):

   ```bash
   cp .env.example .env
   ```

   ```env
   LIVEKIT_URL=wss://tu-proyecto.livekit.cloud
   LIVEKIT_API_KEY=APIxxxxxxxxxxxx
   LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. Arranca el entorno de desarrollo. Tienes dos opciones:

   - **Solo Vite** (rápido, emula la función de tokens):

     ```bash
     npm run dev
     ```

     Abre http://localhost:5173.

   - **Con la Netlify CLI** (idéntico a producción: corre las Functions reales):

     ```bash
     npm run netlify:dev
     ```

     Abre http://localhost:8888. El frontend y la función `/api/token` se sirven
     en el mismo puerto, igual que en Netlify.

     La CLI (`netlify-cli`) ya viene incluida como dependencia de desarrollo.
     Si `netlify dev` pide enlazar un sitio, pulsa para **crear/enlazar** o usa
     `netlify link`. Solo la primera vez.

4. Prueba con **dos navegadores/dispositivos** en la misma red (usa el mismo
   nombre de lobby). Para acceder desde otros equipos de la red:
   `npm run dev -- --host`.

## Desplegar en Netlify

1. Sube este proyecto a un repositorio de Git (GitHub/GitLab).
2. En Netlify: **Add new site → Import from Git** y elige el repo.
   La config de build ya está en `netlify.toml` (build `npm run build`,
   publish `dist`, functions en `netlify/functions`).
3. En **Site settings → Environment variables** agrega:
   - `LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
4. Deploy. Netlify sirve la función de tokens en `/api/token` (definido por
   `config.path`) y da **HTTPS automático** (necesario para pedir el micrófono).

## Uso

1. Escribe tu **nombre** y el **nombre del lobby** (ej. `gym`).
2. Pulsa **Entrar al lobby**. El navegador pedirá permiso de micrófono.
3. Comparte el mismo nombre de lobby con tus compañeros para quedar en la misma
   sala. Verás a cada persona, quién está hablando y podrás silenciar tu micrófono
   o salir.

## Solución de problemas

### No escucho a las demás personas (aunque mi micrófono sí funciona)

Es la **política de autoplay** del navegador: reproducir audio está bloqueado
hasta que haya un gesto (toque/clic). El micrófono no se ve afectado, pero la
salida sí. Cómo resolverlo:

- Toca en cualquier parte de la pantalla, o pulsa el botón **🔊 Toca para activar
  el audio** que aparece. La app también lo desbloquea con el primer toque.
- **Prueba con dos dispositivos** (o Chrome + Edge), no con dos pestañas del
  mismo navegador, y usa **audífonos**. Dos pestañas con el mismo micrófono y las
  mismas bocinas activan la cancelación de eco y "se comen" la voz (eco/silencio).
- Comprueba que ambas personas escribieron **el mismo nombre de lobby**.
- En el móvil, el audio se pausa al bloquear la pantalla (limitación de la web).

### El navegador no pide permiso de micrófono / no conecta

Los navegadores solo permiten el micrófono en **HTTPS** o `localhost`. En Netlify
es automático; en pruebas locales abre `http://localhost`, no la IP de la LAN.

### `netlify dev` no arranca

Revisa la sección *Notas técnicas* (más abajo): TypeScript 5.x y versión de Node.

## Estructura

```
gym-audio-lobby/
├── netlify/functions/token.ts   # Firma los tokens de LiveKit (server-side)
├── src/
│   ├── components/              # JoinScreen, LobbyRoom, ParticipantTile, Controls
│   ├── livekit/
│   │   ├── useToken.ts          # Pide el token a /api/token
│   │   └── useLobby.ts          # Conexión al room, audio y estado de la sala
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vite.config.ts               # React + emulación de la función en dev
├── netlify.toml
└── .env.example
```

## Scripts

| Script                | Descripción                                        |
| --------------------- | -------------------------------------------------- |
| `npm run dev`         | Dev server (incluye la función de tokens en dev).  |
| `npm run build`       | Type-check + build de producción a `dist/`.        |
| `npm run preview`     | Sirve el build de producción localmente.           |
| `npm run netlify:dev` | Dev con la CLI de Netlify (requiere `netlify` CLI).|

## Notas técnicas

- **TypeScript fijado a `~5.9` (no 7.x a propósito).** La CLI de Netlify analiza
  las Functions con `ts-api-utils`, que no es compatible con la API de
  TypeScript 7; con TS 7 `netlify dev` falla al arrancar con
  `Cannot read properties of undefined (reading 'Intrinsic')`. Si actualizas
  TypeScript, no subas de la serie 5.x mientras uses `netlify dev`.
- **Requisitos de Node:** `netlify-cli@27` pide Node `>=22.13`. Verás un aviso
  `EBADENGINE` por una dependencia transitiva (`machina`) que pide `>=22.22`;
  es solo un warning y `netlify dev` funciona, pero si quieres evitar el aviso
  usa Node 22.22+.
- **`/.netlify/functions/token` y `/api/token`** apuntan a la misma función. El
  frontend siempre llama a `/api/token` (definido por `config.path`).

## Próximos pasos posibles

- Push-to-talk y atajos para usar sin mirar la pantalla.
- Audio en segundo plano (versión nativa: React Native + LiveKit).
- Crear/unirse a lobbies por enlace o código, e indicador de calidad de conexión.
