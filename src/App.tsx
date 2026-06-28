import { useMemo, useState } from 'react'
import './App.css'
import tariffBenchmarks from './data/tariffBenchmarks.json'

type CountryRate = {
  iso2: string
  iso3: string
  country: string
  year: number
  benchmarkDutyRate: number
  maxDutyRate: number | null
  dataKind: string
  sourceName: string
  sourceIndicator: string
  sourceUrl: string
}

const records = (tariffBenchmarks.records as CountryRate[]).filter((row) => row.benchmarkDutyRate !== null)

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

  const selected = countries.find((row) => row.iso2 === destination) ?? countries[0]
  const selectedRate = manualRate.trim() ? Number(manualRate) : selected.benchmarkDutyRate
  const duty = customsValue * (selectedRate / 100)
  const landedWithoutVat = customsValue + duty
  const brokerEstimate = Math.max(120, customsValue * 0.006)
  const reportLines = [
    `Destination: ${selected.country} (${selected.iso2})`,
    `HS code: ${hsCode || 'non renseigné'}`,
    `Valeur douanière: ${currency(customsValue, currencyCode)}`,
    `Taux utilisé: ${pct(selectedRate)} ${manualRate.trim() ? '(saisi manuellement)' : '(benchmark pays)'}`,
    `Droits estimés: ${currency(duty, currencyCode)}`,
    `Frais broker indicatifs: ${currency(brokerEstimate, currencyCode)}`,
    `Total avant TVA/GST: ${currency(landedWithoutVat + brokerEstimate, currencyCode)}`,
    `Source benchmark: ${selected.sourceName}, année ${selected.year}`,
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
            <p className="eyebrow">Landed cost intelligence</p>
            <h1>Calculez rapidement les droits de douane avant d'expédier.</h1>
            <p className="lead">
              Routy compare une valeur douanière avec des taux officiels collectés en ligne par pays.
              Cette première version donne une estimation simple, transparente et exportable.
            </p>
            <div className="actions">
              <a className="primary" href="#calculator">Faire un calcul</a>
              <a className="secondary" href={selected.sourceUrl} target="_blank">Source données</a>
            </div>
          </div>
          <div className="mapCard" aria-label="aperçu route">
            <div className="routeLine"><b>CN</b><i /> <b>{selected.iso2}</b></div>
            <div className="metric"><small>Droits estimés</small><strong>{currency(duty, currencyCode)}</strong></div>
            <div className="metric muted"><small>Taux pays benchmark</small><strong>{pct(selected.benchmarkDutyRate)}</strong></div>
            <p>Le taux exact dépend du HS code, de l'origine, des accords préférentiels et des mesures anti-dumping.</p>
          </div>
        </div>
      </section>

      <section id="calculator" className="panel">
        <div className="panelHeader">
          <p className="eyebrow">Calculateur MVP</p>
          <h2>Droits de douane simples</h2>
          <p>Entrez une valeur, choisissez un pays importateur, puis remplacez le taux si vous connaissez le taux HS exact.</p>
        </div>

        <div className="calculator">
          <form className="form">
            <label>
              Destination / pays importateur
              <select value={destination} onChange={(event) => setDestination(event.target.value)}>
                {countries.map((country) => (
                  <option value={country.iso2} key={country.iso2}>{country.country} — {country.iso2} — {pct(country.benchmarkDutyRate)}</option>
                ))}
              </select>
            </label>
            <label>
              HS code / code douanier
              <input value={hsCode} onChange={(event) => setHsCode(event.target.value)} placeholder="ex: 871160" />
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
              Taux manuel optionnel (%)
              <input value={manualRate} onChange={(event) => setManualRate(event.target.value)} placeholder={`${selected.benchmarkDutyRate}`} />
            </label>
          </form>

          <aside className="result">
            <div className="resultTop">
              <span>Estimation</span>
              <b>{selected.country}</b>
            </div>
            <dl>
              <div><dt>Valeur douanière</dt><dd>{currency(customsValue, currencyCode)}</dd></div>
              <div><dt>Taux utilisé</dt><dd>{pct(selectedRate)}</dd></div>
              <div><dt>Droits estimés</dt><dd>{currency(duty, currencyCode)}</dd></div>
              <div><dt>Frais broker indicatifs</dt><dd>{currency(brokerEstimate, currencyCode)}</dd></div>
              <div className="total"><dt>Total avant TVA/GST</dt><dd>{currency(landedWithoutVat + brokerEstimate, currencyCode)}</dd></div>
            </dl>
            <button onClick={() => navigator.clipboard.writeText(reportLines.join('\n'))}>Copier le rapport</button>
          </aside>
        </div>
      </section>

      <section className="dataSection">
        <div>
          <p className="eyebrow">Données collectées en ligne</p>
          <h2>{records.length} pays et zones</h2>
          <p>
            Données officielles World Bank WDI/WITS, indicateur <code>TM.TAX.MRCH.SM.AR.ZS</code>.
            Le champ « maximum par HS code » est prévu dans le modèle mais nécessite l'interrogation produit par produit des bases TARIC/WITS.
          </p>
        </div>
        <div className="tableLike">
          {countries.slice(0, 12).map((country) => (
            <div className="row" key={country.iso2}>
              <span>{country.country}</span>
              <b>{pct(country.benchmarkDutyRate)}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="guardrails">
        <h2>Garde-fous conformité</h2>
        <ul>
          <li>Routy ne recommande pas de fausse origine, sous-évaluation ou mauvais HS code.</li>
          <li>Le taux final dépend du HS code exact, de l'origine, de la destination et des accords applicables.</li>
          <li>Les résultats sensibles doivent être validés par un transitaire ou courtier en douane.</li>
        </ul>
      </section>
    </main>
  )
}

export default App
