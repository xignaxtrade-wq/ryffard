# RyffasRD

SPA para crear, vender y administrar rifas digitales. Usa React, Vite, Supabase, Vercel Functions y una integración opcional con Anthropic.

## Requisitos

- Node.js 20+
- Proyecto de Supabase
- Cuenta de Vercel para el despliegue

## Instalación

```bash
npm ci
copy .env.example .env
npm run dev
```

Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env`. No uses una `service_role` en variables `VITE_*`.

## Base de datos

1. Abre SQL Editor en Supabase.
2. Ejecuta `supabase-schema.sql` completo.
3. Habilita `pg_cron` y activa el bloque `cron.schedule` indicado al final del archivo.
4. En Authentication > URL Configuration añade:
   - La URL pública del sitio.
   - `https://tu-dominio/reset-password`.
   - `http://localhost:5173/reset-password` para desarrollo.

El esquema activa RLS y expone RPC específicas para reservas, administración de tickets, referidos, planes y sorteos. No reemplaces esas llamadas por escrituras públicas directas.

## Variables

Variables públicas de Vite:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`
- `VITE_STRIPE_BASIC_LINK` y `VITE_STRIPE_PRO_LINK`, opcionales

Variables exclusivas de Vercel:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`

Los enlaces de Stripe deben ser Payment Links reales. La activación de planes continúa bajo aprobación del panel maestro; para activación totalmente automática se requiere Stripe Checkout con webhook firmado.

## Validación

```bash
npm run check
```

Este comando ejecuta lint, pruebas unitarias y compilación de producción. GitHub Actions ejecuta la misma validación y bloquea vulnerabilidades de producción de severidad alta.

## Despliegue

Importa el repositorio en Vercel, configura las variables anteriores y despliega. `vercel.json` conserva rutas de la SPA; `/api/cuadre` requiere una sesión válida de Supabase.

Antes de abrir al público:

1. Verifica registro y confirmación por correo.
2. Crea una rifa y configura un método de pago.
3. Reserva números desde una sesión anónima.
4. Confirma y cancela tickets desde el dashboard.
5. Ejecuta un sorteo de prueba y comprueba su hash en el historial.
6. Configura dominio, correo de soporte, Stripe y el cron de vencimientos.
