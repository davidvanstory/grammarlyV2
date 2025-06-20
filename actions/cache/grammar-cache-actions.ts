"use server"

/*
<ai_context>
Server actions for grammar cache management.
Provides cache statistics, cleanup, and performance monitoring for the grammar checking system.
</ai_context>
*/

import { getGrammarCache, CacheStats } from "@/lib/grammar-cache"
import { ActionState } from "@/types"

/**
 * Get current cache statistics
 */
export async function getCacheStatsAction(): Promise<ActionState<CacheStats>> {
  console.log("📊 Getting cache statistics...")
  
  try {
    const cache = getGrammarCache()
    const stats = cache.getStats()
    
    console.log("✅ Cache statistics retrieved:")
    console.log(`  - Total entries: ${stats.totalEntries}`)
    console.log(`  - Hit rate: ${stats.hitRate.toFixed(2)}%`)
    console.log(`  - Total hits: ${stats.totalHits}`)
    console.log(`  - Total misses: ${stats.totalMisses}`)
    console.log(`  - Cache size: ${stats.cacheSize}`)
    
    return {
      isSuccess: true,
      message: "Cache statistics retrieved successfully",
      data: stats
    }
  } catch (error) {
    console.error("❌ Error getting cache statistics:", error)
    return {
      isSuccess: false,
      message: "Failed to get cache statistics"
    }
  }
}

/**
 * Clear all cache entries
 */
export async function clearCacheAction(): Promise<ActionState<void>> {
  console.log("🧹 Clearing grammar cache...")
  
  try {
    const cache = getGrammarCache()
    cache.clear()
    
    console.log("✅ Cache cleared successfully")
    
    return {
      isSuccess: true,
      message: "Cache cleared successfully",
      data: undefined
    }
  } catch (error) {
    console.error("❌ Error clearing cache:", error)
    return {
      isSuccess: false,
      message: "Failed to clear cache"
    }
  }
}

/**
 * Get cache entries for debugging (limited to prevent large responses)
 */
export async function getCacheEntriesAction(limit: number = 10): Promise<ActionState<Array<{
  textHash: string
  originalText: string
  timestamp: Date
  lastAccessed: Date
  hitCount: number
  textLength: number
  errorCount: number
}>>> {
  console.log(`📋 Getting cache entries (limit: ${limit})...`)
  
  try {
    const cache = getGrammarCache()
    const entries = cache.getEntries()
      .slice(0, limit)
      .map(entry => ({
        textHash: entry.textHash,
        originalText: entry.originalText,
        timestamp: entry.timestamp,
        lastAccessed: entry.lastAccessed,
        hitCount: entry.hitCount,
        textLength: entry.textLength,
        errorCount: entry.result.errors.length
      }))
    
    console.log(`✅ Retrieved ${entries.length} cache entries`)
    
    return {
      isSuccess: true,
      message: `Retrieved ${entries.length} cache entries`,
      data: entries
    }
  } catch (error) {
    console.error("❌ Error getting cache entries:", error)
    return {
      isSuccess: false,
      message: "Failed to get cache entries"
    }
  }
}

/**
 * Check if specific text is cached
 */
export async function checkTextCachedAction(text: string): Promise<ActionState<{
  isCached: boolean
  cacheKey?: string
  textLength: number
}>> {
  console.log(`🔍 Checking if text is cached (length: ${text.length})...`)
  
  try {
    const cache = getGrammarCache()
    const isCached = cache.has(text)
    
    console.log(`📋 Text cached: ${isCached}`)
    
    return {
      isSuccess: true,
      message: isCached ? "Text found in cache" : "Text not in cache",
      data: {
        isCached,
        textLength: text.length
      }
    }
  } catch (error) {
    console.error("❌ Error checking cache:", error)
    return {
      isSuccess: false,
      message: "Failed to check cache"
    }
  }
}

/**
 * Get cache performance metrics
 */
export async function getCachePerformanceAction(): Promise<ActionState<{
  hitRate: number
  totalRequests: number
  cacheSize: number
  memoryUsage: number
  averageAccessTime: number
}>> {
  console.log("⚡ Getting cache performance metrics...")
  
  try {
    const cache = getGrammarCache()
    const stats = cache.getStats()
    
    // Calculate memory usage estimate (rough calculation)
    const entries = cache.getEntries()
    const memoryUsage = entries.reduce((total, entry) => {
      return total + entry.textLength + JSON.stringify(entry.result).length
    }, 0)
    
    const performance = {
      hitRate: stats.hitRate,
      totalRequests: stats.totalHits + stats.totalMisses,
      cacheSize: stats.cacheSize,
      memoryUsage: Math.round(memoryUsage / 1024), // KB
      averageAccessTime: stats.averageResponseTime
    }
    
    console.log("✅ Cache performance metrics retrieved:")
    console.log(`  - Hit rate: ${performance.hitRate.toFixed(2)}%`)
    console.log(`  - Total requests: ${performance.totalRequests}`)
    console.log(`  - Cache size: ${performance.cacheSize} entries`)
    console.log(`  - Memory usage: ~${performance.memoryUsage}KB`)
    
    return {
      isSuccess: true,
      message: "Cache performance metrics retrieved",
      data: performance
    }
  } catch (error) {
    console.error("❌ Error getting cache performance:", error)
    return {
      isSuccess: false,
      message: "Failed to get cache performance metrics"
    }
  }
} 