/*
<ai_context>
Readability calculation utilities for the Med Writer application.
Implements Flesch reading-ease algorithm to help medical students write more clearly.
</ai_context>
*/

/**
 * Calculate the Flesch reading-ease score for given text
 * Formula: 206.835 - (1.015 × ASL) - (84.6 × ASW)
 * Where ASL = average sentence length, ASW = average syllables per word
 */
export function calculateFleschScore(text: string): number {
  console.log("Calculating Flesch score for text length:", text.length)

  if (!text.trim()) {
    console.log("Empty text, returning score 0")
    return 0
  }

  const sentences = countSentences(text)
  const words = countWords(text)
  const syllables = countSyllables(text)

  console.log(
    "Text stats - Words:",
    words,
    "Sentences:",
    sentences,
    "Syllables:",
    syllables
  )

  if (sentences === 0 || words === 0) {
    console.log("Invalid text structure, returning score 0")
    return 0
  }

  const averageSentenceLength = words / sentences
  const averageSyllablesPerWord = syllables / words

  const score =
    206.835 - 1.015 * averageSentenceLength - 84.6 * averageSyllablesPerWord

  console.log(
    "Readability calculation - ASL:",
    averageSentenceLength,
    "ASW:",
    averageSyllablesPerWord,
    "Score:",
    score
  )

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10))
}

/**
 * Get human-readable rating for Flesch score
 */
export function getFleschRating(score: number): string {
  if (score >= 90) return "Very Easy"
  if (score >= 80) return "Easy"
  if (score >= 70) return "Fairly Easy"
  if (score >= 60) return "Standard"
  if (score >= 50) return "Fairly Difficult"
  if (score >= 30) return "Difficult"
  return "Very Difficult"
}

/**
 * Count sentences in text
 */
function countSentences(text: string): number {
  // Split by sentence-ending punctuation
  const sentences = text
    .split(/[.!?]+/)
    .filter(sentence => sentence.trim().length > 0)
  const count = Math.max(1, sentences.length) // Minimum 1 sentence
  console.log("Sentence count:", count)
  return count
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
  const count = words.length
  console.log("Word count:", count)
  return count
}

/**
 * Count syllables in text using heuristic approach
 */
function countSyllables(text: string): number {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 0)
  let totalSyllables = 0

  for (const word of words) {
    totalSyllables += countSyllablesInWord(word)
  }

  console.log("Total syllables:", totalSyllables)
  return Math.max(1, totalSyllables) // Minimum 1 syllable
}

/**
 * Count syllables in a single word using heuristic rules
 */
function countSyllablesInWord(word: string): number {
  // Remove punctuation and convert to lowercase
  const cleanWord = word.replace(/[^a-z]/gi, "").toLowerCase()

  if (cleanWord.length === 0) return 0
  if (cleanWord.length === 1) return 1

  let syllables = 0
  let previousWasVowel = false

  // Count vowel groups
  for (let i = 0; i < cleanWord.length; i++) {
    const isVowel = "aeiouy".includes(cleanWord[i])

    if (isVowel && !previousWasVowel) {
      syllables++
    }

    previousWasVowel = isVowel
  }

  // Handle special cases
  if (cleanWord.endsWith("e") && syllables > 1) {
    syllables-- // Silent e
  }

  if (
    cleanWord.endsWith("le") &&
    syllables > 1 &&
    !"aeiou".includes(cleanWord[cleanWord.length - 3])
  ) {
    syllables++ // Words ending in consonant + le (like "table")
  }

  // Ensure minimum of 1 syllable per word
  return Math.max(1, syllables)
}
