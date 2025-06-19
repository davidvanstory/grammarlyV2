"use client"

/*
<ai_context>
Document list component for the left sidebar of Med Writer.
Shows all user documents with create, select, and delete functionality.
</ai_context>
*/

import { useState } from "react"
import { SelectDocument } from "@/db/schema/documents-schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { PlusCircle, FileText, Trash2, Edit2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface DocumentListProps {
  documents: SelectDocument[]
  selectedDocument: SelectDocument | null
  onSelectDocument: (document: SelectDocument) => void
  onCreateDocument: () => void
  onDeleteDocument: (documentId: string) => void
  isCreating: boolean
}

export default function DocumentList({
  documents,
  selectedDocument,
  onSelectDocument,
  onCreateDocument,
  onDeleteDocument,
  isCreating
}: DocumentListProps) {
  console.log("Rendering document list with", documents.length, "documents")

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const handleEditTitle = (document: SelectDocument) => {
    console.log("Starting title edit for document:", document.id)
    setEditingId(document.id)
    setEditTitle(document.title)
  }

  const handleSaveTitle = (document: SelectDocument) => {
    console.log("Saving title:", editTitle, "for document:", document.id)
    if (editTitle.trim() && editTitle !== document.title) {
      // This will be handled by the parent component through onUpdateDocument
      // For now, we'll just close the editing state
    }
    setEditingId(null)
    setEditTitle("")
  }

  const handleCancelEdit = () => {
    console.log("Cancelling title edit")
    setEditingId(null)
    setEditTitle("")
  }

  const handleKeyPress = (e: React.KeyboardEvent, document: SelectDocument) => {
    if (e.key === "Enter") {
      handleSaveTitle(document)
    } else if (e.key === "Escape") {
      handleCancelEdit()
    }
  }

  return (
    <Card className="h-full bg-white shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
          <span className="flex items-center gap-2">
            <FileText className="size-5 text-blue-600" />
            Documents
          </span>
          <Button
            onClick={onCreateDocument}
            disabled={isCreating}
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <PlusCircle className="mr-1 size-4" />
            {isCreating ? "Creating..." : "New"}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="max-h-[700px] space-y-3 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <FileText className="mx-auto mb-3 size-12 text-gray-300" />
            <p className="text-sm">No documents yet.</p>
            <p className="text-xs">
              Create your first document to get started.
            </p>
          </div>
        ) : (
          documents.map(document => (
            <div
              key={document.id}
              className={`cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md ${
                selectedDocument?.id === document.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => onSelectDocument(document)}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  {editingId === document.id ? (
                    <Input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => handleSaveTitle(document)}
                      onKeyPress={e => handleKeyPress(e, document)}
                      className="mb-1 text-sm font-medium"
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <h3 className="mb-1 truncate text-sm font-medium text-gray-900">
                      {document.title}
                    </h3>
                  )}

                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(document.updatedAt), {
                      addSuffix: true
                    })}
                  </p>

                  {document.content && (
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {document.content.substring(0, 60)}...
                    </p>
                  )}
                </div>

                <div className="ml-2 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation()
                      handleEditTitle(document)
                    }}
                    className="size-6 p-0 hover:bg-gray-100"
                  >
                    <Edit2 className="size-3" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => e.stopPropagation()}
                        className="size-6 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{document.title}"?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteDocument(document.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
