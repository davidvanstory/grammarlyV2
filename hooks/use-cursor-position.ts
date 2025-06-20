/*
<ai_context>
React hook for managing cursor position in contentEditable elements.
Provides utilities for saving, restoring, and tracking cursor position during text changes.
</ai_context>
*/

import { useCallback, useRef, useEffect } from "react"
import { CursorPosition } from "@/types/grammar-types"

/**
 * Hook for managing cursor position in contentEditable elements
 */
export function useCursorPosition(elementRef: React.RefObject<HTMLElement>) {
  const savedPosition = useRef<CursorPosition | null>(null)
  const isRestoringPosition = useRef(false)

  console.log("📍 Cursor position hook initialized")

  /**
   * Get current cursor position
   */
  const getCurrentPosition = useCallback((): CursorPosition => {
    console.log("📍 Getting current cursor position...")
    
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      console.log("❌ Server-side rendering, no window object")
      return { offset: 0, node: null, nodeOffset: 0, isAtEnd: false }
    }
    
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || !elementRef.current) {
      console.log("❌ No selection or element found")
      return { offset: 0, node: null, nodeOffset: 0, isAtEnd: false }
    }

    const range = selection.getRangeAt(0)
    const offset = getTextOffsetFromDOM(elementRef.current, range.startContainer, range.startOffset)
    
    const position: CursorPosition = {
      offset,
      node: range.startContainer,
      nodeOffset: range.startOffset,
      isAtEnd: offset === (elementRef.current.innerText?.length || 0)
    }

    console.log(`📍 Current cursor position: offset=${offset}, nodeOffset=${range.startOffset}`)
    return position
  }, [elementRef])

  /**
   * Save current cursor position
   */
  const savePosition = useCallback(() => {
    console.log("💾 Saving cursor position...")
    savedPosition.current = getCurrentPosition()
    console.log(`💾 Position saved: offset=${savedPosition.current.offset}`)
  }, [getCurrentPosition])

  /**
   * Restore saved cursor position
   */
  const restorePosition = useCallback(() => {
    if (!savedPosition.current || !elementRef.current || isRestoringPosition.current) {
      console.log("❌ No saved position or already restoring")
      return false
    }

    console.log(`📍 Restoring cursor position: offset=${savedPosition.current.offset}`)
    isRestoringPosition.current = true

    try {
      const success = setTextOffsetPosition(elementRef.current, savedPosition.current.offset)
      
      if (success) {
        console.log("✅ Cursor position restored successfully")
      } else {
        console.log("❌ Failed to restore cursor position")
      }
      
      return success
    } catch (error) {
      console.error("❌ Error restoring cursor position:", error)
      return false
    } finally {
      isRestoringPosition.current = false
    }
  }, [elementRef])

  /**
   * Set cursor position to specific offset
   */
  const setPosition = useCallback((offset: number) => {
    if (!elementRef.current) {
      console.log("❌ No element reference")
      return false
    }

    console.log(`📍 Setting cursor position to offset: ${offset}`)
    return setTextOffsetPosition(elementRef.current, offset)
  }, [elementRef])

  /**
   * Move cursor by relative offset
   */
  const movePosition = useCallback((deltaOffset: number) => {
    const current = getCurrentPosition()
    const newOffset = Math.max(0, current.offset + deltaOffset)
    
    console.log(`📍 Moving cursor by ${deltaOffset}: ${current.offset} -> ${newOffset}`)
    return setPosition(newOffset)
  }, [getCurrentPosition, setPosition])

  /**
   * Check if cursor is at the end of content
   */
  const isAtEnd = useCallback((): boolean => {
    const position = getCurrentPosition()
    const textLength = elementRef.current?.innerText?.length || 0
    const atEnd = position.offset >= textLength
    
    console.log(`📍 Cursor at end: ${atEnd} (${position.offset}/${textLength})`)
    return atEnd
  }, [getCurrentPosition, elementRef])

  /**
   * Check if cursor is at the beginning of content
   */
  const isAtStart = useCallback((): boolean => {
    const position = getCurrentPosition()
    const atStart = position.offset === 0
    
    console.log(`📍 Cursor at start: ${atStart}`)
    return atStart
  }, [getCurrentPosition])

  /**
   * Get cursor position relative to a specific node
   */
  const getRelativePosition = useCallback((targetNode: Node): number => {
    if (!elementRef.current || typeof window === 'undefined') return -1

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return -1

    const range = selection.getRangeAt(0)
    if (!targetNode.contains(range.startContainer) && range.startContainer !== targetNode) {
      return -1
    }

    return getTextOffsetFromDOM(targetNode as HTMLElement, range.startContainer, range.startOffset)
  }, [elementRef])

  // Auto-save position when selection changes
  useEffect(() => {
    if (!elementRef.current || typeof window === 'undefined') return

    const handleSelectionChange = () => {
      if (!isRestoringPosition.current) {
        // Debounce position saving to avoid excessive saves
        const timeoutId = setTimeout(() => {
          savePosition()
        }, 100)

        return () => clearTimeout(timeoutId)
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [elementRef, savePosition])

  return {
    getCurrentPosition,
    savePosition,
    restorePosition,
    setPosition,
    movePosition,
    isAtEnd,
    isAtStart,
    getRelativePosition,
    savedPosition: savedPosition.current
  }
}

/**
 * Helper function to get text offset from DOM position
 */
function getTextOffsetFromDOM(
  container: HTMLElement,
  node: Node,
  offset: number
): number {
  console.log(`🔍 Converting DOM position to text offset: node=${node.nodeName}, offset=${offset}`)
  
  // Check if we're in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.log("❌ Server-side rendering, returning 0")
    return 0
  }
  
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  )

  let textOffset = 0
  let currentNode = walker.nextNode()

  while (currentNode) {
    if (currentNode === node) {
      const finalOffset = textOffset + offset
      console.log(`📍 Text offset calculated: ${finalOffset}`)
      return finalOffset
    }
    textOffset += currentNode.textContent?.length || 0
    currentNode = walker.nextNode()
  }

  console.log(`📍 Text offset fallback: ${textOffset}`)
  return textOffset
}

/**
 * Helper function to set cursor position from text offset
 */
function setTextOffsetPosition(container: HTMLElement, textOffset: number): boolean {
  console.log(`📍 Setting cursor position from text offset: ${textOffset}`)
  
  // Check if we're in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.log("❌ Server-side rendering, cannot set position")
    return false
  }
  
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  )

  let currentOffset = 0
  let node = walker.nextNode()

  while (node) {
    const nodeLength = node.textContent?.length || 0
    
    if (currentOffset + nodeLength >= textOffset) {
      const nodeOffset = textOffset - currentOffset
      
      try {
        const selection = window.getSelection()
        if (!selection) return false

        const range = document.createRange()
        range.setStart(node, Math.min(nodeOffset, nodeLength))
        range.setEnd(node, Math.min(nodeOffset, nodeLength))

        selection.removeAllRanges()
        selection.addRange(range)

        console.log(`✅ Cursor position set: node=${node.nodeName}, offset=${nodeOffset}`)
        return true
      } catch (error) {
        console.error("❌ Error setting cursor position:", error)
        return false
      }
    }
    
    currentOffset += nodeLength
    node = walker.nextNode()
  }

  console.log(`❌ Could not set cursor position for offset: ${textOffset}`)
  return false
}

/**
 * Utility hook for text change detection with cursor preservation
 */
export function useTextChangeWithCursor(
  elementRef: React.RefObject<HTMLElement>,
  onTextChange: (newText: string, cursorPosition: CursorPosition) => void
) {
  const { getCurrentPosition, savePosition, restorePosition } = useCursorPosition(elementRef)
  const previousText = useRef<string>("")

  const handleTextChange = useCallback(() => {
    if (!elementRef.current) return

    const currentText = elementRef.current.innerText || ""
    
    if (currentText !== previousText.current) {
      console.log("📝 Text change detected with cursor tracking")
      
      const cursorPosition = getCurrentPosition()
      onTextChange(currentText, cursorPosition)
      previousText.current = currentText
    }
  }, [elementRef, getCurrentPosition, onTextChange])

  const handleTextChangeWithPreservation = useCallback((callback: () => void) => {
    console.log("📝 Executing text change with cursor preservation")
    
    savePosition()
    callback()
    
    // Restore position after DOM updates
    setTimeout(() => {
      restorePosition()
    }, 0)
  }, [savePosition, restorePosition])

  return {
    handleTextChange,
    handleTextChangeWithPreservation,
    getCurrentPosition,
    savePosition,
    restorePosition
  }
} 