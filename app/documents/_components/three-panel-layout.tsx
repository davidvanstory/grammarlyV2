"use client"

import { useState } from "react"
import { SelectDocument } from "@/db/schema/documents-schema"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from "@/components/ui/resizable"
import DocumentListSidebar from "./document-list-sidebar"
import ContentEditableEditor from "./content-editable-editor"
import GrammarSuggestionsSidebar from "./grammar-suggestions-sidebar"

/*
<ai_context>
Main three-panel layout component for the Med Writer document editor.
Implements resizable panels with document list (left), editor (center), and grammar suggestions (right).
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

  // State for currently selected document
  const [selectedDocument, setSelectedDocument] =
    useState<SelectDocument | null>(
      initialDocuments.length > 0 ? initialDocuments[0] : null
    )

  // State for documents list (will be updated when documents are created/deleted)
  const [documents, setDocuments] = useState<SelectDocument[]>(initialDocuments)

  // State for panel visibility
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)

  console.log(
    "📄 Current selected document:",
    selectedDocument?.title || "None"
  )

  // Handle document selection
  const handleDocumentSelect = (document: SelectDocument) => {
    console.log("📄 Selecting document:", document.title)
    setSelectedDocument(document)
  }

  // Handle document creation
  const handleDocumentCreate = (newDocument: SelectDocument) => {
    console.log("📄 Adding new document to list:", newDocument.title)
    setDocuments(prev => [newDocument, ...prev])
    setSelectedDocument(newDocument)
  }

  // Handle document deletion
  const handleDocumentDelete = (documentId: string) => {
    console.log("📄 Removing document from list:", documentId)
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))

    // If deleted document was selected, select the first remaining document
    if (selectedDocument?.id === documentId) {
      const remainingDocs = documents.filter(doc => doc.id !== documentId)
      setSelectedDocument(remainingDocs.length > 0 ? remainingDocs[0] : null)
    }
  }

  // Handle document updates
  const handleDocumentUpdate = (updatedDocument: SelectDocument) => {
    console.log("📄 Updating document in list:", updatedDocument.title)
    setDocuments(prev =>
      prev.map(doc => (doc.id === updatedDocument.id ? updatedDocument : doc))
    )

    // Update selected document if it's the one being updated
    if (selectedDocument?.id === updatedDocument.id) {
      setSelectedDocument(updatedDocument)
    }
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
          <GrammarSuggestionsSidebar document={selectedDocument} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
