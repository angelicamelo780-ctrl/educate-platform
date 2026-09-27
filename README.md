# Edúcate contra el Dengue — Plataforma

## 1. Crear el proyecto en Supabase
1. Ve a https://supabase.com/dashboard → "New project".
2. Cuando esté listo, entra a **SQL Editor** → pega el contenido de
   `supabase/schema.sql` → Run. Esto crea las tablas de perfiles, grupos,
   quizzes, intentos, progreso, certificados y las reglas de seguridad (RLS).
3. Ve a **Authentication → Providers** y confirma que "Email" esté activado.
   (Opcional: en Authentication → Settings puedes desactivar la confirmación
   por correo mientras pruebas en local, para no depender de un servidor SMTP).

## 2. Conectar el proyecto local
1. Copia `.env.local.example` como `.env.local`.
2. En Supabase: Project Settings → API → copia "Project URL" y "anon public key"
   y pégalos en `.env.local`.

## 3. Correr en local
```bash
npm install
npm run dev
```
Abre http://localhost:3000/registro para crear la primera cuenta (elige el
rol "docente" para probar ese dashboard, o "estudiante" para el otro).

## Qué ya funciona
- Registro con rol (estudiante/docente) → crea perfil automáticamente (trigger SQL).
- Login → redirige al dashboard según el rol.
- Dashboard docente: lista sus grupos (aún sin botón para crear uno).
- Dashboard estudiante: placeholder listo para conectar unidades/progreso.
- Seguridad a nivel de fila (RLS): un estudiante nunca puede leer datos de
  otro estudiante que no sea de su docente; cada docente solo ve su propio grupo.

## Qué sigue (próximos pasos, en orden sugerido)
1. **Crear grupo + unirse con código** — formulario en dashboard docente para
   crear grupo (genera `join_code` automático); pantalla en dashboard
   estudiante para ingresar el código y unirse (`group_members`).
2. **CRUD de quizzes** — pantalla de administración simple para cargar
   preguntas/opciones (tablas `quizzes`, `questions`, `options` ya existen).
3. **Tomar el quiz y calificar** — pantalla de estudiante que guarda en
   `quiz_attempts` + `attempt_answers`, calcula el score y marca `passed`
   según `pass_threshold`.
4. **Certificado en PDF** — al aprobar, generar PDF (librería `pdf-lib` o
   similar) y subirlo a Supabase Storage; guardar la URL en `certificates`.
5. **Panel de docente con progreso/notas** — tabla que cruza
   `group_members` + `progress` + `quiz_attempts` por alumno.
