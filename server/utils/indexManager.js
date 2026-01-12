// server/utils/indexManager.js - Enhanced Search Index Management
const mongoose = require('mongoose');

class IndexManager {
  
  /**
   * Create enhanced search indexes for better performance
   * Addresses Requirements 2.1, 2.2, 2.3, 2.4, 2.5
   */
  static async createEnhancedIndexes() {
    try {
      const db = mongoose.connection.db;
      const documentsCollection = db.collection('documents');
      
      console.log('[IndexManager] Creating enhanced search indexes...');
      
      // First, check existing indexes and drop conflicting ones
      const existingIndexes = await documentsCollection.listIndexes().toArray();
      const textIndexes = existingIndexes.filter(idx => idx.key && idx.key._fts === 'text');
      
      // Drop existing text indexes to avoid conflicts
      for (const textIndex of textIndexes) {
        if (textIndex.name !== '_id_') {
          try {
            await documentsCollection.dropIndex(textIndex.name);
            console.log(`[IndexManager] Dropped conflicting text index: ${textIndex.name}`);
          } catch (error) {
            console.warn(`[IndexManager] Could not drop index ${textIndex.name}:`, error.message);
          }
        }
      }
      
      // Helper function to create index with conflict handling
      const createIndexSafely = async (indexSpec, options) => {
        try {
          await documentsCollection.createIndex(indexSpec, options);
        } catch (error) {
          if (error.code === 85) {
            console.log(`[IndexManager] Index ${options.name} already exists, skipping...`);
          } else {
            throw error;
          }
        }
      };
      
      // 1. Compound text index for multi-field search (Requirements 2.1, 2.2, 2.3)
      await documentsCollection.createIndex({
        title: 'text',
        fullContent: 'text',
        searchableContent: 'text',
        'chunks.content': 'text',
        'chunks.searchableContent': 'text'
      }, {
        name: 'enhanced_text_search',
        weights: {
          title: 10,
          searchableContent: 5,
          'chunks.searchableContent': 3,
          fullContent: 2,
          'chunks.content': 1
        },
        default_language: 'none', // Disable language-specific stemming for better control
        textIndexVersion: 3
      });
      
      // 2. Search terms array index for exact term matching (Requirement 2.5)
      await createIndexSafely(
        { searchTerms: 1 },
        { name: 'search_terms_index' }
      );
      
      // 3. Chunk-level search terms index
      await createIndexSafely(
        { 'chunks.searchTerms': 1 },
        { name: 'chunk_search_terms_index' }
      );
      
      // 4. User and file type compound index for filtered searches
      await createIndexSafely(
        { userId: 1, fileType: 1, 'metadata.lastIndexed': -1 },
        { name: 'user_filetype_indexed_compound' }
      );
      
      // 5. Tags index for tag-based filtering (skip if exists)
      await createIndexSafely(
        { tags: 1 },
        { name: 'tags_index' }
      );
      
      // 6. Public documents index for cross-user search
      await createIndexSafely(
        { isPublic: 1, 'metadata.lastIndexed': -1 },
        { name: 'public_documents_index' }
      );
      
      // 7. Content hash index for change detection (Requirement 2.4)
      await createIndexSafely(
        { 'metadata.contentHash': 1 },
        { name: 'content_hash_index', unique: false }
      );
      
      // 8. Chunk content hash index
      await createIndexSafely(
        { 'chunks.metadata.contentHash': 1 },
        { name: 'chunk_content_hash_index' }
      );
      
      // 9. Term frequency index for ranking
      await createIndexSafely(
        { 'metadata.termFrequency': 1 },
        { name: 'term_frequency_index', sparse: true }
      );
      
      // 10. Last indexed timestamp for incremental updates
      await createIndexSafely(
        { 'metadata.lastIndexed': -1 },
        { name: 'last_indexed_timestamp' }
      );
      
      console.log('[IndexManager] ✅ Enhanced search indexes created successfully');
      
      // List all indexes for verification
      const indexes = await documentsCollection.listIndexes().toArray();
      console.log('[IndexManager] 📋 Current indexes:');
      indexes.forEach(index => {
        console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
      });
      
      return true;
    } catch (error) {
      console.error('[IndexManager] ❌ Error creating enhanced indexes:', error);
      throw error;
    }
  }
  
  /**
   * Drop and recreate all search indexes
   */
  static async recreateIndexes() {
    try {
      const db = mongoose.connection.db;
      const documentsCollection = db.collection('documents');
      
      console.log('[IndexManager] Dropping existing search indexes...');
      
      // Get current indexes
      const indexes = await documentsCollection.listIndexes().toArray();
      
      // Drop all indexes except _id
      for (const index of indexes) {
        if (index.name !== '_id_') {
          try {
            await documentsCollection.dropIndex(index.name);
            console.log(`[IndexManager] Dropped index: ${index.name}`);
          } catch (error) {
            console.warn(`[IndexManager] Could not drop index ${index.name}:`, error.message);
          }
        }
      }
      
      // Recreate enhanced indexes
      await this.createEnhancedIndexes();
      
      console.log('[IndexManager] ✅ All indexes recreated successfully');
      return true;
    } catch (error) {
      console.error('[IndexManager] ❌ Error recreating indexes:', error);
      throw error;
    }
  }
  
  /**
   * Check if enhanced indexes exist
   */
  static async checkIndexes() {
    try {
      const db = mongoose.connection.db;
      const documentsCollection = db.collection('documents');
      
      const indexes = await documentsCollection.listIndexes().toArray();
      const indexNames = indexes.map(idx => idx.name);
      
      const requiredIndexes = [
        'enhanced_text_search',
        'search_terms_index',
        'chunk_search_terms_index',
        'user_filetype_indexed_compound',
        'tags_index',
        'public_documents_index',
        'content_hash_index',
        'last_indexed_timestamp'
      ];
      
      const missingIndexes = requiredIndexes.filter(name => !indexNames.includes(name));
      
      if (missingIndexes.length > 0) {
        console.log('[IndexManager] ⚠️ Missing indexes:', missingIndexes);
        return false;
      }
      
      console.log('[IndexManager] ✅ All required indexes are present');
      return true;
    } catch (error) {
      console.error('[IndexManager] ❌ Error checking indexes:', error);
      return false;
    }
  }
  
  /**
   * Get index statistics
   */
  static async getIndexStats() {
    try {
      const db = mongoose.connection.db;
      const documentsCollection = db.collection('documents');
      
      const stats = await db.stats();
      const indexes = await documentsCollection.listIndexes().toArray();
      
      return {
        totalDocuments: stats.collections || 0,
        totalIndexes: indexes.length,
        indexes: indexes.map(idx => ({
          name: idx.name,
          key: idx.key,
          unique: idx.unique || false,
          sparse: idx.sparse || false
        }))
      };
    } catch (error) {
      console.error('[IndexManager] ❌ Error getting index stats:', error);
      throw error;
    }
  }
  
  /**
   * Initialize indexes on application startup
   */
  static async initialize() {
    try {
      console.log('[IndexManager] Initializing enhanced search indexes...');
      
      // Check if indexes exist
      const indexesExist = await this.checkIndexes();
      
      if (!indexesExist) {
        console.log('[IndexManager] Creating missing indexes...');
        await this.createEnhancedIndexes();
      }
      
      // Get and log stats
      const stats = await this.getIndexStats();
      console.log('[IndexManager] 📊 Index statistics:');
      console.log(`  - Total documents: ${stats.totalDocuments}`);
      console.log(`  - Total indexes: ${stats.totalIndexes}`);
      
      return true;
    } catch (error) {
      console.error('[IndexManager] ❌ Error initializing indexes:', error);
      throw error;
    }
  }
}

module.exports = IndexManager;