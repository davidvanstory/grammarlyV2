Okay, I've reviewed your codebase, focusing on the cursor stability issue in your `ContentEditableEditor`. This is a common and often tricky problem in rich-text or content-editable scenarios, especially when DOM manipulations like error highlighting are involved.

The root cause of cursor jumping is usually a desynchronization between the browser's selection/cursor state, your React component's state, and the actual DOM structure, particularly when asynchronous operations or direct DOM manipulations occur.

Here's a breakdown of the likely contributing factors in your codebase and a detailed plan to address them:

**Likely Contributing Factors:**

1.  **DOM Manipulation by `ErrorHighlight`:** The `ErrorHighlight` component directly wraps text in `<span>` elements. If this happens while the user is typing or if the cursor restoration logic isn't perfectly timed, the browser can lose track of the correct cursor position.
2.  **`innerText` Usage in `ContentEditableEditor`:** Directly setting `editorRef.current.innerText = content` can be problematic. `innerText` has its own way of parsing and serializing content, which might lead to subtle DOM changes that affect the cursor, especially if the `content` state isn't perfectly aligned with what `innerText` would produce from the current DOM.
3.  **Coordination of Asynchronous Operations:** Grammar checks, auto-saving, and debounced text change handling are asynchronous. If these operations lead to DOM updates or cursor restoration attempts at inopportune moments (e.g., mid-typing), jumps can occur.
4.  **Multiple Points of Cursor Management:** Logic for cursor saving/restoration exists in `useCursorPosition`, potentially within `useTextChange` callbacks, and directly in `ContentEditableEditor`. These could conflict if not perfectly synchronized.
5.  **Event Handling (`onKeyDown` for Enter, `onPaste`):** Manual DOM manipulation in these handlers (like inserting `<br>`) needs to be carefully coordinated with the main text change detection and cursor management logic.

**Solution Strategy:**

The core idea is to establish a clear and robust flow for handling user input, updating component state, manipulating the DOM (for highlighting), and managing the cursor position.

1.  **Single Source of Truth for User Edits:** During user typing, the `contentEditable` div's content (as read by `editorRef.current.innerText`) should be the primary source of truth. React state (`content`) should then synchronize *from* this.
2.  **Centralized and Well-Timed Cursor Management:**
    *   Save the cursor position *before* any React state updates that could trigger DOM changes (like error highlighting).
    *   Restore the cursor position *after* all DOM manipulations for a given user action have completed and React has finished its render cycle. Using `setTimeout(..., 0)` is a common technique for this.
3.  **Controlled DOM Updates:**
    *   When loading a new document, update the editor's DOM directly and then synchronize all related states.
    *   Error highlighting should operate on the DOM with the understanding that cursor restoration will follow.
4.  **Refined Event Handling:** Ensure custom event handlers like `onKeyDown` (for Enter) and `onPaste` integrate smoothly into the main change detection and cursor management flow.
5.  **Improved Debouncing in `useCursorPosition`:** Ensure the `selectionchange` listener's debouncing logic is correctly implemented.

---

**Detailed Instructions and Code Changes:**

**Step 1: Refine `useCursorPosition` Debouncing**

The debouncing for `selectionchange` in `useCursorPosition` needs a slight correction to manage its `setTimeout` correctly.

File: `hooks/use-cursor-position.ts`

```typescript
// ... (imports and other parts of the hook)

export function useCursorPosition(elementRef: React.RefObject<HTMLElement>) {
  const savedPosition = useRef<CursorPosition | null>(null);
  const isRestoringPosition = useRef(false);
  const selectionChangeDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Added for correct debouncing

  console.log("📍 Cursor position hook initialized");

  const getCurrentPosition = useCallback((): CursorPosition => {
    // ... (existing getCurrentPosition logic - seems fine)
    // Ensure console logs are conditional or removed for production
    console.log("📍 Getting current cursor position...");
    
    if (typeof window === 'undefined') {
      console.log("❌ Server-side rendering, no window object");
      return { offset: 0, node: null, nodeOffset: 0, isAtEnd: false };
    }
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !elementRef.current) {
      console.log("❌ No selection or element found");
      return { offset: 0, node: null, nodeOffset: 0, isAtEnd: false };
    }

    const range = selection.getRangeAt(0);
    // Ensure container is passed correctly if getTextOffsetFromDOM is external
    const offset = getTextOffsetFromDOM(elementRef.current, range.startContainer, range.startOffset); 
    
    const position: CursorPosition = {
      offset,
      node: range.startContainer,
      nodeOffset: range.startOffset,
      isAtEnd: offset === (elementRef.current.innerText?.length || 0)
    };

    console.log(`📍 Current cursor position: offset=${offset}, nodeOffset=${range.startOffset}`);
    return position;
  }, [elementRef]);

  const savePosition = useCallback(() => {
    console.log("💾 Saving cursor position...");
    savedPosition.current = getCurrentPosition();
    console.log(`💾 Position saved: offset=${savedPosition.current.offset}`);
  }, [getCurrentPosition]);

  // ... (restorePosition, setPosition, etc. remain largely the same)
  const restorePosition = useCallback(() => {
    if (!savedPosition.current || !elementRef.current || isRestoringPosition.current) {
      console.log("❌ No saved position or already restoring");
      return false;
    }

    console.log(`📍 Restoring cursor position: offset=${savedPosition.current.offset}`);
    isRestoringPosition.current = true;

    try {
      // Ensure container is passed correctly if setTextOffsetPosition is external
      const success = setTextOffsetPosition(elementRef.current, savedPosition.current.offset); 
      
      if (success) {
        console.log("✅ Cursor position restored successfully");
      } else {
        console.log("❌ Failed to restore cursor position");
      }
      
      return success;
    } catch (error) {
      console.error("❌ Error restoring cursor position:", error);
      return false;
    } finally {
      // Use a microtask to ensure isRestoringPosition is reset after the current stack,
      // including any immediate selectionchange events triggered by restorePosition.
      Promise.resolve().then(() => {
        isRestoringPosition.current = false;
      });
    }
  }, [elementRef]);


  // Auto-save position on selection change (debounced)
  useEffect(() => {
    if (!elementRef.current || typeof window === 'undefined') return;

    const handleSelectionChange = () => {
      if (isRestoringPosition.current) {
        console.log("🔄 Skipping savePosition during restore operation.");
        return;
      }

      if (selectionChangeDebounceTimeoutRef.current) {
        clearTimeout(selectionChangeDebounceTimeoutRef.current);
      }
      selectionChangeDebounceTimeoutRef.current = setTimeout(() => {
        // Directly update savedPosition.current, avoid calling the exported `savePosition`
        // if it has other side effects or logging that might be confusing here.
        // Assuming getCurrentPosition is safe and stable to call.
        const currentPos = getCurrentPosition();
        savedPosition.current = currentPos;
        console.log(`💾 Position saved (debounced selectionchange): offset=${currentPos.offset}`);
      }, 100);
    };

    console.log("🎧 Adding selectionchange listener for cursor position.");
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      console.log("🧹 Removing selectionchange listener for cursor position.");
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (selectionChangeDebounceTimeoutRef.current) {
        clearTimeout(selectionChangeDebounceTimeoutRef.current);
      }
    };
  }, [elementRef, getCurrentPosition]); // `savePosition` was removed as a dependency to prevent potential loops if it were less stable. `getCurrentPosition` is what's actually used.

  return {
    getCurrentPosition,
    savePosition,
    restorePosition,
    // ... (rest of the returned methods)
    setPosition,
    movePosition,
    isAtEnd,
    isAtStart,
    getRelativePosition,
    savedPosition: savedPosition.current // This will be stale, prefer calling getCurrentPosition
  };
}

// Helper functions (getTextOffsetFromDOM, setTextOffsetPosition) should remain as they are,
// but ensure they are robust. They seem standard.
// ... (rest of the file, including getTextOffsetFromDOM and setTextOffsetPosition, useTextChangeWithCursor)
```

**Step 2: Modify `useTextChange` to Integrate Better**

The `useTextChange` hook will be simplified. Its `handleTextChange` will be the debounced function that eventually calls `processTextChange`.

File: `hooks/use-text-change.ts`

```typescript
// ... (imports)

export function useTextChange(
  elementRef: React.RefObject<HTMLElement>,
  options: UseTextChangeOptions = {}
) {
  const {
    debounceMs = 300, // Keep this moderate
    onTextChange,
    onSubstantialChange,
    onMinorChange,
    onSentenceComplete,
    substantialChangeThreshold = 50,
    enableSmartDebouncing = true // This flag seems fine
  } = options;

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef<TextChangeState>({
    previousText: "",
    changeCount: 0,
    lastChangeTime: new Date(),
    isProcessing: false
  });
  
  // Get current text from the editor element
  const getCurrentText = useCallback((): string => {
    if (!elementRef.current) return "";
    // innerText is generally preferred for contentEditable to get plain text representation
    return elementRef.current.innerText || ""; 
  }, [elementRef]);

  // Get current cursor position (moved from ContentEditableEditor for direct use)
  const getCurrentCursorPosition = useCallback((): CursorPosition => {
    if (typeof window === 'undefined' || !elementRef.current) {
        return { offset: 0, node: null, nodeOffset: 0, isAtEnd: false };
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return { offset: 0, node: null, nodeOffset: 0, isAtEnd: false };
    }
    const range = selection.getRangeAt(0);
    const offset = getTextOffsetFromDOMPosition(elementRef.current, range.startContainer, range.startOffset);
    return {
      offset,
      node: range.startContainer,
      nodeOffset: range.startOffset,
      isAtEnd: offset === getCurrentText().length
    };
  }, [elementRef, getCurrentText]); // Added getCurrentText dependency

  const processTextChange = useCallback(() => { // Removed newText arg, will get it fresh
    if (stateRef.current.isProcessing) {
      console.log("⏳ Already processing text change, skipping...");
      return;
    }
    console.log("🔍 Processing text change (from useTextChange)...");
    stateRef.current.isProcessing = true;

    try {
      const newText = getCurrentText(); // Get the freshest text from DOM
      const oldText = stateRef.current.previousText;
      
      if (oldText === newText) {
        console.log("✅ No actual text change detected in processTextChange");
        stateRef.current.isProcessing = false;
        return;
      }

      const textChange = calculateTextChange(oldText, newText);
      const cursorPositionVal = getCurrentCursorPosition();
      
      console.log(`📊 Text change calculated: ${textChange.type} at ${textChange.start}-${textChange.end}`);

      // IMPORTANT: Update previousText *before* calling external callbacks that might depend on it
      stateRef.current.previousText = newText;
      stateRef.current.changeCount++;
      stateRef.current.lastChangeTime = new Date();

      const changeSize = Math.abs(textChange.newText.length - textChange.oldText.length);
      const isSubstantial = changeSize >= substantialChangeThreshold;
      
      const textProcessor = getTextProcessor(); // Assuming getTextProcessor is available
      const isSentenceComplete = enableSmartDebouncing && 
                                 textChange.type === "insert" &&
                                 textProcessor.endsWithCompleteSentence(newText); // Use newText

      if (onTextChange) {
        // This callback is critical. It will handle state updates in ContentEditableEditor
        // and schedule cursor restoration.
        onTextChange(textChange, newText, cursorPositionVal);
      }

      if (isSentenceComplete && onSentenceComplete) {
        onSentenceComplete(newText);
      } else if (isSubstantial && onSubstantialChange) {
        onSubstantialChange(newText);
      } else if (!isSubstantial && onMinorChange) {
        onMinorChange(textChange);
      }

    } catch (error) {
      console.error("❌ Error processing text change in useTextChange:", error);
    } finally {
      // Ensure isProcessing is reset even if onTextChange is async or throws
      // However, onTextChange itself should handle its async parts carefully.
      // For now, assume onTextChange is mostly synchronous regarding state updates that affect this hook.
      stateRef.current.isProcessing = false; 
    }
  }, [
    getCurrentText, 
    getCurrentCursorPosition, // Added
    onTextChange, 
    onSubstantialChange, 
    onMinorChange, 
    onSentenceComplete, 
    substantialChangeThreshold, 
    enableSmartDebouncing
  ]);

  const handleTextChange = useCallback(() => {
    // This is the function that gets called by the onInput event.
    // It debounces the call to processTextChange.
    console.log("📝 Text input detected, debouncing change processing...");
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      processTextChange();
    }, debounceMs);
  }, [debounceMs, processTextChange]);

  const forceProcessChange = useCallback(() => {
    console.log("⚡ Forcing immediate text change processing (useTextChange)...");
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    processTextChange();
  }, [processTextChange]);

  const initializeText = useCallback(() => {
    const initialText = getCurrentText();
    console.log(`📝 Initializing text state in useTextChange: ${initialText.length} chars`);
    stateRef.current.previousText = initialText;
    stateRef.current.changeCount = 0;
    stateRef.current.lastChangeTime = new Date();
    stateRef.current.isProcessing = false;
  }, [getCurrentText]);
  
  // ... (resetState, getChangeStats, useEffects for init and cleanup remain similar)
  useEffect(() => {
    console.log("🔄 Text change hook element reference changed, re-initializing text.");
    initializeText();
  }, [initializeText]); // Removed elementRef dependency as initializeText now uses getCurrentText which depends on it

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);


  return {
    handleTextChange, // This is the debounced function to call from onInput
    forceProcessChange,
    resetState,
    initializeText, // Keep this for ContentEditableEditor to call
    getChangeStats,
    getCurrentText, // Expose for convenience
    getCurrentCursorPosition // Expose for convenience
  };
}

// Helper getTextOffsetFromDOMPosition (already in use-cursor-position.ts, ensure it's accessible or duplicated if needed)
// If it's in use-cursor-position.ts, better to import or pass `cursorPosition` object.
// For now, assuming it's accessible or defined locally in use-text-change.ts for simplicity.
// It's better to keep DOM helpers in one place (use-cursor-position.ts) and use them.
// So, `getCurrentCursorPosition` here might use `cursorPosition.getCurrentPosition()` if `useTextChange`
// was to receive the `cursorPosition` object from `useCursorPosition`.
// Given current structure, duplicating or importing is needed. Let's assume it's available.

// Remove useTextChangeWithErrors if not essential for this fix, or refactor it based on the new useTextChange
// ... (updateErrorPositions might need to be part of ContentEditableEditor's logic now)
```

**Step 3: Major Refactor of `ContentEditableEditor.tsx`**

This is where the main changes for cursor stability will happen.

File: `app/documents/_components/content-editable-editor.tsx`

```typescript
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Save, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { SelectDocument } from "@/db/schema/documents-schema";
import { updateDocumentAction } from "@/actions/db/documents-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { createPositionTracker, PositionTracker } from "@/lib/position-tracker"; // Potentially for future advanced mapping
import { getTextProcessor } from "@/lib/text-processor";
import { useCursorPosition } from "@/hooks/use-cursor-position";
import { useTextChange } from "@/hooks/use-text-change";
import ErrorHighlight from "@/components/editor/error-highlight";
import {
  TrackedError,
  TextChange,
  CursorPosition,
  EditorState, // Keep internal editor state concept
  TextProcessingResult,
  GrammarCheckRequest,
  GrammarCheckResponse
} from "@/types/grammar-types";
import { convertToTrackedErrors, validateErrorPosition } from "@/lib/error-parser"; // Assuming validateErrorPosition exists

// ... (AUTO_SAVE_INTERVAL etc. remain the same) ...

export default function ContentEditableEditor({
  document,
  onDocumentUpdate,
  onGrammarCheck
}: ContentEditableEditorProps) {
  console.log(
    "📝 Rendering content editor for document:",
    document?.title || "None"
  );

  const [content, setContent] = useState(document?.content || ""); // React state for content
  const [title, setTitle] = useState(document?.title || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [errors, setErrors] = useState<TrackedError[]>([]);
  const [isGrammarChecking, setIsGrammarChecking] = useState(false);
  const [lastGrammarCheck, setLastGrammarCheck] = useState<Date | null>(null);
  const [grammarCheckError, setGrammarCheckError] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // debounceTimeoutRef is now internal to useTextChange
  const grammarCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const grammarCheckAbortControllerRef = useRef<AbortController | null>(null);
  
  // Flag to prevent onInput handler during programmatic content updates
  const isLoadingDocumentContent = useRef(false);
  // Tracks the document ID to detect when a new document is loaded
  const currentLoadedDocId = useRef<string | null>(null);


  // Initialize cursor position hook
  const cursorPositionHook = useCursorPosition(editorRef);

  // Callback from useTextChange, invoked after debounce & initial processing
  const handleDebouncedTextChange = useCallback(
    (change: TextChange, newText: string, editorCursorPos: CursorPosition) => {
      console.log("🔄 CEE: handleDebouncedTextChange called with new text length:", newText.length);
      
      // Synchronize React content state with the newText from the editor
      setContent(newText); 
      setHasUnsavedChanges(true);
      // updateEditorState is not strictly needed if `content` drives other things
      // Let's simplify and remove `editorState` from CEE if possible, rely on individual states

      // Process text for advanced mapping if needed (e.g., for ErrorHighlight)
      // This part might be deferred or simplified if ErrorHighlight directly uses editorRef.current.innerText
      if (editorRef.current) {
        // const processor = getTextProcessor();
        // const result = processor.htmlToPlainText(editorRef.current);
        // setTextProcessingResult(result); // If needed for other components
      }
      
      // Trigger grammar check
      if (newText.trim().length > 10) {
        smartGrammarCheck(newText); // smartGrammarCheck needs `errors` state
      }

      // Schedule cursor restoration *after* React's render cycle and DOM updates (e.g., from ErrorHighlight)
      setTimeout(() => {
        console.log(" CEE: Restoring cursor after debounced change");
        cursorPositionHook.restorePosition();
      }, 0);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cursorPositionHook, smartGrammarCheck] // `errors` will be read by smartGrammarCheck from its own closure
  );

  const handleSubstantialTextChange = useCallback(
    (newText: string) => {
      console.log("📢 CEE: Substantial text change, new length:", newText.length);
      setErrors([]); // Clear errors as positions are likely very different
      if (newText.trim().length > 10) {
         // Use a short delay to allow DOM to settle from the input event
        setTimeout(() => performGrammarCheck(newText, true), 50);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [performGrammarCheck] // `errors` isn't needed as a dep here directly
  );
  
  const handleSentenceComplete = useCallback(
    (newText: string) => {
      console.log("📝 CEE: Sentence completed");
      if (newText.trim().length > 10) {
        smartGrammarCheck(newText, true); // Immediate check
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [smartGrammarCheck]
  );

  // Initialize text change hook
  const textChangeHook = useTextChange(editorRef, {
    debounceMs: 300, // Adjusted debounce
    onTextChange: handleDebouncedTextChange,
    onSubstantialChange: handleSubstantialTextChange,
    onSentenceComplete: handleSentenceComplete,
  });

  // Perform Grammar Check (modified to use editorRef for consistent text)
  const performGrammarCheck = useCallback(
    async (textForCheck: string, forceRecheck: boolean = false) => { // textForCheck might be stale if not careful
      if (!editorRef.current) {
        console.warn("🤖 Skipping grammar check, editor not ready.");
        return;
      }
      const currentEditorText = editorRef.current.innerText; // Always use fresh text
      console.log("🤖 CEE: performGrammarCheck. Text length:", currentEditorText.length, "Force:", forceRecheck);


      if (currentEditorText.trim().length < 10 || currentEditorText.length > 10000) {
         console.log("⚠️ Text too short or too long for grammar check");
         setErrors([]); // Clear errors for short/empty text
         if (onGrammarCheck) onGrammarCheck([]);
         return;
      }

      if (grammarCheckAbortControllerRef.current) {
        grammarCheckAbortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      grammarCheckAbortControllerRef.current = abortController;

      setIsGrammarChecking(true);
      setGrammarCheckError(null);

      try {
        const request: GrammarCheckRequest = {
          text: currentEditorText, // Use fresh text from editor
          previousErrors: errors, // Pass current errors for context if API uses it
          forceRecheck
        };

        const response = await fetch("/api/grammar-check", { // Ensure this API exists and works
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) {
            console.log("🛑 Grammar check aborted by new request.");
            return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Grammar check failed: ${response.status}`);
        }
        const result = await response.json();

        if (result.success && result.data) {
          const grammarResponse = result.data as GrammarCheckResponse;
          
          // Validate errors against the *current* editor text before converting
          const validatedApiErrors = grammarResponse.errors.filter(apiError => {
            const validation = validateErrorPosition(apiError, currentEditorText);
            if (!validation.isValid && validation.adjustedPosition) {
                console.log(`🔧 Adjusting API error ${apiError.id} position: ${apiError.start}=>${validation.adjustedPosition.start}`);
                apiError.start = validation.adjustedPosition.start;
                apiError.end = validation.adjustedPosition.end;
                return true; // Keep if adj
            }
            return validation.isValid;
          });

          const newTrackedErrors = convertToTrackedErrors(validatedApiErrors);
          setErrors(newTrackedErrors);
          setLastGrammarCheck(new Date());
          if (onGrammarCheck) onGrammarCheck(newTrackedErrors);
        } else {
            throw new Error(result.message || "Grammar check API returned unsuccessful.");
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("🛑 Grammar check aborted.");
        } else {
          console.error("❌ CEE: Grammar check failed:", error);
          setGrammarCheckError(error instanceof Error ? error.message : "Unknown error");
          toast.error(`Grammar check: ${error instanceof Error ? error.message : "failed"}`);
        }
      } finally {
        setIsGrammarChecking(false);
        if (grammarCheckAbortControllerRef.current === abortController) {
             grammarCheckAbortControllerRef.current = null; // Clear if this is the controller that finished
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [errors, onGrammarCheck] // `errors` needed for previousErrors context
  );
  
  const smartGrammarCheck = useCallback( // Smart debouncer for grammar check
    (text: string, isImmediate: boolean = false) => {
      if (grammarCheckTimeoutRef.current) {
        clearTimeout(grammarCheckTimeoutRef.current);
      }
      const textProcessor = getTextProcessor();
      const endsWithSentence = textProcessor.endsWithCompleteSentence(text);
      let delay = isImmediate || endsWithSentence ? SENTENCE_END_IMMEDIATE_CHECK : GRAMMAR_CHECK_DEBOUNCE;
      
      grammarCheckTimeoutRef.current = setTimeout(() => {
        // Pass current editor text to performGrammarCheck to ensure freshness
        if(editorRef.current) {
          performGrammarCheck(editorRef.current.innerText);
        }
      }, delay);
    },
    [performGrammarCheck]
  );

  // Effect for loading/changing documents
  useEffect(() => {
    console.log("🔄 CEE: useEffect for document prop change. Current doc ID:", document?.id, "Loaded ID:", currentLoadedDocId.current);
    if (document) {
      if (document.id !== currentLoadedDocId.current) {
        console.log("📝 CEE: New document detected. ID:", document.id);
        isLoadingDocumentContent.current = true; // Prevent onInput during programmatic update

        setContent(document.content);
        setTitle(document.title);
        if (editorRef.current) {
          editorRef.current.innerText = document.content; // Directly set DOM
        }
        
        setHasUnsavedChanges(false);
        setSaveError(null);
        setLastSaved(document.updatedAt ? new Date(document.updatedAt) : new Date());
        
        setErrors([]);
        setLastGrammarCheck(null);
        setGrammarCheckError(null);
        setIsGrammarChecking(false); // Ensure this is reset

        textChangeHook.initializeText(); // Critical: sync useTextChange's internal state

        currentLoadedDocId.current = document.id;

        // Perform initial grammar check for the new document
        if (document.content.trim().length > 10) {
          // Delay slightly to ensure DOM is fully updated and editorRef is stable
          setTimeout(() => {
             if (editorRef.current) performGrammarCheck(editorRef.current.innerText, true);
          }, 500); // Increased delay for stability
        } else {
            setErrors([]); // Clear errors if new doc is too short
            if(onGrammarCheck) onGrammarCheck([]);
        }
        
        // Set cursor to the beginning of the document
        setTimeout(() => {
          if (editorRef.current) {
            cursorPositionHook.setPosition(0);
             // Focus editor after loading new document
            editorRef.current.focus();
          }
          isLoadingDocumentContent.current = false; // Release lock
        }, 0); // After DOM update
      }
    } else if (currentLoadedDocId.current !== null) { // Document becomes null (deselected)
      console.log("📝 CEE: Document deselected.");
      isLoadingDocumentContent.current = true;
      setContent("");
      setTitle("");
      if (editorRef.current) editorRef.current.innerText = "";
      setHasUnsavedChanges(false);
      setErrors([]);
      // ... other state resets ...
      textChangeHook.initializeText();
      currentLoadedDocId.current = null;
      setTimeout(() => {
        isLoadingDocumentContent.current = false;
      }, 0);
    }
  }, [document, textChangeHook, cursorPositionHook, performGrammarCheck, onGrammarCheck]);


  // Save function (largely unchanged, ensure it uses `content` and `title` state)
  const saveDocument = useCallback(
    async (contentToSave?: string, titleToSave?: string) => {
      // ... (existing saveDocument logic is fine)
      if (!document) return;

      const finalContent = contentToSave ?? content; // Use component's content state
      const finalTitle = titleToSave ?? title;     // Use component's title state

      if (finalContent === document.content && finalTitle === document.title && !hasUnsavedChanges) {
        console.log("📝 No changes to save");
        return;
      }

      console.log("📝 Saving document:", document.title, "->", finalTitle);
      setIsSaving(true);
      setSaveError(null);

      try {
        const result = await updateDocumentAction(document.id, {
          content: finalContent,
          title: finalTitle,
        });

        if (result.isSuccess) {
          console.log("✅ Document saved successfully");
          onDocumentUpdate(result.data); // Notify parent
          setHasUnsavedChanges(false);
          setLastSaved(new Date());
          toast.success("Document saved");
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error("❌ Error saving document:", error);
        const msg = error instanceof Error ? error.message : "Failed to save";
        setSaveError(msg);
        toast.error(msg);
      } finally {
        setIsSaving(false);
      }
    },
    [document, content, title, onDocumentUpdate, hasUnsavedChanges] // `hasUnsavedChanges` added to prevent save if no changes
  );

  // Auto-save (largely unchanged)
  useEffect(() => {
    // ... (existing auto-save logic) ...
    if (autoSaveTimeoutRef.current) clearInterval(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setInterval(() => {
      if (hasUnsavedChanges && !isSaving && document) { // Check document exists
        console.log("⏰ Auto-saving document...");
        saveDocument();
      }
    }, AUTO_SAVE_INTERVAL);
    return () => {
      if (autoSaveTimeoutRef.current) clearInterval(autoSaveTimeoutRef.current);
    };
  }, [hasUnsavedChanges, isSaving, saveDocument, document]); // Added document

  // Title editing handlers (largely unchanged)
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
  };

  const handleTitleSave = async () => {
    if (!document || title.trim() === document.title) {
      setIsEditingTitle(false);
      return;
    }
    if (!title.trim()) {
      setTitle(document.title); // Revert if empty
      setIsEditingTitle(false);
      toast.error("Title cannot be empty");
      return;
    }
    await saveDocument(content, title.trim()); // Pass current content state
    setIsEditingTitle(false);
  };


  // Editor onInput handler
  const handleInput = useCallback(() => {
    if (isLoadingDocumentContent.current) {
      console.log("⌨️ Input event skipped during document load.");
      return;
    }
    console.log("⌨️ Editor onInput event triggered.");
    // The useTextChange hook's handleTextChange is already debounced.
    // It will internally call getCurrentText() from the editorRef.
    textChangeHook.handleTextChange(); 
  }, [textChangeHook]);

  // onKeyDown for Enter - simplified and robust
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand('insertLineBreak'); // More robust way to insert line break
      // execCommand handles cursor placement automatically.
      // Then, trigger text change processing.
      textChangeHook.forceProcessChange();
    }
  }, [textChangeHook]);

  // onPaste - simplified and robust
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    // execCommand handles cursor placement.
    // Then, trigger text change processing.
    textChangeHook.forceProcessChange();
  }, [textChangeHook]);


  // ... (formatLastSaved, cleanup useEffect, and JSX structure remain similar)
  // Ensure the editor div has onInput, onKeyDown, onPaste attached:
  // <div ref={editorRef} onInput={handleInput} onKeyDown={handleKeyDown} onPaste={handlePaste} ... >
  
  if (!document) {
    // ... (no document selected JSX - unchanged)
     return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        {/* ... (placeholder content) ... */}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header (title, save button, status bar) */}
      <div className="shrink-0 border-b border-slate-200 p-4">
        {/* ... (Title input/display logic - unchanged) ... */}
         <div className="mb-2 flex items-center justify-between">
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleTitleSave();
                else if (e.key === "Escape") {
                  setTitle(document.title);
                  setIsEditingTitle(false);
                }
              }}
              onBlur={handleTitleSave}
              className="h-auto border-none p-0 text-2xl font-bold focus-visible:ring-0"
              autoFocus
            />
          ) : (
            <h1
              className="cursor-pointer text-2xl font-bold text-slate-800 transition-colors hover:text-blue-600"
              onClick={() => setIsEditingTitle(true)}
            >
              {title}
            </h1>
          )}
          <Button
            onClick={() => saveDocument()}
            disabled={!hasUnsavedChanges || isSaving}
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Save className="mr-2 size-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
        {/* ... (Status bar logic - unchanged, ensure it uses correct state variables like `isGrammarChecking`, `errors.length`) ... */}
        <div className="flex items-center gap-4 text-sm text-slate-500">
          {/* Save Status */}
          <div className="flex items-center gap-1">
            {isSaving ? ( <><Clock className="size-4 animate-spin" /><span>Saving...</span></>
            ) : saveError ? (<><AlertCircle className="size-4 text-red-500" /> <span className="text-red-500">Save failed</span></>
            ) : hasUnsavedChanges ? (<><Clock className="size-4 text-amber-500" /><span className="text-amber-600">Unsaved changes</span></>
            ) : (<><CheckCircle className="size-4 text-green-500" /><span>Saved</span></>
            )}
          </div>
          {/* Grammar Status */}
           <div className="flex items-center gap-1">
            {isGrammarChecking ? ( <><Clock className="size-4 animate-spin text-blue-500" /> <span className="text-blue-600">Checking...</span></>
            ) : grammarCheckError ? ( <><AlertCircle className="size-4 text-red-500" /> <span className="text-red-500">Check failed</span></>
            ) : lastGrammarCheck ? ( <><CheckCircle className="size-4 text-green-500" /> <span>{errors.length} suggestions</span></>
            ) : ( <><Clock className="size-4 text-slate-400" /><span>Pending</span></>
            )}
          </div>
          {/* Word Count & Last Saved */}
          {/* ... */}
        </div>
      </div>

      {/* Editor Area */}
      <div className="relative flex-1 overflow-auto p-6">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="prose prose-slate prose-lg ltr mx-auto min-h-full w-full max-w-4xl focus:outline-none"
          style={{
            lineHeight: "1.8",
            fontSize: "16px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            direction: "ltr", // Explicitly set LTR for consistency
            textAlign: "left",
            unicodeBidi: "embed",
            whiteSpace: "pre-wrap", // Important for preserving line breaks
            overflowWrap: "break-word",
          }}
          onInput={handleInput} // Use the new onInput handler
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        >
          {/* Content is now primarily managed by direct DOM updates and onInput */}
        </div>

        <ErrorHighlight
          errors={errors}
          containerRef={editorRef} // Pass the ref directly
          onErrorClick={handleErrorClick}
          onErrorHover={handleErrorHover}
        />
        
        {/* ... (Debug Info if needed) ... */}
      </div>
    </div>
  );
}
```
**Step 4: (Important) Review `ErrorHighlight.tsx` for Consistency**

The `ErrorHighlight` component uses `textProcessor.htmlToPlainText(containerRef.current)` to get `plainText`. This `plainText` must be consistent with how `editorRef.current.innerText` (used by `useTextChange` and `ContentEditableEditor`) represents the content. The `TextProcessor`'s `htmlToPlainText` (via `extractTextWithMapping`) seems to handle block elements and newlines, which aligns well with `innerText`.

**Key changes and reasoning in `ContentEditableEditor.tsx`:**

1.  **`onInput` Handler:** This is now the primary way user input is captured. It calls the debounced `handleTextChange` from `useTextChange`.
2.  **`useTextChange` Integration:**
    *   Its `onTextChange` callback (`handleDebouncedTextChange` in CEE) is now responsible for syncing the React `content` state *from* the editor's current text, triggering grammar checks, and crucially, scheduling cursor restoration *after* all state updates and potential DOM changes from `ErrorHighlight` have settled.
3.  **`isLoadingDocumentContent` Flag:** This flag prevents the `onInput` handler from interfering when a new document's content is being programmatically set into the editor.
4.  **Document Loading (`useEffect [document]`):**
    *   Sets `isLoadingDocumentContent.current = true`.
    *   Directly sets `editorRef.current.innerText = document.content`.
    *   Updates React `content` state.
    *   Calls `textChangeHook.initializeText()` to reset the baseline for `useTextChange`.
    *   Schedules cursor positioning (e.g., to start) and resets `isLoadingDocumentContent.current = false` in a `setTimeout(..., 0)`.
5.  **Cursor Restoration:**
    *   Centralized to be called via `cursorPositionHook.restorePosition()` from `handleDebouncedTextChange` (after a `setTimeout`) ensuring it runs post-DOM updates.
    *   When a new document loads, `cursorPositionHook.setPosition(0)` sets it to the start.
6.  **`onKeyDown` and `onPaste`:** Simplified to use `document.execCommand` which often handles cursor placement more reliably for these specific actions. They then call `textChangeHook.forceProcessChange()` to immediately update states and trigger highlighting/grammar checks, which will also manage cursor restoration.
7.  **Removed `useEffect` on `content` state:** The direct synchronization from `content` state back to `editorRef.current.innerText` was removed to avoid conflicts. The flow is now: User DOM input -> `onInput` -> `useTextChange` updates React `content` state. The DOM is the leader for user edits.

**Testing Considerations:**

*   Rapid typing.
*   Typing and pausing (testing debounce and grammar check triggers).
*   Pasting content.
*   Pressing Enter multiple times.
*   Clicking to move the cursor.
*   Arrow key navigation.
*   Editing text near existing error highlights.
*   Editing text that causes highlights to appear/disappear.
*   Switching between documents.

This refactor aims for a more predictable flow where user input directly modifies the DOM, React state syncs to this, and cursor management happens in a coordinated way after DOM changes from highlighting or other operations. The `setTimeout(..., 0)` for cursor restoration is key to letting React and other DOM manipulations finish first.