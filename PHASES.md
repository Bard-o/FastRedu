# RSVP Reader — Plan de Implementación

## Contexto del proyecto

Aplicación web de lectura rápida usando el método RSVP (Rapid Serial Visual Presentation).
Stack: React + Vite + TypeScript. Sin backend. Sin router. Dos vistas: Editor y Lector RSVP.
Persistencia: `localStorage` para posición de lectura y configuración de WPM.
Ingesta: PDF nativo (pdf.js), DOCX (mammoth.js), texto plano.
Identidad visual: paleta Claude — fondo `#0f0f0d`, acento coral `#D97757`, texto blanco cálido.

---

## Arquitectura de componentes

```
App
├── EditorView
│   ├── UploadZone          # drag & drop + click, acepta pdf/docx/txt
│   ├── TextEditor          # textarea controlada, muestra texto extraído
│   ├── Sidebar
│   │   ├── WpmControl      # slider + botones +/- 25 WPM
│   │   └── ProgressInfo    # palabra actual / total
│   └── PlayButton          # FAB que transiciona a RSVPView
└── RSVPView
    ├── RSVPDisplay         # muestra la palabra con ORP coloreado
    ├── ProgressBar         # barra delgada de progreso global
    ├── ControlBar          # botones con atajos de teclado
    └── TopBar              # WPM badge, botón Esc/salir
```

Estado global mínimo (prop drilling o un único useReducer en App):
- `text: string` — texto completo procesado
- `words: string[]` — tokenización final
- `paragraphBoundaries: number[]` — índices donde empieza cada párrafo
- `currentIndex: number` — palabra actual
- `wpm: number` — velocidad actual
- `isPlaying: boolean`
- `view: 'editor' | 'rsvp'`

---

## Fase 1 — Setup del proyecto

**Objetivo:** repo funcionando con estructura de archivos y dependencias instaladas.

```bash
npm create vite@latest rsvp-reader -- --template react-ts
cd rsvp-reader
npm install pdfjs-dist mammoth
```

Configurar `vite.config.ts` para que `pdfjs-dist` resuelva el worker correctamente:
```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  }
})
```

Estructura de carpetas:
```
src/
├── components/
│   ├── EditorView/
│   ├── RSVPView/
│   └── shared/
├── hooks/
│   ├── useRSVPEngine.ts
│   └── useTextExtractor.ts
├── utils/
│   ├── textProcessor.ts    # tokenización y detección de párrafos
│   └── orp.ts              # cálculo del ORP
├── styles/
│   └── global.css
└── App.tsx
```

**Verificación:** `npm run dev` levanta sin errores. Página en blanco con fondo `#0f0f0d`.

---

## Fase 2 — Lógica central: procesamiento de texto

**Objetivo:** funciones puras que transforman texto crudo en la estructura que consume el motor RSVP.

### `src/utils/textProcessor.ts`

```ts
export interface ProcessedText {
  words: string[]
  paragraphBoundaries: number[]  // índice de la primera palabra de cada párrafo
}

export function processText(raw: string): ProcessedText {
  // 1. Normalizar saltos de línea
  // 2. Separar párrafos por líneas vacías (\n\n o más)
  // 3. Dentro de cada párrafo, tokenizar por espacios filtrando strings vacíos
  // 4. Registrar el índice acumulado donde empieza cada párrafo
}
```

Regla de tokenización: una "palabra" puede incluir su puntuación adherida ("hola," "mundo.").
No separar la puntuación — eso complica el re-ensamblado del texto en el editor.

### `src/utils/orp.ts`

El ORP es el carácter en el índice `Math.floor(word.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '').length * 0.35)` de la palabra limpia (sin puntuación inicial/final para el cálculo, pero mostrada completa).

```ts
export function getOrpIndex(word: string): number {
  // Strippear puntuación del inicio y fin para el cálculo
  const clean = word.replace(/^[^a-zA-ZáéíóúÁÉÍÓÚñÑ]+|[^a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/g, '')
  if (clean.length === 0) return 0
  return Math.floor(clean.length * 0.35)
}

export function splitWordAtOrp(word: string): { before: string; orp: string; after: string } {
  // Devuelve las tres partes para renderizar con color diferenciado
}
```

### Timing adaptivo

No todos los intervalos son iguales. Implementar multiplicadores:
- Palabras > 8 caracteres: `× 1.3`
- Palabras con puntuación final (`.`, `,`, `;`, `:`): `× 1.5`  
- Palabras con punto final (`.`, `!`, `?`): `× 1.8`
- Número puro: `× 1.0`

```ts
export function getWordDuration(word: string, wpm: number): number {
  const base = (60 / wpm) * 1000  // ms por palabra
  let multiplier = 1.0
  // aplicar reglas...
  return Math.round(base * multiplier)
}
```

**Verificación:** tests manuales en consola. `processText("Hola mundo.\n\nSegundo párrafo.")` debe retornar `{ words: ['Hola', 'mundo.', 'Segundo', 'párrafo.'], paragraphBoundaries: [0, 2] }`.

---

## Fase 3 — Extracción de texto (UploadZone + useTextExtractor)

**Objetivo:** drag & drop que acepta PDF, DOCX y TXT y devuelve texto plano.

### `src/hooks/useTextExtractor.ts`

```ts
export function useTextExtractor() {
  const extractText = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') return extractPdf(file)
    if (file.name.endsWith('.docx')) return extractDocx(file)
    return file.text()  // TXT plano
  }
  return { extractText }
}
```

**PDF con pdf.js:**
```ts
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

async function extractPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) =>
      pdf.getPage(i + 1).then(p => p.getTextContent())
    )
  )
  return pages
    .flatMap(p => p.items)
    .map((item: any) => item.str)
    .join(' ')
}
```

**DOCX con mammoth:**
```ts
import mammoth from 'mammoth'

async function extractDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}
```

**UploadZone:** div con `onDragOver`, `onDrop`, y `<input type="file" accept=".pdf,.docx,.txt">` oculto.
Al soltar/seleccionar, llamar `extractText(file)` y pasar el resultado al estado global `text`.

**Verificación:** subir un PDF de muestra y confirmar que el texto aparece en el textarea.

---

## Fase 4 — Motor RSVP (useRSVPEngine)

**Objetivo:** hook que maneja el loop de presentación con `setInterval` y expone controles.

```ts
// src/hooks/useRSVPEngine.ts

export function useRSVPEngine(words: string[], paragraphBoundaries: number[]) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wpm, setWpm] = useState(300)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Loop principal: usa setTimeout recursivo en lugar de setInterval
  // para poder ajustar el delay por palabra (timing adaptivo)
  const scheduleNext = useCallback(() => {
    if (!isPlaying) return
    const word = words[currentIndex]
    const delay = getWordDuration(word, wpm)
    timerRef.current = setTimeout(() => {
      setCurrentIndex(i => {
        if (i >= words.length - 1) {
          setIsPlaying(false)
          return i
        }
        return i + 1
      })
    }, delay)
  }, [isPlaying, currentIndex, words, wpm])

  useEffect(() => {
    if (isPlaying) scheduleNext()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [isPlaying, currentIndex])

  // Controles
  const play = () => setIsPlaying(true)
  const pause = () => { setIsPlaying(false); clearTimeout(timerRef.current!) }
  const toggle = () => isPlaying ? pause() : play()
  const skip = (n: number) => setCurrentIndex(i => Math.max(0, Math.min(words.length - 1, i + n)))
  const jumpToParagraphStart = () => {
    // Encontrar el último paragraphBoundary <= currentIndex
    const start = [...paragraphBoundaries].reverse().find(b => b <= currentIndex) ?? 0
    setCurrentIndex(start)
  }
  const adjustWpm = (delta: number) => setWpm(w => Math.max(100, Math.min(1000, w + delta)))

  // Persistir en localStorage
  useEffect(() => {
    localStorage.setItem('rsvp_index', String(currentIndex))
    localStorage.setItem('rsvp_wpm', String(wpm))
  }, [currentIndex, wpm])

  return { currentIndex, isPlaying, wpm, toggle, skip, jumpToParagraphStart, adjustWpm }
}
```

**Nota sobre setTimeout recursivo vs setInterval:** `setInterval` acumula drift — si el callback tarda, los ticks se solapan. Con `setTimeout` recursivo cada siguiente tick se programa al completar el anterior, manteniendo el timing adaptivo limpio.

**Verificación:** hook funciona en aislamiento con un array de palabras hardcodeado. Play/pause/skip operan correctamente. El índice se persiste en localStorage.

---

## Fase 5 — Componentes de UI

### RSVPDisplay

El componente más crítico visualmente. La palabra se divide en tres spans:

```tsx
function RSVPDisplay({ word }: { word: string }) {
  const { before, orp, after } = splitWordAtOrp(word)
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: 'Georgia, serif', fontSize: 38 }}>
      <span style={{ color: 'rgba(255,255,255,0.75)' }}>{before}</span>
      <span style={{ color: '#D97757' }}>{orp}</span>
      <span style={{ color: 'rgba(255,255,255,0.75)' }}>{after}</span>
    </div>
  )
}
```

El contenedor padre debe tener `position: relative` y el ORP debe estar alineado siempre en `left: 50%` (o un punto fijo definido). Esto significa que el span `before` debe tener `text-align: right` y el span `after` `text-align: left`, ambos con `display: inline-block` y ancho máximo fijo — o más simple: el contenedor es `display: flex` con el ORP como punto de referencia central.

Implementación de alineación fija del ORP:
```tsx
// Ancho reservado para los caracteres previos al ORP
const MAX_BEFORE = 8  // caracteres máximos antes del ORP en palabras largas
// El span 'before' tiene min-width = MAX_BEFORE * fontSize_aproximado
// Así el ORP siempre cae en la misma columna visual
```

### ControlBar — atajos de teclado

```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLTextAreaElement) return  // no interferir con el editor
    switch (e.key) {
      case ' ':       e.preventDefault(); toggle(); break
      case 'ArrowLeft':  skip(-10); break
      case 'ArrowRight': skip(10); break
      case 'ArrowUp':    jumpToParagraphStart(); break
      case '[':       adjustWpm(-25); break
      case ']':       adjustWpm(25); break
      case 'Escape':  onExit(); break
    }
  }
  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}, [toggle, skip, jumpToParagraphStart, adjustWpm])
```

### EditorView — resaltado de posición

Al volver del modo RSVP, el editor debe mostrar la palabra en `currentIndex` resaltada.
Implementar con un `<span>` wrapping cada token en el render del editor, y al montar la vista hacer scroll al span con `ref.scrollIntoView({ block: 'center' })`.

El editor no usa `<textarea>` para el render con highlights — usa un `<div contentEditable>` o renderiza el texto como lista de spans clicables. La edición libre es un nice-to-have; si complica, usar textarea para editar y div de preview para leer con highlight.

**Verificación de la fase completa:**
- Subir PDF → texto aparece en editor
- Clic en Leer → transición a modo RSVP
- Palabras pasan con ORP coloreado en posición fija
- Space pausa/reanuda
- ← salta 10 palabras atrás
- Esc regresa al editor con la palabra actual resaltada y visible en viewport

---

## Fase 6 — Pulido y detalles finales

Prioridad decreciente — completar en orden:

1. **Transición de vistas:** fade-in/fade-out simple con `opacity` transition (200ms) al cambiar entre editor y RSVP.

2. **Estado vacío del editor:** cuando no hay texto, el área muestra un mensaje de invitación y el botón Leer está deshabilitado.

3. **Feedback de velocidad:** al cambiar WPM, mostrar brevemente el nuevo valor en grande en el centro del display RSVP (aparece 800ms y desaparece).

4. **Restauración de sesión:** al cargar la app, leer `rsvp_index` y `rsvp_wpm` de localStorage. Si existe texto guardado (también persistir), restaurar estado completo.

5. **Responsive básico:** en mobile, el sidebar del editor colapsa debajo del textarea. La vista RSVP es naturalmente mobile-friendly.

6. **Mensaje de fin de texto:** al llegar a la última palabra, mostrar overlay breve "Fin del texto" con botón para volver al editor.

---

## Atajos de teclado — referencia completa

| Acción | Tecla |
|---|---|
| Play / Pausa | `Space` |
| −10 palabras | `←` |
| +10 palabras | `→` |
| Inicio del párrafo actual | `↑` |
| Velocidad −25 WPM | `[` |
| Velocidad +25 WPM | `]` |
| Salir del modo RSVP | `Esc` |

---

## Decisiones de diseño — referencia para agentes

- Fuente del lector RSVP: serif (Georgia como fallback, o cargar `Lora` de Google Fonts). El serif en el momento de lectura concentrada ayuda al reconocimiento de formas de letra a alta velocidad.
- Fuente de UI (editor, controles): sans-serif del sistema.
- Fondo modo RSVP: `#0a0a08` (más oscuro que el editor `#0f0f0d`) para máxima concentración.
- El ORP siempre en `#D97757`. No hay segundo color de acento.
- Sin animaciones de entrada/salida de palabras en el display RSVP — la velocidad misma es la animación.
- Border-radius general: 8px para elementos small, 12px para cards/pantallas.

---

## Checklist de entrega

- [ ] Fase 1: proyecto levanta sin errores
- [ ] Fase 2: `processText` y `splitWordAtOrp` testeadas en consola
- [ ] Fase 3: PDF, DOCX y TXT se extraen correctamente
- [ ] Fase 4: motor RSVP con timing adaptivo funciona en aislamiento
- [ ] Fase 5: flujo completo editor → RSVP → editor con highlight
- [ ] Fase 6: pulido de transiciones y estados vacíos
