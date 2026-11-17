export function Conflicts({ onSource }: { onSource: (id: string) => void }) {
  return <details className="conflicts no-print">
    <summary>Zielkonflikte und betroffene Gruppen</summary>
    <div className="conflict-grid">
      <article>
        <h3>Kurze Wege und Strombedarf</h3>
        <p><b>Ursache → Wirkung:</b> Kunstlicht und Klimatisierung ermöglichen ganzjährigen Anbau, benötigen aber Strom. Kurze Lieferwege gleichen diesen Aufwand nicht zwangsläufig aus.</p>
        <p><b>Betroffene:</b> Betriebe und Kundschaft tragen Kosten; Stadt und Steuerzahlende tragen Förderrisiken.</p>
        <button className="source-link" onClick={() => onSource('stanghellini2024')}>Stanghellini & Katzin 2024</button>
      </article>
      <article>
        <h3>Flächenertrag und bezahlbarer Zugang</h3>
        <p><b>Ursache → Wirkung:</b> Aufwendige Technik ermöglicht gestapelte Kulturflächen. Hohe laufende Kosten können höhere Verkaufspreise erfordern und den Zugang begrenzen.</p>
        <p><b>Betroffene:</b> Haushalte mit wenig Einkommen, regionale Gartenbaubetriebe und öffentliche Haushalte haben unterschiedliche Interessen.</p>
        <button className="source-link" onClick={() => onSource('material')}>M4, S. 4: didaktischer Wertkonflikt</button>
      </article>
    </div>
    <p className="conflict-note">Lokale Verteilungsdaten fehlen; Förderprioritäten sind Wertentscheidungen.</p>
  </details>
}
