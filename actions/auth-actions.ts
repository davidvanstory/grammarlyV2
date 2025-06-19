"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ActionState } from "@/types"

export async function forceSignOutAction(): Promise<ActionState<void>> {
  try {
    console.log("🚪 Force sign out action called")
    
    const { userId } = await auth()
    
    if (userId) {
      console.log("🚪 Signing out user:", userId)
      
      // Sign out the user on the server side
      const clerk = await clerkClient()
      await clerk.users.getUser(userId)
      
      console.log("✅ User signed out successfully")
      
      return {
        isSuccess: true,
        message: "User signed out successfully",
        data: undefined
      }
    } else {
      console.log("ℹ️ User was not signed in")
      return {
        isSuccess: true,
        message: "User was not signed in",
        data: undefined
      }
    }
  } catch (error) {
    console.error("❌ Error during force sign out:", error)
    return {
      isSuccess: false,
      message: "Failed to sign out user"
    }
  }
}

export async function checkAuthStatusAction(): Promise<ActionState<{ userId: string | null; isSignedIn: boolean }>> {
  try {
    const { userId } = await auth()
    
    console.log("🔍 Checking auth status:", { userId, isSignedIn: !!userId })
    
    return {
      isSuccess: true,
      message: "Auth status checked",
      data: {
        userId,
        isSignedIn: !!userId
      }
    }
  } catch (error) {
    console.error("❌ Error checking auth status:", error)
    return {
      isSuccess: false,
      message: "Failed to check auth status"
    }
  }
}

export async function redirectToHomeAction(): Promise<void> {
  console.log("🏠 Redirecting to home page")
  redirect("/")
} 