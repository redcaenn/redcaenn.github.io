# Sitio de la Red CAENN

Expediente público de la Red de Cuerpos Académicos de Escuelas Normales del Noroeste. Cada producto, evento, acuerdo y publicación tiene:

- **Enlace permanente**, que no cambia nunca y se puede citar en solicitudes a SECIHTI o al SNII.
- **Fecha de publicación y de última actualización** en el sitio. Las pone el sistema, nadie las escribe.
- **Escuelas normales participantes.** Cuando son dos o más, aparece la etiqueta «Colaboración entre N normales».
- **Exportación a CSV:** todo el conjunto o solo lo que se ve con los filtros aplicados.

El contenido **no está en el código**: está en tablas. Agregar un producto es agregar una fila.

---

## Cómo se actualiza

```
Hoja de Google (privada)  →  cada mañana GitHub la lee y revisa  →  propuesta de cambios  →  alguien la aprueba  →  sitio publicado
```

1. El personal de la Red llena la **hoja de Google** «Red CAENN — datos del sitio». Cada pestaña es una tabla: `productos`, `eventos`, `acuerdos`, `divulgación`, `personas`, `normales`, `líneas`, `obra colectiva`, `fotos`, `retirados`.
2. Cada mañana GitHub lee la hoja, revisa los datos y abre una **propuesta de cambios** (*pull request*) llamada «Cambios de la hoja de Google para revisar».
3. Quien administra el sitio la revisa y presiona **Merge**. En unos 2 minutos el sitio queda actualizado.

Si la propuesta dice **«⚠️ con errores»**, la lista explica qué fila falla y por qué. Se corrige en la hoja y la propuesta se actualiza sola al día siguiente. Para no esperar: pestaña **Actions** → «Sincronizar desde Google Sheets» → **Run workflow**.

> **Otra forma sin la hoja:** los mismos datos están en la carpeta [`datos/`](datos/) del repositorio. En GitHub se abre el archivo, se presiona el lápiz ✏️, se agrega la fila y se guarda con **Commit changes**. El sitio se publica solo.

---

## Reglas de oro

1. **El `id` nunca cambia y nunca se reutiliza.** Es la dirección permanente del registro (`p0007` → `redcaenn.com/repositorio/p0007/`). Para uno nuevo se toma el siguiente número libre.
2. **No se borran filas.** Si un registro tiene que salir, se agrega a la pestaña `retirados` con su `id`, la fecha y el motivo. Su enlace sigue funcionando y muestra «Registro retirado».
3. **Fechas como `AAAA-MM-DD`** (`2026-04-20`). Si solo se sabe el mes: `2026-04`. Si no se sabe: `[PENDIENTE]`.
4. **Lo que falte se escribe `[PENDIENTE]`.** En el sitio aparece resaltado en amarillo para que nadie lo olvide. No hay que inventar datos.
5. **Varias personas o normales se separan con punto y coma:** `enft; ens; bycenes`.
   Los nombres de las columnas y de las pestañas se pueden escribir con o sin acentos y mayúsculas (`Año`, `año` o `anio` funcionan igual). Los identificadores (`enft`, `formacion-docente`, `ortiz-macias-catalina`) van siempre sin acentos ni ñ, porque forman parte de las direcciones.
6. **Nada de correos ni datos privados en columnas públicas.** La hoja puede tener columnas propias (correo, notas internas); el sistema solo copia las columnas de esta guía y descarta el resto.
7. **Fotos: nunca caras de menores.** Una foto solo se publica si su fila dice `revisada_sin_menores` = `sí`.

Identificadores de las normales: `enft`, `bene-ensenada`, `benu-bcs`, `bycenes`, `ens`, `enrrfm`.
Identificadores de las líneas: `formacion-docente`, `derechos-humanos`, `curriculum-didacticas`, `politica-educativa`.
Las personas se identifican como `apellido-apellido-nombre`, por ejemplo `ortiz-macias-catalina`. Consulta la pestaña `personas`; si la persona no está, agrégala primero.

---

## Agregar un producto (artículo, capítulo, libro, ponencia)

Pestaña **`productos`**. Una fila por producto:

| Columna | Qué va | Ejemplo |
|---|---|---|
| `id` * | `p` + 4 cifras, el siguiente libre | `p0012` |
| `tipo` * | `articulo`, `capitulo`, `libro`, `ponencia`, `memoria`, `tesis` u `otro` | `articulo` |
| `título` * | Título completo | `Narrativas docentes en contextos de migración` |
| `autores` * | En el orden de la publicación. Personas de la Red por su id; externos como `Apellido, N.` | `ortiz-macias-catalina; Suárez, D. H.` |
| `año` * | Año de publicación | `2025` |
| `fuente` | Revista (artículo), libro (capítulo) o congreso (ponencia) | `Revista Mexicana de Investigación Educativa` |
| `editores` | Solo capítulos, como en APA | `G. de la Cruz y C. Ortiz (Eds.)` |
| `editorial` | Editorial | `IISUE-UNAM` |
| `volumen`, `número`, `páginas` | Si aplica | `30`, `104`, `45-67` |
| `doi` | Sin `https://doi.org/` | `10.1234/rmie.2025.104` |
| `isbn`, `issn` | Si aplica. El ISBN se revisa automáticamente | `978-607-30-1234-5` |
| `url` | Enlace donde se puede leer | `https://…` |
| `acceso_abierto` * | `sí` o `no` | `sí` |
| `línea` | Línea de investigación (identificador) | `formacion-docente` |
| `normales` | Solo si participa una normal que no sale de los autores | `enrrfm` |
| `pdf` | Nombre del PDF, si la Red tiene permiso de alojarlo (ver abajo) | `p0012.pdf` |
| `resumen` | Resumen breve | |

\* obligatoria

La **cita APA** y las **normales** se calculan solas a partir de los autores.

## Agregar un evento o una sesión del Seminario

Pestaña **`eventos`**:

| Columna | Qué va | Ejemplo |
|---|---|---|
| `id` * | `e` + 4 cifras | `e0008` |
| `tipo` * | `seminario`, `encuentro`, `reunion`, `congreso`, `taller`, `conferencia`, `presentacion`, `inauguracion` u `otro` | `seminario` |
| `serie` | `seminario-latinoamericano` si es parte del Seminario | `seminario-latinoamericano` |
| `sesión` | Número de sesión del Seminario | `5` |
| `título` * | | |
| `fecha_inicio` * / `fecha_fin` | | `2026-10-15` / `2026-10-16` |
| `sede`, `ciudad`, `estado`, `país` | | `ByCENES`, `Hermosillo`, `Sonora`, `México` |
| `modalidad` | `presencial`, `virtual` o `mixta` | `mixta` |
| `normales` | Normales participantes | `bycenes; ens; enft` |
| `instituciones` | Instituciones externas | `IISUE-UNAM; IICE-FILO-UBA` |
| `personas` | Participantes de la Red (ids) | |
| `invitados` | Invitados especiales (texto libre) | `Dra. Sofia Dono` |
| `descripción` | Texto oficial del evento | |
| `nota` | Aclaraciones visibles (por ejemplo, datos por confirmar) | |
| `video` | Enlace de YouTube | `https://www.youtube.com/watch?v=…` |
| `relatoría`, `programa` | Nombre del PDF en `public/documentos/eventos/` | `e0008-relatoria.pdf` |

Los eventos con fecha futura aparecen solos en «Próximos eventos» de la página de inicio.

## Agregar una publicación de divulgación

Pestaña **`divulgación`**. Una fila por cada publicación en redes, transmisión, podcast o nota de prensa:

| Columna | Qué va | Ejemplo |
|---|---|---|
| `id` * | `d` + 4 cifras | `d0020` |
| `fecha` * | Fecha de publicación | `2026-10-02` |
| `tipo` * | `publicacion`, `transmision`, `podcast`, `entrevista`, `nota-de-prensa` u `otro` | `publicacion` |
| `red` * | `facebook`, `instagram`, `youtube`, `whatsapp`, `tiktok`, `x`, `spotify`, `prensa`, `radio`, `television` o `web` | `instagram` |
| `medio` | Quién publicó | `Red CAENN` o `Uniradio Informa` |
| `url` * | Enlace a la publicación | |
| `serie` | Nombre de la serie, si la hay | `Cápsulas de investigación` |
| `título` * | | |
| `normales` | Normales que aparecen o participan | `ens` |
| `personas` | Personas de la Red que aparecen (ids) | `rubio-moreno-mireya` |
| `evento` | Id del evento del que se habla | `e0007` |

Así cada persona puede demostrar sus actividades de divulgación: su ficha (`/personas/su-id/`) las reúne todas.

## Agregar un acuerdo de colaboración

1. Escanea el documento firmado en PDF y ponle como nombre el id: `a0005.pdf`.
2. Súbelo a la carpeta [`public/documentos/acuerdos/`](public/documentos/acuerdos/). En GitHub: abre la carpeta → **Add file** → **Upload files** → **Commit changes**.
3. Agrega la fila en la pestaña **`acuerdos`**: `id`, `fecha`, `tipo` (`carta-compromiso`, `acuerdo`, `convenio` u `otro`), `título`, `instituciones`, `normales`, `personas` (firmantes), `lugar`, `descripción`, `vigencia` y `pdf` = `a0005.pdf`.

## Agregar fotos

1. Revisa que **no aparezcan caras de menores**.
2. Sube la foto a la carpeta [`fotos/`](fotos/). Conviene una subcarpeta por registro, por ejemplo `fotos/e0008/`.
3. Agrega una fila en la pestaña **`fotos`**:
   - `archivo`: `e0008/foto1.jpg`
   - `registro`: `e0008`, el evento o acuerdo al que pertenece.
   - `descripción`: qué se ve. Es obligatoria porque la leen los lectores de pantalla.
   - `crédito`: quién tomó la foto.
   - `revisada_sin_menores`: `sí`

El sitio genera solo versiones ligeras de cada foto.

---

## Errores comunes

| Mensaje | Qué hacer |
|---|---|
| `el id "p0004" está repetido` | Usa el siguiente número libre. |
| `"ens; enft" no existe en normales.csv` | Revisa que el identificador esté bien escrito y separado por `;`. |
| `autor "Catalina Ortiz" no es una persona…` | Usa el id (`ortiz-macias-catalina`) o el formato `Ortiz, C.` si es externo. |
| `no existe el archivo public/documentos/acuerdos/a0005.pdf` | Sube primero el PDF, con ese nombre exacto. |
| `El registro "divulgacion/d0003" ya no está en los datos` | Alguien borró una fila. Vuelve a ponerla o pásala a `retirados`. |
| `columna(s) no permitida(s): correo` | Solo pasa editando los CSV directamente. Quita esa columna: los CSV del repositorio son públicos. |

---

## Para quien mantiene el sitio

### Comandos

```bash
npm install          # una sola vez
npm run dev          # vista previa en http://localhost:4321
npm run validar      # revisa los datos y actualiza datos/_registro.json
npm run build        # revisa y construye el sitio en dist/
npm run sheets       # descarga la hoja (necesita las variables de abajo)
```

### Estructura

```
datos/                     ← todo el contenido (CSV) + sitio.json (textos oficiales, redes, correo)
datos/_registro.json       ← fechas de alta y actualización de cada registro (automático, no editar)
public/documentos/…        ← PDF de acuerdos, relatorías, programas, productos
fotos/                     ← fotos de eventos y acuerdos (se optimizan al construir)
scripts/esquema.mjs        ← columnas permitidas por tabla: la única lista blanca
scripts/validar.mjs        ← revisión de datos y fechas de registro
scripts/sheets.mjs         ← lectura de la hoja de Google con cuenta de servicio (solo lectura)
src/                       ← páginas y diseño (Astro)
```

### Configurar la hoja de Google (una sola vez)

1. **Crear la hoja.** En Google Drive, crea una hoja con una pestaña por archivo de `datos/`, con el mismo nombre (`productos`, `eventos`…). En cada pestaña: **Archivo → Importar → Subir** el CSV correspondiente → «Reemplazar la hoja actual» y **desmarca «Convertir texto en números, fechas y fórmulas»**. Luego selecciona todo y aplica **Formato → Número → Texto sin formato**, para que Sheets no cambie las fechas.
2. **Crear la cuenta de servicio.** En [console.cloud.google.com](https://console.cloud.google.com):
   1. Crea un proyecto («redcaenn-sitio»).
   2. Activa la **Google Sheets API**.
   3. En **IAM → Cuentas de servicio**, crea una cuenta.
   4. En **Claves → Agregar clave → JSON**, descarga el archivo. **Esa llave no se sube al repositorio ni se comparte por chat.**
3. **Compartir la hoja** con el correo de la cuenta de servicio (`…@….iam.gserviceaccount.com`) como **Lector**.
4. **Guardar los datos en GitHub.** En el repositorio: **Settings → Secrets and variables → Actions → New repository secret**:
   - `GOOGLE_SHEET_ID`: lo que va entre `/d/` y `/edit` en la dirección de la hoja.
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: el contenido completo del archivo JSON.
5. **Permitir las propuestas automáticas.** En **Settings → Actions → General**, activa «Allow GitHub Actions to create and approve pull requests».

Después borra la llave de tu computadora. Si se pierde, se crea otra desde la misma pantalla.

### Publicar en GitHub Pages

1. **Settings → Pages → Source: GitHub Actions**.
2. Mientras no se conecte el dominio, define en **Settings → Secrets and variables → Actions → Variables** `SITE` = `https://<usuario>.github.io` y `BASE` = `/<nombre-del-repositorio>`.
3. **Conectar redcaenn.com:**
   1. Borra las variables `SITE` y `BASE`.
   2. En **Settings → Pages → Custom domain** escribe `redcaenn.com` y activa «Enforce HTTPS».
   3. En el DNS de Hostinger (panel → Dominios → DNS), la coordinación debe dejar:
      - 4 registros **A** para `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
      - un **CNAME** `www` → `<usuario>.github.io`
   4. **No cambiar los nameservers ni los registros MX:** el correo @redcaenn.com vive en Hostinger.
   5. El dominio está registrado en GoDaddy y vence el **14 de enero de 2027**. Conviene activar la renovación automática.

Las direcciones del WordPress anterior (`/inicio/`, `/home/`, `/acuerdos-de-colaboracion/`, `/registro/`) redirigen a sus equivalentes nuevas.
