# 🏥 Sistema de Generación de Recetas Médicas - PDF

## ✨ Características implementadas

✅ **Generación automática de recetas en PDF**
✅ **Diseño profesional y elegante**
✅ **Logo de la clínica personalizable**
✅ **Apertura automática en nueva pestaña**
✅ **Lista para imprimir**
✅ **Incluye todos los datos relevantes**

---

## 📋 Lo que se incluye en la receta:

### 1. Encabezado corporativo
- Logo de la clínica (personalizable)
- Nombre y datos de contacto de la clínica
- Línea decorativa verde corporativa

### 2. Información del doctor
- Nombre completo
- Especialidad
- RUT profesional
- Fecha de emisión

### 3. Datos del paciente
- Nombre completo
- RUT
- Edad calculada automáticamente

### 4. Diagnósticos
- Lista numerada de todas las enfermedades asignadas
- Extraídos del selector de diagnósticos

### 5. Prescripciones (Tabla profesional)
- Nombre del medicamento
- Presentación (comprimidos, jarabe, etc.)
- Dosis (cada 8 horas, etc.)
- Duración del tratamiento

### 6. Indicaciones
- Tratamiento detallado escrito por el doctor
- Formato de texto largo legible

### 7. Firma digital
- Firma del doctor
- Especialidad
- Pie de página con fecha/hora de generación

---

## 🎨 Personalización del Logo

### Opción A: Usar tu propio logo

1. **Prepara tu logo:**
   - Formato: PNG con fondo transparente (recomendado)
   - Tamaño: Mínimo 300x300px, ideal 500x500px
   - Peso: Máximo 500 KB

2. **Ubicación:**
   ```
   front-clinica/public/logo-clinica.png
   ```

3. **Renombra exactamente como:**
   ```
   logo-clinica.png
   ```

4. **Recarga la aplicación** (F5)

### Opción B: Sin logo (texto alternativo)

Si no agregas logo, el sistema mostrará automáticamente:
```
CLÍNICA
MÉDICA
```
En texto verde elegante.

### Opción C: Usar el logo temporal incluido

Incluí un SVG temporal que puedes convertir a PNG:
```
front-clinica/public/logo-temporal.svg
```

**Para convertirlo:**
1. Abre el SVG en un navegador
2. Toma screenshot
3. Recorta y guarda como `logo-clinica.png`

O usa: https://cloudconvert.com/svg-to-png

---

## 🚀 Cómo usar el sistema

### Paso 1: Completar la consulta
1. Ingresar información del paciente (motivo, síntomas, etc.)
2. Seleccionar diagnósticos con los checkboxes
3. Asignar los diagnósticos seleccionados

### Paso 2: Agregar medicamentos
1. Llenar el formulario de receta:
   - Nombre del medicamento
   - Presentación
   - Dosis
   - Duración
   - Cantidad
2. Click en "Agregar Medicamento"
3. Repetir para cada medicamento

### Paso 3: Escribir indicaciones
1. En el campo "Tratamiento", escribir las indicaciones generales
2. Ejemplo: "Reposo relativo por 3 días. Tomar abundante líquido..."

### Paso 4: Generar la receta
1. Click en **"Generar Receta PDF"** (botón azul con icono de impresora)
2. Se abre una nueva pestaña con el PDF
3. El navegador muestra automáticamente el diálogo de impresión
4. Puedes:
   - ✅ Imprimir directamente
   - ✅ Guardar como PDF
   - ✅ Cerrar y regenerar si es necesario

---

## 🎨 Personalizar colores corporativos

Si quieres cambiar los colores del PDF, edita:
```
front-clinica/src/utils/generarRecetaPDF.js
```

**Líneas 12-14:**
```javascript
// Verde actual
const colorPrimario = [34, 197, 94];

// Azul
const colorPrimario = [37, 99, 235];

// Rojo
const colorPrimario = [220, 38, 38];

// Morado
const colorPrimario = [168, 85, 247];
```

Usa formato RGB: `[R, G, B]` donde cada valor es 0-255.

---

## 📝 Personalizar datos de la clínica

**Edita la línea 66-69 de `generarRecetaPDF.js`:**

```javascript
doc.text("CLÍNICA MÉDICA GENERAL", pageWidth - 15, yPos, { align: "right" });
doc.text("Av. Principal #123, Santiago", pageWidth - 15, yPos + 5, { align: "right" });
doc.text("Teléfono: +56 2 1234 5678", pageWidth - 15, yPos + 10, { align: "right" });
doc.text("www.clinicamedica.cl", pageWidth - 15, yPos + 15, { align: "right" });
```

Cambia por los datos reales de tu clínica.

---

## 🔧 Solución de problemas

### ❌ El botón "Generar Receta PDF" está deshabilitado
**Causa:** No hay medicamentos agregados
**Solución:** Agrega al menos 1 medicamento a la receta

### ❌ El logo no aparece en el PDF
**Causa:** Archivo no encontrado o nombre incorrecto
**Solución:** 
1. Verifica que el archivo esté en `public/logo-clinica.png`
2. El nombre debe ser exacto (sensible a mayúsculas)
3. Recarga con F5

### ❌ El PDF se ve cortado
**Causa:** Demasiado contenido
**Solución:** El sistema automáticamente crea páginas adicionales si es necesario

### ❌ Error al generar PDF
**Causa:** Falta información del paciente
**Solución:** 
1. Abre la consola del navegador (F12)
2. Busca el error específico en rojo
3. Verifica que la cita tenga datos del paciente

---

## 📱 Compatibilidad

✅ **Navegadores soportados:**
- Chrome (recomendado)
- Firefox
- Edge
- Safari

✅ **Dispositivos:**
- Desktop (Windows, Mac, Linux)
- Tablet (con navegador compatible)

⚠️ **No recomendado:** Móviles pequeños (mejor usar desktop para imprimir)

---

## 🎯 Flujo completo de ejemplo

1. Doctor inicia consulta con paciente
2. Registra síntomas y diagnósticos
3. Selecciona diagnósticos: "Gripe (Influenza)" + "Faringitis aguda"
4. Agrega medicamentos:
   - Paracetamol 500mg, cada 8 horas, 5 días
   - Amoxicilina 500mg, cada 12 horas, 7 días
5. Escribe indicaciones: "Reposo relativo por 3 días. Abundantes líquidos."
6. Click en **"Generar Receta PDF"**
7. Se abre nueva pestaña con receta profesional
8. Imprime o guarda
9. Click en "Guardar Borrador" (opcional)
10. Click en "Finalizar Consulta"

---

## 📦 Archivos creados

```
front-clinica/
├── src/
│   └── utils/
│       └── generarRecetaPDF.js          # Motor de generación de PDF
│   └── pages/
│       └── doctor/
│           └── CitasDoctor.jsx           # Actualizado con botón
└── public/
    ├── logo-clinica.png                  # (Tu logo aquí)
    └── logo-temporal.svg                 # Logo de ejemplo
```

---

## 🎓 Tecnología utilizada

- **jsPDF**: Librería para generación de PDFs en navegador
- **React**: Framework del frontend
- **Tailwind CSS**: Estilos del botón

---

## 💡 Tips profesionales

1. **Siempre verifica** la receta generada antes de entregarla al paciente
2. **Guarda una copia** digital para el historial médico
3. **Personaliza el footer** con advertencias o información legal si es necesario
4. **Usa diagnósticos precisos** de la base de datos
5. **Sé específico** en las dosis y duraciones

---

## 📞 ¿Necesitas ayuda?

Si tienes problemas:
1. Revisa este README completo
2. Abre la consola del navegador (F12) para ver errores
3. Verifica que todos los archivos estén en su lugar
4. Prueba primero sin logo (texto alternativo)

---

¡Listo para generar recetas profesionales! 🎉
