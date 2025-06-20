/*
<ai_context>
Medical terminology dictionary and utilities for the Med Writer application.
Client-safe medical term validation and medical context analysis.
</ai_context>
*/

// Medical terminology dictionary (expandable)
export const MEDICAL_TERMS = new Set([
  // Common medical abbreviations
  "BP",
  "HR",
  "ECG",
  "EKG",
  "MRI",
  "CT",
  "CBC",
  "BUN",
  "CHF",
  "COPD",
  "MI",
  "CVA",
  "ICU",
  "ER",
  "OR",
  "IV",
  "IM",
  "PO",
  "PRN",
  "BID",
  "TID",
  "QID",
  "QD",

  // Anatomical terms
  "myocardium",
  "pericardium",
  "endocardium",
  "ventricle",
  "atrium",
  "aorta",
  "pulmonary",
  "hepatic",
  "renal",
  "cardiac",
  "thoracic",
  "abdominal",

  // Common medical terms
  "diagnosis",
  "prognosis",
  "etiology",
  "pathophysiology",
  "symptom",
  "syndrome",
  "treatment",
  "therapy",
  "medication",
  "dosage",
  "contraindication",

  // Units and measurements
  "mg",
  "mL",
  "mmHg",
  "bpm",
  "kg",
  "cm",
  "mm",
  "L",
  "dL",
  "mcg",
  "IU"
])

// Additional medical term lists for comprehensive coverage
export const MEDICAL_PREFIXES = new Set([
  "cardio",
  "neuro",
  "gastro",
  "hepato",
  "nephro",
  "pulmo",
  "osteo",
  "hemo",
  "pneumo",
  "dermato",
  "endo",
  "exo"
])

export const MEDICAL_SUFFIXES = new Set([
  "itis",
  "osis",
  "emia",
  "pathy",
  "gram",
  "scopy",
  "tomy",
  "ectomy",
  "plasty",
  "logy",
  "ology",
  "megaly"
])

export const LATIN_MEDICAL_TERMS = new Set([
  "in situ",
  "per os",
  "ad libitum",
  "pro re nata",
  "ante cibum",
  "post cibum",
  "bis in die",
  "ter in die",
  "quater in die",
  "sub lingua",
  "per rectum"
])

// Helper function to check if a term is medical
export function isMedicalTerm(term: string): boolean {
  console.log(`🏥 Checking if term is medical: "${term}"`)

  const upperTerm = term.toUpperCase()
  const lowerTerm = term.toLowerCase()

  const isMedical =
    MEDICAL_TERMS.has(upperTerm) ||
    MEDICAL_TERMS.has(lowerTerm) ||
    MEDICAL_PREFIXES.has(lowerTerm) ||
    MEDICAL_SUFFIXES.has(lowerTerm) ||
    isLatinMedicalTerm(term)

  console.log(`🏥 Term "${term}" is ${isMedical ? "medical" : "non-medical"}`)
  return isMedical
}

// Check if a term is a Latin medical term
export function isLatinMedicalTerm(word: string): boolean {
  const lowerWord = word.toLowerCase()

  return Array.from(LATIN_MEDICAL_TERMS).some(
    term =>
      term.toLowerCase().includes(lowerWord) ||
      lowerWord.includes(term.toLowerCase())
  )
}

// Check if text contains medical terminology
export function hasMedicalTerminology(text: string): boolean {
  console.log("🏥 Checking text for medical terminology...")

  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  const medicalTermsFound = words.filter(word => isMedicalTerm(word))

  const hasMedical = medicalTermsFound.length > 0
  console.log(
    `🏥 Medical terminology check: ${medicalTermsFound.length} terms found`
  )

  return hasMedical
}

// Get medical terms from text
export function extractMedicalTerms(text: string): {
  abbreviations: string[]
  anatomicalTerms: string[]
  generalTerms: string[]
  latinTerms: string[]
} {
  console.log("🏥 Extracting medical terms from text...")

  const words = text.match(/\b\w+\b/g) || []
  const abbreviations: string[] = []
  const anatomicalTerms: string[] = []
  const generalTerms: string[] = []
  const latinTerms: string[] = []

  for (const word of words) {
    if (isMedicalTerm(word)) {
      const upperWord = word.toUpperCase()

      if (upperWord.length <= 4 && upperWord === upperWord.toUpperCase()) {
        abbreviations.push(upperWord)
      } else if (isLatinMedicalTerm(word)) {
        latinTerms.push(word)
      } else if (isAnatomicalTerm(word)) {
        anatomicalTerms.push(word)
      } else {
        generalTerms.push(word)
      }
    }
  }

  const result = {
    abbreviations: [...new Set(abbreviations)],
    anatomicalTerms: [...new Set(anatomicalTerms)],
    generalTerms: [...new Set(generalTerms)],
    latinTerms: [...new Set(latinTerms)]
  }

  console.log(`🏥 Medical terms extracted:`, result)
  return result
}

// Check if a term is anatomical
function isAnatomicalTerm(word: string): boolean {
  const anatomicalTerms = [
    "myocardium",
    "pericardium",
    "endocardium",
    "ventricle",
    "atrium",
    "aorta",
    "pulmonary",
    "hepatic",
    "renal",
    "cardiac",
    "thoracic",
    "abdominal"
  ]

  return anatomicalTerms.includes(word.toLowerCase())
}

// Calculate medical context confidence
export function calculateMedicalConfidence(text: string): number {
  console.log("🏥 Calculating medical confidence...")

  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  if (words.length === 0) return 0

  const medicalWords = words.filter(word => isMedicalTerm(word))
  const confidence = Math.min(
    medicalWords.length / Math.max(words.length * 0.1, 1),
    1
  )

  console.log(`🏥 Medical confidence: ${(confidence * 100).toFixed(1)}%`)
  return confidence
}

// Logging utility for medical term operations
export function logMedicalTermOperation(operation: string, details?: any) {
  console.log(`🏥 Medical Terms ${operation}:`, details || "")
}
