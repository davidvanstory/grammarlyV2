"use client"

import { useState, useEffect, useMemo } from "react"
import { SelectDocument } from "@/db/schema/documents-schema"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from "@/components/ui/resizable"
import { TrackedError } from "@/types/grammar-types"
import DocumentListSidebar from "./document-list-sidebar"
import ContentEditableEditor from "./content-editable-editor"
import GrammarSuggestionsSidebar from "./grammar-suggestions-sidebar"

/*
<ai_context>
Main three-panel layout component for the Med Writer document editor.
Implements resizable panels with document list (left), editor (center), and grammar suggestions (right).
Enhanced with stable selectedDocument prop to prevent infinite re-renders.
</ai_context>
*/

interface ThreePanelLayoutProps {
  initialDocuments: SelectDocument[]
  userId: string
}

export default function ThreePanelLayout({
  initialDocuments,
  userId
}: ThreePanelLayoutProps) {
  console.log(
    "🎨 Rendering three-panel layout with documents:",
    initialDocuments.length
  )

  // State for documents list (will be updated when documents are created/deleted)
  const [documents, setDocuments] = useState<SelectDocument[]>(initialDocuments)

  // Store only the ID of the selected document instead of the full object
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    initialDocuments.length > 0 ? initialDocuments[0].id : null
  )

  // State for panel visibility
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)

  // Phase 5 - Grammar checking state
  const [grammarErrors, setGrammarErrors] = useState<TrackedError[]>([])
  const [isGrammarChecking, setIsGrammarChecking] = useState(false)

  // Effect to synchronize local `documents` state and `selectedDocumentId`
  // when the `initialDocuments` prop changes.
  useEffect(() => {
    console.log("🔄 ThreePanelLayout: Syncing with new initialDocuments prop")
    setDocuments(initialDocuments)

    const currentSelectedDocExistsInNewList = initialDocuments.some(
      doc => doc.id === selectedDocumentId
    )

    if (selectedDocumentId && !currentSelectedDocExistsInNewList) {
      // Current selection is gone, select first from new list or null
      console.log(
        "🔄 ThreePanelLayout: Current selection not found in new list, selecting first document"
      )
      setSelectedDocumentId(
        initialDocuments.length > 0 ? initialDocuments[0].id : null
      )
    } else if (!selectedDocumentId && initialDocuments.length > 0) {
      // Nothing was selected, but now there are documents
      console.log(
        "🔄 ThreePanelLayout: No document was selected, selecting first available"
      )
      setSelectedDocumentId(initialDocuments[0].id)
    }
    // If current selection still exists, selectedDocumentId remains the same.
  }, [initialDocuments, selectedDocumentId]) // Ensure selectedDocumentId is a dep

  // Derive the selectedDocument object using useMemo for stability
  const selectedDocument = useMemo(() => {
    console.log("🔄 ThreePanelLayout: Recalculating selectedDocument memo")
    const found = documents.find(doc => doc.id === selectedDocumentId) || null
    console.log(
      "📄 ThreePanelLayout: Selected document:",
      found?.title || "None",
      "ID:",
      found?.id || "None"
    )
    return found
  }, [documents, selectedDocumentId])

  console.log(
    "📄 Current selected document:",
    selectedDocument?.title || "None"
  )

  // Clear grammar errors when document changes
  useEffect(() => {
    console.log(
      "🧹 ThreePanelLayout: Document ID changed, clearing grammar errors and state"
    )
    setGrammarErrors([])
    setIsGrammarChecking(false)
  }, [selectedDocumentId]) // Track ID changes instead of full object

  // Handle document selection
  const handleDocumentSelect = (document: SelectDocument) => {
    console.log(
      "📄 ThreePanelLayout: Document selected - ID:",
      document.id,
      "Title:",
      document.title
    )
    setSelectedDocumentId(document.id)
    // Grammar errors will be cleared by the useEffect above
  }

  // Handle document creation
  const handleDocumentCreate = (newDocument: SelectDocument) => {
    console.log(
      "✨ ThreePanelLayout: Document created - ID:",
      newDocument.id,
      "Title:",
      newDocument.title
    )
    setDocuments(prevDocs => [newDocument, ...prevDocs])
    setSelectedDocumentId(newDocument.id) // Select the new document
    // Grammar errors will be cleared by the useEffect above
  }

  // Handle document deletion
  const handleDocumentDelete = (documentId: string) => {
    console.log(
      "🗑️ ThreePanelLayout: Document delete requested - ID:",
      documentId
    )
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId))

    if (selectedDocumentId === documentId) {
      // If deleted document was selected, select the first remaining document or null
      const remainingDocs = documents.filter(doc => doc.id !== documentId)
      const nextSelectedId =
        remainingDocs.length > 0 ? remainingDocs[0].id : null
      console.log(
        "🔄 ThreePanelLayout: Deleted document was selected, switching to:",
        nextSelectedId
      )
      setSelectedDocumentId(nextSelectedId)
      // Grammar errors will be cleared by the useEffect above
    }
  }

  // Handle document updates
  const handleDocumentUpdate = (updatedDocument: SelectDocument) => {
    console.log(
      "💾 ThreePanelLayout: Document update received - ID:",
      updatedDocument.id,
      "Title:",
      updatedDocument.title
    )
    setDocuments(prevDocs =>
      prevDocs.map(doc =>
        doc.id === updatedDocument.id ? updatedDocument : doc
      )
    )
    // No need to call setSelectedDocumentId if the ID hasn't changed,
    // useMemo will provide the updated selectedDocument object automatically.
  }

  // Phase 5 - Handle grammar check results
  const handleGrammarCheck = (errors: TrackedError[]) => {
    console.log(
      "✍️ ThreePanelLayout: Grammar check results received - Errors:",
      errors.length
    )
    setGrammarErrors(errors)
    setIsGrammarChecking(false)
  }

  // Phase 5 - Handle grammar error clicks
  const handleGrammarErrorClick = (error: TrackedError) => {
    console.log("🖱️ Grammar error clicked:", error.id, error.type)
    // TODO: Scroll to error position and highlight it in Phase 6
  }

  return (
    <div className="h-full bg-slate-50">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Document List */}
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={35}
          collapsible={true}
          onCollapse={() => setLeftPanelCollapsed(true)}
          onExpand={() => setLeftPanelCollapsed(false)}
          className={leftPanelCollapsed ? "min-w-0" : "min-w-60"}
        >
          <DocumentListSidebar
            documents={documents}
            selectedDocument={selectedDocument}
            userId={userId}
            onDocumentSelect={handleDocumentSelect}
            onDocumentCreate={handleDocumentCreate}
            onDocumentDelete={handleDocumentDelete}
            onDocumentUpdate={handleDocumentUpdate}
          />
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-slate-200 transition-colors hover:bg-slate-300"
        />

        {/* Center Panel - Text Editor */}
        <ResizablePanel defaultSize={55} minSize={30}>
          <ContentEditableEditor
            document={selectedDocument}
            onDocumentUpdate={handleDocumentUpdate}
            onGrammarCheck={handleGrammarCheck}
          />
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-slate-200 transition-colors hover:bg-slate-300"
        />

        {/* Right Panel - Grammar Suggestions */}
        <ResizablePanel
          defaultSize={25}
          minSize={20}
          maxSize={40}
          collapsible={true}
          onCollapse={() => setRightPanelCollapsed(true)}
          onExpand={() => setRightPanelCollapsed(false)}
          className={rightPanelCollapsed ? "min-w-0" : "min-w-72"}
        >
          <GrammarSuggestionsSidebar
            document={selectedDocument}
            errors={grammarErrors}
            isGrammarChecking={isGrammarChecking}
            onErrorClick={handleGrammarErrorClick}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
