// COUNTRY FILTER SYSTEM - REBUILT FOR STABILITY
(function() {
  'use strict';
  
  // VARIABLES: All declared at the top
  var isPopulating = false;
  var observerInstance = null;
  var countriesArray = [];
  var articleDataCache = [];
  
  // CONSTANTS
  var SELECTED_COUNTRY_KEY = 'selectedCountry';
  var API_BASE = 'https://hook.eu2.make.com/7w8p1kw0g0gqsol5pviqg5l1ql7p7ksv';
  
  // LOGGING
  function log(message) {
    console.log('%c🌍 ' + message, 'color: #10b981');
  }
  
  function debugLog(message) {
    console.log('%c🔍 DEBUG: ' + message, 'color: #6b7280');
  }
  
  // ARTICLE CACHING SYSTEM
  function initializeArticleCache() {
    function attemptCache() {
      try {
        var articles = document.querySelectorAll('[data-country-id]:not(option)');
        
        if (articles.length > 0 && articleDataCache.length === 0) {
          log('📦 INITIAL CACHE: Found ' + articles.length + ' articles to cache');
          
          articleDataCache = Array.from(articles).map(function(article) {
            return {
              element: article,
              countryId: article.getAttribute('data-country-id'),
              originalParent: article.parentElement,
              originalDisplay: article.style.display,
              className: article.className,
              id: article.id || 'article-' + Date.now() + '-' + Math.random()
            };
          });
          
          log('✅ INITIAL CACHE: Cached ' + articleDataCache.length + ' articles');
          return true;
        }
        return false;
      } catch (error) {
        console.error('Cache attempt failed:', error);
        return false;
      }
    }
    
    // Try immediately
    if (!attemptCache()) {
      // Try when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attemptCache);
      } else {
        setTimeout(attemptCache, 100);
      }
      
      // Try multiple times with delays
      setTimeout(attemptCache, 250);
      setTimeout(attemptCache, 500);
      setTimeout(attemptCache, 1000);
      setTimeout(attemptCache, 2000);
    }
  }
  
  // UTILITY FUNCTIONS
  function isElementVisibleInWebflow(element) {
    if (!element) return false;
    
    var computedStyle = window.getComputedStyle(element);
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
      return false;
    }
    
    // Check if parent containers are hidden
    var parent = element.parentElement;
    while (parent && parent !== document.body) {
      var parentStyle = window.getComputedStyle(parent);
      if (parentStyle.display === 'none') {
        debugLog('Parent element hidden', {parent: parent.className || parent.tagName, display: parentStyle.display});
        return false;
      }
      parent = parent.parentElement;
    }
    
    return true;
  }
  
  // API FUNCTIONS
  function fetchCountries() {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', API_BASE, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var response = JSON.parse(xhr.responseText);
              if (response && Array.isArray(response.countries)) {
                countriesArray = response.countries;
                resolve(countriesArray);
              } else {
                reject(new Error('Invalid response format'));
              }
            } catch (error) {
              reject(new Error('Failed to parse response: ' + error.message));
            }
          } else {
            reject(new Error('HTTP ' + xhr.status + ': ' + xhr.statusText));
          }
        }
      };
      xhr.onerror = function() {
        reject(new Error('Network error'));
      };
      xhr.send();
    });
  }
  
  // FILTERING FUNCTIONS
  function applyCountryFilter(countryId) {
    // Work with both current DOM articles AND cached data
    var currentArticles = Array.from(document.querySelectorAll('[data-country-id]:not(option)'));
    var allRegions = Array.from(document.querySelectorAll('[data-region-country-id]:not(option)'));
    
    log(`Filter: Found ${currentArticles.length} current articles (${articleDataCache.length} cached) and ${allRegions.length} regions for country ID ${countryId}`);
    
    var visibleArticles = 0, hiddenArticles = 0;
    var visibleRegions = 0, hiddenRegions = 0;
    
    // If no articles in DOM but we have cached data, Webflow has hidden them
    if (currentArticles.length === 0 && articleDataCache.length > 0) {
      log('🔄 No articles in DOM - Webflow has filtered them. Using cache to restore matching articles.');
      
      // Use cached data to restore articles that match the country filter
      articleDataCache.forEach(function(cachedArticle) {
        if (!cachedArticle.element || !cachedArticle.element.parentElement) {
          return;
        }
        
        if (!countryId || cachedArticle.countryId === countryId) {
          cachedArticle.element.classList.remove('country-filtered');
          cachedArticle.element.style.display = '';
          visibleArticles++;
        } else {
          cachedArticle.element.classList.add('country-filtered');
          cachedArticle.element.style.display = 'none';
          hiddenArticles++;
        }
      });
    } else {
      // Work with current articles in DOM
      currentArticles.forEach(function(article) {
        var articleCountryId = article.getAttribute('data-country-id');
        if (!countryId || articleCountryId === countryId) {
          article.classList.remove('country-filtered');
          article.style.display = '';
          visibleArticles++;
        } else {
          article.classList.add('country-filtered');
          article.style.display = 'none';
          hiddenArticles++;
        }
      });
    }
    
    // Always filter regions normally
    allRegions.forEach(function(region) {
      var regionCountryId = region.getAttribute('data-region-country-id');
      if (!countryId || regionCountryId === countryId) {
        region.classList.remove('country-filtered');
        region.style.display = '';
        visibleRegions++;
      } else {
        region.classList.add('country-filtered');
        region.style.display = 'none';
        hiddenRegions++;
      }
    });
    
    log(`Result: ${visibleArticles}/${currentArticles.length || articleDataCache.length} articles visible, ${visibleRegions}/${allRegions.length} regions visible`);
  }
  
  // EVENT HANDLERS
  function setupChangeHandlers(dropdowns) {
    log('🎯 Setting up change handlers for ' + dropdowns.length + ' selects');
    
    Array.from(dropdowns).forEach(function(select, index) {
      debugLog('Setting up handler for select ' + index);
      
      var newSelect = select.cloneNode(true);
      select.parentNode.replaceChild(newSelect, select);
      
      newSelect.addEventListener('change', function() {
        log('🔄 Country change event triggered');
        
        var selectedCode = this.value;
        debugLog('Selected country code: ' + selectedCode);
        
        if (selectedCode) {
          var selectedOption = this.querySelector('option[value="' + selectedCode + '"]');
          if (selectedOption) {
            var countryId = selectedOption.getAttribute('data-country-id');
            var countryName = selectedOption.textContent;
            
            log('Changed to: ' + countryName + ' (ID: ' + countryId + ')');
            
            // Update all dropdowns
            var allSelects = document.querySelectorAll('.country-filter-dropdown');
            Array.from(allSelects).forEach(function(otherSelect) {
              if (otherSelect !== newSelect) {
                otherSelect.value = selectedCode;
              }
            });
            
            // Save selection and apply filter
            localStorage.setItem(SELECTED_COUNTRY_KEY, selectedCode);
            applyCountryFilter(countryId);
            
            // Update URL if needed
            var url = new URL(window.location);
            url.searchParams.set('country', selectedCode);
            window.history.replaceState({}, '', url);
          }
        }
      });
    });
  }
  
  // WEBFLOW INTEGRATION
  function createWebflowWatcher() {
    log('🔍 Setting up Webflow filter watcher');
    
    var debounceTimeout;
    var lastFilterTime = 0;
    
    function checkForChanges() {
      if (isPopulating) {
        debugLog('Skipping change check - population in progress');
        return;
      }
      
      var now = Date.now();
      if (now - lastFilterTime < 2000) {
        debugLog('Skipping - too soon since last filter');
        return;
      }
      
      lastFilterTime = now;
      log('🔄 Detected potential Webflow filter change, reapplying country filter');
      
      var selects = document.querySelectorAll('.country-filter-dropdown');
      if (selects.length > 0 && selects[0].value) {
        var selectedOption = selects[0].querySelector('option[value="' + selects[0].value + '"]');
        if (selectedOption) {
          var countryId = selectedOption.getAttribute('data-country-id');
          log('Reapplying filter for country ID:', countryId);
          applyCountryFilter(countryId);
        }
      }
    }
    
    function debouncedCheck() {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(checkForChanges, 1500);
    }
    
    observerInstance = new MutationObserver(function(mutations) {
      if (isPopulating) {
        return;
      }
      
      var webflowChange = false;
      
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          var target = mutation.target;
          
          if (target && target.nodeType === 1) {
            var hasCountryData = target.hasAttribute('data-country-id') || target.hasAttribute('data-region-country-id');
            var isCollectionItem = target.classList && target.classList.contains('w-dyn-item');
            
            if (hasCountryData && isCollectionItem) {
              debugLog('Webflow collection item style change detected');
              webflowChange = true;
            }
          }
        }
      });
      
      if (webflowChange) {
        debouncedCheck();
      }
    });
    
    return observerInstance;
  }
  
  function setupWebflowWatcher() {
    if (observerInstance) {
      observerInstance.disconnect();
      debugLog('Reconnecting observer');
    }
    
    observerInstance = createWebflowWatcher();
    
    if (document.body) {
      observerInstance.observe(document.body, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        subtree: true,
        childList: false
      });
    }
    
    // Watch for Webflow events
    if (window.Webflow && window.Webflow.push) {
      window.Webflow.push(function() {
        log('📡 Webflow.push event detected');
        if (!isPopulating) {
          setTimeout(function() {
            var selects = document.querySelectorAll('.country-filter-dropdown');
            if (selects.length > 0 && selects[0].value) {
              var selectedOption = selects[0].querySelector('option[value="' + selects[0].value + '"]');
              if (selectedOption) {
                var countryId = selectedOption.getAttribute('data-country-id');
                log('Reapplying country filter after Webflow event');
                applyCountryFilter(countryId);
              }
            }
          }, 750);
        }
      });
    }
    
    debugLog('Population completed, observer reconnected');
  }
  
  // MAIN POPULATION FUNCTION
  function populateCountryFilter() {
    if (isPopulating) {
      debugLog('Already populating, skipping');
      return;
    }
    
    isPopulating = true;
    log('🚀 populateCountryFilter called');
    
    try {
      // Try to cache articles if not done yet
      var articles = document.querySelectorAll('[data-country-id]:not(option)');
      if (articles.length > 0 && articleDataCache.length === 0) {
        log('📦 BACKUP CACHE: Caching article data for ' + articles.length + ' articles');
        
        articleDataCache = Array.from(articles).map(function(article) {
          return {
            element: article,
            countryId: article.getAttribute('data-country-id'),
            originalParent: article.parentElement,
            originalDisplay: article.style.display,
            className: article.className,
            id: article.id || 'article-' + Date.now() + '-' + Math.random()
          };
        });
        
        log('✅ BACKUP CACHE: Cached ' + articleDataCache.length + ' articles');
      }
      
      var countryFilterDropdowns = document.querySelectorAll('.country-filter-dropdown');
      
      if (countryFilterDropdowns.length === 0) {
        log('❌ No country filter dropdowns found');
        return;
      }
      
      log(`Init: Found ${countryFilterDropdowns.length} dropdowns`);
      
      if (countriesArray.length === 0) {
        log('📡 Fetching countries from API');
        fetchCountries().then(function() {
          log('Cache: ' + countriesArray.length + ' countries');
          populateCountryFilter();
        }).catch(function(error) {
          log('❌ Error fetching countries: ' + error.message);
        });
        return;
      }
      
      setupChangeHandlers(countryFilterDropdowns);
      setupWebflowWatcher();
      
      return new Promise(function(resolve) {
        log('✅ Countries fetched successfully');
        log('Always showing all ' + countriesArray.length + ' countries in dropdown');
        
        var availableCountries = countriesArray;
        log('Showing ' + availableCountries.length + ' countries in dropdown');
        
        // Populate all dropdowns
        Array.from(countryFilterDropdowns).forEach(function(select, index) {
          debugLog('Populating select ' + index);
          
          // Clear existing options except the first one
          while (select.children.length > 1) {
            select.removeChild(select.lastChild);
          }
          
          // Add country options
          availableCountries.forEach(function(country) {
            var option = document.createElement('option');
            option.value = country.code;
            option.textContent = country.name + ' (' + country.code + ')';
            option.setAttribute('data-country-id', country.database_id || country.id);
            select.appendChild(option);
          });
        });
        
        // Select country
        var selectedCountry = localStorage.getItem(SELECTED_COUNTRY_KEY);
        var urlCountry = new URLSearchParams(window.location.search).get('country');
        
        if (urlCountry) {
          selectedCountry = urlCountry;
        }
        
        if (!selectedCountry) {
          if (availableCountries.length > 0) {
            selectedCountry = availableCountries[0].code;
            log(`Auto-selected first country: ${selectedCountry}`);
          }
        }
        
        if (selectedCountry) {
          Array.from(countryFilterDropdowns).forEach(function(select) {
            select.value = selectedCountry;
          });
          
          var selectedOption = countryFilterDropdowns[0].querySelector('option[value="' + selectedCountry + '"]');
          if (selectedOption) {
            var countryId = selectedOption.getAttribute('data-country-id');
            var countryName = selectedOption.textContent;
            log('Selected: ' + countryName + ' (ID: ' + countryId + ')');
            localStorage.setItem(SELECTED_COUNTRY_KEY, selectedCountry);
            applyCountryFilter(countryId);
          }
        }
        
        log('✅ populateCountryFilter completed successfully');
        resolve();
      });
      
    } catch (error) {
      console.error('Error in populateCountryFilter:', error);
    } finally {
      isPopulating = false;
    }
  }
  
  // INITIALIZATION
  function initializeCountryFilter() {
    try {
      log('🚀 Country filter starting...');
      
      var filterElements = document.querySelectorAll('[data-country-filter]');
      var dropdownElements = document.querySelectorAll('.country-filter-dropdown');
      var articleElements = document.querySelectorAll('[data-country-id]:not(option)');
      
      log(`Elements: ${filterElements.length} filters, ${dropdownElements.length} dropdowns, ${articleElements.length} articles`);
      
      if (dropdownElements.length === 0) {
        log('❌ No dropdowns found - country filter cannot initialize');
        return;
      }
      
      populateCountryFilter();
    } catch (error) {
      console.error('❌ Country filter initialization failed:', error);
    }
  }
  
  // DEBUG FUNCTIONS
  window.debugCountry = function() {
    try {
      var selects = document.querySelectorAll('.country-filter-dropdown');
      var articles = document.querySelectorAll('[data-country-id]:not(option)');
      var regions = document.querySelectorAll('[data-region-country-id]:not(option)');
      
      console.log('🔍 COUNTRY FILTER DEBUG:', {
        isPopulating: isPopulating,
        observerConnected: observerInstance && observerInstance.constructor.name === 'MutationObserver',
        dropdowns: selects.length,
        totalArticles: articles.length,
        totalRegions: regions.length,
        selectedCountry: localStorage.getItem(SELECTED_COUNTRY_KEY),
        firstDropdownValue: selects[0] ? selects[0].value : 'none',
        firstDropdownOptions: selects[0] ? selects[0].options.length : 0,
        cachedArticles: articleDataCache.length,
        countriesLoaded: countriesArray.length
      });
      
      if (articleDataCache.length > 0) {
        var cacheDistribution = {};
        articleDataCache.forEach(function(cached) {
          cacheDistribution[cached.countryId] = (cacheDistribution[cached.countryId] || 0) + 1;
        });
        console.log('💾 Cache country distribution:', cacheDistribution);
      }
      
      if (selects[0]) {
        console.log('📋 Dropdown options:', Array.from(selects[0].options).map(function(option) {
          return {
            value: option.value,
            text: option.textContent,
            countryId: option.getAttribute('data-country-id')
          };
        }));
      }
      
    } catch (error) {
      console.error('❌ debugCountry failed:', error);
    }
  };
  
  window.countryFilterStatus = function() {
    console.log('🔍 COUNTRY FILTER STATUS:', {
      scriptLoaded: true,
      dropdowns: document.querySelectorAll('.country-filter-dropdown').length,
      articles: document.querySelectorAll('[data-country-id]:not(option)').length,
      countriesLoaded: countriesArray.length,
      isPopulating: isPopulating,
      hasCache: articleDataCache.length > 0
    });
  };
  
  // START EVERYTHING
  initializeArticleCache();
  
  try {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initializeCountryFilter, 100);
      });
    } else {
      setTimeout(initializeCountryFilter, 100);
    }
    
    setTimeout(function() {
      try {
        initializeCountryFilter();
      } catch (e) {
        console.error('Delayed init failed:', e);
      }
    }, 1000);
    
    setTimeout(function() {
      try {
        initializeCountryFilter();
      } catch (e) {
        console.error('Late init failed:', e);
      }
    }, 3000);
  } catch (error) {
    console.error('Failed to set up country filter initialization:', error);
  }
  
})();
