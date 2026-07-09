import { getSheetDef } from '../lib/sheetDefs'
import type { Bogen } from '../types'
import { courseKey, type CourseImages } from './SheetsDocument'

// react-pdf <Image> kann nur PNG/JPEG (kein SVG). Wir laden die Parcours-PNGs
// und zeichnen sie – für die Tor-Bögen um 90° gedreht – auf ein Canvas, um sie
// als Data-URI einzubetten.

async function loadCourseImage(url: string, rotate: boolean): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('Bild nicht ladbar: ' + url))
    i.src = url
  })
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return url
  if (rotate) {
    canvas.width = img.naturalHeight
    canvas.height = img.naturalWidth
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(Math.PI / 2) // im Uhrzeigersinn – wie im Haupt-Prototyp
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
  } else {
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)
  }
  return canvas.toDataURL('image/png')
}

/** Lädt (und dreht) alle für die Bögen benötigten Parcoursbilder. */
export async function loadCourseImages(boegen: Bogen[], baseUrl: string): Promise<CourseImages> {
  const needed = new Map<string, { dir: string; klasse: string; rotate: boolean }>()
  for (const b of boegen) {
    const dir = getSheetDef(b.typeId).courseImageDir
    if (dir) {
      needed.set(courseKey(dir, b.klasse), {
        dir,
        klasse: b.klasse,
        rotate: dir !== 'alcatraz_Parcours', // Tor-Bögen drehen, Parcours quer lassen
      })
    }
  }
  const entries = await Promise.all(
    [...needed].map(async ([key, { dir, klasse, rotate }]) => {
      try {
        const uri = await loadCourseImage(`${baseUrl}parcours/${dir}/Klasse${klasse}.png`, rotate)
        return [key, uri] as const
      } catch {
        return null
      }
    }),
  )
  return Object.fromEntries(entries.filter((e): e is [string, string] => e !== null))
}
