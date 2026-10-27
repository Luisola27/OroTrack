# OroTrack

Sistema de venta de oro por gramo: clientes, ventas a crédito/contado, inventario por contenedores y reportes.

## Estructura

```
backend/
  OroTrack.Domain/          entidades del dominio
  OroTrack.Infrastructure/  DbContext, Identity, migraciones EF Core
  OroTrack.Api/             API REST (.NET), controladores, servicios, JWT
frontend/                   React + TypeScript + Vite + Tailwind
docker-compose.yml          SQL Server + API + frontend (Nginx) para despliegue
```

## Desarrollo local

### Requisitos
- .NET SDK 10
- Node.js 22+
- SQL Server (local, Docker, o Azure SQL)

### Backend

```bash
cd backend/OroTrack.Api
dotnet ef database update --project ../OroTrack.Infrastructure --startup-project .
dotnet run
```

La API queda en `https://localhost:7041`. Al iniciar se crean automáticamente:
- Roles `Admin` y `Vendedor`
- Usuario admin: `admin@orotrack.local` / `Admin123!` (cámbialo antes de producción)
- 3 contenedores de ejemplo (24k, 18k, 14k)

Swagger/OpenAPI: `https://localhost:7041/openapi/v1.json`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. El archivo `.env` ya apunta a la API local (`VITE_API_URL`).

## Despliegue (VPS con Docker)

1. Copia `.env.example` a `.env` y define `DB_PASSWORD`, `JWT_KEY` (32+ caracteres aleatorios) y `PUBLIC_URL` (dominio o IP pública).
2. `docker compose up -d --build`
3. La primera vez, aplica las migraciones dentro del contenedor `api` (o corre `dotnet ef database update` apuntando a la base del VPS antes de levantar el contenedor).
4. El frontend queda expuesto en el puerto `80` y proxya `/api` hacia el contenedor `api`.

Antes de exponerlo a internet real: pon Nginx/Traefik con TLS (Let's Encrypt) delante del puerto 80, y cambia la contraseña del usuario admin sembrado.

## Modelo de negocio (resumen)

- El **saldo de un cliente** y el **peso disponible de un contenedor** se calculan al vuelo, nunca se guardan como columna.
- Una venta la registra un `Usuario` (vendedor) a nombre de un `Cliente`; ambos son roles distintos aunque compartan el mismo flujo.
- `Contenedor` = lote de oro por quilate. `MovimientoContenedor` registra cada compra de material/ajuste.
  El costo por gramo del lote es un promedio ponderado entre lo que quedaba y lo nuevo, y cada venta guarda
  el costo del momento (`VentaDetalle.CostoGramo`) para calcular la ganancia real.

## Control del dinero (caja y cierres)

Cada usuario tiene una **caja**: el dinero que debería tener en su poder desde su último cierre.

| Entra a la caja | Sale de la caja |
|---|---|
| Cobros de ventas de contado y abonos (`Pago`) | Material comprado con **plata de las ventas** (`MovimientoContenedor.Fuente = Caja`, a la caja de `ResponsableCajaId`) |
| Entradas: fondo inicial, sencillo (`MovimientoCaja.Tipo = Aporte`) | Retiros y gastos (`MovimientoCaja.Tipo = Retiro / Gasto`) |

- Material comprado con **capital aparte** (`Fuente = Capital`) no toca ninguna caja; se informa en el cierre.
- **Efectivo esperado** = cobrado en efectivo − material pagado en efectivo de la caja + entradas − retiros y gastos.
- `CajaService` hace este cálculo; lo usan la pantalla de Caja y los Cierres, así que siempre coinciden.
- Un cierre empieza justo después del anterior del mismo usuario: no se puede contar dos veces el mismo dinero.
- El vendedor ve solo su caja; el admin ve todas, registra entradas/retiros/gastos y hace los cierres.
- Ver el mockup de diseño y el diagrama entidad-relación compartidos durante el diseño del producto para el detalle visual y de datos.
