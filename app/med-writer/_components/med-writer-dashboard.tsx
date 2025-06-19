"use client"

/*
<ai_context>
Main Med Writer dashboard component with three-panel layout:
- Left: Document list with create/edit/delete functionality
- Center: Text editor with auto-save and readability scoring
- Right: Grammar suggestions and AI analysis panel
</ai_context>
*/

import { useState, useCallback, useEffect } from "react"
import { SelectDocument } from "@/db/schema/documents-schema"
import DocumentList from "./document-list"
import DocumentEditor from "./document-editor"
import SuggestionsPanel from "./suggestions-panel"
import { toast } from "sonner"
import {
  createDocumentAction,
  updateDocumentAction,
  deleteDocumentAction
} from "@/actions/db/documents-actions"

interface MedWriterDashboardProps {
  initialDocuments: SelectDocument[]
  userId: string
}

export default function MedWriterDashboard({
  initialDocuments,
  userId
}: MedWriterDashboardProps) {
  console.log(
    "Rendering Med Writer dashboard with documents:",
    initialDocuments.length
  )

  const [documents, setDocuments] = useState<SelectDocument[]>(initialDocuments)
  const [selectedDocument, setSelectedDocument] =
    useState<SelectDocument | null>(initialDocuments[0] || null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Auto-save functionality
  const handleDocumentUpdate = useCallback(
    async (
      documentId: string,
      updates: { title?: string; content?: string }
    ) => {
      if (!selectedDocument) return

      console.log("Auto-saving document:", documentId, updates)
      setIsSaving(true)

      try {
        const result = await updateDocumentAction(documentId, userId, updates)
        if (result.isSuccess) {
          // Update local state
          setDocuments(prev =>
            prev.map(doc =>
              doc.id === documentId ? { ...doc, ...updates } : doc
            )
          )
          setSelectedDocument(prev => (prev ? { ...prev, ...updates } : null))
          console.log("Document auto-saved successfully")
        } else {
          console.error("Failed to auto-save document:", result.message)
          toast.error("Failed to save changes")
        }
      } catch (error) {
        console.error("Error auto-saving document:", error)
        toast.error("Failed to save changes")
      } finally {
        setIsSaving(false)
      }
    },
    [selectedDocument, userId]
  )

  // Create new document
  const handleCreateDocument = useCallback(async () => {
    console.log("Creating new document...")
    setIsCreating(true)

    try {
      const result = await createDocumentAction({
        userId,
        title: "Untitled Document",
        content: ""
      })

      if (result.isSuccess) {
        console.log("New document created:", result.data.id)
        setDocuments(prev => [result.data, ...prev])
        setSelectedDocument(result.data)
        toast.success("New document created")
      } else {
        console.error("Failed to create document:", result.message)
        toast.error("Failed to create document")
      }
    } catch (error) {
      console.error("Error creating document:", error)
      toast.error("Failed to create document")
    } finally {
      setIsCreating(false)
    }
  }, [userId])

  // Delete document
  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      console.log("Deleting document:", documentId)

      try {
        const result = await deleteDocumentAction(documentId, userId)

        if (result.isSuccess) {
          console.log("Document deleted successfully")
          setDocuments(prev => prev.filter(doc => doc.id !== documentId))

          // If deleted document was selected, select another one
          if (selectedDocument && selectedDocument.id === documentId) {
            const remainingDocs = documents.filter(doc => doc.id !== documentId)
            setSelectedDocument(remainingDocs[0] || null)
          }

          toast.success("Document deleted")
        } else {
          console.error("Failed to delete document:", result.message)
          toast.error("Failed to delete document")
        }
      } catch (error) {
        console.error("Error deleting document:", error)
        toast.error("Failed to delete document")
      }
    },
    [selectedDocument, documents, userId]
  )

  console.log("Current selected document:", selectedDocument?.id || "none")

  return (
    <div className="grid h-[800px] grid-cols-12 gap-6">
      {/* Left Sidebar - Document List */}
      <div className="col-span-3">
        <DocumentList
          documents={documents}
          selectedDocument={selectedDocument}
          onSelectDocument={setSelectedDocument}
          onCreateDocument={handleCreateDocument}
          onDeleteDocument={handleDeleteDocument}
          isCreating={isCreating}
        />
      </div>

      {/* Center Panel - Text Editor */}
      <div className="col-span-6">
        <DocumentEditor
          document={selectedDocument}
          onUpdateDocument={handleDocumentUpdate}
          isSaving={isSaving}
        />
      </div>

      {/* Right Sidebar - Suggestions Panel */}
      <div className="col-span-3">
        <SuggestionsPanel document={selectedDocument} />
      </div>
    </div>
  )
}
