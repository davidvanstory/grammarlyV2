"use client"

/*
<ai_context>
Error highlighting component for the Med Writer application.
Implements DOM-based error highlighting with color-coded error types and interactive tooltips.
Enhanced with improved cross-node highlighting and position mapping accuracy.
</ai_context>
*/

import { useCallback, useEffect, useRef } from "react"
import {
  TrackedError,
  ErrorType,
  HighlightConfig,
  ErrorSpanAttributes,
  PerformanceMetrics
} from "@/types/grammar-types"
import { getTextProcessor } from "@/lib/text-processor"

interface ErrorHighlightProps {
  errors: TrackedError[]
  containerRef: React.RefObject<HTMLElement>
  onErrorClick?: (error: TrackedError) => void
  onErrorHover?: (error: TrackedError | null) => void
  className?: string
}

// Error highlighting configuration
const HIGHLIGHT_CONFIGS: Record<ErrorType, HighlightConfig> = {
  spelling: {
    errorType: "spelling",
    className: "error-highlight-spelling",
    color: "#ef4444", // red-500
    underlineStyle: "wavy"
  },
  grammar: {
    errorType: "grammar",
    className: "error-highlight-grammar",
    color: "#3b82f6", // blue-500
    underlineStyle: "solid"
  },
  style: {
    errorType: "style",
    className: "error-highlight-style",
    color: "#f97316", // orange-500
    underlineStyle: "dotted"
  }
}

export default function ErrorHighlight({
  errors,
  containerRef,
  onErrorClick,
  onErrorHover,
  className = ""
}: ErrorHighlightProps) {
  const highlightedErrors = useRef<Set<string>>(new Set())
  const performanceMetrics = useRef<PerformanceMetrics>({
    positionCalculationTime: 0,
    textProcessingTime: 0,
    errorHighlightingTime: 0,
    totalOperationTime: 0,
    errorsProcessed: 0,
    textLength: 0
  })

  console.log(
    "🎨 Error highlight component rendered with",
    errors.length,
    "errors"
  )

  /**
   * Apply error highlights to the DOM using consistent text processing
   */
  const applyHighlights = useCallback(() => {
    if (!containerRef.current) {
      console.log("❌ No container reference for highlighting")
      return
    }

    const startTime = performance.now()
    console.log("🎨 Applying error highlights with enhanced algorithm...")

    // Clear existing highlights first
    clearHighlights()

    const validErrors = errors.filter(
      error =>
        error.status === "pending" &&
        error.currentPosition.start < error.currentPosition.end
    )

    console.log(
      `🎨 Processing ${validErrors.length} valid errors for highlighting`
    )

    // Use consistent text processing for position mapping
    const textProcessor = getTextProcessor()
    const textResult = textProcessor.htmlToPlainText(containerRef.current)
    const { plainText } = textResult

    console.log(
      `📝 Extracted plain text: ${plainText.length} chars for highlighting`
    )

    // Sort errors by position to avoid conflicts
    const sortedErrors = [...validErrors].sort(
      (a, b) => a.currentPosition.start - b.currentPosition.start
    )

    let highlightsApplied = 0

    for (const error of sortedErrors) {
      try {
        const success = applyErrorHighlightWithValidation(error, plainText)
        if (success) {
          highlightsApplied++
          highlightedErrors.current.add(error.id)
        }
      } catch (highlightError) {
        console.error(
          `❌ Error highlighting error ${error.id}:`,
          highlightError
        )
      }
    }

    const processingTime = performance.now() - startTime
    performanceMetrics.current.errorHighlightingTime = processingTime
    performanceMetrics.current.errorsProcessed = validErrors.length
    performanceMetrics.current.textLength = plainText.length

    console.log(
      `✅ Applied ${highlightsApplied}/${validErrors.length} error highlights`
    )
    console.log(`⚡ Highlighting time: ${processingTime.toFixed(2)}ms`)
  }, [errors, containerRef])

  /**
   * Clear all error highlights from the DOM
   */
  const clearHighlights = useCallback(() => {
    if (!containerRef.current) return

    console.log("🧹 Clearing existing error highlights...")

    const existingHighlights =
      containerRef.current.querySelectorAll("[data-error-id]")
    let clearedCount = 0

    existingHighlights.forEach(highlight => {
      try {
        const parent = highlight.parentNode
        if (parent) {
          // Replace the highlight span with its text content
          const textNode = document.createTextNode(highlight.textContent || "")
          parent.replaceChild(textNode, highlight)
          clearedCount++
        }
      } catch (error) {
        console.error("❌ Error clearing highlight:", error)
      }
    })

    // Normalize the text content to merge adjacent text nodes
    if (containerRef.current) {
      containerRef.current.normalize()
    }

    highlightedErrors.current.clear()
    console.log(`🧹 Cleared ${clearedCount} error highlights`)
  }, [containerRef])

  /**
   * Apply highlight for a single error with enhanced validation
   */
  const applyErrorHighlightWithValidation = useCallback(
    (error: TrackedError, plainText: string): boolean => {
      if (!containerRef.current) return false

      console.log(
        `🎨 Applying highlight for error ${error.id}: ${error.currentPosition.start}-${error.currentPosition.end}`
      )

      // Validate error position against current text
      const { start, end } = error.currentPosition
      if (start < 0 || end > plainText.length || start >= end) {
        console.log(
          `❌ Invalid error position: ${start}-${end} for text length ${plainText.length}`
        )
        return false
      }

      // Verify the text matches what we expect
      const expectedText = plainText.substring(start, end)
      if (expectedText !== error.original) {
        console.log(
          `❌ Text mismatch for error ${error.id}: expected "${error.original}", found "${expectedText}"`
        )

        // Try to find the correct position
        const correctedPosition = findCorrectPosition(
          plainText,
          error.original,
          start
        )
        if (correctedPosition) {
          console.log(`🔧 Found corrected position for error ${error.id}`)
          return highlightTextRangeEnhanced(
            containerRef.current,
            correctedPosition.start,
            correctedPosition.end,
            error
          )
        }
        return false
      }

      // Apply highlight using enhanced algorithm
      try {
        const success = highlightTextRangeEnhanced(
          containerRef.current,
          start,
          end,
          error
        )
        if (success) {
          console.log(`✅ Successfully highlighted error ${error.id}`)
        }
        return success
      } catch (highlightError) {
        console.error(
          `❌ Error applying highlight for ${error.id}:`,
          highlightError
        )
        return false
      }
    },
    [containerRef]
  )

  /**
   * Handle error click events
   */
  const handleErrorClick = useCallback(
    (event: Event) => {
      const target = event.target as HTMLElement
      const errorId = target.getAttribute("data-error-id")

      if (errorId && onErrorClick) {
        const error = errors.find(e => e.id === errorId)
        if (error) {
          console.log(`🖱️ Error clicked: ${errorId}`)
          onErrorClick(error)
        }
      }
    },
    [errors, onErrorClick]
  )

  /**
   * Handle error hover events
   */
  const handleErrorHover = useCallback(
    (event: Event) => {
      const target = event.target as HTMLElement
      const errorId = target.getAttribute("data-error-id")

      if (onErrorHover) {
        if (errorId) {
          const error = errors.find(e => e.id === errorId)
          if (error) {
            console.log(`🖱️ Error hovered: ${errorId}`)
            onErrorHover(error)
          }
        } else {
          onErrorHover(null)
        }
      }
    },
    [errors, onErrorHover]
  )

  // Apply highlights when errors change
  useEffect(() => {
    console.log("🔄 Errors changed, reapplying highlights...")
    applyHighlights()
  }, [applyHighlights])

  // Set up event listeners for error interactions
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Add click listeners for error interactions
    container.addEventListener("click", handleErrorClick)
    container.addEventListener("mouseenter", handleErrorHover, true)
    container.addEventListener("mouseleave", handleErrorHover, true)

    return () => {
      container.removeEventListener("click", handleErrorClick)
      container.removeEventListener("mouseenter", handleErrorHover, true)
      container.removeEventListener("mouseleave", handleErrorHover, true)
    }
  }, [containerRef, handleErrorClick, handleErrorHover])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up error highlights on unmount")
      clearHighlights()
    }
  }, [clearHighlights])

  // This component doesn't render anything directly - it manipulates the DOM
  return (
    <style>{`
      .error-highlight-spelling {
        background-color: rgba(239, 68, 68, 0.1);
        border-bottom: 2px wavy #ef4444;
        cursor: pointer;
        position: relative;
      }
      
      .error-highlight-grammar {
        background-color: rgba(59, 130, 246, 0.1);
        border-bottom: 2px solid #3b82f6;
        cursor: pointer;
        position: relative;
      }
      
      .error-highlight-style {
        background-color: rgba(249, 115, 22, 0.1);
        border-bottom: 2px dotted #f97316;
        cursor: pointer;
        position: relative;
      }
      
      .error-highlight-spelling:hover,
      .error-highlight-grammar:hover,
      .error-highlight-style:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      .error-highlight-spelling::after,
      .error-highlight-grammar::after,
      .error-highlight-style::after {
        content: attr(title);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #1f2937;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
        z-index: 1000;
      }
      
      .error-highlight-spelling:hover::after,
      .error-highlight-grammar:hover::after,
      .error-highlight-style:hover::after {
        opacity: 1;
      }
    `}</style>
  )
}

/**
 * Enhanced helper function to highlight a text range in the DOM with cross-node support
 * Implements the improved algorithm from highlighting.md
 */
function highlightTextRangeEnhanced(
  container: HTMLElement,
  start: number,
  end: number,
  error: TrackedError
): boolean {
  console.log(`🎨 Enhanced highlighting text range: ${start}-${end}`)

  let currentPlainTextOffset = 0
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  )
  let node
  let success = false

  const nodesToWrap: Array<{
    textNode: Text
    startInNode: number
    endInNode: number
  }> = []

  while ((node = walker.nextNode() as Text | null)) {
    const nodeText = node.textContent || ""
    const nodeLength = nodeText.length

    if (currentPlainTextOffset + nodeLength <= start) {
      // Node is entirely before the error
      currentPlainTextOffset += nodeLength
      continue
    }

    // At this point, the error starts in or before this node,
    // or this node is part of an ongoing error span.
    const errorStartInThisNode = Math.max(0, start - currentPlainTextOffset)
    const errorEndInThisNode = Math.min(
      nodeLength,
      end - currentPlainTextOffset
    )

    if (errorStartInThisNode < errorEndInThisNode) {
      // There's something to highlight in this node
      nodesToWrap.push({
        textNode: node,
        startInNode: errorStartInThisNode,
        endInNode: errorEndInThisNode
      })
      success = true // Mark that we found at least one segment
    }

    currentPlainTextOffset += nodeLength
    if (currentPlainTextOffset >= end) {
      // We've passed the end of the error
      break
    }
  }

  if (!success) {
    console.warn(
      `Could not find DOM range for error ID ${error.id}: "${error.original}" at ${start}-${end}`
    )

    // Optional: Fallback validation with container text
    const extractedText = container.innerText.substring(start, end)
    if (extractedText !== error.original) {
      console.warn(
        `Text mismatch: Expected "${error.original}", Got "${extractedText}"`
      )
    }
    return false
  }

  // Wrap identified segments. Iterate in reverse to avoid issues with node splitting.
  for (let i = nodesToWrap.length - 1; i >= 0; i--) {
    const { textNode, startInNode, endInNode } = nodesToWrap[i]
    const wrapSuccess = wrapTextInSpanEnhanced(
      textNode,
      startInNode,
      endInNode,
      error
    )
    if (!wrapSuccess) {
      console.error(`❌ Failed to wrap text segment ${i} for error ${error.id}`)
      // Continue with other segments even if one fails
    }
  }

  return success
}

/**
 * Enhanced helper function to wrap text in a highlight span with config support
 */
function wrapTextInSpanEnhanced(
  textNode: Node,
  start: number,
  end: number,
  error: TrackedError
): boolean {
  if (!textNode.textContent || start >= end) return false

  console.log(
    `🎨 Enhanced wrapping text in span: "${textNode.textContent.substring(start, end)}"`
  )

  try {
    const parent = textNode.parentNode
    if (!parent) return false

    const textContent = textNode.textContent
    const beforeText = textContent.substring(0, start)
    const highlightText = textContent.substring(start, end)
    const afterText = textContent.substring(end)

    // Create the highlight span with config
    const span = document.createElement("span")
    const config = HIGHLIGHT_CONFIGS[error.type]

    if (!config) {
      console.warn("No highlight config for error type:", error.type)
      return false
    }

    // Set span attributes with enhanced configuration
    const attributes: ErrorSpanAttributes = {
      "data-error-id": error.id,
      "data-error-type": error.type,
      "data-error-start": start.toString(),
      "data-error-end": end.toString(),
      className: `${config.className} error-highlight-span`,
      title: `${error.type}: ${error.explanation}`
    }

    Object.entries(attributes).forEach(([key, value]) => {
      if (value) span.setAttribute(key, value)
    })

    // Apply styling from config
    span.style.color = config.color
    span.style.borderBottom = `2px ${config.underlineStyle} ${config.color}`
    span.textContent = highlightText

    // Replace the text node with the new structure
    const fragment = document.createDocumentFragment()

    if (beforeText) {
      fragment.appendChild(document.createTextNode(beforeText))
    }

    fragment.appendChild(span)

    if (afterText) {
      fragment.appendChild(document.createTextNode(afterText))
    }

    parent.replaceChild(fragment, textNode)

    console.log(`✅ Text wrapped in enhanced highlight span successfully`)
    return true
  } catch (error) {
    console.error("❌ Error wrapping text in enhanced span:", error)
    return false
  }
}

/**
 * Find correct position for misaligned error text
 */
function findCorrectPosition(
  text: string,
  searchText: string,
  approximateStart: number
): { start: number; end: number } | null {
  console.log("🔍 Attempting to find correct position for:", searchText)

  // Search in a window around the approximate position
  const searchWindow = 100
  const windowStart = Math.max(0, approximateStart - searchWindow)
  const windowEnd = Math.min(
    text.length,
    approximateStart + searchText.length + searchWindow
  )
  const searchArea = text.substring(windowStart, windowEnd)

  const relativeIndex = searchArea.indexOf(searchText)
  if (relativeIndex !== -1) {
    const actualStart = windowStart + relativeIndex
    console.log("✅ Found correct position:", actualStart)
    return {
      start: actualStart,
      end: actualStart + searchText.length
    }
  }

  console.log("❌ Could not find correct position")
  return null
}
