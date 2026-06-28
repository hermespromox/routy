export type TariffStatus = 'official_rule' | 'manual' | 'missing'

export type TariffLookup = {
  status: TariffStatus
  dutyRate: number | null
  sourceName: string
  sourceUrl?: string
  confidence: 'haute' | 'moyenne' | 'basse' | 'aucune'
  explanation: string
  missingReason?: string
  reviewRequired: boolean
}

export const euCountryCodes = new Set([
  'EU', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
])

export function normalizeHsCode(value: string) {
  return value.replace(/\D/g, '').slice(0, 10)
}

type LookupInput = {
  origin: string
  destination: string
  hsCode: string
  manualRate: string
}

export function lookupTariff({ origin, destination, hsCode, manualRate }: LookupInput): TariffLookup {
  const normalizedHs = normalizeHsCode(hsCode)
  const parsedManualRate = Number(manualRate.replace(',', '.'))
  const hasManualRate = manualRate.trim() !== '' && Number.isFinite(parsedManualRate) && parsedManualRate >= 0
  const isIntraEu = euCountryCodes.has(origin) && euCountryCodes.has(destination)

  if (isIntraEu) {
    return {
      status: 'official_rule',
      dutyRate: 0,
      sourceName: 'Règle union douanière / circulation intra-UE',
      sourceUrl: 'https://taxation-customs.ec.europa.eu/customs-4/eu-customs-union_en',
      confidence: 'haute',
      explanation: 'Origine et destination sont dans l’Union européenne : droits de douane à 0 %. La TVA intracommunautaire, l’autoliquidation et les obligations déclaratives restent hors MVP.',
      reviewRequired: false,
    }
  }

  if (hasManualRate) {
    return {
      status: 'manual',
      dutyRate: parsedManualRate,
      sourceName: 'Taux saisi manuellement',
      confidence: 'moyenne',
      explanation: 'Routy utilise uniquement le taux que vous avez saisi. La source officielle de ce taux doit être conservée dans votre dossier d’import.',
      reviewRequired: true,
    }
  }

  if (normalizedHs.length < 6) {
    return {
      status: 'missing',
      dutyRate: null,
      sourceName: 'Matrice tarifaire non interrogée',
      confidence: 'aucune',
      explanation: 'Un calcul douanier sérieux exige au minimum un HS code à 6 chiffres, puis une ligne tarifaire par origine et destination.',
      missingReason: 'HS code obligatoire : entrez au moins 6 chiffres.',
      reviewRequired: true,
    }
  }

  const destinationHint = destination === 'US'
    ? 'Pour les États-Unis, il faut intégrer HTSUS + Chapter 99 + mesures par origine, par exemple Section 301, sanctions, quotas et préférences pays.'
    : euCountryCodes.has(destination)
      ? 'Pour l’Union européenne, il faut intégrer TARIC / Access2Markets avec origine, destination, HS code, mesures additionnelles et accords préférentiels.'
      : 'Il faut intégrer la source officielle du pays importateur pour cette destination.'

  return {
    status: 'missing',
    dutyRate: null,
    sourceName: 'Donnée officielle non encore intégrée',
    confidence: 'aucune',
    explanation: destinationHint,
    missingReason: `Aucune ligne officielle dans la matrice pour ${origin} → ${destination} / HS ${normalizedHs}.`,
    reviewRequired: true,
  }
}
