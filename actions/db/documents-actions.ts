/*
<ai_context>
Contains server actions related to medical documents in the DB.
</ai_context>
*/

"use server"

import { db } from "@/db/db"
import { InsertDocument, SelectDocument, documentsTable } from "@/db/schema/documents-schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

export async function createDocumentAction(
  document: InsertDocument
): Promise<ActionState<SelectDocument>> {
  try {
    console.log("📄 Creating new document:", { title: document.title, userId: document.userId })
    
    const [newDocument] = await db.insert(documentsTable).values(document).returning()
    
    console.log("✅ Document created successfully:", { id: newDocument.id, title: newDocument.title })
    
    return {
      isSuccess: true,
      message: "Document created successfully",
      data: newDocument
    }
  } catch (error) {
    console.error("❌ Error creating document:", error)
    return { isSuccess: false, message: "Failed to create document" }
  }
}

export async function getDocumentsByUserIdAction(
  userId: string
): Promise<ActionState<SelectDocument[]>> {
  try {
    console.log("📄 Fetching documents for user:", userId)
    
    const documents = await db.query.documents.findMany({
      where: eq(documentsTable.userId, userId),
      orderBy: (documents, { desc }) => [desc(documents.updatedAt)]
    })
    
    console.log("✅ Documents retrieved successfully:", { count: documents.length })
    
    return {
      isSuccess: true,
      message: "Documents retrieved successfully",
      data: documents
    }
  } catch (error) {
    console.error("❌ Error getting documents:", error)
    return { isSuccess: false, message: "Failed to get documents" }
  }
}

export async function getDocumentByIdAction(
  id: string
): Promise<ActionState<SelectDocument>> {
  try {
    console.log("📄 Fetching document by ID:", id)
    
    const document = await db.query.documents.findFirst({
      where: eq(documentsTable.id, id)
    })

    if (!document) {
      console.warn("⚠️ Document not found:", id)
      return { isSuccess: false, message: "Document not found" }
    }
    
    console.log("✅ Document retrieved successfully:", { id: document.id, title: document.title })
    
    return {
      isSuccess: true,
      message: "Document retrieved successfully",
      data: document
    }
  } catch (error) {
    console.error("❌ Error getting document:", error)
    return { isSuccess: false, message: "Failed to get document" }
  }
}

export async function updateDocumentAction(
  id: string,
  data: Partial<InsertDocument>
): Promise<ActionState<SelectDocument>> {
  try {
    console.log("📄 Updating document:", { id, updates: Object.keys(data) })
    
    const [updatedDocument] = await db
      .update(documentsTable)
      .set(data)
      .where(eq(documentsTable.id, id))
      .returning()

    if (!updatedDocument) {
      console.warn("⚠️ Document not found for update:", id)
      return { isSuccess: false, message: "Document not found" }
    }
    
    console.log("✅ Document updated successfully:", { id: updatedDocument.id, title: updatedDocument.title })

    return {
      isSuccess: true,
      message: "Document updated successfully",
      data: updatedDocument
    }
  } catch (error) {
    console.error("❌ Error updating document:", error)
    return { isSuccess: false, message: "Failed to update document" }
  }
}

export async function deleteDocumentAction(id: string): Promise<ActionState<void>> {
  try {
    console.log("📄 Deleting document:", id)
    
    const deletedRows = await db.delete(documentsTable).where(eq(documentsTable.id, id))
    
    console.log("✅ Document deleted successfully:", { id, deletedRows })
    
    return {
      isSuccess: true,
      message: "Document deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("❌ Error deleting document:", error)
    return { isSuccess: false, message: "Failed to delete document" }
  }
} 