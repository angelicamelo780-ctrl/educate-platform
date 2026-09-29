// Genera los audios del diccionario con la voz colombiana "Gonzalo" de Microsoft Azure.
//
// Uso (desde la carpeta del proyecto):
//   AZURE_SPEECH_KEY=tu_clave AZURE_SPEECH_REGION=eastus node scripts/generar-audios-diccionario.mjs
// En Windows (PowerShell):
//   $env:AZURE_SPEECH_KEY="tu_clave"; $env:AZURE_SPEECH_REGION="eastus"; node scripts/generar-audios-diccionario.mjs
//
// Crea un MP3 por palabra en public/audio/diccionario/<palabra>.mp3 (palabra + definición).
// Si un audio ya existe, lo salta; para regenerarlo, bórralo y vuelve a correr el script.
// La clave NUNCA se guarda en el código ni se sube a GitHub.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const KEY = process.env.AZURE_SPEECH_KEY;
const REGION = process.env.AZURE_SPEECH_REGION;
if (!KEY || !REGION) {
  console.error("Falta AZURE_SPEECH_KEY o AZURE_SPEECH_REGION. Mira las instrucciones al inicio de este archivo.");
  process.exit(1);
}

// Voz y estilo: Gonzalo (Colombia), un poco más agudo y pausado para que suene cercano a los niños.
const VOZ = "es-CO-GonzaloNeural";
const TONO = process.env.TONO || "+8%";        // subir para sonar más juvenil, p. ej. "+15%"
const VELOCIDAD = process.env.VELOCIDAD || "-6%";

// Leer las palabras directamente de lib/diccionario.ts
const src = readFileSync(join("lib", "diccionario.ts"), "utf8");
const inicio = src.indexOf("= [", src.indexOf("export const DICCIONARIO")) + 2;
const fin = src.indexOf("\n];", inicio);
const DICCIONARIO = JSON.parse(src.slice(inicio, fin + 2).replace(/,\s*\]$/, "]"));

export function slug(palabra) {
  return palabra.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const salida = join("public", "audio", "diccionario");
mkdirSync(salida, { recursive: true });

const soloPrueba = process.argv.includes("--prueba"); // genera solo 3 audios para escuchar antes
const lista = soloPrueba ? DICCIONARIO.filter((p) => ["Campantes", "Abandonados", "Dengue"].includes(p.palabra)).slice(0, 3) : DICCIONARIO;

let hechos = 0, saltados = 0, errores = 0;
for (const p of lista) {
  const archivo = join(salida, slug(p.palabra) + ".mp3");
  if (existsSync(archivo)) { saltados++; continue; }
  const ssml = `<speak version="1.0" xml:lang="es-CO" xmlns="http://www.w3.org/2001/10/synthesis">
  <voice name="${VOZ}"><prosody pitch="${TONO}" rate="${VELOCIDAD}">${esc(p.palabra)}.<break time="400ms"/>${esc(p.definicion)}</prosody></voice></speak>`;
  try {
    const res = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "educate-contra-el-dengue",
      },
      body: ssml,
    });
    if (!res.ok) throw new Error(res.status + " " + (await res.text()).slice(0, 200));
    writeFileSync(archivo, Buffer.from(await res.arrayBuffer()));
    hechos++;
    process.stdout.write(`✓ ${p.palabra}\n`);
    await new Promise((r) => setTimeout(r, 350)); // pausa corta para no pasar el límite del plan gratuito
  } catch (e) {
    errores++;
    console.error(`✗ ${p.palabra}: ${e.message}`);
  }
}
console.log(`\nListo: ${hechos} nuevos, ${saltados} ya existían, ${errores} con error. Carpeta: ${salida}`);
