# 📊 Dashboard Rediseño - Especificación Visual & Técnica

## 1. VISIÓN GENERAL

Transformar el dashboard actual (funcional pero simple) en una interfaz moderna, analítica y visualmente rica, similar a **Stripe Dashboard** o **Power BI Embedded**, manteniendo exactamente la misma lógica de negocio y estructura de datos.

**Objetivos:**
- ✅ Apariencia moderna y profesional (SaaS-style)
- ✅ Información densa pero bien jerarquizada
- ✅ Visualizaciones ricas (gráficos en lugar de listas)
- ✅ Análisis ejecutivo a simple vista
- ✅ CERO cambios a endpoints, servicios, hooks, lógica

---

## 2. DISEÑO VISUAL - LAYOUT

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Filtros + Actualizar                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┬────────────┬────────────┬────────────┬───────────┐ │
│  │   KPI 1 │   KPI 2    │   KPI 3    │   KPI 4    │   KPI 5   │ │
│  │ Total   │ Ticket     │ Facturación│ Cantidad   │ Variación │ │
│  │Movs     │ Promedio   │ Total      │ Acumulada  │ Anterior  │ │
│  └─────────┴────────────┴────────────┴────────────┴───────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  CHARTS SECTION (3 filas)                                │   │
│  │                                                          │   │
│  │  ┌────────────────────┬──────────────┬──────────────┐   │   │
│  │  │ Top Propietarios   │  Ingresos    │  Ingresos    │   │   │
│  │  │ (Barras horiz.)    │  por Tipo    │  por CECO    │   │   │
│  │  │                    │  (Donut)     │  (Donut)     │   │   │
│  │  └────────────────────┴──────────────┴──────────────┘   │   │
│  │                                                          │   │
│  │  ┌────────────────────┬──────────────────────────────┐   │   │
│  │  │ Top VTA            │ Ingresos × Día               │   │   │
│  │  │ (Barras horiz.)    │ (Combo: barras + línea)      │   │   │
│  │  │                    │                              │   │   │
│  │  └────────────────────┴──────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ Actividad Reciente (tabla mejorada)              │   │   │
│  │  │ con scroll, tipografía jerárquica, valores       │   │   │
│  │  │ resaltados                                       │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. COMPONENTES NUEVOS A CREAR

### 3.1 KPI Card Mejorada

**Componente:** `EnhancedKPICard.jsx`

```jsx
<EnhancedKPICard
  icon={<TrendingUpIcon />}
  label="Facturación Total"
  value="$125,450"
  change="+12.5%"
  changeType="positive"
  sparklineData={[...]}  // Array de valores para Mini gráfico
  tone="blue"  // 'blue' | 'green' | 'red' | 'orange'
/>
```

**Características:**
- Icono + Etiqueta
- Valor destacado
- Subtexto con variación
- Sparkline (mini gráfico de línea)
- Color coding (tone)
- Hover effect sutil

---

### 3.2 Gráfico de Barras Horizontales

**Componente:** `HorizontalBarChart.jsx`

```jsx
<HorizontalBarChart
  title="Top Propietarios"
  subtitle="Facturación (últimos 30 días)"
  data={[
    { name: 'Propietario A', value: 45000, color: '#1976d2' },
    { name: 'Propietario B', value: 32000, color: '#2196f3' },
    ...
  ]}
  showValues={true}
  showPercentage={true}
  height={250}
/>
```

**Características:**
- Barras ordenadas descendente
- Valores y porcentajes visibles
- Colores personalizados
- Etiquetas legibles

---

### 3.3 Gráfico Donut (Pie)

**Componente:** `DonutChart.jsx`

```jsx
<DonutChart
  title="Ingresos por Tipo de Movimiento"
  data={[
    { name: 'CARGUE', value: 145000, color: '#4caf50' },
    { name: 'DESCARGUE', value: 98000, color: '#f44336' },
    { name: 'TRANSFERENCIA', value: 52000, color: '#ff9800' },
  ]}
  totalLabel="Total"
  height={280}
  showLegend={true}
/>
```

**Características:**
- Valor total en el centro
- Colores por categoría
- Leyenda lateral con %
- Hover con tooltip

---

### 3.4 Combo Chart (Barras + Línea)

**Componente:** `ComboChart.jsx`

```jsx
<ComboChart
  title="Ingresos × Día"
  subtitle="Barras: ingresos | Línea: cantidad"
  data={[
    { date: '2026-04-15', ingresos: 12500, cantidad: 85 },
    { date: '2026-04-16', ingresos: 15200, cantidad: 102 },
    ...
  ]}
  barKey="ingresos"
  lineKey="cantidad"
  barColor="#1976d2"
  lineColor="#4caf50"
  height={300}
/>
```

**Características:**
- Eje doble (izquierda: $, derecha: cantidad)
- Barras + Línea con colores distintos
- Grid de fondo
- Tooltip detallado

---

### 3.5 Activity Table Mejorada

**Mejoras visuales:**
- Tipografía jerárquica (propietario grande, VTA más pequeño)
- Valores monetarios resaltados en color
- Badges de tipo de movimiento
- Mejor padding/spacing
- Hover effect sutil

---

## 4. ESTRUCTURA DE CARPETAS

```
frontend/src/
├── components/
│   └── dashboard/
│       ├── DashboardFilters.jsx          (sin cambios)
│       ├── DashboardRecentActivityTable.jsx (mejorada visualmente)
│       ├── KPISection/
│       │   ├── EnhancedKPICard.jsx       (NUEVO)
│       │   └── KPIGrid.jsx               (NUEVO - organiza 5 KPIs)
│       ├── ChartsSection/
│       │   ├── HorizontalBarChart.jsx    (NUEVO)
│       │   ├── DonutChart.jsx            (NUEVO)
│       │   ├── ComboChart.jsx            (NUEVO)
│       │   └── ChartContainer.jsx        (NUEVO - wrapper con estilos)
│       └── ...
├── hooks/
│   ├── useDashboardKPIs.js               (sin cambios)
│   ├── useDashboardAggregations.js       (sin cambios)
│   ├── useDashboardChartData.js          (NUEVO - transformar datos para gráficos)
│   └── ...
├── pages/
│   └── dashboard/
│       └── DashboardPage.jsx             (REFACTOR - nuevo layout)
├── styles/
│   └── theme.js                          (verificar/expandir colores)
└── ...
```

---

## 5. PALETA DE COLORES

```javascript
const DASHBOARD_COLORS = {
  // Revenue & Income
  blue: '#1976d2',           // Principal
  lightBlue: '#42a5f5',      // Secundario
  darkBlue: '#1565c0',       // Hover

  // Positive / Growth
  green: '#4caf50',          // Positivo
  lightGreen: '#81c784',     // Suave
  darkGreen: '#388e3c',      // Fuerte

  // Negative / Decline
  red: '#f44336',            // Error/Decline
  lightRed: '#ef5350',       // Suave
  darkRed: '#d32f2f',        // Fuerte

  // Warning
  orange: '#ff9800',         // Warning
  lightOrange: '#ffb74d',    // Suave
  darkOrange: '#f57c00',     // Fuerte

  // Neutrals
  gray: '#757575',
  lightGray: '#bdbdbd',
  bgGray: '#f5f5f5',
};
```

---

## 6. PALETA TIPOGRÁFICA

```javascript
// H1: Títulos principales (28px, bold)
// H4: Valores KPI (24px, bold)
// Subtitle1: Títulos sección (18px, bold)
// Subtitle2: Subtítulos (14px, medium)
// Body1: Texto base (14px, regular)
// Body2: Texto secundario (13px, regular)
// Caption: Etiquetas pequeñas (12px)
```

---

## 7. ICONOGRAFÍA

Usar `@mui/icons-material`:

```javascript
// KPI Cards
TrendingUpIcon          // Variación positiva
TrendingDownIcon        // Variación negativa
AttachMoneyIcon         // Facturación
ShoppingCartIcon        // Cantidad/Movimientos
PersonIcon              // Propietarios
StorageIcon             // VTA
TrendingFlatIcon        // Sin variación

// Sections
BarChartIcon            // Gráficos
PieChartIcon            // Donuts
TimelineIcon            // Series temporales
TableChartIcon          // Tablas
```

---

## 8. RESPONSIVE DESIGN

```javascript
// Mobile (xs < 600px)
// - 1 KPI por fila
// - Charts apilados verticalmente
// - Table scroll horizontal

// Tablet (sm 600px - md 960px)
// - 2 KPIs por fila
// - 2 Charts por fila
// - Table con scroll

// Desktop (md 960px+)
// - 5 KPIs por fila
// - Layout 2+1 para charts
// - Table completa
```

---

## 9. DATOS QUE NECESITAN TRANSFORMACIÓN

**Para gráficos tipo Donut (Ingresos por Tipo):**
- Necesario: Agrupar movimientos por campo `tipo`
- Datos actuales disponibles: `item.tipo`
- Transformación: `useDashboardChartData` (NUEVO hook)

**Para gráfico Combo (Ingresos × Día):**
- Necesario: Agrupar por fecha + calcular acumulados
- Datos actuales: `item.fecha`, `item.total`, `item.cantidad`
- Transformación: Mismo hook `useDashboardChartData`

**Para CECO (si aplica):**
- Necesario: Verificar si existe `item.ceco` en datos
- Si existe: Agrupar por CECO
- Si no existe: Usar alternativa o deshabilitar gráfico

---

## 10. MEJORAS VISUALES A TABLA RECIENTE

**Antes:**
```
| Fecha | Propietario | VTA | CECO | Tipo | Cantidad | Total |
| 2026-04-21 | Propietario A | VTA-001 | ... | CARGUE | 125 | $12,500 |
```

**Después:**
```
┌─────────────────────────────────────────────────────────┐
│ 2026-04-21                                              │
│ Propietario A > VTA-001 (CARGUE)                        │
│ Cantidad: 125 kg  |  Total: $12,500                     │
└─────────────────────────────────────────────────────────┘
```

Cambios:
- Agrupación por fila (fecha es header)
- Propietario/VTA/Tipo en mismo renglón
- Valores resaltados (Cantidad y Total)
- Mejor uso de espacio vertical

---

## 11. REQUERIMIENTOS TÉCNICOS DE IMPLEMENTACIÓN

### NO TOCAR:
```javascript
- useDashboardKPIs()          // Calcula KPIs
- useDashboardAggregations()  // Calcula top 5
- useFilterState()            // Manejo filtros
- useOwnersQuery()            // Propietarios
- useVtasByOwnerQuery()       // VTAs
- useMovimientosListQuery()   // Movimientos
- movimientosService          // API calls
- DashboardFilters.jsx        // UI filtros
```

### CREAR NUEVO:
```javascript
- useDashboardChartData()     // Transformar datos para gráficos
- EnhancedKPICard.jsx         // Tarjeta KPI mejorada
- KPIGrid.jsx                 // Grid de 5 KPIs
- HorizontalBarChart.jsx      // Barras horizontales
- DonutChart.jsx              // Gráficos circulares
- ComboChart.jsx              // Combo bars + line
- ChartContainer.jsx          // Wrapper visual
```

### REFACTOR VISUAL (sin cambio lógico):
```javascript
- DashboardPage.jsx           // Nuevo layout (mismo props, mismo comportamiento)
- DashboardRecentActivityTable.jsx  // Mejor tipografía y spacing
```

---

## 12. CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Componentes de Gráficos
- [ ] Instalar/verificar Recharts
- [ ] Crear `HorizontalBarChart.jsx`
- [ ] Crear `DonutChart.jsx`
- [ ] Crear `ComboChart.jsx`
- [ ] Crear `ChartContainer.jsx` (wrapper)

### Fase 2: Componentes KPI
- [ ] Crear `EnhancedKPICard.jsx` con sparkline
- [ ] Crear `KPIGrid.jsx`
- [ ] Agregar iconos apropiados

### Fase 3: Hooks
- [ ] Crear `useDashboardChartData.js` (transformaciones)
- [ ] Verificar datos disponibles (tipo, ceco, fecha)

### Fase 4: Integración
- [ ] Refactor `DashboardPage.jsx` con nuevo layout
- [ ] Integrar gráficos con datos reales
- [ ] Testear responsiveness

### Fase 5: Mejoras Visuales
- [ ] Mejorar `DashboardRecentActivityTable.jsx`
- [ ] Ajustar tipografía y colores
- [ ] Pruebas cross-browser

---

## 13. VENTAJAS DEL REDISEÑO

✨ **Apariencia moderna** - Parece un SaaS premium  
📊 **Información analítica** - Entiende el negocio en segundos  
🎨 **Visualmente rico** - Gráficos profesionales  
⚡ **Mismo comportamiento** - Filtros, exportación, lógica idéntica  
📱 **Responsive** - Mobile, tablet, desktop  
♿ **Accesible** - Contraste, etiquetas, navegación  

---

## 14. PRÓXIMOS PASOS

1. **Confirmar** disponibilidad de datos (tipo, ceco, fecha)
2. **Instalar** Recharts si no está instalado
3. **Crear** componentes de gráficos base
4. **Integrar** datos reales
5. **Testear** en diferentes dispositivos
6. **Ajustar** colores/espacios según feedback

