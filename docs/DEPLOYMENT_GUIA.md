# 📦 Guía de Deployment en Windows Server

## 🎯 Resumen
Aplicación: **Facturación** (React + Express + SQL Server)
Servidor: Windows Server (app.icestarlatam.com.co:442)
Estado BD: Hay que crearla desde cero

---

## 📋 Requisitos Previos (Coordinado con IT)

- [ ] Node.js 20.x instalado en el servidor
- [ ] SQL Server accesible en la red corporativa
- [ ] Redis accesible en la red corporativa
- [ ] Permisos de escritura en `C:\Aplicaciones\` (o ruta equivalente)
- [ ] Permiso para abrir puerto 5000 (backend)
- [ ] IIS o puerto 80/443 disponible (frontend)

---

## 🚀 Pasos de Deployment

### **PASO 1: Preparar los archivos en tu máquina**

```bash
# En tu máquina local, en la carpeta raíz del proyecto
npm install
npm run build --workspace frontend
npm run build --workspace backend
```

Esto genera:
- `frontend/dist/` → Archivos HTML/JS/CSS compilados
- Backend listo para ejecutar

### **PASO 2: Copiar la aplicación al servidor**

Pedir a IT que:
1. Cree la carpeta: `C:\Aplicaciones\Facturacion`
2. Copie el contenido:
   - `backend/` (completa, excepto `node_modules`)
   - `frontend/dist/` (solo la carpeta dist)
   - Archivos de configuración (ver PASO 3)

O hacerlo vía:
```bash
# Si tienes acceso por compartida de red
robocopy . "\\servidor\Aplicaciones\Facturacion" /S /E
```

### **PASO 3: Configurar variables de entorno**

Crear archivo: `C:\Aplicaciones\Facturacion\backend\.env`

```env
# === ENTORNO ===
NODE_ENV=production
PORT=5000

# === SEGURIDAD ===
JWT_SECRET=icestarlatam-produccion-secreto-muy-seguro-cambiar-en-prod

# === BASE DE DATOS ===
DB_SERVER=<IP-O-HOSTNAME-DEL-SERVIDOR-SQL>
DB_PORT=1433
DB_NAME=MovimientosDB
DB_USER=<usuario-sql-server>
DB_PASSWORD=<contraseña-sql-server>

# === REDIS ===
REDIS_HOST=<IP-O-HOSTNAME-DEL-REDIS>
REDIS_PORT=6379
REDIS_PASSWORD=<si-tiene-contraseña>

# === FRONTEND ===
FRONTEND_URL=https://app.icestarlatam.com.co:442
BCRYPT_ROUNDS=10
```

⚠️ **IMPORTANTE**: Solicitar a IT los valores de:
- `DB_SERVER`, `DB_USER`, `DB_PASSWORD`
- `REDIS_HOST` (si tiene contraseña)

### **PASO 4: Crear la base de datos**

En el servidor, ejecutar en `C:\Aplicaciones\Facturacion\backend`:

```bash
# Instalar dependencias
npm install

# Crear y migrar la BD
npm run db:setup
```

Esto:
- Crea tablas
- Aplica todas las migraciones
- Prepara datos iniciales (usuarios admin, etc.)

### **PASO 5: Instalar como servicio Windows**

En PowerShell (como administrador):

```powershell
# Navegar a la carpeta
cd C:\Aplicaciones\Facturacion\backend

# Instalar PM2 globalmente (primera vez)
npm install -g pm2

# Crear servicio de Windows
pm2 install pm2-windows-startup

# Iniciar el proceso
pm2 start pm2.config.cjs --env production

# Guardar configuración
pm2 save

# Verificar estado
pm2 list
```

### **PASO 6: Servir Frontend con IIS**

IT debe:
1. Crear un sitio IIS: `Facturacion`
2. Ruta física: `C:\Aplicaciones\Facturacion\frontend\dist`
3. Vincular a dominio: `app.icestarlatam.com.co`
4. Puerto HTTPS: 442

**Configurar reescritura de URL** (si no funciona SPA):
```xml
<!-- En web.config de IIS -->
<rewrite>
  <rules>
    <rule name="SPA">
      <match url="^(?!api).*" />
      <conditions logicalGrouping="MatchAll">
        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
      </conditions>
      <action type="Rewrite" url="index.html" />
    </rule>
  </rules>
</rewrite>
```

### **PASO 7: Configurar reverse proxy (IIS)**

Agregar regla de reescritura para `/api/` → `localhost:5000`:

```xml
<rule name="API Proxy" stopProcessing="true">
  <match url="^api/(.*)" />
  <action type="Rewrite" url="http://localhost:5000/api/{R:1}" />
</rule>
```

---

## ✅ Verificación Post-Deployment

1. **Backend activo:**
   ```powershell
   pm2 list
   curl http://localhost:5000/health
   ```

2. **Frontend accesible:**
   - Abrir navegador: `https://app.icestarlatam.com.co:442`
   - Verifica que cargue sin errores

3. **Base de datos:**
   - Verificar que hay tablas en `MovimientosDB`
   - Probar login con usuario admin

4. **Logs:**
   ```powershell
   pm2 logs facturacion-api
   ```

---

## 🔄 Actualizaciones Futuras

```bash
# En tu máquina
npm run build --workspace frontend

# Copiar nuevo dist/ al servidor
# En el servidor:
pm2 stop facturacion-api
# Copiar archivos nuevos
pm2 start facturacion-api --env production
```

---

## 🆘 Troubleshooting

| Problema | Solución |
|----------|----------|
| "Puerto 5000 en uso" | `netstat -ano \| findstr :5000` y terminar proceso |
| "BD no conecta" | Verificar credenciales en `.env` y firewall |
| "Frontend muestra error 404" | Verificar `web.config` de IIS y rutas |
| "Redis no responde" | Verificar IP y puerto en `.env` |

---

## 📞 Coordinación con IT

**Email sugerido a IT:**

```
Asunto: Deployment Aplicación Facturación

Necesitamos desplegar una aplicación Node.js/React en Windows Server.

REQUISITOS:
- Carpeta: C:\Aplicaciones\Facturacion
- Node.js 20.x
- Acceso a SQL Server: [IP/Usuario]
- Acceso a Redis: [IP/Puerto]
- Sitio IIS: app.icestarlatam.com.co:442
- Puertos: 5000 (interno), 443 (externo)

ARCHIVOS ADJUNTOS:
- Código fuente
- .env.example (completar credenciales)
- Instrucciones de setup

CONTACTO: [Tu email]
```
