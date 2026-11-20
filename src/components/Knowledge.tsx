import { evidenceData } from '../data/catalog'
import { number } from '../lib/format'

export function Knowledge({ onSource }: { onSource: (id: string) => void }) {
  return <details className="knowledge no-print" aria-labelledby="knowledge-heading">
    <summary className="knowledge-header"><h2 id="knowledge-heading">Hintergrund</h2><span>Ressourcen · Daten · Begriffe</span></summary>
    <div className="knowledge-index">
      <details className="knowledge-topic">
        <summary>Ressourcen und Standort</summary>
        <div className="knowledge-content">
          <p>Nährlösung wird zurückgeführt. Ernte, Reinigung und Verluste führen Stoffe aus; Strom, Frischwasser, Nährsalze und Betriebsmittel müssen zugeführt werden.</p>
          <p className="knowledge-flow">Strom · Wasser · Nährsalze · Saatgut <span aria-hidden="true">→</span> <strong>Vertical Farm</strong> <span aria-hidden="true">→</span> Ernte · Abwärme · Reststoffe</p>
          <small>Schema der Abläufe, keine Mengenverhältnisse.</small>
          <dl className="knowledge-facts">
            <div><dt>Energie</dt><dd>Verlässlicher Stromanschluss und Versorgung prägen Betriebskosten und den strombedingten Emissionsbeitrag.</dd></div>
            <div><dt>Gebäude und Infrastruktur</dt><dd>Tragfähigkeit, Wasser, Genehmigungen und tatsächlich nutzbare Wärmeflüsse müssen zum Standort passen.</dd></div>
            <div><dt>Personal und Absatz</dt><dd>Fachkräfte, Wartung und erreichbare Käufer sind nötig; kurze Wege allein sichern keinen Absatz.</dd></div>
          </dl>
          <p>Der ALTMARKTgarten nutzt Sonnenlicht in einem Dachgewächshaus. Seine Gebäudekopplung ist kein Leistungsnachweis für eine vollständig künstlich beleuchtete Pflanzenfabrik.</p>
          <div className="knowledge-sources"><button className="source-link" onClick={() => onSource('dlrresources2020')}>DLR: externe Ressourcen</button><button className="source-link" onClick={() => onSource('fraunhofer')}>Fraunhofer: inFARMING</button></div>
        </div>
      </details>

      <details className="knowledge-topic">
        <summary>Begriffe</summary>
        <div className="knowledge-content">
          <dl className="knowledge-facts">
            <div><dt>Hydroponik</dt><dd>Die Wurzeln erhalten Wasser und gelöste Nährstoffe ohne Ackerboden.</dd></div>
            <div><dt>Flächenertrag</dt><dd>Ernte je definierter Fläche und Zeit; Gebäudegrundfläche und summierte Anbaufläche sind verschieden.</dd></div>
            <div><dt>Systemgrenze</dt><dd>Sie legt fest, welche Prozesse und Vorleistungen eine Bilanz erfasst.</dd></div>
            <div><dt>Resilienz</dt><dd>Die Fähigkeit, Störungen zu bewältigen. Technische Kontrolle kann Risiken auch verlagern.</dd></div>
          </dl>
        </div>
      </details>
    </div>
  </details>
}

export function EnergyEvidence({ onSource }: { onSource: (id: string) => void }) {
  const efficiencies = ['eue-science', 'eue-business'].map(id => evidenceData.find(datum => datum.id === id)!)
  const water = evidenceData.find(datum => datum.id === 'water-efficiency')!
  const edenHarvest = evidenceData.find(datum => datum.id === 'eden-harvest')!
  const edenArea = evidenceData.find(datum => datum.id === 'eden-area')!

  return <details className="atlas-details atlas-evidence">
        <summary>Was die Daten aus M3 belegen</summary>
        <div className="knowledge-content">
          <figure className="m3-chart">
            <figcaption>Salatfrischmasse je eingesetzter Energie · kg/kWh</figcaption>
            {efficiencies.map((datum, i) => <div key={datum.id}><span>{i === 0 ? 'Literatur · n = 34' : 'Unternehmen · n = 6'}</span><i style={{ width: `${datum.value / .16 * 100}%` }} /><b>{number(datum.value, 2)}</b></div>)}
            <p>Gemeinsame Skala 0–0,16 kg/kWh. Pennisi et al. 2025, Abb. 3, S. 5.</p>
          </figure>
          <p>Die Gruppenmittel stammen aus unterschiedlichen Methoden und sind keine repräsentative Betriebsstichprobe. Sie begründen keine Rangliste realer Betriebstypen.</p>
          <p>Rechnerische Kehrwerte: {efficiencies.map(datum => number(1 / datum.value, 1)).join(' bzw. ')} kWh/kg. Das sind keine mittleren Energiebedarfe.</p>
          <p>Auch die „typische Spanne“ des Flächenertrags in M3 beruht auf zwei Gruppenmitteln, nicht auf natürlichen Grenzen. Der Wasserwert von {number(water.value, 1)} g/L gilt für die Bewässerungszufuhr im Review, nicht für einen vollständigen Wasserfußabdruck oder eine garantierte Einsparung.</p>
          <p>EDEN ISS erntete {number(edenHarvest.value)} kg Mischgemüse auf {number(edenArea.value, 1)} m² Anbaufläche ({edenHarvest.dataYear}). Dieser historische Forschungsfall belegt weder einen Salatjahresertrag noch Rentabilität in NRW.</p>
          <div className="knowledge-sources"><button className="source-link" onClick={() => onSource('pennisi2025')}>Pennisi et al. 2025: Werte und Grenzen</button><button className="source-link" onClick={() => onSource('dlr2020')}>EDEN ISS: Versuch 2018</button></div>
        </div>
      </details>
}
