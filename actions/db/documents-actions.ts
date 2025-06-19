"use server"

/*
<ai_context>
Server actions for document management in the Med Writer application.
Provides CRUD operations for medical documents with user ownership.
</ai_context>
*/

import { db } from "@/db/db"
import { InsertDocument, SelectDocument, documentsTable } from "@/db/schema/documents-schema"
import { ActionState } from "@/types"
import { eq, desc } from "drizzle-orm"

export async function createDocumentAction(
  document: InsertDocument
): Promise<ActionState<SelectDocument>> {
  try {
    console.log("Creating new document:", document)
    const [newDocument] = await db.insert(documentsTable).values(document).returning()
    console.log("Document created successfully:", newDocument.id)
    return {
      isSuccess: true,
      message: "Document created successfully",
      data: newDocument
    }
  } catch (error) {
    console.error("Error creating document:", error)
    return { isSuccess: false, message: "Failed to create document" }
  }
}

export async function getDocumentsAction(
  userId: string
): Promise<ActionState<SelectDocument[]>> {
  try {
    console.log("Fetching documents for user:", userId)
    const documents = await db.query.documents.findMany({
      where: eq(documentsTable.userId, userId),
      orderBy: [desc(documentsTable.updatedAt)]
    })
    console.log("Retrieved documents count:", documents.length)
    return {
      isSuccess: true,
      message: "Documents retrieved successfully",
      data: documents
    }
  } catch (error) {
    console.error("Error getting documents:", error)
    return { isSuccess: false, message: "Failed to get documents" }
  }
}

export async function getDocumentByIdAction(
  id: string,
  userId: string
): Promise<ActionState<SelectDocument>> {
  try {
    console.log("Fetching document:", id, "for user:", userId)
    const document = await db.query.documents.findFirst({
      where: eq(documentsTable.id, id)
    })
    
    if (!document) {
      console.log("Document not found:", id)
      return { isSuccess: false, message: "Document not found" }
    }
    
    if (document.userId !== userId) {
      console.log("Access denied for document:", id, "user:", userId)
      return { isSuccess: false, message: "Access denied" }
    }
    
    console.log("Document retrieved successfully:", document.id)
    return {
      isSuccess: true,
      message: "Document retrieved successfully",
      data: document
    }
  } catch (error) {
    console.error("Error getting document:", error)
    return { isSuccess: false, message: "Failed to get document" }
  }
}

export async function updateDocumentAction(
  id: string,
  userId: string,
  data: Partial<InsertDocument>
): Promise<ActionState<SelectDocument>> {
  try {
    console.log("Updating document:", id, "for user:", userId, "with data:", data)
    
    // First verify ownership
    const existingDocument = await db.query.documents.findFirst({
      where: eq(documentsTable.id, id)
    })
    
    if (!existingDocument) {
      console.log("Document not found for update:", id)
      return { isSuccess: false, message: "Document not found" }
    }
    
    if (existingDocument.userId !== userId) {
      console.log("Access denied for document update:", id, "user:", userId)
      return { isSuccess: false, message: "Access denied" }
    }
    
    const [updatedDocument] = await db
      .update(documentsTable)
      .set(data)
      .where(eq(documentsTable.id, id))
      .returning()
    
    console.log("Document updated successfully:", updatedDocument.id)
    return {
      isSuccess: true,
      message: "Document updated successfully",
      data: updatedDocument
    }
  } catch (error) {
    console.error("Error updating document:", error)
    return { isSuccess: false, message: "Failed to update document" }
  }
}

export async function deleteDocumentAction(
  id: string,
  userId: string
): Promise<ActionState<void>> {
  try {
    console.log("Deleting document:", id, "for user:", userId)
    
    // First verify ownership
    const existingDocument = await db.query.documents.findFirst({
      where: eq(documentsTable.id, id)
    })
    
    if (!existingDocument) {
      console.log("Document not found for deletion:", id)
      return { isSuccess: false, message: "Document not found" }
    }
    
    if (existingDocument.userId !== userId) {
      console.log("Access denied for document deletion:", id, "user:", userId)
      return { isSuccess: false, message: "Access denied" }
    }
    
    await db.delete(documentsTable).where(eq(documentsTable.id, id))
    console.log("Document deleted successfully:", id)
    return {
      isSuccess: true,
      message: "Document deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting document:", error)
    return { isSuccess: false, message: "Failed to delete document" }
  }
} 