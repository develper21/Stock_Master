import Fuse from 'fuse.js';

export class AdvancedSearch {
  constructor(data, options = {}) {
    this.data = data;
    this.originalData = [...data];
    this.options = {
      keys: ['name', 'code', 'description', 'category'],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      ...options,
    };
    this.fuse = new Fuse(this.data, this.options);
  }

  // Basic text search
  search(query) {
    if (!query || query.trim() === '') {
      return this.originalData;
    }

    const results = this.fuse.search(query);
    return results.map(result => ({
      ...result.item,
      _score: result.score,
      _matches: result.matches,
    }));
  }

  // Advanced search with filters
  advancedSearch(searchParams) {
    let filteredData = [...this.originalData];

    // Text search
    if (searchParams.query) {
      const textResults = this.search(searchParams.query);
      const textResultIds = new Set(textResults.map(item => item.id));
      filteredData = filteredData.filter(item => textResultIds.has(item.id));
    }

    // Category filter
    if (searchParams.category && searchParams.category !== 'all') {
      filteredData = filteredData.filter(item => 
        item.category === searchParams.category
      );
    }

    // Status filter
    if (searchParams.status && searchParams.status !== 'all') {
      filteredData = filteredData.filter(item => 
        item.status === searchParams.status
      );
    }

    // Price range filter
    if (searchParams.minPrice !== undefined) {
      filteredData = filteredData.filter(item => 
        (item.price || item.costPrice || 0) >= searchParams.minPrice
      );
    }

    if (searchParams.maxPrice !== undefined) {
      filteredData = filteredData.filter(item => 
        (item.price || item.costPrice || 0) <= searchParams.maxPrice
      );
    }

    // Stock level filter
    if (searchParams.stockLevel) {
      switch (searchParams.stockLevel) {
        case 'in_stock':
          filteredData = filteredData.filter(item => 
            (item.quantity || item.currentStock || 0) > 0
          );
          break;
        case 'low_stock':
          filteredData = filteredData.filter(item => {
            const quantity = item.quantity || item.currentStock || 0;
            const minStock = item.minStockLevel || 0;
            return quantity > 0 && quantity <= minStock;
          });
          break;
        case 'out_of_stock':
          filteredData = filteredData.filter(item => 
            (item.quantity || item.currentStock || 0) === 0
          );
          break;
      }
    }

    // Date range filter
    if (searchParams.dateFrom) {
      const fromDate = new Date(searchParams.dateFrom);
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.createdAt || item.date);
        return itemDate >= fromDate;
      });
    }

    if (searchParams.dateTo) {
      const toDate = new Date(searchParams.dateTo);
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.createdAt || item.date);
        return itemDate <= toDate;
      });
    }

    // Warehouse filter
    if (searchParams.warehouseId && searchParams.warehouseId !== 'all') {
      filteredData = filteredData.filter(item => 
        item.warehouseId === searchParams.warehouseId
      );
    }

    // Tags filter
    if (searchParams.tags && searchParams.tags.length > 0) {
      filteredData = filteredData.filter(item => {
        if (!item.tags) return false;
        const itemTags = Array.isArray(item.tags) ? item.tags : [item.tags];
        return searchParams.tags.some(tag => itemTags.includes(tag));
      });
    }

    // Sort results
    if (searchParams.sortBy) {
      filteredData.sort((a, b) => {
        const aValue = a[searchParams.sortBy];
        const bValue = b[searchParams.sortBy];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return searchParams.sortOrder === 'desc' 
            ? bValue.localeCompare(aValue)
            : aValue.localeCompare(bValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return searchParams.sortOrder === 'desc' 
            ? bValue - aValue
            : aValue - bValue;
        }
        
        if (aValue instanceof Date && bValue instanceof Date) {
          return searchParams.sortOrder === 'desc' 
            ? bValue.getTime() - aValue.getTime()
            : aValue.getTime() - bValue.getTime();
        }
        
        return 0;
      });
    }

    return filteredData;
  }

  // Update data
  updateData(newData) {
    this.data = newData;
    this.originalData = [...newData];
    this.fuse = new Fuse(this.data, this.options);
  }

  // Get search suggestions
  getSuggestions(query, field = 'name') {
    if (!query || query.length < 2) {
      return [];
    }

    const fuseOptions = {
      ...this.options,
      keys: [field],
      threshold: 0.2,
      includeScore: false,
      includeMatches: false,
    };

    const fuse = new Fuse(this.data, fuseOptions);
    const results = fuse.search(query);
    
    return results
      .slice(0, 10)
      .map(result => result.item[field])
      .filter((value, index, self) => self.indexOf(value) === index);
  }

  // Get facets for filtering
  getFacets() {
    const facets = {
      categories: new Set(),
      statuses: new Set(),
      warehouses: new Set(),
      tags: new Set(),
    };

    this.originalData.forEach(item => {
      if (item.category) facets.categories.add(item.category);
      if (item.status) facets.statuses.add(item.status);
      if (item.warehouseId) facets.warehouses.add(item.warehouseId);
      if (item.tags) {
        const tags = Array.isArray(item.tags) ? item.tags : [item.tags];
        tags.forEach(tag => facets.tags.add(tag));
      }
    });

    return {
      categories: Array.from(facets.categories).sort(),
      statuses: Array.from(facets.statuses).sort(),
      warehouses: Array.from(facets.warehouses).sort(),
      tags: Array.from(facets.tags).sort(),
    };
  }
}

// Search utilities
export const searchUtils = {
  // Debounce search
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Highlight search matches
  highlightMatches(text, matches) {
    if (!matches || matches.length === 0) {
      return text;
    }

    let highlightedText = text;
    const offsets = [];

    matches.forEach(match => {
      if (match.indices) {
        match.indices.forEach(([start, end]) => {
          offsets.push({ start, end });
        });
      }
    });

    // Sort offsets in reverse order to avoid index shifting
    offsets.sort((a, b) => b.start - a.start);

    offsets.forEach(({ start, end }) => {
      const before = highlightedText.substring(0, start);
      const match = highlightedText.substring(start, end + 1);
      const after = highlightedText.substring(end + 1);
      highlightedText = `${before}<mark class="bg-yellow-200">${match}</mark>${after}`;
    });

    return highlightedText;
  },

  // Extract search terms
  extractSearchTerms(query) {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 1)
      .filter((term, index, self) => self.indexOf(term) === index);
  },

  // Calculate relevance score
  calculateRelevanceScore(item, query, fields = ['name', 'description']) {
    const terms = this.extractSearchTerms(query);
    let score = 0;

    terms.forEach(term => {
      fields.forEach(field => {
        const fieldValue = item[field];
        if (fieldValue && typeof fieldValue === 'string') {
          const value = fieldValue.toLowerCase();
          
          // Exact match gets highest score
          if (value === term) {
            score += 100;
          }
          // Starts with term gets high score
          else if (value.startsWith(term)) {
            score += 50;
          }
          // Contains term gets medium score
          else if (value.includes(term)) {
            score += 25;
          }
          // Partial match gets low score
          else if (value.includes(term.substring(0, Math.floor(term.length / 2)))) {
            score += 10;
          }
        }
      });
    });

    return score;
  },

  // Create search index
  createSearchIndex(data, fields = ['name', 'description']) {
    const index = new Map();

    data.forEach((item, id) => {
      fields.forEach(field => {
        const value = item[field];
        if (value && typeof value === 'string') {
          const terms = this.extractSearchTerms(value);
          terms.forEach(term => {
            if (!index.has(term)) {
              index.set(term, new Set());
            }
            index.get(term).add(id);
          });
        }
      });
    });

    return index;
  },

  // Search using index
  searchWithIndex(index, data, query) {
    const terms = this.extractSearchTerms(query);
    const resultIds = new Set();

    terms.forEach(term => {
      const termIds = index.get(term);
      if (termIds) {
        termIds.forEach(id => resultIds.add(id));
      }
    });

    return Array.from(resultIds).map(id => data[id]);
  },
};

export default AdvancedSearch;
