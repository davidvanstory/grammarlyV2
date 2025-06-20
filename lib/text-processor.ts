/*
<ai_context>
Text processing utilities for the Med Writer application.
Handles contentEditable to plain text conversion, text normalization, and text processing.
</ai_context>
*/

import {
  TextProcessingResult,
  PositionMapping,
  TextChange,
  TextChunk
} from "@/types/grammar-types"

/**
 * Text processor class for handling contentEditable content
 */
export class TextProcessor {
  private static instance: TextProcessor

  constructor() {
    console.log("📝 Text processor initialized")
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

    // Remove excessive whitespace but preserve formatting
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
   * Clean text for AI processing (remove formatting)
   */
  cleanForAI(text: string): string {
    console.log("🤖 Cleaning text for AI processing...")

    // Clean and normalize text
    let cleaned = text
      .replace(/\u00A0/g, " ") // Replace non-breaking spaces
      .replace(/[\u2000-\u206F]/g, " ") // Replace various Unicode spaces
      .replace(/[\u2E00-\u2E7F]/g, "") // Remove punctuation supplements
      .normalize("NFKC") // Normalize Unicode

    // Preserve structure
    cleaned = this.normalizeText(cleaned)

    console.log(
      `🤖 Text cleaned for AI: ${text.length} -> ${cleaned.length} chars`
    )
    return cleaned
  }

  /**
   * Split text into sentence-based chunks for parallel processing
   */
  chunkTextBySentences(text: string, maxChunkSize: number = 500): TextChunk[] {
    console.log(
      `📦 Chunking text by sentences (${text.length} chars, max chunk: ${maxChunkSize})`
    )

    const chunks: TextChunk[] = []

    // First, split by sentences using multiple delimiters
    const sentencePattern = /([.!?]+)\s+/g
    const sentences: Array<{
      text: string
      startOffset: number
      endOffset: number
    }> = []

    let lastIndex = 0
    let match

    // Extract sentences with their positions
    while ((match = sentencePattern.exec(text)) !== null) {
      const sentenceText = text
        .substring(lastIndex, match.index + match[0].length)
        .trim()
      if (sentenceText.length > 0) {
        sentences.push({
          text: sentenceText,
          startOffset: lastIndex,
          endOffset: match.index + match[0].length
        })
      }
      lastIndex = match.index + match[0].length
    }

    // Add remaining text as final sentence
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex).trim()
      if (remainingText.length > 0) {
        sentences.push({
          text: remainingText,
          startOffset: lastIndex,
          endOffset: text.length
        })
      }
    }

    console.log(`📝 Extracted ${sentences.length} sentences`)

    // Group sentences into chunks
    let currentChunk = ""
    let currentStartOffset = 0
    let currentSentenceCount = 0
    let chunkIndex = 0

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      const potentialChunk =
        currentChunk + (currentChunk ? " " : "") + sentence.text

      // Check if adding this sentence would exceed the chunk size
      if (potentialChunk.length > maxChunkSize && currentChunk.length > 0) {
        // Create chunk with current sentences
        chunks.push({
          id: `chunk_${chunkIndex++}_${Date.now()}`,
          text: currentChunk.trim(),
          startOffset: currentStartOffset,
          endOffset: sentences[i - 1].endOffset,
          sentenceCount: currentSentenceCount,
          isComplete: true
        })

        console.log(
          `📦 Created chunk ${chunks.length}: ${currentChunk.length} chars, ${currentSentenceCount} sentences`
        )

        // Start new chunk with current sentence
        currentChunk = sentence.text
        currentStartOffset = sentence.startOffset
        currentSentenceCount = 1
      } else {
        // Add sentence to current chunk
        if (currentChunk === "") {
          currentStartOffset = sentence.startOffset
        }
        currentChunk = potentialChunk
        currentSentenceCount++
      }
    }

    // Add final chunk if there's remaining content
    if (currentChunk.length > 0) {
      chunks.push({
        id: `chunk_${chunkIndex++}_${Date.now()}`,
        text: currentChunk.trim(),
        startOffset: currentStartOffset,
        endOffset: text.length,
        sentenceCount: currentSentenceCount,
        isComplete: true
      })

      console.log(
        `📦 Created final chunk ${chunks.length}: ${currentChunk.length} chars, ${currentSentenceCount} sentences`
      )
    }

    console.log(`✅ Text chunking complete: ${chunks.length} chunks created`)

    // Log chunk summary
    chunks.forEach((chunk, index) => {
      console.log(
        `  Chunk ${index + 1}: ${chunk.text.length} chars, ${chunk.sentenceCount} sentences, "${chunk.text.substring(0, 50)}..."`
      )
    })

    return chunks
  }

  /**
   * Detect if text ends with a complete sentence
   */
  endsWithCompleteSentence(text: string): boolean {
    const trimmed = text.trim()
    if (trimmed.length === 0) return false

    const lastChar = trimmed[trimmed.length - 1]
    const isComplete = /[.!?]/.test(lastChar)

    console.log(
      `📝 Text ends with complete sentence: ${isComplete} (last char: "${lastChar}")`
    )
    return isComplete
  }

  /**
   * Get the last incomplete sentence from text
   */
  getLastIncompleteSentence(text: string): string {
    const trimmed = text.trim()
    if (this.endsWithCompleteSentence(trimmed)) {
      return ""
    }

    // Find the last sentence boundary
    const sentencePattern = /[.!?]\s+/g
    let lastSentenceEnd = 0
    let match

    while ((match = sentencePattern.exec(trimmed)) !== null) {
      lastSentenceEnd = match.index + match[0].length
    }

    const incompleteSentence = trimmed.substring(lastSentenceEnd).trim()
    console.log(`📝 Last incomplete sentence: "${incompleteSentence}"`)

    return incompleteSentence
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

    // Create change record
    const change: TextChange = {
      type:
        oldEnd === start ? "insert" : newEnd === start ? "delete" : "replace",
      start,
      end: oldEnd,
      oldText: oldText.substring(start, oldEnd),
      newText: newText.substring(start, newEnd),
      timestamp: new Date()
    }

    changes.push(change)
    console.log(`📝 Detected ${change.type} change at position ${start}`)

    return changes
  }

  /**
   * Extract text with position mapping from DOM element
   */
  private extractTextWithMapping(element: HTMLElement): {
    plainText: string
    positionMap: PositionMapping[]
    wordCount: number
    characterCount: number
  } {
    console.log("🔍 Extracting text with position mapping...")

    const positionMap: PositionMapping[] = []
    let plainText = ""
    let nodeIndex = 0

    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent || ""
        const startOffset = plainText.length

        positionMap.push({
          domOffset: startOffset,
          textOffset: startOffset,
          nodeIndex: nodeIndex++,
          nodeType: "text"
        })

        plainText += textContent
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement

        // Add space for block elements
        if (
          this.isBlockElement(element) &&
          plainText.length > 0 &&
          !plainText.endsWith("\n")
        ) {
          plainText += "\n"
        }

        positionMap.push({
          domOffset: plainText.length,
          textOffset: plainText.length,
          nodeIndex: nodeIndex++,
          nodeType: "element"
        })

        // Process child nodes
        for (const child of Array.from(node.childNodes)) {
          processNode(child)
        }

        // Add line break after block elements
        if (this.isBlockElement(element) && !plainText.endsWith("\n")) {
          plainText += "\n"
        }
      }
    }

    processNode(element)

    // Clean up trailing whitespace
    plainText = plainText.trim()

    const stats = this.getTextStatistics(plainText)

    console.log(
      `✅ Text extraction complete: ${stats.wordCount} words, ${positionMap.length} position mappings`
    )

    return {
      plainText,
      positionMap,
      wordCount: stats.wordCount,
      characterCount: stats.characterCount
    }
  }

  /**
   * Check if element is a block-level element
   */
  private isBlockElement(element: HTMLElement): boolean {
    const blockElements = new Set([
      "DIV",
      "P",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "SECTION",
      "ARTICLE",
      "ASIDE",
      "HEADER",
      "FOOTER",
      "MAIN",
      "NAV",
      "BLOCKQUOTE",
      "PRE",
      "UL",
      "OL",
      "LI"
    ])

    return blockElements.has(element.tagName.toUpperCase())
  }
}

// Export singleton instance
export function getTextProcessor(): TextProcessor {
  return TextProcessor.getInstance()
}

// Convenience functions
export function processContentEditable(
  element: HTMLElement
): TextProcessingResult {
  const processor = getTextProcessor()
  return processor.htmlToPlainText(element)
}

export function normalizeTextForProcessing(text: string): string {
  const processor = getTextProcessor()
  return processor.normalizeText(text)
}

export function getTextStats(text: string) {
  const processor = getTextProcessor()
  return processor.getTextStatistics(text)
}
