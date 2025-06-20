/*
<ai_context>
React hook for debounced text change detection in contentEditable elements.
Provides text change detection with position tracking and mathematical position updates.
</ai_context>
*/

import { useCallback, useRef, useEffect } from "react"
import { TextChange, TrackedError, CursorPosition } from "@/types/grammar-types"
import { calculateTextChange } from "@/lib/position-tracker"

interface UseTextChangeOptions {
  debounceMs?: number
  onTextChange?: (change: TextChange, newText: string, cursorPosition: CursorPosition) => void
  onSubstantialChange?: (newText: string) => void
  onMinorChange?: (change: TextChange) => void
  onSentenceComplete?: (newText: string) => void
  substantialChangeThreshold?: number
  enableSmartDebouncing?: boolean
}

interface TextChangeState {
  previousText: string
  changeCount: number
  lastChangeTime: Date
  isProcessing: boolean
}

/**
 * Hook for detecting and handling text changes with debouncing
 */
export function useTextChange(
  elementRef: React.RefObject<HTMLElement>,
  options: UseTextChangeOptions = {}
) {
  const {
    debounceMs = 300,
    onTextChange,
    onSubstantialChange,
    onMinorChange,
    onSentenceComplete,
    substantialChangeThreshold = 50,
    enableSmartDebouncing = true
  } = options

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const stateRef = useRef<TextChangeState>({
    previousText: "",
    changeCount: 0,
    lastChangeTime: new Date(),
    isProcessing: false
  })

  console.log("📝 Text change hook initialized with debounce:", debounceMs, "ms")

  /**
   * Get current text content from the element
   */
  const getCurrentText = useCallback((): string => {
    if (!elementRef.current) return ""
    return elementRef.current.innerText || ""
  }, [elementRef])

  /**
   * Get current cursor position
   */
  const getCurrentCursorPosition = useCallback((): CursorPosition => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || !elementRef.current) {
      return { offset: 0, node: null, nodeOffset: 0, isAtEnd: false }
    }

    const range = selection.getRangeAt(0)
    const offset = getTextOffsetFromDOMPosition(elementRef.current, range.startContainer, range.startOffset)
    
    return {
      offset,
      node: range.startContainer,
      nodeOffset: range.startOffset,
      isAtEnd: offset === getCurrentText().length
    }
  }, [elementRef, getCurrentText])

  /**
   * Process a detected text change
   */
  const processTextChange = useCallback((newText: string) => {
    if (stateRef.current.isProcessing) {
      console.log("⏳ Already processing text change, skipping...")
      return
    }

    console.log("🔍 Processing text change...")
    stateRef.current.isProcessing = true

    try {
      const oldText = stateRef.current.previousText
      
      if (oldText === newText) {
        console.log("✅ No actual text change detected")
        return
      }

      // Calculate the specific change
      const textChange = calculateTextChange(oldText, newText)
      const cursorPosition = getCurrentCursorPosition()
      
      console.log(`📊 Text change detected: ${textChange.type} at ${textChange.start}-${textChange.end}`)
      console.log(`📝 Old length: ${oldText.length}, New length: ${newText.length}`)

      // Update state
      stateRef.current.previousText = newText
      stateRef.current.changeCount++
      stateRef.current.lastChangeTime = new Date()

      // Determine if this is a substantial change
      const changeSize = Math.abs(textChange.newText.length - textChange.oldText.length)
      const isSubstantial = changeSize >= substantialChangeThreshold

      console.log(`📊 Change size: ${changeSize}, Substantial: ${isSubstantial}`)

      // Check for sentence completion
      const isSentenceComplete = enableSmartDebouncing && 
                                 textChange.type === "insert" &&
                                 /[.!?]\s*$/.test(textChange.newText)

      console.log(`📊 Change analysis: size=${changeSize}, substantial=${isSubstantial}, sentence=${isSentenceComplete}`)

      // Call appropriate callbacks
      if (onTextChange) {
        onTextChange(textChange, newText, cursorPosition)
      }

      if (isSentenceComplete && onSentenceComplete) {
        console.log("📢 Triggering sentence complete callback")
        onSentenceComplete(newText)
      } else if (isSubstantial && onSubstantialChange) {
        console.log("📢 Triggering substantial change callback")
        onSubstantialChange(newText)
      } else if (!isSubstantial && onMinorChange) {
        console.log("📢 Triggering minor change callback")
        onMinorChange(textChange)
      }

    } catch (error) {
      console.error("❌ Error processing text change:", error)
    } finally {
      stateRef.current.isProcessing = false
    }
  }, [getCurrentCursorPosition, onTextChange, onSubstantialChange, onMinorChange, substantialChangeThreshold])

  /**
   * Debounced text change handler
   */
  const handleTextChange = useCallback(() => {
    console.log("📝 Text change detected, starting debounce...")
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      const currentText = getCurrentText()
      console.log(`📝 Debounce completed, processing text (${currentText.length} chars)`)
      processTextChange(currentText)
    }, debounceMs)
  }, [debounceMs, getCurrentText, processTextChange])

  /**
   * Force immediate text change processing (bypass debounce)
   */
  const forceProcessChange = useCallback(() => {
    console.log("⚡ Forcing immediate text change processing...")
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }

    const currentText = getCurrentText()
    processTextChange(currentText)
  }, [getCurrentText, processTextChange])

  /**
   * Initialize the text state
   */
  const initializeText = useCallback(() => {
    const initialText = getCurrentText()
    console.log(`📝 Initializing text state: ${initialText.length} chars`)
    
    stateRef.current.previousText = initialText
    stateRef.current.changeCount = 0
    stateRef.current.lastChangeTime = new Date()
    stateRef.current.isProcessing = false
  }, [getCurrentText])

  /**
   * Reset the change detection state
   */
  const resetState = useCallback(() => {
    console.log("🔄 Resetting text change state...")
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }

    initializeText()
  }, [initializeText])

  /**
   * Get current change statistics
   */
  const getChangeStats = useCallback(() => {
    return {
      changeCount: stateRef.current.changeCount,
      lastChangeTime: stateRef.current.lastChangeTime,
      currentTextLength: getCurrentText().length,
      isProcessing: stateRef.current.isProcessing
    }
  }, [getCurrentText])

  // Initialize on mount and when element changes
  useEffect(() => {
    console.log("🔄 Text change hook element reference changed")
    initializeText()
  }, [initializeText])

  // Set up input event listeners
  useEffect(() => {
    if (!elementRef.current) return

    const element = elementRef.current
    console.log("🎧 Setting up text change event listeners...")

    // Listen for various input events
    const events = ['input', 'paste', 'cut', 'keydown', 'keyup']
    
    events.forEach(eventType => {
      element.addEventListener(eventType, handleTextChange)
    })

    return () => {
      console.log("🧹 Cleaning up text change event listeners...")
      events.forEach(eventType => {
        element.removeEventListener(eventType, handleTextChange)
      })
    }
  }, [elementRef, handleTextChange])

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        console.log("🧹 Cleaning up debounce timeout...")
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return {
    handleTextChange,
    forceProcessChange,
    resetState,
    initializeText,
    getChangeStats,
    getCurrentText,
    getCurrentCursorPosition
  }
}

/**
 * Hook for text change detection with error position updates
 */
export function useTextChangeWithErrors(
  elementRef: React.RefObject<HTMLElement>,
  errors: TrackedError[],
  onErrorsUpdate: (updatedErrors: TrackedError[]) => void,
  options: UseTextChangeOptions = {}
) {
  console.log("📝 Text change with errors hook initialized")

  const { handleTextChange, ...textChangeUtils } = useTextChange(elementRef, {
    ...options,
    onTextChange: (change, newText, cursorPosition) => {
      console.log("📝 Text change with error position updates...")
      
      // Update error positions based on the text change
      const updatedErrors = updateErrorPositions(errors, change)
      
      // Call the error update callback
      onErrorsUpdate(updatedErrors)
      
      // Call the original callback if provided
      if (options.onTextChange) {
        options.onTextChange(change, newText, cursorPosition)
      }
    }
  })

  return {
    handleTextChange,
    ...textChangeUtils
  }
}

/**
 * Helper function to get text offset from DOM position
 */
function getTextOffsetFromDOMPosition(
  container: HTMLElement,
  node: Node,
  offset: number
): number {
  const walker = document.createTreeWalker(
    container,
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

  return textOffset
}

/**
 * Enhanced helper function to update error positions after text changes
 * Implements improved position shifting logic from highlighting.md
 */
function updateErrorPositions(
  errors: TrackedError[],
  change: TextChange
): TrackedError[] {
  console.log(`🔧 Updating ${errors.length} error positions after text change...`)
  console.log(`📝 Change details: type=${change.type}, start=${change.start}, end=${change.end}`)
  console.log(`📝 Text change: "${change.oldText}" -> "${change.newText}"`)
  
  const lengthDiff = change.newText.length - change.oldText.length
  const changeStart = change.start
  const changeEnd = change.end

  console.log(`📊 Length difference: ${lengthDiff}`)

  return errors.map((error, index) => {
    const errorStart = error.currentPosition.start
    const errorEnd = error.currentPosition.end

    console.log(`🔍 Processing error ${error.id} (${index + 1}/${errors.length}): pos=${errorStart}-${errorEnd}`)

    // Error is completely before the change - no adjustment needed
    if (errorEnd <= changeStart) {
      console.log(`➡️ Error ${error.id}: before change, no adjustment needed`)
      return error
    }

    // Error is completely after the change - adjust by length difference
    if (errorStart >= changeEnd) {
      const newStart = errorStart + lengthDiff
      const newEnd = errorEnd + lengthDiff
      console.log(`➡️ Error ${error.id}: after change, shifting by ${lengthDiff} (${errorStart}-${errorEnd} -> ${newStart}-${newEnd})`)
      return {
        ...error,
        currentPosition: {
          start: newStart,
          end: newEnd
        }
      }
    }

    // Complex case: Error overlaps with the change
    console.log(`⚠️ Error ${error.id} overlaps with change, analyzing overlap...`)

    // Check if the error is completely within the changed range
    if (errorStart >= changeStart && errorEnd <= changeEnd) {
      console.log(`❌ Error ${error.id} is completely within changed range, invalidating`)
      return {
        ...error,
        status: "pending" as const, // Will need revalidation
        currentPosition: {
          start: changeStart,
          end: changeStart + change.newText.length
        }
      }
    }

    // Check if the change is completely within the error
    if (changeStart >= errorStart && changeEnd <= errorEnd) {
      console.log(`🔧 Error ${error.id}: change is within error, adjusting end position`)
      return {
        ...error,
        status: "pending" as const, // May need revalidation due to content change
        currentPosition: {
          start: errorStart,
          end: errorEnd + lengthDiff
        }
      }
    }

    // Partial overlap - error starts before change but overlaps
    if (errorStart < changeStart && errorEnd > changeStart) {
      console.log(`🔧 Error ${error.id}: starts before change but overlaps, may need revalidation`)
      
      // If error ends within the change, truncate it
      if (errorEnd <= changeEnd) {
        return {
          ...error,
          status: "pending" as const,
          currentPosition: {
            start: errorStart,
            end: changeStart
          }
        }
      } else {
        // Error spans across the change - adjust end position
        return {
          ...error,
          status: "pending" as const,
          currentPosition: {
            start: errorStart,
            end: errorEnd + lengthDiff
          }
        }
      }
    }

    // Partial overlap - error starts within change but extends beyond
    if (errorStart >= changeStart && errorStart < changeEnd && errorEnd > changeEnd) {
      console.log(`🔧 Error ${error.id}: starts within change but extends beyond`)
      const newStart = changeEnd + lengthDiff
      const newEnd = errorEnd + lengthDiff
      return {
        ...error,
        status: "pending" as const,
        currentPosition: {
          start: newStart,
          end: newEnd
        }
      }
    }

    // Fallback - mark as pending for revalidation
    console.log(`⚠️ Error ${error.id}: complex overlap, marking as pending`)
    return {
      ...error,
      status: "pending" as const,
      currentPosition: {
        start: Math.max(changeStart, errorStart + (errorStart >= changeStart ? lengthDiff : 0)),
        end: Math.max(changeStart + change.newText.length, errorEnd + lengthDiff)
      }
    }
  })
} 