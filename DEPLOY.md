# 🚀 Guía de despliegue — Sistema PDL

Sigue estos pasos en orden. Tiempo estimado: **30–45 minutos**.

---

## Paso 1 — Crear cuenta en Supabase (base de datos)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita
2. Crea un **nuevo proyecto** (elige la región más cercana, ej. São Paulo)
3. Anota la contraseña del proyecto
4. Ve a **Settings → API** y copia:
   - `Project URL` → esto es tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → esto es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → esto es tu `SUPABASE_SERVICE_ROLE_KEY`
5. Ve a **SQL Editor**, pega todo el contenido de `supabase-schema.sql` y ejecuta

---

## Paso 2 — Crear cuenta en Resend (correos)

1. Ve a [resend.com](https://resend.com) y crea una cuenta gratuita
2. En **API Keys**, crea una nueva clave → copia como `RESEND_API_KEY`
3. En **Domains**, agrega tu dominio de correo (o usa el dominio sandbox para pruebas)

> Para pruebas puedes enviar a cualquier correo sin dominio verificado usando `onboarding@resend.dev` como `FROM_EMAIL`

---

## Paso 3 — Subir el código a GitHub

1. Ve a [github.com](https://github.com) y crea una cuenta gratuita
2. Crea un nuevo repositorio llamado `pdl-app` (privado)
3. Descarga e instala [GitHub Desktop](https://desktop.github.com) si no tienes Git
4. Arrastra la carpeta `pdl-app` a GitHub Desktop y haz commit + push

---

## Paso 4 — Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) y crea cuenta (puedes entrar con GitHub)
2. Haz clic en **"Add New Project"**
3. Selecciona el repositorio `pdl-app` de tu GitHub
4. Antes de desplegar, ve a **Environment Variables** y agrega:

```
NEXT_PUBLIC_SUPABASE_URL      = https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY     = eyJ...
RESEND_API_KEY                = re_...
FROM_EMAIL                    = noreply@tuempresa.com
ADMIN_EMAIL                   = tuCorreo@tuempresa.com
NEXT_PUBLIC_APP_URL           = https://pdl-tuempresa.vercel.app
ADMIN_PIN                     = (elige un PIN de 4-6 dígitos)
```

5. Haz clic en **Deploy**
6. Vercel te dará una URL como `pdl-tuempresa.vercel.app`

---

## Paso 5 — Probar el sistema

| URL | Quién la usa |
|-----|-------------|
| `tuapp.vercel.app/nueva-solicitud` | Ejecutivos — llenan el formulario |
| `tuapp.vercel.app/seguimiento/PDL-XXX` | Ejecutivos — ven el estado |
| `tuapp.vercel.app/admin` | Tú — gestionas todo |

1. Abre `/nueva-solicitud` y llena una solicitud de prueba
2. Revisa que llegue el correo de confirmación
3. Entra a `/admin` con tu PIN
4. Avanza el estado y verifica que llega el correo al ejecutivo
5. Abre el link de seguimiento para ver la vista del ejecutivo

---

## Dominio propio (opcional)

Si quieres una URL como `pdl.tuempresa.com`:
1. Compra el dominio en GoDaddy, Namecheap, o Porkbun (~$12/año)
2. En Vercel → tu proyecto → **Domains** → agrega el dominio
3. Vercel te da los DNS que debes configurar en tu registrador

---

## Costos mensuales estimados

| Servicio | Plan | Costo |
|----------|------|-------|
| Vercel | Hobby (gratis) | $0 |
| Supabase | Free (gratis) | $0 |
| Resend | Free (100 correos/día) | $0 |
| Dominio | Opcional | ~$1/mes |
| **Total** | | **$0 – $1/mes** |

---

## Soporte

Si algo no funciona, los errores más comunes aparecen en:
- **Vercel → tu proyecto → Deployments → Functions** (errores de API)
- **Supabase → Logs** (errores de base de datos)
