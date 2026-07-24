# Zenthera Design System

## Identidad Visual
Zenthera es una plataforma clínica moderna, ágil y confiable. El diseño debe transmitir pulcritud, innovación médica y eficiencia tecnológica. Su apariencia es "Premium", utilizando glassmorphism suave, interfaces limpias con mucho espacio en blanco (breathable UI) y micro-interacciones pulidas.

## Paleta de Colores
* **Primary**: Tonos azules modernos (confianza, salud, tecnología). Ej: `#0f172a` (oscuro) o `#2563eb` (brillante).
* **Surface / Background**: Uso de blancos, grises muy claros o temas oscuros con alto contraste. Interfaces "Glass" utilizan `bg-surface/50` o similar.
* **Text / Foreground**: `#0f172a` para texto principal, variantes atenuadas para jerarquía menor (`/70`, `/50`).
* **Semantic Colors**:
  * **Success**: Verde vibrante (Ej. `#10b981`).
  * **Error**: Rojo intenso pero suave (Ej. `#ef4444`).
  * **Warning**: Ámbar (Ej. `#f59e0b`).
  * **Info**: Azul cielo (Ej. `#3b82f6`).

## Tipografía
* **Familia principal**: Inter, Roboto, u Outfit (fuentes de Google limpias y modernas).
* **Títulos (h1, h2, h3)**: Pesos fuertes (Bold, SemiBold) con un tracking ajustado (`tracking-tight`).
* **Cuerpo de texto**: Legible, interlineado amplio (`leading-relaxed`), peso Regular o Medium.

## Escala de Espaciado
El sistema usa escalas base de 4px (Tailwind base):
* Micro: `gap-2` (8px), `gap-3` (12px)
* Base: `gap-4` (16px), `gap-6` (24px) para separar secciones internas de tarjetas.
* Macro: `gap-8` (32px), `pb-10` (40px) para separación estructural de páginas.

## Estilos de Botones
* **Primary**: Relleno sólido (`bg-primary`), color de texto invertido (`text-primary-foreground`), bordes redondeados (`rounded-xl`), sombra sutil (`shadow-lg shadow-primary/20`), transición al hacer hover (`hover:bg-primary/90`).
* **Secondary / Outline**: Fondo transparente o `bg-surface`, borde marcado (`border-border`), efecto en hover.
* **Ghost / Icon**: Usados en tablas o controles auxiliares, sin fondo hasta que se hace hover (`hover:bg-surface/70`).
* *Nota*: Todos los botones deben tener `focus:ring-2 focus:ring-primary` para accesibilidad.

## Inputs y Selects
* Formularios amigables de aspecto Premium.
* **Estructura**: Etiqueta (label) visible + Input grueso (`py-2.5 px-4`).
* **Estilo normal**: Fondo ligeramente más oscuro que la tarjeta (`bg-surface/50`), bordes sutiles (`border-border`), esquinas redondeadas (`rounded-xl`).
* **Focus**: Borde primario limpio (`focus:ring-2 focus:border-transparent focus:ring-primary`).
* **Error**: Borde rojo (`border-error focus:ring-error`).

## Tablas
* Fondos limpios. Filas amplias (`py-4 px-6`).
* Cabeceras con fuente menor pero en mayúsculas pequeñas o texto tenue y claro.
* Filas interactivas: Hover suave sobre toda la fila (`hover:bg-surface/30`), indicando que es clickeable (si aplica).
* Ordenamiento dinámico soportado visualmente (iconos de flechas).

## Cards
* Tarjetas estilo Glassmorphism.
* Clases típicas: `glass rounded-2xl border border-border overflow-hidden`.
* Evitar sombras duras nativas; preferir opacidad y desenfoque (backdrop-blur) si es aplicable.

## Modales
* Centrados en pantalla con `backdrop-blur-sm` en el fondo y `bg-background/80`.
* Modal body con `rounded-2xl`, sombra masiva pero difusa (`shadow-2xl`).
* Animaciones de entrada (`animate-in zoom-in-95`).

## Badges (Etiquetas de estado)
* Forma de píldora (`rounded-full`), tamaño pequeño (`text-xs`), ícono adjunto.
* **Activo**: `bg-success/10 text-success border-success/20`.
* **Inactivo**: `bg-error/10 text-error border-error/20`.

## Alertas
* Para feedback global o de validación.
* Contenedor redondeado (`rounded-xl`), fondo tenue del color semántico (`bg-error/10`), borde, texto del color fuerte (`text-error`) y siempre acompañadas de un ícono identificador.

## Sidebar y Navegación
* Clara indicación del estado "Activo" (resalte del link actual).
* Colapsable en móviles.
* Íconos consistentes en la navegación principal (lucide-react).

## Diseño Responsive
* Mobile first implícito.
* Formularios cambian de 1 columna (mobile) a 2 columnas (md/lg).
* Las tablas deben poseer `overflow-x-auto` para nunca quebrar el layout en mobile.
* Header y toolbars cambian a alineación apilada (`flex-col`) en dispositivos pequeños.

## Estados: Carga, Error, Vacío y Éxito
* **Loading**: Uso de Skeletons (cajas `animate-pulse` con forma del contenido final) para evitar saltos bruscos en el DOM. Spinners (`Loader2` animado) para botones.
* **Empty States**: Ícono grande atenuado al centro, título y sugerencia de acción clara.
* **Errores (Data Fetch)**: Visibles dentro del contexto (no superpuestos si no es necesario), mensaje amable sugiriendo el reintento (`Reintentar`).
* **Éxito**: Redirección natural o mensajes `Toast`/alertas.

## Accesibilidad (A11y)
* Formularios siempre con `label` (o `aria-label` si el espacio es nulo).
* Contrast ratio validado.
* Control con teclado inquebrantable (`tabindex`, modales que atrapan el foco, `Escape` para cerrar).
* `aria-sort` en tablas interactivas.

## Ejemplos
**Correcto**:
```tsx
<button className="bg-primary hover:bg-primary/90 text-primary-foreground focus:ring-2 focus:ring-primary rounded-xl px-4 py-2 transition-all">
  Guardar
</button>
```
**Incorrecto**:
```tsx
<button className="bg-blue-500 text-white" onClick={() => alert("Guardado")}>
  Guardar
</button> // Falta padding adecuado, hover, anillos de focus, border-radius inconsistente.
```
