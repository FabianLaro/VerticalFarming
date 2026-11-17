import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowsOut, X } from '@phosphor-icons/react'
import './render-gallery.css'

type System = 'vertical' | 'greenhouse' | 'field'
const scenes: { id: System; title: string; image: string; alt: string; description: string }[] = [
  { id: 'vertical', title: 'Vertical Farm', image: './renders/vertical-farm.png', alt: 'Gerendertes Schnittmodell einer vertikalen Farm mit bepflanzten Regalen, LED, Nährlösungstank, Pumpen und Lüftungstechnik.', description: 'Gestapelte Kulturflächen, künstliches Licht und eine technische Versorgung außerhalb der Regale.' },
  { id: 'greenhouse', title: 'Gewächshaus', image: './renders/greenhouse.png', alt: 'Gerendertes Modell eines Gewächshauses mit transparenter Hülle, sichtbarer Tragkonstruktion und Salatkulturen im Sonnenlicht.', description: 'Eine lichtdurchlässige Hülle nutzt Sonnenlicht; Bewässerung und Klimaführung bleiben technische Aufgaben.' },
  { id: 'field', title: 'Freiland', image: './renders/field.png', alt: 'Gerendertes Modell eines Freilandbeets mit organisch geformten Salatpflanzen, Boden und Bewässerungsleitungen.', description: 'Boden, Witterung und Jahreszeiten prägen die Kulturen; Zusatzbewässerung und Ernte verbinden die Fläche mit ihrer Umgebung.' },
]

export function RenderGallery({ system, onSystemChange }: { system: System; onSystemChange: (system: System) => void }) {
  const selected = scenes.find(scene => scene.id === system)!
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState(false)
  useEffect(() => setDetail(false), [system])
  const showDetail = system === 'vertical' && detail
  const image = showDetail ? './renders/lettuce-detail.png' : selected.image
  const title = showDetail ? 'Salat und Anbaukanal' : selected.title
  const alt = showDetail ? 'Nahaufnahme selbst modellierter Salatblätter mit gewelltem Rand und Blattadern in einem Bewässerungskanal unter LED-Leuchten.' : selected.alt
  const description = showDetail ? 'Gekrümmte Blattflächen, Pflanzöffnungen und die Lichtversorgung einer einzelnen Anbauebene.' : selected.description
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal()
    else if (!open) dialog.current?.close()
  }, [open])
  const next = (direction: number) => onSystemChange(scenes[(scenes.findIndex(scene => scene.id === system) + direction + scenes.length) % scenes.length].id)
  return <section className="render-gallery no-print" aria-label="Gerenderte Modellansichten">
    <nav aria-label="Gerenderte Modellansichten">{scenes.map(scene => <button key={scene.id} aria-pressed={system === scene.id} onClick={() => onSystemChange(scene.id)}>{scene.title}</button>)}</nav>
    {system === 'vertical' && <div className="render-detail-switch" aria-label="Detail der Vertical Farm"><button aria-pressed={!detail} onClick={() => setDetail(false)}>Gesamtansicht</button><button aria-pressed={detail} onClick={() => setDetail(true)}>Blätter & Anbaukanal</button></div>}
    <figure>
      <button className="render-image-button" onClick={() => setOpen(true)} aria-label={`${title}: gerenderte Ansicht vergrößern`}>
        <img src={image} alt={alt} width={2048} height={1408} loading="lazy" decoding="async" />
        <span><ArrowsOut size={19} />Großansicht</span>
      </button>
      <figcaption><div><strong>{title}</strong><p>{description}</p></div><small>Feste Modellszenen, keine Messbilder. Die Regler verändern das interaktive Modell oben. Ansichten jeweils eingepasst, kein gemeinsamer Flächenmaßstab.</small></figcaption>
    </figure>
    <dialog ref={dialog} className="render-dialog" onCancel={() => setOpen(false)} onClose={() => { if (!dialog.current?.open) setOpen(false) }} onClick={event => { if (event.target === event.currentTarget) setOpen(false) }} onKeyDown={event => { if (event.key === 'ArrowLeft') next(-1); if (event.key === 'ArrowRight') next(1) }} aria-label={`Großansicht: ${title}`}>
      <div className="render-dialog-content"><div className="render-dialog-toolbar"><strong>{title}</strong><div><button onClick={() => next(-1)} aria-label="Vorherige Modellansicht"><ArrowLeft size={20} /></button><button onClick={() => next(1)} aria-label="Nächste Modellansicht"><ArrowRight size={20} /></button><button onClick={() => setOpen(false)} aria-label="Großansicht schließen"><X size={22} /></button></div></div><img src={image} alt={alt} /><p>{description}</p><small>Feste Referenzdarstellung · Ansichten einzeln eingepasst</small></div>
    </dialog>
  </section>
}
