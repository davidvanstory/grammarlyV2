"use client"

/*
<ai_context>
Error highlighting component for the Med Writer application.
Implements DOM-based error highlighting with color-coded error types and interactive tooltips.
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
   * Apply error highlights to the DOM
   */
  const applyHighlights = useCallback(() => {
    if (!containerRef.current) {
      console.log("❌ No container reference for highlighting")
      return
    }

    const startTime = performance.now()
    console.log("🎨 Applying error highlights...")

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

    // Sort errors by position to avoid conflicts
    const sortedErrors = [...validErrors].sort(
      (a, b) => a.currentPosition.start - b.currentPosition.start
    )

    let highlightsApplied = 0
    const textContent = containerRef.current.innerText || ""

    for (const error of sortedErrors) {
      try {
        const success = applyErrorHighlight(error, textContent)
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
    performanceMetrics.current.textLength = textContent.length

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
   * Apply highlight for a single error
   */
  const applyErrorHighlight = useCallback(
    (error: TrackedError, textContent: string): boolean => {
      if (!containerRef.current) return false

      console.log(
        `🎨 Applying highlight for error ${error.id}: ${error.currentPosition.start}-${error.currentPosition.end}`
      )

      // Validate error position
      const { start, end } = error.currentPosition
      if (start < 0 || end > textContent.length || start >= end) {
        console.log(
          `❌ Invalid error position: ${start}-${end} for text length ${textContent.length}`
        )
        return false
      }

      // Verify the text matches what we expect
      const expectedText = textContent.substring(start, end)
      if (expectedText !== error.original) {
        console.log(
          `❌ Text mismatch for error ${error.id}: expected "${error.original}", found "${expectedText}"`
        )
        return false
      }

      try {
        const success = highlightTextRange(
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
 * Helper function to highlight a text range in the DOM
 */
function highlightTextRange(
  container: HTMLElement,
  start: number,
  end: number,
  error: TrackedError
): boolean {
  console.log(`🎨 Highlighting text range: ${start}-${end}`)

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  )

  let currentOffset = 0
  let node = walker.nextNode()

  while (node) {
    const nodeLength = node.textContent?.length || 0
    const nodeStart = currentOffset
    const nodeEnd = currentOffset + nodeLength

    // Check if this text node contains part of our target range
    if (nodeStart < end && nodeEnd > start) {
      const rangeStart = Math.max(0, start - nodeStart)
      const rangeEnd = Math.min(nodeLength, end - nodeStart)

      if (rangeStart < rangeEnd) {
        try {
          const success = wrapTextInSpan(node, rangeStart, rangeEnd, error)
          if (success) {
            console.log(
              `✅ Successfully wrapped text in span: ${rangeStart}-${rangeEnd}`
            )
            return true
          }
        } catch (wrapError) {
          console.error("❌ Error wrapping text in span:", wrapError)
          return false
        }
      }
    }

    currentOffset += nodeLength
    node = walker.nextNode()
  }

  console.log(`❌ Could not find text range to highlight: ${start}-${end}`)
  return false
}

/**
 * Helper function to wrap text in a highlight span
 */
function wrapTextInSpan(
  textNode: Node,
  start: number,
  end: number,
  error: TrackedError
): boolean {
  if (!textNode.textContent || start >= end) return false

  console.log(
    `🎨 Wrapping text in span: "${textNode.textContent.substring(start, end)}"`
  )

  try {
    const parent = textNode.parentNode
    if (!parent) return false

    const textContent = textNode.textContent
    const beforeText = textContent.substring(0, start)
    const highlightText = textContent.substring(start, end)
    const afterText = textContent.substring(end)

    // Create the highlight span
    const span = document.createElement("span")
    const config = HIGHLIGHT_CONFIGS[error.type]

    // Set span attributes
    const attributes: ErrorSpanAttributes = {
      "data-error-id": error.id,
      "data-error-type": error.type,
      "data-error-start": start.toString(),
      "data-error-end": end.toString(),
      className: config.className,
      title: `${error.type}: ${error.explanation}`
    }

    Object.entries(attributes).forEach(([key, value]) => {
      if (value) span.setAttribute(key, value)
    })

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

    console.log(`✅ Text wrapped in highlight span successfully`)
    return true
  } catch (error) {
    console.error("❌ Error wrapping text in span:", error)
    return false
  }
}
