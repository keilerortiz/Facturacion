# 📋 GUÍA PARA EQUIPO DE IT - DEPLOYMENT FACTURACION

> Esta guía está dirigida al equipo de IT para instalar la aplicación Facturación en el Windows Server corporativo.

---

## 📌 Información General

| Concepto | Valor |
|----------|-------|
| **Aplicación** | Facturación (React + Express + SQL Server) |
| **Stack** | Node.js 20+, npm, PM2 |
| **BD** | SQL Server (existente) |
| **Caché** | Redis (existente) |
| **Servidor** | Windows Server |
| **URL** | https://app.icestarlatam.com.co:442 |
| **Puerto Backend** | 5000 (interno) |
| **Usuarios Iniciales** | ~5-10 usuarios |

---

## ✅ Requisitos Previos (Checklist)

- [ ] Node.js 20.x o superior instalado
- [ ] npm 10.x o superior
- [ ] SQL Server accesible en red (puerto 1433 abierto)
- [ ] Redis accesible en red (puerto 6379 abierto)
- [ ] Carpeta `C:\Aplicaciones\` disponible con permisos de escritura
- [ ] Permiso para crear servicio Windows (PM2)
- [ ] IIS instalado y configurado (si lo usan para frontend)
- [ ] Certificado SSL válido para el dominio
- [ ] Firewall: puerto 443 abierto saliente

---

## 🚀 PASO 1: Preparar la Carpeta

**En el servidor, en PowerShell como Administrador:**

```powershell
# Crear carpeta de aplicación
New-Item -ItemType Directory -Path "C:\Aplicaciones\Facturacion" -Force

# Dar permisos al usuario del servicio (ej: NETWORK SERVICE)
$acl = Get-Acl "C:\Aplicaciones\Facturacion"
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "NETWORK SERVICE", 
    "Modify", 
    "ContainerInherit,ObjectInherit", 
    "None", 
    "Allow"
)
$acl.SetAccessRule($rule)
Set-Acl "C:\Aplicaciones\Facturacion" $acl
```

---

## 🚀 PASO 2: Copiar Archivos de la Aplicación

El desarrollador proporciona:
- Carpeta `backend/` (sin `node_modules`)
- Carpeta `frontend/dist/` (compilada)

**Copiar a `C:\Aplicaciones\Facturacion\`**

Usando Explorer o comando:
```powershell
robocopy "\\ruta-compartida\Facturacion\backend" "C:\Aplicaciones\Facturacion\backend" /S /E
robocopy "\\ruta-compartida\Facturacion\frontend\dist" "C:\Aplicaciones\Facturacion\frontend\dist" /S /E
```

---

## 🚀 PASO 3: Configurar Variables de Entorno

**Crear archivo**: `C:\Aplicaciones\Facturacion\backend\.env`

**Coordinar con desarrollador los valores:**
- SQL Server IP/hostname
- Usuario SQL
- Contraseña SQL
- Redis IP/hostname
- Redis puerto (y contraseña si existe)

**Ejemplo de .env (REEMPLAZAR valores):**

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=sKEZJN@2kP9mL#Xq8Wv4YbC7Dr5Nt1Us  # Mínimo 32 caracteres aleatorios
FRONTEND_URL=https://app.icestarlatam.com.co:442

DB_SERVER=sql-server.icestar.local
DB_PORT=1433
DB_NAME=MovimientosDB
DB_USER=facturacion_user
DB_PASSWORD=PasswordSegura123!Aqui
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false

REDIS_HOST=redis-server.icestar.local
REDIS_PORT=6379

BCRYPT_ROUNDS=10
```

⚠️ **Proteger este archivo:**
```powershell
# Dar lectura solo a SYSTEM y Administrador
$acl = Get-Acl "C:\Aplicaciones\Facturacion\backend\.env"
$acl.SetAccessRuleProtection($true, $true)
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "NETWORK SERVICE", 
    "Read", 
    "None", 
    "None", 
    "Allow"
)
$acl.SetAccessRule($rule)
Set-Acl "C:\Aplicaciones\Facturacion\backend\.env" $acl
```

---

## 🚀 PASO 4: Instalar Dependencias

**En PowerShell, como Administrador:**

```powershell
cd C:\Aplicaciones\Facturacion\backend
npm install
```

**Esto demora ~2-3 minutos**

Verifica que no hay errores (warnings están bien).

---

## 🚀 PASO 5: Crear Base de Datos SQL

**En SQL Server Management Studio, ejecutar:**

```sql
-- Crear BD
CREATE DATABASE MovimientosDB;
USE MovimientosDB;

-- Crear usuario (si no existe)
CREATE LOGIN facturacion_user WITH PASSWORD = 'PasswordSegura123!Aqui';
CREATE USER facturacion_user FOR LOGIN facturacion_user;
ALTER ROLE db_owner ADD MEMBER facturacion_user;
```

---

## 🚀 PASO 6: Ejecutar Migraciones de BD

**En PowerShell, en `C:\Aplicaciones\Facturacion\backend`:**

```powershell
npm run db:setup
```

Esto:
- ✅ Crea todas las tablas
- ✅ Aplica migraciones
- ✅ Carga datos iniciales
- ✅ Crea usuario admin de prueba

**Esperar a que termine sin errores**

---

## 🚀 PASO 7: Instalar PM2 (Process Manager)

**En PowerShell como Administrador:**

```powershell
# Instalar PM2 globalmente
npm install -g pm2

# Instalar startup script
pm2 install pm2-windows-startup

# Navegar a backend
cd C:\Aplicaciones\Facturacion\backend

# Iniciar la aplicación
pm2 start pm2.config.cjs --env production

# Guardar configuración (importante!)
pm2 save

# Verificar estado
pm2 list
pm2 logs facturacion-api
```

**Debe ver algo como:**
```
┌─────────────────┬────┬─────────┬──────┬
│ App name        │ id │ version │ pid  │
├─────────────────┼────┼─────────┼──────┤
│ facturacion-api │ 0  │ 2.1.0   │ 5432 │
└─────────────────┴────┴─────────┴──────┘
```

---

## 🚀 PASO 8: Configurar IIS (Frontend)

**En IIS Manager:**

1. **Crear sitio web:**
   - Nombre: `Facturacion`
   - Ruta física: `C:\Aplicaciones\Facturacion\frontend\dist`
   - Binding: `https` + dominio `app.icestarlatam.com.co` + puerto `442`
   - Certificado SSL: Usar certificado válido

2. **Crear archivo `web.config` en la carpeta dist:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- Reescribir rutas del frontend a index.html (SPA) -->
        <rule name="SPA" stopProcessing="true">
          <match url="^(?!api).*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="index.html" />
        </rule>
        
        <!-- Proxy para API -->
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:5000/api/{R:1}" />
        </rule>
      </rules>
    </rewrite>
    
    <!-- Compresión -->
    <httpCompression>
      <dynamicTypes>
        <add mimeType="text/javascript" enabled="true" />
        <add mimeType="application/json" enabled="true" />
      </dynamicTypes>
    </httpCompression>
    
    <!-- Headers de seguridad -->
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="DENY" />
        <add name="X-XSS-Protection" value="1; mode=block" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

3. **Instalar Role "URL Rewrite"** en IIS (si no está)

---

## 🧪 PASO 9: Verificar Funcionamiento

**Test 1: Backend está corriendo**
```powershell
Invoke-WebRequest http://localhost:5000/health
# Debe retornar 200 OK
```

**Test 2: Frontend accesible**
- Abrir navegador: `https://app.icestarlatam.com.co:442`
- Debe cargar la página sin errores

**Test 3: Base de datos conecta**
- Intentar login con usuario admin (credenciales del db:setup)
- Debe permitir acceso

**Test 4: Ver logs**
```powershell
pm2 logs facturacion-api
# Buscar errores con prefijo [ERROR]
```

---

## 📊 Monitoreo Diario

```powershell
# Ver estado de procesos
pm2 status

# Ver logs en vivo
pm2 logs

# Monitorear recursos (CPU, memoria)
pm2 monit

# Reiniciar si hay problema
pm2 restart facturacion-api

# Detener (si hay que actualizar)
pm2 stop facturacion-api
```

---

## 🔄 Actualizar la Aplicación

Cuando el desarrollador entrega versión nueva:

```powershell
# 1. Detener proceso
pm2 stop facturacion-api

# 2. Copiar nuevos archivos (frontend/dist y backend código)
robocopy "\\ruta-compartida\Facturacion\backend" "C:\Aplicaciones\Facturacion\backend" /S /E

# 3. Instalar dependencias (si hay cambios en package.json)
cd C:\Aplicaciones\Facturacion\backend
npm install

# 4. Iniciar proceso
pm2 start pm2.config.cjs --env production

# 5. Verificar
pm2 logs
```

---

## 🆘 Troubleshooting

### "Puerto 5000 en uso"
```powershell
netstat -ano | findstr :5000
# Terminar el proceso (PID) que lo usa
taskkill /PID <PID> /F
pm2 start pm2.config.cjs --env production
```

### "BD no conecta"
```powershell
# Verificar credenciales en .env
# Verificar que SQL Server está corriendo
# Verificar firewall (puerto 1433)
# Test conexión:
sqlcmd -S "DB_SERVER" -U "DB_USER" -P "DB_PASSWORD"
```

### "Frontend muestra error 404"
- Verificar que `web.config` existe en `C:\...\frontend\dist`
- Verificar que URL Rewrite está instalado en IIS
- Revisar logs de IIS

### "Redis no responde"
```powershell
# Verificar IP y puerto en .env
# Test conexión:
# (Instalar redis-cli si no existe)
redis-cli -h <REDIS_HOST> -p <REDIS_PORT> ping
```

### "Aplicación lenta o se congela"
```powershell
pm2 monit  # Ver uso de memoria
# Si usa >500MB, revisar memory leaks con desarrollador
```

---

## 📞 Contacto Soporte

- **Desarrollador**: [Email del desarrollador]
- **Problemas BD**: Equipo de BD
- **Problemas Red/Firewall**: Equipo de Infraestructura

---

## 📝 Checklist Final

- [ ] Carpeta `C:\Aplicaciones\Facturacion` creada
- [ ] Archivos copiados correctamente
- [ ] `.env` configurado con valores reales
- [ ] Node.js 20+ instalado
- [ ] npm install ejecutado sin errores
- [ ] BD creada en SQL Server
- [ ] Migraciones ejecutadas (npm run db:setup)
- [ ] PM2 instalado como servicio
- [ ] Aplicación corriendo (pm2 list)
- [ ] IIS sitio creado y configurado
- [ ] web.config en lugar correcto
- [ ] URL accesible desde navegador
- [ ] SSL certificate válido
- [ ] Logs monitoreados (sin errores críticos)

---

**Versión**: 1.0
**Fecha**: 23 Abril 2026
**Estado**: Listo para producción
