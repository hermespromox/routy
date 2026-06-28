import { useMemo, useState } from 'react'
import './App.css'
import tariffBenchmarks from './data/tariffBenchmarks.json'
import { euCountryCodes, lookupTariff, normalizeHsCode } from './data/tariffMatrix'

type CountryRate = {
  iso2: string
  iso3: string
  country: string
  year: number
  benchmarkDutyRate: number | null
  maxDutyRate: number | null
  dataKind: string
  sourceName: string
  sourceIndicator: string
  sourceUrl: string
}

const records = (tariffBenchmarks.records as CountryRate[]).filter((row) => row.iso2 && row.country)
const preferredDestinations = ['EU', 'FR', 'DE', 'NL', 'US', 'GB', 'MA', 'TR', 'AE', 'VN', 'CN']

function currency(value: number, code: string) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)
}

function pct(value: number) {
  return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
}

function App() {
  const [origin, setOrigin] = useState('CN')
  const [destination, setDestination] = useState('EU')
  const [customsValue, setCustomsValue] = useState(10000)
  const [currencyCode, setCurrencyCode] = useState('EUR')
  const [hsCode, setHsCode] = useState('')
  const [manualRate, setManualRate] = useState('')

  const countries = useMemo(() => {
    const map = new Map(records.map((row) => [row.iso2, row]))
    const preferred = preferredDestinations.map((iso) => map.get(iso)).filter(Boolean) as CountryRate[]
    const rest = records.filter((row) => !preferredDestinations.includes(row.iso2))
    return [...preferred, ...rest]
  }, [])

  const selectedOrigin = countries.find((row) => row.iso2 === origin) ?? countries.find((row) => row.iso2 === 'CN') ?? countries[0]
  const selected = countries.find((row) => row.iso2 === destination) ?? countries[0]
  const normalizedHs = normalizeHsCode(hsCode)
  const tariff = lookupTariff({ origin: selectedOrigin.iso2, destination: selected.iso2, hsCode, manualRate })
  const rate = tariff.dutyRate
  const duty = rate === null ? null : customsValue * (rate / 100)
  const brokerEstimate = tariff.status === 'official_rule' && euCountryCodes.has(selectedOrigin.iso2) && euCountryCodes.has(selected.iso2)
    ? 0
    : Math.max(120, customsValue * 0.006)
  const landedWithoutVat = duty === null ? null : customsValue + duty + brokerEstimate
  const resultLabel = tariff.status === 'missing' ? 'Donnée manquante' : currency(duty ?? 0, currencyCode)
  const rateLabel = tariff.dutyRate === null ? 'Non disponible' : pct(tariff.dutyRate)
  const sourceLink = tariff.sourceUrl ?? 'https://trade.ec.europa.eu/access-to-markets/en/home'
  const reportLines = [
    `Exportateur / origine: ${selectedOrigin.country} (${selectedOrigin.iso2})`,
    `Destination / importateur: ${selected.country} (${selected.iso2})`,
    `HS code: ${normalizedHs || 'non renseigné'}`,
    `Valeur douanière: ${currency(customsValue, currencyCode)}`,
    `Statut donnée: ${tariff.status}`,
    `Taux utilisé: ${rateLabel}`,
    `Droits estimés: ${duty === null ? 'non calculés' : currency(duty, currencyCode)}`,
    `Source: ${tariff.sourceName}`,
    `Confiance: ${tariff.confidence}`,
    `Broker review: ${tariff.reviewRequired ? 'oui' : 'non'}`,
    tariff.missingReason ? `Donnée manquante: ${tariff.missingReason}` : `Explication: ${tariff.explanation}`,
  ]

  return (
    <main>
      <section className="hero">
        <nav>
          <div className="brand"><span>R</span> Routy</div>
          <a href="#calculator">Calculateur</a>
        </nav>
        <div className="heroGrid">
          <div>
            <p className="eyebrow">Matrice tarifaire pays × pays × HS</p>
            <h1>Calculez seulement quand la donnée officielle existe.</h1>
            <p className="lead">
              Routy passe à une logique sérieuse : origine, destination et HS code sont traités comme une matrice tarifaire.
              S’il manque la ligne officielle, l’app l’indique au lieu d’inventer un taux moyen.
            </p>
            <div className="actions">
              <a className="primary" href="#calculator">Tester une route</a>
              <a className="secondary" href={sourceLink} target="_blank">Sources à intégrer</a>
            </div>
          </div>
          <div className="mapCard" aria-label="aperçu route">
            <div className="routeLine"><b>{selectedOrigin.iso2}</b><i /> <b>{selected.iso2}</b></div>
            <div className={`metric ${tariff.status === 'missing' ? 'warning' : ''}`}><small>Droits estimés</small><strong>{resultLabel}</strong></div>
            <div className="metric muted"><small>Taux matrice</small><strong>{rateLabel}</strong></div>
            <p>{tariff.explanation}</p>
          </div>
        </div>
      </section>

      <section id="calculator" className="panel">
        <div className="panelHeader">
          <p className="eyebrow">Calculateur MVP corrigé</p>
          <h2>Matrice douanière, pas moyenne pays</h2>
          <p>Le taux automatique n’est plus un benchmark. Il faut une règle officielle ou un taux manuel documenté.</p>
        </div>

        <div className="calculator">
          <form className="form">
            <label>
              Pays exportateur / origine
              <select value={origin} onChange={(event) => setOrigin(event.target.value)}>
                {countries.map((country) => (
                  <option value={country.iso2} key={country.iso2}>{country.country} — {country.iso2}</option>
                ))}
              </select>
            </label>
            <label>
              Destination / pays importateur
              <select value={destination} onChange={(event) => setDestination(event.target.value)}>
                {countries.map((country) => (
                  <option value={country.iso2} key={country.iso2}>{country.country} — {country.iso2}</option>
                ))}
              </select>
            </label>
            <label>
              HS code / code douanier obligatoire
              <input value={hsCode} onChange={(event) => setHsCode(event.target.value)} placeholder="ex: 871160" inputMode="numeric" />
            </label>
            <label>
              Valeur douanière
              <input type="number" min="0" value={customsValue} onChange={(event) => setCustomsValue(Number(event.target.value))} />
            </label>
            <label>
              Devise
              <select value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value)}>
                {['EUR', 'USD', 'GBP', 'MAD', 'AED', 'TRY', 'CNY'].map((code) => <option key={code}>{code}</option>)}
              </select>
            </label>
            <label>
              Taux manuel si source officielle connue (%)
              <input value={manualRate} onChange={(event) => setManualRate(event.target.value)} placeholder="ex: 7.5" />
            </label>
          </form>

          <aside className={`result ${tariff.status}`}>
            <div className="resultTop">
              <span>{tariff.status === 'missing' ? 'Non calculable' : 'Estimation'}</span>
              <b>{selectedOrigin.iso2} → {selected.iso2}</b>
            </div>
            <dl>
              <div><dt>Pays exportateur</dt><dd>{selectedOrigin.country}</dd></div>
              <div><dt>Pays importateur</dt><dd>{selected.country}</dd></div>
              <div><dt>HS code normalisé</dt><dd>{normalizedHs || 'obligatoire'}</dd></div>
              <div><dt>Valeur douanière</dt><dd>{currency(customsValue, currencyCode)}</dd></div>
              <div><dt>Taux matrice</dt><dd>{rateLabel}</dd></div>
              <div><dt>Source</dt><dd>{tariff.sourceName}</dd></div>
              <div><dt>Confiance</dt><dd>{tariff.confidence}</dd></div>
              <div><dt>Droits estimés</dt><dd>{duty === null ? 'Non calculés' : currency(duty, currencyCode)}</dd></div>
              <div><dt>Frais broker indicatifs</dt><dd>{duty === null ? 'Non calculés' : currency(brokerEstimate, currencyCode)}</dd></div>
              <div className="total"><dt>Total avant TVA/GST</dt><dd>{landedWithoutVat === null ? 'Non calculé' : currency(landedWithoutVat, currencyCode)}</dd></div>
            </dl>
            <p className="calculationNote">
              {tariff.missingReason ? `${tariff.missingReason} ${tariff.explanation}` : tariff.explanation}
            </p>
            <button onClick={() => navigator.clipboard.writeText(reportLines.join('\n'))}>Copier le rapport</button>
          </aside>
        </div>
      </section>

      <section className="dataSection">
        <div>
          <p className="eyebrow">Architecture de donnée</p>
          <h2>Matrice entière à remplir source par source</h2>
          <p>
            Le modèle cible est <code>origine × destination × HS code</code>. Chaque ligne doit porter le taux MFN,
            les taux préférentiels, les mesures additionnelles, la source, la date et le niveau de confiance.
          </p>
        </div>
        <div className="tableLike">
          {[
            ['Union européenne', 'TARIC / Access2Markets : droits, préférences, anti-dumping'],
            ['États-Unis', 'HTSUS + Chapter 99 : pays spécifiques, Section 301, quotas'],
            ['Royaume-Uni', 'UK Global Tariff + accords préférentiels'],
            ['Autres pays', 'Sources douanières nationales à intégrer progressivement'],
          ].map(([label, value]) => (
            <div className="row" key={label}>
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="guardrails">
        <h2>Garde-fous conformité</h2>
        <ul>
          <li>Pas de taux moyen pays utilisé comme calcul douanier.</li>
          <li>Une route hors matrice officielle affiche « donnée manquante ».</li>
          <li>Les États-Unis et autres pays avec droits par origine nécessitent une source officielle pays × HS × mesure.</li>
          <li>Routy ne recommande pas de fausse origine, sous-évaluation ou mauvais HS code.</li>
        </ul>
      </section>
    </main>
  )
}

export default App
