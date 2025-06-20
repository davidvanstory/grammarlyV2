Okay, this is a comprehensive codebase for a medical writing application with a focus on grammar checking. The core of your request is to accurately highlight text in the `contentEditable` editor based on JSON responses from an AI. This is a non-trivial task due to the nature of `contentEditable` and the need to map plain text offsets to a potentially complex DOM structure.

Here's a detailed review and a plan to achieve accurate highlighting:

**Overall Codebase Structure & Quality:**

*   **Well-Organized:** The project structure is logical, separating concerns into actions, components, DB schemas, hooks, libs, and types.
*   **Modern Tech Stack:** Next.js, Clerk, Drizzle, Tailwind, Shadcn are excellent choices.
*   **Comprehensive Features:** You've laid the groundwork for many features (auth, document management, editor, grammar checking, error highlighting).
*   **Type Safety:** Good use of TypeScript throughout. `grammar-types.ts` and `document-types.ts` are well-defined.
*   **Server Actions:** Proper use of Next.js Server Actions for backend logic.
*   **Rules & Context:** The `.cursorrules` and `<ai_context>` tags are helpful for AI-assisted development.

**Focus Area: Accurate Text Highlighting in `content-editable-editor.tsx`**

The key components involved are:

1.  `app/documents/_components/content-editable-editor.tsx`: The editor itself.
2.  `components/editor/error-highlight.tsx`: Responsible for applying/clearing DOM highlights.
3.  `hooks/use-text-change.ts`: Detects text changes and attempts to update error positions.
4.  `lib/text-processor.ts`: Converts editor HTML to plain text for the AI.
5.  `lib/position-tracker.ts` & `hooks/use-cursor-position.ts`: For managing text positions and cursor.
6.  `actions/ai/grammar-actions.ts`: Calls the AI and processes the response.
7.  `lib/error-parser.ts`: Converts AI JSON errors into `TrackedError` objects.

**Core Challenge:**

The AI provides `start` and `end` character offsets based on a *plain text* version of the document. The `contentEditable` div contains HTML. You need to:

1.  Reliably convert the editor's HTML content to the *exact* plain text format the AI processes.
2.  Map the AI's plain text offsets back to specific DOM Text nodes and offsets within those nodes.
3.  Wrap these DOM ranges with `<span>` elements for highlighting.
4.  Update these highlights (or their underlying error positions) correctly when the user edits the content.

**Detailed Plan & Instructions for Accurate Highlighting:**

**Phase 1: Ensuring Consistent Plain Text Representation**

*   **Problem:** The AI sees plain text. Your highlighting logic needs to find the corresponding segments in the DOM. If the plain text generation for the AI differs from how `error-highlight.tsx` interprets the DOM's text content, offsets will be wrong.
*   **Solution:**
    1.  **Standardize Plain Text Generation:**
        *   The `TextProcessor` class (`lib/text-processor.ts`) has `htmlToPlainText` and `extractTextWithMapping`. The latter is more robust as it can provide a map.
        *   In `content-editable-editor.tsx` -> `performGrammarCheck`, when you prepare the `text` for the API, ensure it's generated using a consistent method. `editorRef.current.innerText` is often used, but it has browser inconsistencies (especially with newlines for block elements).
        *   **Recommendation:** Use `TextProcessor.extractTextWithMapping(editorRef.current).plainText` (or a similar method from your `TextProcessor`) to get the text for the AI. This processor should handle newlines (e.g., for `<p>`, `<div>`, `<br>`) in a defined way.
    2.  **Make `ErrorHighlight` Aware:** The `error-highlight.tsx` component, when traversing the DOM to find highlight locations, must reconstruct plain text offsets in a way that mirrors the method used in step 1.1. The current `TreeWalker` approach is good, but pay close attention to how `currentOffset` is accumulated, especially around block elements and whitespace.

**Phase 2: Robust DOM Range Finding and Wrapping (`error-highlight.tsx`)**

*   **Current State:** `error-highlight.tsx` uses a `TreeWalker` to find text nodes and `highlightTextRange` to calculate offsets. `wrapTextInSpan` then splits text nodes and uses `range.surroundContents()`.
*   **Improvements & Verification:**
    1.  **`highlightTextRange` Accuracy:**
        *   The core of this function is iterating through text nodes and accumulating an `currentOffset`. This offset must precisely match the character count of the plain text version that the AI's error positions refer to.
        *   **Newline Handling:** If your `TextProcessor` inserts `\n` for `<p>` tags, `highlightTextRange` needs to account for this when calculating offsets if it's not directly part of a text node's `textContent`. Typically, `textContent` of a `<p>` doesn't include the newline, but `innerText` might. `TreeWalker` on `SHOW_TEXT` only gives you text nodes.
        *   **Recommendation:** The `currentOffset` in `highlightTextRange` should *only* be incremented by `node.textContent.length`. The consistency then relies on the plain text sent to AI *also* being a direct concatenation of all text nodes, with newlines handled explicitly if needed (e.g., AI prompt specifies that newlines represent paragraph breaks). Your current AI prompt doesn't specify newline handling, but implies it should handle structured text.
    2.  **`wrapTextInSpan` Logic:**
        *   The logic `const middle = textNode.splitText(startInNode); middle.splitText(endInNode - startInNode); ... range.selectNode(middle); range.surroundContents(span);` is generally correct for wrapping a segment *within a single text node*.
        *   **Cross-Node Highlighting:** If an error spans multiple text nodes (e.g., "text **bold** more text" where "bold more" is an error), this logic needs extension. The current `highlightTextRange` attempts to identify the start and end within a single node. If an error crosses nodes, you'll need to wrap segments in each affected text node.
            *   **Modified `highlightTextRange` (Conceptual):**
                ```typescript
                // In error-highlight.tsx
                function highlightTextRange(
                  container: HTMLElement,
                  start: number, // Plain text offset
                  end: number,   // Plain text offset
                  error: TrackedError
                ): boolean {
                  let currentPlainTextOffset = 0;
                  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
                  let node;
                  let success = false;

                  const nodesToWrap: Array<{ textNode: Text, startInNode: number, endInNode: number }> = [];

                  while ((node = walker.nextNode() as Text | null)) {
                    const nodeText = node.textContent || "";
                    const nodeLength = nodeText.length;

                    if (currentPlainTextOffset + nodeLength <= start) { // Node is entirely before the error
                      currentPlainTextOffset += nodeLength;
                      continue;
                    }

                    // At this point, the error starts in or before this node,
                    // or this node is part of an ongoing error span.

                    const errorStartInThisNode = Math.max(0, start - currentPlainTextOffset);
                    const errorEndInThisNode = Math.min(nodeLength, end - currentPlainTextOffset);

                    if (errorStartInThisNode < errorEndInThisNode) { // There's something to highlight in this node
                       nodesToWrap.push({
                           textNode: node,
                           startInNode: errorStartInThisNode,
                           endInNode: errorEndInThisNode
                       });
                       success = true; // Mark that we found at least one segment
                    }

                    currentPlainTextOffset += nodeLength;
                    if (currentPlainTextOffset >= end) { // We've passed the end of the error
                      break;
                    }
                  }

                  if (!success) {
                      console.warn(`Could not find DOM range for error ID ${error.id}: "${error.original}" at ${start}-${end}`);
                      // Optional: Fallback to validate with error.original if positions are slightly off due to normalization.
                      // This is complex and should be a last resort.
                      const extractedText = container.innerText.substring(start, end);
                      if (extractedText !== error.original) {
                          console.warn(`Text mismatch: Expected "${error.original}", Got "${extractedText}"`);
                      }
                      return false;
                  }
                  
                  // Wrap identified segments. Iterate in reverse to avoid issues with node splitting.
                  for (let i = nodesToWrap.length - 1; i >= 0; i--) {
                      const { textNode, startInNode, endInNode } = nodesToWrap[i];
                      wrapTextInSpan(textNode, startInNode, endInNode, error);
                  }
                  return true;
                }
                ```
            *   Ensure `wrapTextInSpan` is robust and handles being called multiple times for the same error if it spans nodes.
    3.  **Validation (Sanity Check):**
        *   The check `if (container.innerText.substring(start, end) !== error.original)` in `applyHighlightForSingleError` is a good sanity check. If it fails, it indicates a discrepancy between the AI's view of the text and the DOM's current state, or an issue with position updates.
        *   **However, rely more on accurate offset mapping than string comparison for applying highlights,** as minor normalization differences can cause false negatives. Use the string comparison primarily for debugging.

**Phase 3: Handling Editor Content Updates and Highlight Synchronization**

*   **Problem:** When `content-editable-editor.tsx` updates its `content` state and re-renders the editor (e.g., `editorRef.current.innerText = content;`), previously applied highlight `<span>`s are wiped from the DOM.
*   **Solution (Current Approach is Okay with Caveats):**
    1.  The line `editorRef.current.innerText = content;` in the `useEffect` listening to `content` changes in `ContentEditableEditor` effectively resets the editor's HTML.
    2.  This is acceptable *if* `ErrorHighlight` is designed to re-apply all highlights from scratch every time it renders based on the `errors` prop.
    3.  The flow:
        *   User types -> `useTextChange` detects change.
        *   `handleTextChangeWithPositionTracking` updates `content` state.
        *   `ContentEditableEditor` re-renders. `useEffect[content]` updates `editorRef.current.innerText`.
        *   `ErrorHighlight` also re-renders. Its `useEffect[errors, containerRef]` calls `applyHighlights`.
        *   `applyHighlights` calls `clearHighlights()` then re-applies everything.
    4.  **Key:** `TrackedError.currentPosition` *must* be accurately updated by `hooks/use-text-change.ts`'s `updateErrorPositions` function before `ErrorHighlight` re-applies highlights.

**Phase 4: Accurate Error Position Updates During User Edits (`hooks/use-text-change.ts`)**

*   **Problem:** As the user types, inserts, or deletes text, the character offsets of existing errors change.
*   **Current State:** `useTextChange` calls `updateErrorPositions` (which seems to be defined locally within it, or is intended to be called with its output).
    ```typescript
    // hooks/use-text-change.ts -> local updateErrorPositions
    function updateErrorPositions(
      errors: TrackedError[],
      change: TextChange
    ): TrackedError[] {
      // ... logic ...
      // Error overlaps with the change - mark as potentially invalid
      // else if (...) {
      //   updatedErrors.push({
      //     ...error,
      //     status: "pending" as const, // Will need revalidation
      //   });
      // }
      // ...
    }
    ```
*   **Improvements:**
    1.  **Robust Position Shifting:**
        *   **Insertion:** If text is inserted *before* an error, shift `error.currentPosition.start` and `error.currentPosition.end` by `change.newText.length`.
        *   **Deletion:** If text is deleted *before* an error, shift by `-change.oldText.length`.
        *   **Overlapping Changes:** This is the hardest.
            *   If the change is *within* an error: The error might be partially resolved, its length changed, or it might be entirely gone. Marking as `"pending"` and requiring re-validation (another AI check on that segment) is a safe and common strategy.
            *   If an error is *within* the changed (deleted/replaced) range: The error is likely gone.
    2.  **No Direct Modification of `errors` Prop:** The `useTextChangeWithErrors` hook receives `errors` as a prop. It should call `onErrorsUpdate` with a *new array* of updated errors, not mutate the incoming `errors` array. The current implementation in the file `hooks/use-text-change.ts` seems to correctly return a new array.
    3.  **Clarity:** The `updateErrorPositions` function used by `useTextChangeWithErrors` in `hooks/use-text-change.ts` is critical. Its logic for adjusting `currentPosition` based on `TextChange` needs to be perfect for insertions/deletions *outside* the error, and clear about its strategy (e.g., invalidate/mark as "pending") for overlaps.

**Phase 5: Grammar Check Request and Response Handling**

*   **`actions/ai/grammar-actions.ts`:**
    *   The `processSingleChunkWithAI` function parses the JSON. Your prompt requests "strict JSON format - NO markdown code blocks, NO backticks". The cleanup `cleanedResponse.replace(/```json\n?|\n?```/g, "")` is a good defensive measure in case the AI doesn't strictly adhere.
    *   Error validation (structure, position bounds) is good.
    *   `findCorrectPosition` is a fallback if `error.original` doesn't match at the AI-provided position. This is useful for minor desyncs.
*   **`lib/error-parser.ts`:**
    *   `ErrorParser.convertToTrackedError` correctly initializes `originalPosition` and `currentPosition`. This is vital. Ensure the convenience function `convertToTrackedErrors` uses this consistently. (It seems to: `errors.map(error => errorParser.convertToTrackedError(error))`).

**Specific Code Suggestions/Fixes:**

1.  **`content-editable-editor.tsx` - Initial Content Setting:**
    *   In the `useEffect` that listens to `document` changes:
        ```typescript
        useEffect(() => {
          if (document) {
            // ...
            // This line will strip existing highlights when a new document is loaded.
            // This is generally fine as ErrorHighlight will re-apply.
            if (editorRef.current && editorRef.current.innerText !== document.content) {
               editorRef.current.innerText = document.content; // Set plain text
            }
            // ...
            // Initial grammar check
            if (document.content.trim().length > 10) {
              setTimeout(() => {
                performGrammarCheck(document.content, true); // Use the plain text content
              }, 1000);
            }
          } else {
            if (editorRef.current) editorRef.current.innerText = ""; // Clear content
            // ...
          }
        }, [document]); // Removed performGrammarCheck from dependencies to avoid loop issues
                        // It's called conditionally inside.
        ```
    *   The `useEffect` that syncs `content` state to `editorRef.current.innerText`:
        ```typescript
        useEffect(() => {
          if (editorRef.current && content !== editorRef.current.innerText) {
            console.log(
              "📝 Synchronizing editor DOM with new content, length:",
              content.length
            );
            // Preserve cursor position before changing innerText
            const selection = window.getSelection();
            let savedRange = null;
            if (selection && selection.rangeCount > 0) {
                const currentRange = selection.getRangeAt(0);
                // Check if the cursor is inside the editor before saving
                if (editorRef.current.contains(currentRange.commonAncestorContainer)) {
                    savedRange = currentRange.cloneRange();
                }
            }

            editorRef.current.innerText = content; // This will trigger ErrorHighlight to re-run

            // Restore cursor position if possible
            if (savedRange && selection) {
                try {
                    // Adjust savedRange if necessary based on content change,
                    // or simply try to restore. For simplicity, direct restore:
                    selection.removeAllRanges();
                    selection.addRange(savedRange);
                } catch (e) {
                    console.warn("Could not restore cursor position after content sync:", e);
                    // Fallback: move cursor to end or start
                    const newRange = document.createRange();
                    newRange.selectNodeContents(editorRef.current);
                    newRange.collapse(false); // false for end, true for start
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                }
            }
          }
        }, [content]);
        ```
        **Important Note on Cursor Preservation above:** Directly re-applying `savedRange` after `innerText` modification is unreliable because the underlying DOM nodes in `savedRange` might no longer exist or be valid. A more robust cursor restoration would involve converting the `savedRange` to a character offset *before* `innerText` modification, and then re-creating a range from that offset *after* modification. Your `useCursorPosition` hook might already handle some of this, but direct `innerText` changes are tricky for external cursor managers. The `useTextChange` hook gets cursor position *before* it calls `onTextChange`, which updates `content`. This is complex. For now, the primary goal is highlight accuracy. Cursor jumping after load might be a secondary issue to fix.

2.  **`error-highlight.tsx` - Configuration:**
    *   The `highlightConfig` is well-defined.
    *   In `wrapTextInSpan`, ensure you use the properties from the `config` object that should be passed to it:
        ```typescript
        // error-highlight.tsx
        // Modify applyHighlightForSingleError to pass the config
        function applyHighlightForSingleError(
            error: TrackedError,
            container: HTMLElement
        ) {
            // ...
            const config = highlightConfig[error.type];
            if (!config) {
                console.warn("No highlight config for error type:", error.type);
                return;
            }
            highlightTextRange(container, error.currentPosition.start, error.currentPosition.end, error, config);
        }

        // Modify highlightTextRange to accept and pass config
        function highlightTextRange(
            // ...,
            config: HighlightConfig // Add this
        ): boolean {
            // ...
            // When calling wrapTextInSpan
            wrapTextInSpan(textNode, startInNode, endInNode, error, config); // Pass config
            // ...
        }

        // Modify wrapTextInSpan to use the passed config
        function wrapTextInSpan(
            textNode: Node,
            startInNode: number,
            endInNode: number,
            error: TrackedError,
            config: HighlightConfig // Add this
        ): boolean {
            // ...
            const span = document.createElement("span");
            // Use config for styling
            span.className = `${config.className} error-highlight-span your-base-error-class`; // Added a placeholder base class
            span.style.color = config.color;
            span.style.borderBottom = `2px ${config.underlineStyle} ${config.color}`; // Example using border
            // ...
        }
        ```

3.  **`lib/text-processor.ts` - `chunkTextBySentences`:**
    *   This is for chunking large texts for the AI. The logic for splitting by sentences and then grouping into chunks seems reasonable. The `maxChunkSize` helps manage token limits. Ensure the AI prompt is also included with each chunk if necessary or that the AI understands it's a partial text. Your current prompt is global.
    *   When combining results from chunks, the error offsets from each chunk need to be adjusted by the `startOffset` of that chunk in the original text. This is correctly done in `actions/ai/grammar-actions.ts`:
        ```javascript
        // actions/ai/grammar-actions.ts -> processChunkedGrammarCheck
        const adjustedErrors = chunkResult.errors.map(err => ({
            ...err,
            start: err.start + chunk.startOffset,
            end: err.end + chunk.startOffset,
            id: `${chunk.id}-${err.id}` // Ensure unique IDs
        }));
        ```
        This looks correct.

**Testing and Debugging Strategy:**

1.  **Simple Cases First:** Start with a short piece of text with one known error.
    *   Log the plain text sent to the AI.
    *   Log the AI's JSON response (especially `start`, `end`, `original`).
    *   In `error-highlight.tsx` (`highlightTextRange`), log `currentPlainTextOffset`, `node.textContent`, `start`, `end`. Verify that the correct text node and in-node offsets are found.
    *   Check if the highlight appears correctly.
2.  **Multi-Node Spanning Errors:** Test errors that span across HTML tags (e.g., "This is **an err**or").
3.  **Edge Cases:**
    *   Errors at the very beginning/end of the text.
    *   Errors adjacent to each other.
    *   Content with multiple `<br>` tags or `<p>` tags.
4.  **Editing:**
    *   Type before an error: Does the highlight shift correctly?
    *   Type after an error: Does it stay in place?
    *   Type *into* an error: Does it get marked as "pending" or re-validated?
    *   Delete text around an error.
5.  **Pasting Content:** Test pasting plain text and HTML. Your `onPaste` handler converts to plain text, which simplifies things.

By systematically verifying each step of the data flow (plain text generation, AI response, offset mapping, DOM manipulation, position updates), you can isolate and fix inaccuracies. The foundation you have is strong; it's mostly about refining the DOM interaction and offset calculations in `error-highlight.tsx` and ensuring the `currentPosition` of `TrackedError`s is impeccably maintained by `useTextChange`.