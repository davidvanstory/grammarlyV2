/*
<ai_context>
Position tracking utilities for the Med Writer application.
Implements mathematical position calculation, DOM to text mapping, and cursor position management.
</ai_context>
*/

import {
  TextPosition,
  PositionMapping,
  CursorPosition,
  TrackedError,
  PositionCalculation,
  PositionValidation,
  TextChange,
  PerformanceMetrics
} from "@/types/grammar-types"

/**
 * Core position tracker class for managing text positions in contentEditable elements
 */
export class PositionTracker {
  private element: HTMLElement
  private lastTextContent: string = ""
  private positionMap: PositionMapping[] = []
  private performanceMetrics: PerformanceMetrics = {
    positionCalculationTime: 0,
    textProcessingTime: 0,
    errorHighlightingTime: 0,
    totalOperationTime: 0,
    errorsProcessed: 0,
    textLength: 0
  }

  constructor(element: HTMLElement) {
    this.element = element
    this.updatePositionMap()
    console.log("🎯 Position tracker initialized for element:", element.tagName)
  }

  /**
   * Extract plain text from contentEditable while maintaining position mapping
   */
  extractPlainText(): { text: string; positionMap: PositionMapping[] } {
    const startTime = performance.now()
    console.log("🔍 Extracting plain text from contentEditable...")

    const walker = document.createTreeWalker(
      this.element,
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
        console.log(
          `📝 Processing text node ${nodeIndex}: "${textContent.substring(0, 50)}..."`
        )

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
        const element = node as HTMLElement
        console.log(
          `🏷️ Processing element node ${nodeIndex}: ${element.tagName}`
        )

        // Handle line breaks and block elements
        if (this.isBlockElement(element) || element.tagName === "BR") {
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

    this.positionMap = positionMap
    this.lastTextContent = plainText
    this.performanceMetrics.textProcessingTime = performance.now() - startTime
    this.performanceMetrics.textLength = plainText.length

    console.log(
      `✅ Plain text extracted: ${plainText.length} chars, ${positionMap.length} mappings`
    )
    console.log(
      `⚡ Processing time: ${this.performanceMetrics.textProcessingTime.toFixed(2)}ms`
    )

    return { text: plainText, positionMap }
  }

  /**
   * Get current cursor position in the contentEditable element
   */
  getCursorPosition(): CursorPosition {
    console.log("📍 Getting cursor position...")
    const selection = window.getSelection()

    if (!selection || selection.rangeCount === 0) {
      console.log("❌ No selection found")
      return { offset: 0, node: null, nodeOffset: 0, isAtEnd: false }
    }

    const range = selection.getRangeAt(0)
    const cursorOffset = this.getTextOffsetFromDOMPosition(
      range.startContainer,
      range.startOffset
    )

    const cursorPosition: CursorPosition = {
      offset: cursorOffset,
      node: range.startContainer,
      nodeOffset: range.startOffset,
      isAtEnd: cursorOffset === this.lastTextContent.length
    }

    console.log(
      `📍 Cursor position: offset ${cursorOffset}, node offset ${range.startOffset}`
    )
    return cursorPosition
  }

  /**
   * Set cursor position in the contentEditable element
   */
  setCursorPosition(offset: number): boolean {
    console.log(`📍 Setting cursor position to offset: ${offset}`)

    try {
      const domPosition = this.getDOMPositionFromTextOffset(offset)
      if (!domPosition) {
        console.error("❌ Could not find DOM position for offset:", offset)
        return false
      }

      const selection = window.getSelection()
      if (!selection) {
        console.error("❌ No selection available")
        return false
      }

      const range = document.createRange()
      range.setStart(domPosition.node, domPosition.offset)
      range.setEnd(domPosition.node, domPosition.offset)

      selection.removeAllRanges()
      selection.addRange(range)

      console.log(`✅ Cursor position set successfully`)
      return true
    } catch (error) {
      console.error("❌ Error setting cursor position:", error)
      return false
    }
  }

  /**
   * Calculate new positions after text changes
   */
  calculatePositionUpdates(
    textChange: TextChange,
    existingErrors: TrackedError[]
  ): PositionCalculation {
    const startTime = performance.now()
    console.log(
      "🧮 Calculating position updates for text change:",
      textChange.type
    )

    const adjustedErrors: TrackedError[] = []
    const invalidatedErrors: string[] = []
    const newPositions: TextPosition[] = []

    const changeStart = textChange.start
    const changeEnd = textChange.end
    const lengthDiff = textChange.newText.length - textChange.oldText.length

    console.log(
      `📊 Change details: start=${changeStart}, end=${changeEnd}, lengthDiff=${lengthDiff}`
    )

    for (const error of existingErrors) {
      const errorStart = error.currentPosition.start
      const errorEnd = error.currentPosition.end

      console.log(
        `🔍 Processing error ${error.id}: pos=${errorStart}-${errorEnd}`
      )

      // Error is completely before the change - no adjustment needed
      if (errorEnd < changeStart) {
        console.log(`➡️ Error ${error.id}: before change, no adjustment`)
        adjustedErrors.push(error)
        continue
      }

      // Error is completely after the change - adjust by length difference
      if (errorStart > changeEnd) {
        console.log(
          `➡️ Error ${error.id}: after change, adjusting by ${lengthDiff}`
        )
        const adjustedError = {
          ...error,
          currentPosition: {
            start: errorStart + lengthDiff,
            end: errorEnd + lengthDiff
          }
        }
        adjustedErrors.push(adjustedError)
        continue
      }

      // Error overlaps with the change - may need invalidation
      if (this.errorOverlapsChange(error, textChange)) {
        console.log(`❌ Error ${error.id}: overlaps with change, invalidating`)
        invalidatedErrors.push(error.id)
        continue
      }

      // Error is partially affected - complex adjustment needed
      console.log(`🔧 Error ${error.id}: partial adjustment needed`)
      const adjustedError = this.adjustErrorPosition(
        error,
        textChange,
        lengthDiff
      )
      if (adjustedError) {
        adjustedErrors.push(adjustedError)
      } else {
        invalidatedErrors.push(error.id)
      }
    }

    const recalculationNeeded =
      invalidatedErrors.length > 0 ||
      Math.abs(lengthDiff) > 50 ||
      adjustedErrors.length > 10

    this.performanceMetrics.positionCalculationTime =
      performance.now() - startTime
    this.performanceMetrics.errorsProcessed = existingErrors.length

    console.log(
      `✅ Position calculation complete: ${adjustedErrors.length} adjusted, ${invalidatedErrors.length} invalidated`
    )
    console.log(
      `⚡ Calculation time: ${this.performanceMetrics.positionCalculationTime.toFixed(2)}ms`
    )

    return {
      newPositions,
      adjustedErrors,
      invalidatedErrors,
      recalculationNeeded
    }
  }

  /**
   * Validate that AI-provided positions match actual text
   */
  validateErrorPosition(
    error: { start: number; end: number; original: string },
    text: string
  ): PositionValidation {
    console.log(`🔍 Validating error position: ${error.start}-${error.end}`)

    if (
      error.start < 0 ||
      error.end > text.length ||
      error.start >= error.end
    ) {
      console.log(
        `❌ Invalid position bounds: start=${error.start}, end=${error.end}, textLength=${text.length}`
      )
      return {
        isValid: false,
        actualText: "",
        expectedText: error.original,
        error: "Position out of bounds"
      }
    }

    const actualText = text.substring(error.start, error.end)
    const isValid = actualText === error.original

    if (!isValid) {
      console.log(
        `❌ Text mismatch: expected="${error.original}", actual="${actualText}"`
      )

      // Try to find the correct position nearby
      const adjustedPosition = this.findNearbyMatch(
        error.original,
        text,
        error.start
      )

      return {
        isValid: false,
        actualText,
        expectedText: error.original,
        adjustedPosition,
        error: `Text mismatch: expected "${error.original}", found "${actualText}"`
      }
    }

    console.log(`✅ Position validation successful`)
    return {
      isValid: true,
      actualText,
      expectedText: error.original
    }
  }

  /**
   * Update the internal position mapping
   */
  updatePositionMap(): void {
    console.log("🔄 Updating position map...")
    const { positionMap } = this.extractPlainText()
    this.positionMap = positionMap
    console.log(`✅ Position map updated: ${positionMap.length} mappings`)
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  // Private helper methods

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
      "OL"
    ]
    return blockElements.includes(element.tagName)
  }

  private getTextOffsetFromDOMPosition(node: Node, offset: number): number {
    console.log(
      `🔍 Converting DOM position to text offset: node=${node.nodeName}, offset=${offset}`
    )

    const walker = document.createTreeWalker(
      this.element,
      NodeFilter.SHOW_TEXT,
      null
    )

    let textOffset = 0
    let currentNode = walker.nextNode()

    while (currentNode) {
      if (currentNode === node) {
        return textOffset + offset
      }
      textOffset += currentNode.textContent?.length || 0
      currentNode = walker.nextNode()
    }

    console.log(`📍 Text offset found: ${textOffset}`)
    return textOffset
  }

  private getDOMPositionFromTextOffset(
    textOffset: number
  ): { node: Node; offset: number } | null {
    console.log(`🔍 Converting text offset to DOM position: ${textOffset}`)

    const walker = document.createTreeWalker(
      this.element,
      NodeFilter.SHOW_TEXT,
      null
    )

    let currentOffset = 0
    let node = walker.nextNode()

    while (node) {
      const nodeLength = node.textContent?.length || 0

      if (currentOffset + nodeLength >= textOffset) {
        const nodeOffset = textOffset - currentOffset
        console.log(
          `📍 DOM position found: node=${node.nodeName}, offset=${nodeOffset}`
        )
        return { node, offset: nodeOffset }
      }

      currentOffset += nodeLength
      node = walker.nextNode()
    }

    console.log(`❌ Could not find DOM position for text offset: ${textOffset}`)
    return null
  }

  private errorOverlapsChange(
    error: TrackedError,
    change: TextChange
  ): boolean {
    const errorStart = error.currentPosition.start
    const errorEnd = error.currentPosition.end
    const changeStart = change.start
    const changeEnd = change.end

    return !(errorEnd <= changeStart || errorStart >= changeEnd)
  }

  private adjustErrorPosition(
    error: TrackedError,
    change: TextChange,
    lengthDiff: number
  ): TrackedError | null {
    // Complex position adjustment logic for partially affected errors
    // This is a simplified version - in practice, this would be more sophisticated

    const errorStart = error.currentPosition.start
    const errorEnd = error.currentPosition.end

    // If error starts after change start, adjust both start and end
    if (errorStart >= change.start) {
      return {
        ...error,
        currentPosition: {
          start: errorStart + lengthDiff,
          end: errorEnd + lengthDiff
        }
      }
    }

    // If error ends before change end, only adjust end if necessary
    if (errorEnd <= change.end) {
      return {
        ...error,
        currentPosition: {
          start: errorStart,
          end: errorEnd + lengthDiff
        }
      }
    }

    // Complex overlap - invalidate for safety
    return null
  }

  private findNearbyMatch(
    searchText: string,
    fullText: string,
    startPosition: number,
    searchRadius: number = 50
  ): TextPosition | undefined {
    console.log(`🔍 Searching for nearby match: "${searchText}"`)

    const searchStart = Math.max(0, startPosition - searchRadius)
    const searchEnd = Math.min(
      fullText.length,
      startPosition + searchRadius + searchText.length
    )
    const searchArea = fullText.substring(searchStart, searchEnd)

    const foundIndex = searchArea.indexOf(searchText)
    if (foundIndex !== -1) {
      const actualStart = searchStart + foundIndex
      const actualEnd = actualStart + searchText.length

      console.log(
        `✅ Found nearby match at position: ${actualStart}-${actualEnd}`
      )
      return { start: actualStart, end: actualEnd }
    }

    console.log(`❌ No nearby match found`)
    return undefined
  }
}

/**
 * Utility functions for position tracking
 */

export function createPositionTracker(element: HTMLElement): PositionTracker {
  console.log("🎯 Creating position tracker for element")
  return new PositionTracker(element)
}

export function calculateTextChange(
  oldText: string,
  newText: string,
  cursorPosition?: number
): TextChange {
  console.log("📊 Calculating text change...")
  console.log(
    `📝 Old text length: ${oldText.length}, New text length: ${newText.length}`
  )

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

  const changeType: TextChange["type"] =
    oldEnd === start ? "insert" : newEnd === start ? "delete" : "replace"

  const textChange: TextChange = {
    type: changeType,
    start,
    end: oldEnd,
    oldText: oldText.substring(start, oldEnd),
    newText: newText.substring(start, newEnd),
    timestamp: new Date()
  }

  console.log(`📊 Text change detected: ${changeType} at ${start}-${oldEnd}`)
  return textChange
}

export function isPositionValid(
  position: TextPosition,
  textLength: number
): boolean {
  return (
    position.start >= 0 &&
    position.end <= textLength &&
    position.start < position.end
  )
}

export function normalizePosition(
  position: TextPosition,
  textLength: number
): TextPosition {
  return {
    start: Math.max(0, Math.min(position.start, textLength)),
    end: Math.max(position.start, Math.min(position.end, textLength))
  }
}
