# 🚀 Deployment - Facturación en Windows Server

> Guía rápida para pasar la aplicación del entorno local al servidor corporativo

## 📌 Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| **[DEPLOYMENT_GUIA.md](./DEPLOYMENT_GUIA.md)** | Guía completa con todos los pasos |
| **[DEPLOYMENT_IT_GUIA.md](./DEPLOYMENT_IT_GUIA.md)** | 📋 **PARA IT**: Instrucciones paso a paso |
| **backend/.env.example** | Plantilla de configuración (copiar a .env) |
| **backend/verify-deployment.js** | Script de verificación pre-deployment |
| **backend/setup-windows.bat** | Script de setup automático (ejecutar como admin) |
| **frontend/dist/web.config** | Configuración IIS para el frontend |

---

## ⚡ Quick Start (5 pasos)

### **PASO 1: Compilar localmente**
```bash
npm install
npm run build --workspace frontend
npm run build --workspace backend
```

### **PASO 2: Preparar archivos**
- Carpeta `backend/` (sin node_modules)
- Carpeta `frontend/dist/`
- Archivos de este repositorio

### **PASO 3: Copiar al servidor**
```
C:\Aplicaciones\Facturacion\
├── backend/
├── frontend/dist/
└── (archivos de configuración)
```

### **PASO 4: Pedir a IT que ejecute**
- Archivo: `backend/setup-windows.bat`
- **Como Administrador en PowerShell**
- Luego: Configurar IIS + crear BD

### **PASO 5: Verificar en navegador**
```
https://app.icestarlatam.com.co:442
```

---

## 🎯 Para Desarrollador (Tú)

1. **Antes de enviar a IT:**
   ```bash
   node backend/verify-deployment.js
   ```
   Debe mostrar todos ✅

2. **Preparar paquete para IT:**
   - Compilar frontend
   - Incluir guía `DEPLOYMENT_IT_GUIA.md`
   - Incluir archivos de configuración

3. **Coordinar con IT:**
   - IP del servidor SQL
   - IP del servidor Redis
   - Usuario/contraseña SQL
   - Dominio disponible

---

## 🎯 Para Equipo de IT

👉 **Lee este archivo primero**: [DEPLOYMENT_IT_GUIA.md](./DEPLOYMENT_IT_GUIA.md)

Resumen de tareas:
1. Crear carpeta `C:\Aplicaciones\Facturacion`
2. Copiar archivos
3. Ejecutar `setup-windows.bat` (como admin)
4. Configurar IIS
5. Crear base de datos SQL
6. Ejecutar migraciones

**Tiempo estimado**: 30-45 minutos

---

## 🔑 Valores Necesarios de IT

Antes de hacer deployment, obtener de IT:

```
SQL Server:
  - Servidor: _________________
  - Puerto: _________________
  - Usuario: _________________
  - Contraseña: _________________

Redis:
  - Servidor: _________________
  - Puerto: _________________
  - Contraseña: _________________

Network:
  - Dominio: _________________
  - Certificado SSL: _________________
```

---

## 📊 Arquitectura de Deployment

```
┌─────────────────────────────────────────────────────┐
│         Windows Server Corporativo                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────┐         ┌──────────────────┐  │
│  │  IIS (Puerto443)│◄────────│  frontend/dist   │  │
│  │ (reverse proxy) │  serve  │   (React SPA)    │  │
│  └────────┬────────┘         └──────────────────┘  │
│           │                                         │
│           │ /api/* requests                        │
│           ▼                                         │
│  ┌─────────────────┐         ┌──────────────────┐  │
│  │  PM2 Process    │◄────────│  backend:5000    │  │
│  │  (Node.js)      │         │  (Express.js)    │  │
│  └────────┬────────┘         └──────────────────┘  │
│           │                                         │
│     ┌─────┴──────┬───────────┐                     │
│     ▼            ▼           ▼                     │
│  SQL Server  Redis       External APIs            │
│                                                    │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Verificación Post-Deployment

Ejecutar estos comandos en el servidor para validar:

```powershell
# 1. Verificar PM2
pm2 list

# 2. Ver logs
pm2 logs facturacion-api

# 3. Test backend
Invoke-WebRequest http://localhost:5000/health

# 4. Test conexión DB
sqlcmd -S "servidor" -U "usuario" -P "contraseña"

# 5. Abrir navegador
# https://app.icestarlatam.com.co:442
```

---

## 🔄 Actualizaciones Futuras

Cuando hay una nueva versión:

```bash
# 1. Developer compila
npm run build --workspace frontend

# 2. Envía archivos a IT

# 3. IT ejecuta en el servidor:
pm2 stop facturacion-api
# Copiar nuevos archivos
npm install  # si hay cambios en dependencies
pm2 start pm2.config.cjs --env production
```

---

## 🆘 Problemas Comunes

| Problema | Solución |
|----------|----------|
| "Puerto 5000 en uso" | `netstat -ano \| findstr :5000` → Terminar proceso |
| "BD no conecta" | Verificar IP, usuario, contraseña, firewall |
| "Frontend 404" | Verificar web.config en IIS |
| "Logs sin errores pero no carga" | Revisar CORS en .env (FRONTEND_URL) |
| "Lento o congelado" | `pm2 monit` → Ver memoria |

---

## 📞 Contacto

- **Preguntas Desarrollo**: [desarrollador@empresa.com]
- **Soporte IT**: [it@empresa.com]
- **BD / SQL**: [bd@empresa.com]

---

## 📚 Documentación Relacionada

- [Documentación Técnica Completa](./TECHNICAL_DOCUMENTATION.md)
- [Análisis de Autenticación](./ANALISIS_AUTENTICACION_AUTORIZACION.md)
- [Changelog](./CHANGELOG.md)

---

**Versión**: 2.1.0
**Último Update**: 23 Abril 2026
**Estado**: Listo para Producción ✅
