"use client"

import { useState } from "react"
import {
  Plus,
  FileText,
  MoreVertical,
  Trash2,
  Edit3,
  Calendar,
  LogOut
} from "lucide-react"
import { SelectDocument } from "@/db/schema/documents-schema"
import {
  createDocumentAction,
  deleteDocumentAction,
  updateDocumentAction
} from "@/actions/db/documents-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { SignOutButton } from "@clerk/nextjs"

/*
<ai_context>
Document list sidebar component for the Med Writer application.
Displays user's documents with create, edit, delete, and selection functionality.
</ai_context>
*/

interface DocumentListSidebarProps {
  documents: SelectDocument[]
  selectedDocument: SelectDocument | null
  userId: string
  onDocumentSelect: (document: SelectDocument) => void
  onDocumentCreate: (document: SelectDocument) => void
  onDocumentDelete: (documentId: string) => void
  onDocumentUpdate: (document: SelectDocument) => void
}

export default function DocumentListSidebar({
  documents,
  selectedDocument,
  userId,
  onDocumentSelect,
  onDocumentCreate,
  onDocumentDelete,
  onDocumentUpdate
}: DocumentListSidebarProps) {
  console.log(
    "📄 Rendering document list sidebar with",
    documents.length,
    "documents"
  )

  // State for creating new documents
  const [isCreating, setIsCreating] = useState(false)
  const [newDocumentTitle, setNewDocumentTitle] = useState("")

  // State for editing document titles
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(
    null
  )
  const [editingTitle, setEditingTitle] = useState("")

  // State for delete confirmation
  const [documentToDelete, setDocumentToDelete] =
    useState<SelectDocument | null>(null)

  // State for loading states
  const [creatingDocument, setCreatingDocument] = useState(false)
  const [deletingDocument, setDeletingDocument] = useState(false)
  const [updatingDocument, setUpdatingDocument] = useState(false)

  // Handle creating a new document
  const handleCreateDocument = async () => {
    if (!newDocumentTitle.trim()) {
      toast.error("Please enter a document title")
      return
    }

    console.log("📄 Creating new document:", newDocumentTitle)
    setCreatingDocument(true)

    try {
      const result = await createDocumentAction({
        title: newDocumentTitle.trim(),
        content: "",
        userId
      })

      if (result.isSuccess) {
        console.log("✅ Document created successfully:", result.data.id)
        onDocumentCreate(result.data)
        setNewDocumentTitle("")
        setIsCreating(false)
        toast.success("Document created successfully")
      } else {
        console.error("❌ Failed to create document:", result.message)
        toast.error(result.message)
      }
    } catch (error) {
      console.error("❌ Error creating document:", error)
      toast.error("Failed to create document")
    } finally {
      setCreatingDocument(false)
    }
  }

  // Handle deleting a document
  const handleDeleteDocument = async (document: SelectDocument) => {
    console.log("📄 Deleting document:", document.title)
    setDeletingDocument(true)

    try {
      const result = await deleteDocumentAction(document.id)

      if (result.isSuccess) {
        console.log("✅ Document deleted successfully:", document.id)
        onDocumentDelete(document.id)
        setDocumentToDelete(null)
        toast.success("Document deleted successfully")
      } else {
        console.error("❌ Failed to delete document:", result.message)
        toast.error(result.message)
      }
    } catch (error) {
      console.error("❌ Error deleting document:", error)
      toast.error("Failed to delete document")
    } finally {
      setDeletingDocument(false)
    }
  }

  // Handle updating document title
  const handleUpdateTitle = async (document: SelectDocument) => {
    if (!editingTitle.trim() || editingTitle.trim() === document.title) {
      setEditingDocumentId(null)
      setEditingTitle("")
      return
    }

    console.log(
      "📄 Updating document title:",
      document.title,
      "->",
      editingTitle
    )
    setUpdatingDocument(true)

    try {
      const result = await updateDocumentAction(document.id, {
        title: editingTitle.trim()
      })

      if (result.isSuccess) {
        console.log("✅ Document title updated successfully")
        onDocumentUpdate(result.data)
        setEditingDocumentId(null)
        setEditingTitle("")
        toast.success("Document title updated")
      } else {
        console.error("❌ Failed to update document title:", result.message)
        toast.error(result.message)
      }
    } catch (error) {
      console.error("❌ Error updating document title:", error)
      toast.error("Failed to update document title")
    } finally {
      setUpdatingDocument(false)
    }
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(date))
  }

  // Get document preview (first 100 characters)
  const getDocumentPreview = (content: string) => {
    if (!content.trim()) return "No content yet..."
    return content.length > 100 ? content.substring(0, 100) + "..." : content
  }

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <FileText className="size-5 text-blue-600" />
            Documents
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCreating(true)}
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={creatingDocument}
            >
              <Plus className="size-4" />
            </Button>
            <SignOutButton>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                title="Sign Out"
              >
                <LogOut className="size-4" />
              </Button>
            </SignOutButton>
          </div>
        </div>

        {/* New document creation */}
        {isCreating && (
          <div className="space-y-2">
            <Input
              placeholder="Enter document title..."
              value={newDocumentTitle}
              onChange={e => setNewDocumentTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  handleCreateDocument()
                } else if (e.key === "Escape") {
                  setIsCreating(false)
                  setNewDocumentTitle("")
                }
              }}
              className="text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCreateDocument}
                size="sm"
                disabled={creatingDocument || !newDocumentTitle.trim()}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {creatingDocument ? "Creating..." : "Create"}
              </Button>
              <Button
                onClick={() => {
                  setIsCreating(false)
                  setNewDocumentTitle("")
                }}
                size="sm"
                variant="outline"
                disabled={creatingDocument}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Document List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {documents.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <FileText className="mx-auto mb-3 size-12 text-slate-300" />
              <p className="text-sm">No documents yet</p>
              <p className="mt-1 text-xs text-slate-400">
                Create your first medical document
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {documents.map(document => (
                <div
                  key={document.id}
                  className={`group cursor-pointer rounded-lg p-3 transition-all ${
                    selectedDocument?.id === document.id
                      ? "border border-blue-200 bg-blue-50"
                      : "border border-transparent hover:bg-slate-50"
                  }`}
                  onClick={() => onDocumentSelect(document)}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      {editingDocumentId === document.id ? (
                        <Input
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              handleUpdateTitle(document)
                            } else if (e.key === "Escape") {
                              setEditingDocumentId(null)
                              setEditingTitle("")
                            }
                          }}
                          onBlur={() => handleUpdateTitle(document)}
                          className="h-6 px-1 py-0 text-sm font-medium"
                          autoFocus
                          disabled={updatingDocument}
                        />
                      ) : (
                        <h3 className="truncate text-sm font-medium text-slate-800">
                          {document.title}
                        </h3>
                      )}

                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {getDocumentPreview(document.content)}
                      </p>

                      <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="size-3" />
                        {formatDate(document.updatedAt)}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={e => e.stopPropagation()}
                        >
                          <MoreVertical className="size-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            setEditingDocumentId(document.id)
                            setEditingTitle(document.title)
                          }}
                        >
                          <Edit3 className="mr-2 size-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            setDocumentToDelete(document)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!documentToDelete}
        onOpenChange={() => setDocumentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingDocument}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                documentToDelete && handleDeleteDocument(documentToDelete)
              }
              disabled={deletingDocument}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingDocument ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
