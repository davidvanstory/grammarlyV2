/*
<ai_context>
Smart caching system for grammar check results.
Implements LRU cache with text hashing, performance metrics, and automatic cleanup.
</ai_context>
*/

import { GrammarCheckResponse, GrammarError } from "@/types/grammar-types"
import { createHash } from "crypto"

export interface GrammarCacheEntry {
  textHash: string
  originalText: string
  result: GrammarCheckResponse
  timestamp: Date
  lastAccessed: Date
  hitCount: number
  textLength: number
}

export interface CacheStats {
  totalEntries: number
  hitRate: number
  totalHits: number
  totalMisses: number
  averageResponseTime: number
  cacheSize: number
  oldestEntry: Date | null
  newestEntry: Date | null
}

export interface CacheConfig {
  maxEntries: number
  maxAge: number // milliseconds
  maxTextLength: number
  cleanupInterval: number // milliseconds
}

/**
 * LRU Cache for grammar check results with smart eviction
 */
export class GrammarCache {
  private cache = new Map<string, GrammarCacheEntry>()
  private accessOrder: string[] = []
  private stats = {
    hits: 0,
    misses: 0,
    totalResponseTime: 0,
    operations: 0
  }
  private cleanupTimer: NodeJS.Timeout | null = null

  private readonly config: CacheConfig = {
    maxEntries: 1000, // Store up to 1000 entries
    maxAge: 30 * 60 * 1000, // 30 minutes
    maxTextLength: 10000, // Max text length to cache
    cleanupInterval: 5 * 60 * 1000 // Cleanup every 5 minutes
  }

  constructor(customConfig?: Partial<CacheConfig>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig }
    }

    console.log("💾 Grammar cache initialized with config:", this.config)
    this.startCleanupTimer()
  }

  /**
   * Generate cache key from text content
   */
  private generateCacheKey(text: string): string {
    // Normalize text for consistent hashing
    const normalizedText = text
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .toLowerCase()

    // Create hash of normalized text
    const hash = createHash("sha256")
      .update(normalizedText)
      .digest("hex")
      .substring(0, 16) // Use first 16 chars for performance

    console.log(
      `🔑 Generated cache key: ${hash} for text length: ${text.length}`
    )
    return hash
  }

  /**
   * Check if text is suitable for caching
   */
  private isCacheable(text: string): boolean {
    const suitable =
      text.length >= 10 &&
      text.length <= this.config.maxTextLength &&
      text.trim().length > 0

    console.log(`📋 Text cacheable: ${suitable} (length: ${text.length})`)
    return suitable
  }

  /**
   * Update access order for LRU eviction
   */
  private updateAccessOrder(key: string): void {
    // Remove from current position
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }

    // Add to end (most recently used)
    this.accessOrder.push(key)
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(): void {
    while (
      this.cache.size >= this.config.maxEntries &&
      this.accessOrder.length > 0
    ) {
      const lruKey = this.accessOrder.shift()
      if (lruKey && this.cache.has(lruKey)) {
        console.log(`🗑️ Evicting LRU entry: ${lruKey}`)
        this.cache.delete(lruKey)
      }
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = new Date()
    const expiredKeys: string[] = []

    console.log("🧹 Starting cache cleanup...")

    for (const [key, entry] of this.cache.entries()) {
      const age = now.getTime() - entry.timestamp.getTime()
      if (age > this.config.maxAge) {
        expiredKeys.push(key)
      }
    }

    // Remove expired entries
    for (const key of expiredKeys) {
      this.cache.delete(key)
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }
    }

    console.log(`🧹 Cleaned up ${expiredKeys.length} expired entries`)
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired()
    }, this.config.cleanupInterval)

    console.log("⏰ Cache cleanup timer started")
  }

  /**
   * Get cached result for text
   */
  public get(text: string): GrammarCacheEntry | null {
    console.log(`💾 Cache GET request for text length: ${text.length}`)

    if (!this.isCacheable(text)) {
      console.log("❌ Text not cacheable")
      this.stats.misses++
      return null
    }

    const key = this.generateCacheKey(text)
    const entry = this.cache.get(key)

    if (entry) {
      // Check if entry is still valid
      const age = new Date().getTime() - entry.timestamp.getTime()
      if (age > this.config.maxAge) {
        console.log(`⏰ Cache entry expired (age: ${age}ms)`)
        this.cache.delete(key)
        this.stats.misses++
        return null
      }

      // Update access statistics
      entry.lastAccessed = new Date()
      entry.hitCount++
      this.updateAccessOrder(key)
      this.stats.hits++

      console.log(`✅ Cache HIT for key: ${key} (hits: ${entry.hitCount})`)
      return entry
    }

    console.log(`❌ Cache MISS for key: ${key}`)
    this.stats.misses++
    return null
  }

  /**
   * Store result in cache
   */
  public set(text: string, result: GrammarCheckResponse): void {
    console.log(`💾 Cache SET request for text length: ${text.length}`)

    if (!this.isCacheable(text)) {
      console.log("❌ Text not cacheable, skipping cache")
      return
    }

    const key = this.generateCacheKey(text)
    const now = new Date()

    // Evict old entries if needed
    this.evictLRU()

    const entry: GrammarCacheEntry = {
      textHash: key,
      originalText: text.substring(0, 200) + (text.length > 200 ? "..." : ""), // Store preview
      result,
      timestamp: now,
      lastAccessed: now,
      hitCount: 0,
      textLength: text.length
    }

    this.cache.set(key, entry)
    this.updateAccessOrder(key)

    console.log(`✅ Cache SET complete for key: ${key}`)
    console.log(`📊 Cache size: ${this.cache.size}/${this.config.maxEntries}`)
  }

  /**
   * Check if text has cached result
   */
  public has(text: string): boolean {
    if (!this.isCacheable(text)) {
      return false
    }

    const key = this.generateCacheKey(text)
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Check if entry is still valid
    const age = new Date().getTime() - entry.timestamp.getTime()
    if (age > this.config.maxAge) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const entries = Array.from(this.cache.values())
    const totalRequests = this.stats.hits + this.stats.misses

    return {
      totalEntries: this.cache.size,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      averageResponseTime:
        this.stats.operations > 0
          ? this.stats.totalResponseTime / this.stats.operations
          : 0,
      cacheSize: this.cache.size,
      oldestEntry:
        entries.length > 0
          ? new Date(Math.min(...entries.map(e => e.timestamp.getTime())))
          : null,
      newestEntry:
        entries.length > 0
          ? new Date(Math.max(...entries.map(e => e.timestamp.getTime())))
          : null
    }
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    console.log("🧹 Clearing entire cache")
    this.cache.clear()
    this.accessOrder = []
    this.stats = {
      hits: 0,
      misses: 0,
      totalResponseTime: 0,
      operations: 0
    }
  }

  /**
   * Get cache entries for debugging
   */
  public getEntries(): GrammarCacheEntry[] {
    return Array.from(this.cache.values())
  }

  /**
   * Cleanup and destroy cache
   */
  public destroy(): void {
    console.log("💀 Destroying grammar cache")

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    this.clear()
  }
}

// Global cache instance
let globalCache: GrammarCache | null = null

/**
 * Get or create global cache instance
 */
export function getGrammarCache(): GrammarCache {
  if (!globalCache) {
    console.log("🏗️ Creating global grammar cache instance")
    globalCache = new GrammarCache()
  }
  return globalCache
}

/**
 * Create cache with custom configuration
 */
export function createGrammarCache(
  config?: Partial<CacheConfig>
): GrammarCache {
  console.log("🏗️ Creating custom grammar cache instance")
  return new GrammarCache(config)
}

/**
 * Destroy global cache
 */
export function destroyGrammarCache(): void {
  if (globalCache) {
    globalCache.destroy()
    globalCache = null
  }
}
