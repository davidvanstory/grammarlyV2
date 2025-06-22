"use client"

import { useState, useEffect } from "react"
import { SelectDocument } from "@/db/schema/documents-schema"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from "@/components/ui/resizable"
import { TrackedError } from "@/types/grammar-types"
import { MedicalInformation, MedicalField } from "@/types/medical-types"
import { analyzeMedicalInformationAction } from "@/actions/ai/medical-actions"
import DocumentListSidebar from "./document-list-sidebar"
import ContentEditableEditor from "./content-editable-editor"
import UnifiedSuggestionsSidebar from "./unified-suggestions-sidebar"

/*
<ai_context>
Main layout component for the Med Writer document editor.
Implements resizable panels with document list (left), editor (center), and unified suggestions sidebar (right).
The right sidebar features tabs for switching between medical information tracking and grammar suggestions.
Defaults to medical information tab and resets on document changes.
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
    "🎨 Rendering four-panel layout with documents:",
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

  // Phase 5 - Grammar checking state
  const [grammarErrors, setGrammarErrors] = useState<TrackedError[]>([])
  const [isGrammarChecking, setIsGrammarChecking] = useState(false)

  // Medical information tracking state (new modular feature)
  const [medicalAnalysis, setMedicalAnalysis] =
    useState<MedicalInformation | null>(null)
  const [isMedicalAnalyzing, setIsMedicalAnalyzing] = useState(false)
  const [medicalAnalysisError, setMedicalAnalysisError] = useState<
    string | null
  >(null)

  console.log(
    "📄 Current selected document:",
    selectedDocument?.title || "None"
  )
  console.log(
    "🏥 Current medical analysis:",
    medicalAnalysis?.id || "None",
    medicalAnalysis?.overallCompleteness || 0,
    "%"
  )

  // Clear state when document changes
  useEffect(() => {
    console.log(
      "🧹 Document changed, clearing grammar errors and medical analysis state"
    )
    setGrammarErrors([])
    setIsGrammarChecking(false)
    setMedicalAnalysis(null)
    setIsMedicalAnalyzing(false)
    setMedicalAnalysisError(null)
  }, [selectedDocument?.id]) // Only trigger when document ID changes

  // Handle document selection
  const handleDocumentSelect = (document: SelectDocument) => {
    console.log("📄 Selecting document:", document.title)
    console.log(
      "🧹 Will clear grammar errors and medical analysis for new document"
    )
    setSelectedDocument(document)
    // Note: State will be cleared by the useEffect above
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

  // Phase 5 - Handle grammar check results
  const handleGrammarCheck = (errors: TrackedError[]) => {
    console.log("🤖 Received grammar check results:", errors.length, "errors")
    setGrammarErrors(errors)
    setIsGrammarChecking(false)
  }

  // Phase 5 - Handle grammar error clicks
  const handleGrammarErrorClick = (error: TrackedError) => {
    console.log("🖱️ Grammar error clicked:", error.id, error.type)
    // TODO: Scroll to error position and highlight it in Phase 6
  }

  // Medical Information Analysis Handlers (new modular feature)
  const handleMedicalAnalysis = async (
    text: string,
    forceRecheck: boolean = false
  ) => {
    console.log("🏥 Starting medical information analysis...")
    console.log("📝 Text length:", text.length)
    console.log("🔄 Force recheck:", forceRecheck)

    // Skip if text is too short
    if (text.trim().length < 10) {
      console.log("⚠️ Text too short for medical analysis")
      return
    }

    setIsMedicalAnalyzing(true)
    setMedicalAnalysisError(null)

    try {
      const result = await analyzeMedicalInformationAction({
        text,
        previousAnalysis: medicalAnalysis || undefined,
        forceRecheck
      })

      if (result.isSuccess) {
        console.log("✅ Medical analysis successful")
        console.log(
          "📊 Completeness:",
          result.data.analysis.overallCompleteness,
          "%"
        )
        setMedicalAnalysis(result.data.analysis)
        setMedicalAnalysisError(null)
      } else {
        console.error("❌ Medical analysis failed:", result.message)
        setMedicalAnalysisError(result.message)
      }
    } catch (error) {
      console.error("❌ Medical analysis error:", error)
      setMedicalAnalysisError("Medical analysis service unavailable")
    } finally {
      setIsMedicalAnalyzing(false)
    }
  }

  // Handle medical field clicks
  const handleMedicalFieldClick = (field: MedicalField) => {
    console.log(
      "🖱️ Medical field clicked:",
      field.type,
      field.isPresent ? "present" : "missing"
    )
    // TODO: Could scroll to editor and focus on relevant field or show tooltip
  }

  // Handle medical analysis refresh
  const handleMedicalAnalysisRefresh = () => {
    if (selectedDocument?.content) {
      console.log("🔄 Refreshing medical analysis...")
      handleMedicalAnalysis(selectedDocument.content, true)
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
        <ResizablePanel defaultSize={45} minSize={30}>
          <ContentEditableEditor
            document={selectedDocument}
            onDocumentUpdate={handleDocumentUpdate}
            onGrammarCheck={handleGrammarCheck}
            onMedicalAnalysis={handleMedicalAnalysis}
          />
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-slate-200 transition-colors hover:bg-slate-300"
        />

        {/* Right Panel - Unified Suggestions Sidebar */}
        <ResizablePanel
          defaultSize={35}
          minSize={25}
          maxSize={50}
          collapsible={true}
          onCollapse={() => setRightPanelCollapsed(true)}
          onExpand={() => setRightPanelCollapsed(false)}
          className={rightPanelCollapsed ? "min-w-0" : "min-w-80"}
        >
          <UnifiedSuggestionsSidebar
            document={selectedDocument}
            grammarErrors={grammarErrors}
            isGrammarChecking={isGrammarChecking}
            onGrammarErrorClick={handleGrammarErrorClick}
            medicalAnalysis={medicalAnalysis}
            isMedicalAnalyzing={isMedicalAnalyzing}
            onMedicalFieldClick={handleMedicalFieldClick}
            onMedicalRefresh={handleMedicalAnalysisRefresh}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
