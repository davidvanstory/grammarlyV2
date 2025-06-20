/*
<ai_context>
Text processing utilities for the Med Writer application.
Handles contentEditable to plain text conversion, text normalization, and medical text processing.
</ai_context>
*/

import {
  TextProcessingResult,
  PositionMapping,
  TextChange,
  MedicalContext
} from "@/types/grammar-types"
import {
  isMedicalTerm,
  MEDICAL_TERMS,
  MEDICAL_PREFIXES,
  MEDICAL_SUFFIXES,
  isLatinMedicalTerm,
  calculateMedicalConfidence,
  extractMedicalTerms
} from "@/lib/medical-terms"

/**
 * Text processor class for handling contentEditable content
 */
export class TextProcessor {
  private static instance: TextProcessor
  private medicalTermsCache = new Set<string>()

  constructor() {
    console.log("📝 Text processor initialized")
    this.initializeMedicalTermsCache()
  }

  static getInstance(): TextProcessor {
    if (!TextProcessor.instance) {
      TextProcessor.instance = new TextProcessor()
    }
    return TextProcessor.instance
  }

  /**
   * Convert contentEditable HTML to plain text with position mapping
   */
  htmlToPlainText(htmlElement: HTMLElement): TextProcessingResult {
    const startTime = performance.now()
    console.log("🔄 Converting HTML to plain text...")

    const result = this.extractTextWithMapping(htmlElement)
    const processingTime = performance.now() - startTime

    console.log(
      `✅ HTML to plain text conversion complete: ${result.plainText.length} chars`
    )
    console.log(`⚡ Processing time: ${processingTime.toFixed(2)}ms`)

    return {
      ...result,
      hasChanges: true // Always true for new processing
    }
  }

  /**
   * Normalize text for consistent processing
   */
  normalizeText(text: string): string {
    console.log("🧹 Normalizing text...")

    // Remove excessive whitespace but preserve medical formatting
    let normalized = text
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\r/g, "\n") // Handle Mac line endings
      .replace(/\t/g, " ") // Convert tabs to spaces
      .replace(/ +/g, " ") // Collapse multiple spaces
      .replace(/\n +/g, "\n") // Remove spaces at start of lines
      .replace(/ +\n/g, "\n") // Remove spaces at end of lines
      .replace(/\n{3,}/g, "\n\n") // Limit consecutive line breaks
      .trim()

    console.log(
      `📏 Text normalized: ${text.length} -> ${normalized.length} chars`
    )
    return normalized
  }

  /**
   * Detect medical context in text
   */
  analyzeMedicalContext(text: string): MedicalContext {
    console.log("🏥 Analyzing medical context...")

    // Use the new medical terms utilities
    const extractedTerms = extractMedicalTerms(text)
    const confidence = calculateMedicalConfidence(text)

    const context: MedicalContext = {
      termsFound: extractedTerms.generalTerms,
      abbreviationsUsed: extractedTerms.abbreviations,
      specialTerms: [
        ...extractedTerms.latinTerms,
        ...extractedTerms.anatomicalTerms
      ],
      confidence
    }

    console.log(
      `🏥 Medical context analysis complete: confidence: ${(confidence * 100).toFixed(1)}%`
    )
    return context
  }

  /**
   * Calculate word and character counts
   */
  getTextStatistics(text: string): {
    wordCount: number
    characterCount: number
    sentenceCount: number
    paragraphCount: number
  } {
    console.log("📊 Calculating text statistics...")

    const words = text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)

    const stats = {
      wordCount: words.length,
      characterCount: text.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length
    }

    console.log(
      `📊 Text statistics: ${stats.wordCount} words, ${stats.characterCount} chars`
    )
    return stats
  }

  /**
   * Clean text for AI processing (remove formatting but preserve medical terms)
   */
  cleanForAI(text: string): string {
    console.log("🤖 Cleaning text for AI processing...")

    // Preserve medical abbreviations and terms while cleaning
    let cleaned = text
      .replace(/\u00A0/g, " ") // Replace non-breaking spaces
      .replace(/[\u2000-\u206F]/g, " ") // Replace various Unicode spaces
      .replace(/[\u2E00-\u2E7F]/g, "") // Remove punctuation supplements
      .normalize("NFKC") // Normalize Unicode

    // Preserve structure important for medical text
    cleaned = this.normalizeText(cleaned)

    console.log(
      `🤖 Text cleaned for AI: ${text.length} -> ${cleaned.length} chars`
    )
    return cleaned
  }

  /**
   * Compare two texts and detect changes
   */
  detectChanges(oldText: string, newText: string): TextChange[] {
    console.log("🔍 Detecting text changes...")

    const changes: TextChange[] = []

    // Simple diff algorithm - can be enhanced with more sophisticated algorithms
    if (oldText === newText) {
      console.log("✅ No changes detected")
      return changes
    }

    // Find the first difference
    let start = 0
    while (
      start < oldText.length &&
      start < newText.length &&
      oldText[start] === newText[start]
    ) {
      start++
    }

    // Find the last difference
    let oldEnd = oldText.length
    let newEnd = newText.length
    while (
      oldEnd > start &&
      newEnd > start &&
      oldText[oldEnd - 1] === newText[newEnd - 1]
    ) {
      oldEnd--
      newEnd--
    }

    if (start < oldEnd || start < newEnd) {
      const changeType: TextChange["type"] =
        oldEnd === start ? "insert" : newEnd === start ? "delete" : "replace"

      changes.push({
        type: changeType,
        start,
        end: oldEnd,
        oldText: oldText.substring(start, oldEnd),
        newText: newText.substring(start, newEnd),
        timestamp: new Date()
      })

      console.log(
        `🔍 Change detected: ${changeType} at position ${start}-${oldEnd}`
      )
    }

    return changes
  }

  // Private helper methods

  private initializeMedicalTermsCache(): void {
    console.log("🏥 Initializing medical terms cache...")

    // Add all medical terms to cache for faster lookup
    MEDICAL_TERMS.forEach(term => {
      this.medicalTermsCache.add(term.toUpperCase())
    })

    // Add medical prefixes and suffixes
    MEDICAL_PREFIXES.forEach(prefix =>
      this.medicalTermsCache.add(prefix.toUpperCase())
    )
    MEDICAL_SUFFIXES.forEach(suffix =>
      this.medicalTermsCache.add(suffix.toUpperCase())
    )

    console.log(
      `🏥 Medical terms cache initialized: ${this.medicalTermsCache.size} terms`
    )
  }

  private extractTextWithMapping(element: HTMLElement): {
    plainText: string
    positionMap: PositionMapping[]
    wordCount: number
    characterCount: number
  } {
    console.log("🔍 Extracting text with position mapping...")

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null
    )

    let plainText = ""
    const positionMap: PositionMapping[] = []
    let domOffset = 0
    let textOffset = 0
    let nodeIndex = 0

    let node = walker.nextNode()
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent || ""

        // Map each character position
        for (let i = 0; i < textContent.length; i++) {
          positionMap.push({
            domOffset: domOffset + i,
            textOffset: textOffset + i,
            nodeIndex,
            nodeType: "text"
          })
        }

        plainText += textContent
        textOffset += textContent.length
        domOffset += textContent.length
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const elementNode = node as HTMLElement

        // Handle block elements and line breaks
        if (this.isBlockElement(elementNode) || elementNode.tagName === "BR") {
          if (plainText.length > 0 && !plainText.endsWith("\n")) {
            positionMap.push({
              domOffset,
              textOffset,
              nodeIndex,
              nodeType: "element"
            })
            plainText += "\n"
            textOffset += 1
          }
        }
      }

      nodeIndex++
      node = walker.nextNode()
    }

    const normalizedText = this.normalizeText(plainText)
    const stats = this.getTextStatistics(normalizedText)

    console.log(
      `🔍 Text extraction complete: ${normalizedText.length} chars, ${positionMap.length} mappings`
    )

    return {
      plainText: normalizedText,
      positionMap,
      wordCount: stats.wordCount,
      characterCount: stats.characterCount
    }
  }

  private isBlockElement(element: HTMLElement): boolean {
    const blockElements = [
      "DIV",
      "P",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "LI",
      "UL",
      "OL",
      "BLOCKQUOTE"
    ]
    return blockElements.includes(element.tagName)
  }
}

/**
 * Utility functions for text processing
 */

export function getTextProcessor(): TextProcessor {
  return TextProcessor.getInstance()
}

export function processContentEditable(
  element: HTMLElement
): TextProcessingResult {
  console.log("📝 Processing contentEditable element...")
  const processor = getTextProcessor()
  return processor.htmlToPlainText(element)
}

export function normalizeTextForProcessing(text: string): string {
  console.log("🧹 Normalizing text for processing...")
  const processor = getTextProcessor()
  return processor.normalizeText(text)
}

export function detectMedicalContext(text: string): MedicalContext {
  console.log("🏥 Detecting medical context...")
  const processor = getTextProcessor()
  return processor.analyzeMedicalContext(text)
}

export function getTextStats(text: string) {
  console.log("📊 Getting text statistics...")
  const processor = getTextProcessor()
  return processor.getTextStatistics(text)
}
