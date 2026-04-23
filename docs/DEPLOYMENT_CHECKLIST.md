# 📋 CHECKLIST PRE-DEPLOYMENT

> Validar antes de enviar a IT

## ✅ Paso 1: Compilación (Tu Máquina Local)

- [ ] Git está actualizado: `git status` (sin cambios pendientes)
- [ ] Backend compilado: `npm run build --workspace backend` (sin errores)
- [ ] Frontend compilado: `npm run build --workspace frontend` (sin errores)
- [ ] Carpeta `frontend/dist/` tiene contenido (HTML, JS, CSS)
- [ ] No hay carpetas `node_modules` a desplegar

```bash
# Ejecutar esto para verificar todo
npm run build
```

---

## ✅ Paso 2: Configuración

- [ ] `.env.example` en `backend/` está actualizado con variables necesarias
- [ ] No hay `.env` real en el repo (solo .env.example)
- [ ] Archivo `backend/web.config` existe (para IIS)
- [ ] `pm2.config.cjs` está en `backend/`

---

## ✅ Paso 3: Scripts y Herramientas

- [ ] Script de verificación: `backend/verify-deployment.js` existe
- [ ] Script de setup: `backend/setup-windows.bat` existe
- [ ] Todos los scripts están en la carpeta correcta

```bash
# Verificar scripts
ls backend/verify-deployment.js
ls backend/setup-windows.bat
```

---

## ✅ Paso 4: Documentación

- [ ] `DEPLOYMENT_README.md` (en /docs) existe
- [ ] `DEPLOYMENT_GUIA.md` (en /docs) existe
- [ ] `DEPLOYMENT_IT_GUIA.md` (en /docs) existe ← **MÁS IMPORTANTE**
- [ ] Todos los archivos .md tienen información útil

---

## ✅ Paso 5: Verificación de Errores

```bash
# Ejecutar verificador de deployment
node backend/verify-deployment.js
```

**Debe mostrar:** ✅ Aplicación lista para deployment

Si hay ❌:
- [ ] Ejecutar: `npm install --workspace backend`
- [ ] Ejecutar: `npm run build --workspace frontend`
- [ ] Volver a ejecutar verify-deployment.js

---

## ✅ Paso 6: Dependencias

- [ ] `package.json` (raíz) tiene workspace correctos
- [ ] `backend/package.json` tiene todas las dependencias
- [ ] `frontend/package.json` tiene todas las dependencias
- [ ] Node 20.x y npm 10.x están instalados localmente

```bash
node --version  # Debe ser v20.x.x
npm --version   # Debe ser 10.x.x
```

---

## ✅ Paso 7: Base de Datos

- [ ] Migraciones están en: `backend/database/migrations/`
- [ ] Scripts de setup están en: `backend/scripts/`
- [ ] `backend/package.json` tiene script: `db:setup`

```bash
# Verificar que script existe
npm run db:setup --workspace backend --dry-run
```

---

## ✅ Paso 8: Variables de Entorno

- [ ] `.env.example` tiene todas las variables necesarias
- [ ] `JWT_SECRET` debe cambiar en producción (está marcado como "change_this")
- [ ] `FRONTEND_URL` apunta a dominio correcto: `https://app.icestarlatam.com.co:442`
- [ ] Variables de BD no tienen valores hardcodeados en código

---

## ✅ Paso 9: Seguridad

- [ ] No hay contraseñas reales en archivos versionados
- [ ] `.env` está en `.gitignore` (no se pushea)
- [ ] `node_modules` está en `.gitignore`
- [ ] Archivos de log están ignorados
- [ ] Claves SSH/certificados no están en repo

```bash
git check-ignore backend/.env  # Debe retornar algo
```

---

## ✅ Paso 10: Archivos Listos para Enviar

**Estructura que enviamos a IT:**

```
Facturacion/
├── backend/
│   ├── src/
│   ├── database/
│   ├── scripts/
│   ├── package.json
│   ├── pm2.config.cjs
│   ├── .env.example
│   ├── verify-deployment.js
│   ├── setup-windows.bat
│   └── web.config ← IMPORTANTE
├── frontend/
│   └── dist/
│       ├── index.html
│       ├── assets/
│       └── web.config ← IMPORTANTE
├── docs/
│   ├── DEPLOYMENT_README.md
│   ├── DEPLOYMENT_GUIA.md
│   └── DEPLOYMENT_IT_GUIA.md
```

**NO incluir:**
- [ ] ❌ `node_modules`
- [ ] ❌ `.env` (solo .env.example)
- [ ] ❌ `.git`
- [ ] ❌ archivos de log
- [ ] ❌ carpetas de build temporales

---

## ✅ Paso 11: Comunicación con IT

Preparar email:

```
ASUNTO: Solicitud Deployment - Facturación v2.1.0

Estimado Equipo de IT,

Solicito support para desplegar la aplicación Facturación 
en Windows Server.

INFORMACIÓN:
- Aplicación: Facturación (React + Node.js)
- Versión: 2.1.0
- Servidor: https://app.icestarlatam.com.co:442
- BD: SQL Server (crear nueva)
- Usuarios estimados: 10

DOCUMENTACIÓN INCLUIDA:
- DEPLOYMENT_IT_GUIA.md (paso a paso)
- setup-windows.bat (setup automático)
- verify-deployment.js (validación)

COORDINAR ANTES DE EMPEZAR:
☐ IP/hostname SQL Server
☐ Usuario/contraseña SQL Server
☐ IP/hostname Redis
☐ Certificado SSL válido
☐ Permisos en C:\Aplicaciones\

TIEMPO ESTIMADO: 45 minutos

¿Disponibles para coordinar?

Gracias,
[Tu nombre]
```

---

## ✅ Final Checklist

- [ ] Todos los puntos anteriores están ✅
- [ ] Código está compilado y listo
- [ ] Documentación está clara
- [ ] Email está redactado
- [ ] Credenciales están coordinate con IT
- [ ] Fecha de deployment está acordada
- [ ] Usuarios saben que hay deployment (comunicar)
- [ ] Tienes contacto de IT para consultas

---

## 🚀 ¡Listo para Enviar!

Si todos los puntos están ✅, el proyecto está listo para pasar a producción.

**Próximo paso:** Contactar a IT con email anterior y archivos.

---

**Nota**: Guardar este checklist como referencia. Podrá usarse para futuras actualizaciones.

Fecha: 23 Abril 2026
Versión: 2.1.0
