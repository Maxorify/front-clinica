# 📋 Instrucciones para el Logo de la Clínica

## 🎨 Especificaciones del Logo

Para que la receta médica se vea profesional, necesitas agregar el logo de la clínica siguiendo estas especificaciones:

### Ubicación del archivo:
```
front-clinica/public/logo-clinica.png
```

### Requisitos técnicos:

1. **Formato**: PNG con fondo transparente (preferido) o JPG
2. **Resolución mínima**: 300 x 300 píxeles
3. **Resolución recomendada**: 500 x 500 píxeles o superior
4. **Tamaño del archivo**: Máximo 500 KB
5. **Forma**: Preferiblemente cuadrado o circular
6. **Calidad**: Alta calidad para impresión (300 DPI recomendado)

### Características visuales:

- ✅ **Colores**: Preferiblemente corporativos de la clínica
- ✅ **Legibilidad**: El logo debe verse bien en tamaño pequeño (30x30px en el PDF)
- ✅ **Contraste**: Buen contraste para que sea visible en impresión
- ✅ **Simplicidad**: Evitar detalles muy finos que se pierdan al reducir

## 🚀 Cómo agregar el logo:

### Opción 1: Si tienes el logo
1. Renombra tu logo a: `logo-clinica.png`
2. Cópialo a la carpeta: `front-clinica/public/`
3. Recarga la aplicación
4. Genera una receta de prueba

### Opción 2: Si NO tienes logo todavía
- El sistema funcionará perfectamente sin logo
- Mostrará "CLÍNICA MÉDICA" en texto como alternativa
- Puedes agregar el logo después sin modificar código

### Opción 3: Crear un logo temporal
Puedes usar herramientas gratuitas:
- **Canva**: https://www.canva.com (templates médicos)
- **LogoMaker**: https://logomaker.com
- **FreeLogoDesign**: https://www.freelogodesign.org

**Tip**: Busca "medical clinic logo" en las plantillas

## 🎯 Personalización adicional

Si quieres personalizar más la receta, puedes editar:
```
front-clinica/src/utils/generarRecetaPDF.js
```

**Líneas para modificar:**
- **Línea 66-69**: Nombre y datos de la clínica
- **Línea 12-14**: Colores corporativos (RGB)
- **Línea 284**: Texto del pie de página

### Ejemplo de cambio de colores:
```javascript
// Actual (Verde)
const colorPrimario = [34, 197, 94];

// Opciones:
const colorPrimario = [37, 99, 235];  // Azul
const colorPrimario = [220, 38, 38];  // Rojo
const colorPrimario = [168, 85, 247]; // Morado
```

## 📄 Resultado esperado

La receta PDF incluirá:
- ✅ Logo de la clínica (o texto alternativo)
- ✅ Datos del doctor (nombre, especialidad, RUT)
- ✅ Datos del paciente (nombre, RUT, edad)
- ✅ Diagnósticos asignados
- ✅ Tabla de medicamentos prescritos
- ✅ Indicaciones del tratamiento
- ✅ Firma del doctor
- ✅ Fecha y hora de emisión
- ✅ Diseño profesional listo para imprimir

## 🖨️ Uso del sistema

1. El doctor completa la consulta con medicamentos
2. Click en **"Generar Receta PDF"**
3. Se abre nueva pestaña con el PDF
4. El navegador muestra el diálogo de impresión automáticamente
5. Imprime o guarda como desees

## ❓ Solución de problemas

### El logo no aparece:
- Verifica que el archivo esté en `public/logo-clinica.png`
- Comprueba que el nombre sea exacto (sensible a mayúsculas)
- Recarga la aplicación (F5)

### El PDF no se genera:
- Abre la consola del navegador (F12)
- Busca errores en rojo
- Verifica que haya al menos 1 medicamento agregado

### La calidad es mala:
- Usa un logo de mayor resolución (500x500 mínimo)
- Formato PNG con transparencia
- Evita JPG de baja calidad

## 📞 Soporte

Si necesitas ayuda adicional, puedes:
1. Revisar el código en `generarRecetaPDF.js`
2. Verificar la consola del navegador
3. Probar con un logo de prueba simple primero
