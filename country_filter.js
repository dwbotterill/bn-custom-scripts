// Country Filter System with Webflow Filtering Support - FIXED VERSION
(function() {
  'use strict';
  
  // Enhanced logging for debugging
  function log(msg, data) {
    console.log(`🌍 ${msg}`, data || '');
  }
  
  function debugLog(msg, data) {
    console.log(`🔍 DEBUG: ${msg}`, data || '');
  }
  
  var CACHE_KEY = 'webflow_countries_cache';
  var CACHE_DURATION = 6 * 60 * 60 * 1000;
  var SELECTED_COUNTRY_KEY = 'selected_country';
  
  // CRITICAL FIX: Add observer management
  var observerInstance = null;
  var isPopulating = false;
  var populateTimeout = null;
  
  function isMobileView() {
    return window.innerWidth <= 568;
  }
  
  function getFromCache() {
    try {
      var cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        var data = JSON.parse(cached);
        var now = new Date().getTime();
        if (now - data.timestamp < CACHE_DURATION) {
          if (data.countries && Array.isArray(data.countries)) {
            log(`Cache: ${data.countries.length} countries`);
            return data.countries;
          } else {
            localStorage.removeItem(CACHE_KEY);
            return null;
          }
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (e) {
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  }
  
  function saveToCache(countries) {
    try {
      if (!Array.isArray(countries)) return;
      var data = {
        countries: countries,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {}
  }
  
  function fetchCountries() {
    return new Promise(function(resolve, reject) {
      var cachedCountries = getFromCache();
      if (cachedCountries) {
        resolve(cachedCountries);
        return;
      }
      
      log('Fetching from API...');
      var xhr = new XMLHttpRequest();
      var apiUrl = 'https://bn020.replit.app/api/webflow/countries';
      
      xhr.open('GET', apiUrl, true);
      xhr.timeout = 10000;
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var response = JSON.parse(xhr.responseText);
              if (response && response.success && Array.isArray(response.countries)) {
                log(`API: Got ${response.countries.length} countries`);
                saveToCache(response.countries);
                resolve(response.countries);
              } else {
                log('API: Invalid response format');
                reject(new Error('Invalid response format'));
              }
            } catch (e) {
              log('API: Parse error', e);
              reject(new Error('Failed to parse response'));
            }
          } else {
            log(`API: HTTP ${xhr.status}`);
            reject(new Error('HTTP ' + xhr.status));
          }
        }
      };
      
      xhr.ontimeout = function() {
        log('API: Timeout');
        reject(new Error('Request timeout'));
      };
      
      xhr.onerror = function() {
        log('API: Network error');
        reject(new Error('Network error'));
      };
      
      xhr.send();
    });
  }
  
  function updateCountryDisplay(countryCode, countryName) {
    var displayElements = document.querySelectorAll('[data-country-display]');
    displayElements.forEach(function(element) {
      element.textContent = countryName || '';
      element.setAttribute('data-current-country', countryCode || '');
    });
  }

  function updateCountryCodeDisplay(countryCode) {
    var displayElements = document.querySelectorAll('[data-country-code-display]');
    displayElements.forEach(function(element) {
      element.textContent = countryCode || '';
      element.setAttribute('data-current-country-code', countryCode || '');
    });
  }
  
  function resizeSelectToContent(select) {
    if (!select) return;
    
    var temp = document.createElement('span');
    temp.style.cssText = 'visibility: hidden; position: absolute; top: -9999px; left: -9999px; white-space: nowrap; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: 16px; font-weight: 500; line-height: 1.2; padding: 0;';
    
    var selectedOption = select.options[select.selectedIndex];
    var text = '';
    
    if (isMobileView()) {
      text = selectedOption ? selectedOption.value : '';
    } else {
      text = selectedOption ? selectedOption.textContent : '';
    }
    
    temp.textContent = text;
    document.body.appendChild(temp);
    var textWidth = temp.offsetWidth;
    document.body.removeChild(temp);
    
    var totalWidth = textWidth + 50;
    select.style.setProperty('width', totalWidth + 'px', 'important');
  }
  
  function updateMobileOverlay(select) {
    if (!isMobileView()) return;
    
    var container = select.parentNode;
    var overlay = container ? container.querySelector('.country-select-overlay') : null;
    var selectedOption = select.options[select.selectedIndex];
    
    if (overlay && selectedOption && selectedOption.value) {
      overlay.textContent = selectedOption.value;
    }
  }
  
  function updateAllSelectsForScreenSize() {
    var selects = document.querySelectorAll('.country-filter-dropdown');
    
    selects.forEach(function(select) {
      if (isMobileView()) {
        if (!select.dataset.mobileDisplay) {
          select.dataset.mobileDisplay = 'true';
          
          var selectedOption = select.options[select.selectedIndex];
          if (selectedOption && selectedOption.value) {
            var overlay = document.createElement('div');
            overlay.className = 'country-select-overlay';
            overlay.textContent = selectedOption.value;
            
            var container = document.createElement('div');
            container.style.cssText = 'position: relative; display: inline-block; width: auto; z-index: 1; isolation: isolate;';
            select.parentNode.insertBefore(container, select);
            container.appendChild(select);
            container.appendChild(overlay);

            select.style.opacity = '0';
            select.style.position = 'relative';
            select.style.zIndex = '1';
          }
        }
      } else {
        if (select.dataset.mobileDisplay) {
          var container = select.parentNode;
          var overlay = container.querySelector('.country-select-overlay');
          if (overlay) {
            overlay.remove();
          }
          
          if (container.className === '' && container.style.cssText.includes('position: relative')) {
            var originalParent = container.parentNode;
            originalParent.insertBefore(select, container);
            container.remove();
          }
          
          select.style.opacity = '';
          select.style.position = '';
          select.style.zIndex = '';
          select.dataset.mobileDisplay = '';
        }
      }
      
      resizeSelectToContent(select);
    });
  }

  // IMPROVED: More robust visibility checking
  function isElementVisibleInWebflow(element) {
    if (!element || !element.nodeType || element.nodeType !== 1) {
      return false;
    }
    
    // Check if element itself is hidden
    if (element.style.display === 'none') {
      return false;
    }
    
    // Check if element has been filtered out by Webflow
    if (element.classList.contains('w-condition-invisible')) {
      return false;
    }
    
    // Check computed style
    var computedStyle = window.getComputedStyle(element);
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
      return false;
    }
    
    // Check if parent containers are hidden by Webflow (limited depth to prevent performance issues)
    var parent = element.parentElement;
    var depth = 0;
    while (parent && parent !== document.body && depth < 5) {
      var parentStyle = window.getComputedStyle(parent);
      if (parentStyle.display === 'none' || parent.classList.contains('w-condition-invisible')) {
        return false;
      }
      parent = parent.parentElement;
      depth++;
    }
    
    return true;
  }

  // CRITICAL FIX: Add protection against recursive calls
  function populateCountryFilter() {
    // Prevent recursive calls
    if (isPopulating) {
      debugLog('populateCountryFilter already running, skipping');
      return;
    }
    
    isPopulating = true;
    log('🚀 populateCountryFilter called');
    
    // Clear any existing timeout
    if (populateTimeout) {
      clearTimeout(populateTimeout);
    }
    
    var selects = document.querySelectorAll('.country-filter-dropdown');
    log(`Init: Found ${selects.length} dropdowns`);
    
    if (selects.length === 0) {
      var filterElements = document.querySelectorAll('[data-country-filter]');
      log(`Init: Found ${filterElements.length} filter containers`);
      isPopulating = false;
      return;
    }
    
    // DISCONNECT OBSERVER during population to prevent loops
    if (observerInstance) {
      observerInstance.disconnect();
      debugLog('Observer disconnected during population');
    }
    
    selects.forEach(function(select) {
      select.innerHTML = '<option value="">Loading countries...</option>';
    });
    
    fetchCountries()
      .then(function(countries) {
        log('✅ Countries fetched successfully');
        var countriesArray = countries;
        if (!Array.isArray(countries)) {
          if (typeof countries === 'object' && countries !== null) {
            countriesArray = Object.values(countries);
          } else {
            throw new Error('Countries is not an array or object');
          }
        }
        
        // FIXED: Always show all countries in dropdown regardless of visible articles
        var availableCountries = countriesArray;
        log(`Always showing all ${availableCountries.length} countries in dropdown`);
        
        // Just for debugging - check what articles/regions are present
        var allArticles = Array.from(document.querySelectorAll('[data-country-id]:not(option)'));
        var allRegions = Array.from(document.querySelectorAll('[data-region-country-id]:not(option)'));
        debugLog(`Found ${allArticles.length} articles and ${allRegions.length} regions with country data`);
        
        var visibleArticles = allArticles.filter(isElementVisibleInWebflow);
        var visibleRegions = allRegions.filter(isElementVisibleInWebflow);
        debugLog(`Found ${visibleArticles.length} visible articles and ${visibleRegions.length} visible regions after filtering`);
        
        log(`Showing ${availableCountries.length} countries in dropdown`);
        
        availableCountries.sort(function(a, b) {
          var idA = parseInt(a.database_id || a.id);
          var idB = parseInt(b.database_id || b.id);
          return idA - idB;
        });
        
        selects.forEach(function(select, index) {
          debugLog(`Populating select ${index}`);
          select.innerHTML = '';
          
          availableCountries.forEach(function(country) {
            if (country && country.code && country.name) {
              var option = document.createElement('option');
              option.value = country.code;
              option.textContent = country.name;
              option.setAttribute('data-country-id', country.database_id || country.id);
              select.appendChild(option);
            }
          });
        });
        
        var urlParams = new URLSearchParams(window.location.search);
        var countryFromUrl = urlParams.get('country');
        var savedCountry = localStorage.getItem(SELECTED_COUNTRY_KEY);
        var selectedCountry = countryFromUrl || savedCountry;
        
        // FIXED: Auto-select first country if none selected, regardless of visibility
        if (!selectedCountry) {
          if (availableCountries.length > 0) {
            selectedCountry = availableCountries[0].code;
            log(`Auto-selected first country: ${selectedCountry}`);
          }
        }
        
        if (selectedCountry) {
          selects.forEach(function(select) {
            select.value = selectedCountry;
          });
          
          localStorage.setItem(SELECTED_COUNTRY_KEY, selectedCountry);
          
          var selectedOption = selects[0].querySelector('option[value="' + selectedCountry + '"]');
          if (selectedOption) {
            var countryId = selectedOption.getAttribute('data-country-id');
            var countryName = selectedOption.textContent;
            log(`Selected: ${selectedCountry} (ID: ${countryId})`);
            
            applyCountryFilter(countryId);
            updateCountryDisplay(selectedCountry, countryName);
            updateCountryCodeDisplay(selectedCountry);
            
            if (!countryFromUrl) {
              var url = new URL(window.location);
              url.searchParams.set('country', selectedCountry);
              window.history.replaceState({}, '', url.toString());
            }
          }
        }
        
        updateAllSelectsForScreenSize();
        
        selects.forEach(function(select) {
          resizeSelectToContent(select);
        });
        
        log('✅ populateCountryFilter completed successfully');
      })
      .catch(function(error) {
        log('❌ Population error:', error);
        selects.forEach(function(select) {
          select.innerHTML = '<option value="">Error loading countries</option>';
        });
      })
      .finally(function() {
        // RECONNECT OBSERVER after a delay to prevent immediate re-triggering
        populateTimeout = setTimeout(function() {
          isPopulating = false;
          reconnectObserver();
          debugLog('Population completed, observer reconnected');
        }, 1000); // 1 second delay before reconnecting
      });
  }
  
  // IMPROVED: Filter that works WITH Webflow category filters
  function applyCountryFilter(countryId) {
    // Get ALL articles and regions regardless of current visibility
    var allArticles = Array.from(document.querySelectorAll('[data-country-id]:not(option)'));
    var allRegions = Array.from(document.querySelectorAll('[data-region-country-id]:not(option)'));
    
    log(`Filter: Found ${allArticles.length} articles and ${allRegions.length} regions for country ID ${countryId}`);
    
    if (!countryId) {
      // Remove country filtering - let other filters control visibility
      allArticles.forEach(function(article) {
        article.classList.remove('country-filtered');
        // Don't force display - let Webflow category filter control it
      });
      allRegions.forEach(function(region) {
        region.classList.remove('country-filtered');
        // Don't force display - let Webflow category filter control it
      });
      return;
    }
    
    var visibleArticles = 0, hiddenArticles = 0;
    var visibleRegions = 0, hiddenRegions = 0;
    
    // Apply country filter to ALL articles
    allArticles.forEach(function(article) {
      var articleCountryId = article.getAttribute('data-country-id');
      if (articleCountryId === countryId) {
        // This article matches the country filter
        article.classList.remove('country-filtered');
        
        // Only show if it's not hidden by Webflow category filter
        var computedStyle = window.getComputedStyle(article);
        var isHiddenByWebflow = computedStyle.display === 'none';
        
        if (!isHiddenByWebflow) {
          // Article is visible and matches country
          visibleArticles++;
        } else {
          // Article matches country but is hidden by category filter
          // We'll show it anyway since country filter should override
          article.style.display = 'block';
          visibleArticles++;
        }
      } else {
        // This article doesn't match the country filter
        article.classList.add('country-filtered');
        article.style.display = 'none';
        hiddenArticles++;
      }
    });
    
    // Apply country filter to ALL regions  
    allRegions.forEach(function(region) {
      var regionCountryId = region.getAttribute('data-region-country-id');
      if (regionCountryId === countryId) {
        region.classList.remove('country-filtered');
        
        var computedStyle = window.getComputedStyle(region);
        var isHiddenByWebflow = computedStyle.display === 'none';
        
        if (!isHiddenByWebflow) {
          visibleRegions++;
        } else {
          region.style.display = 'block';
          visibleRegions++;
        }
      } else {
        region.classList.add('country-filtered');
        region.style.display = 'none';
        hiddenRegions++;
      }
    });
    
    log(`Result: ${visibleArticles}/${allArticles.length} articles visible, ${visibleRegions}/${allRegions.length} regions visible`);
  }
  
  function handleCountryChange() {
    var selects = document.querySelectorAll('.country-filter-dropdown');
    if (selects.length === 0) return;
    
    log(`🎯 Setting up change handlers for ${selects.length} selects`);
    
    selects.forEach(function(select, index) {
      debugLog(`Setting up handler for select ${index}`);
      
      select.addEventListener('change', function(e) {
        log('🔄 Country change event triggered');
        var selectedCountryCode = this.value;
        debugLog('Selected country code:', selectedCountryCode);
        
        if (selectedCountryCode) {
          var selectedOption = this.querySelector('option[value="' + selectedCountryCode + '"]');
          var countryId = selectedOption ? selectedOption.getAttribute('data-country-id') : null;
          var countryName = selectedOption ? selectedOption.textContent : '';
          
          log(`Changed to: ${selectedCountryCode} (ID: ${countryId})`);
          
          localStorage.setItem(SELECTED_COUNTRY_KEY, selectedCountryCode);
          
          selects.forEach(function(otherSelect) {
            if (otherSelect !== select) {
              otherSelect.value = selectedCountryCode;
              updateMobileOverlay(otherSelect);
            }
          });
          
          updateMobileOverlay(this);
          resizeSelectToContent(this);
          
          selects.forEach(function(otherSelect) {
            if (otherSelect !== select) {
              resizeSelectToContent(otherSelect);
            }
          });
          
          applyCountryFilter(countryId);
          updateCountryDisplay(selectedCountryCode, countryName);
          updateCountryCodeDisplay(selectedCountryCode);
          
          var url = new URL(window.location);
          url.searchParams.set('country', selectedCountryCode);
          window.history.replaceState({}, '', url.toString());
          
          if (window.location.pathname !== '/') {
            var url = new URL(window.location.origin);
            url.searchParams.set('country', selectedCountryCode);
            log('🔀 Redirecting to home with country filter');
            window.location.href = url.toString();
            return;
          }
        }
      });
    });
  }
  
  function refreshCountryCache() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(SELECTED_COUNTRY_KEY);
    populateCountryFilter();
  }
  
  // IMPROVED: Much more conservative observer to prevent conflicts
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
      
      // Instead of full repopulation, just reapply current filter
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
      debounceTimeout = setTimeout(checkForChanges, 1500); // 1.5 second debounce
    }
    
    // Much more conservative observer - only watch for Webflow-specific changes
    observerInstance = new MutationObserver(function(mutations) {
      if (isPopulating) {
        return;
      }
      
      var webflowChange = false;
      
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          var target = mutation.target;
          
          // Only trigger for elements that might be filtered by Webflow
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
  
  function reconnectObserver() {
    if (observerInstance) {
      debugLog('Reconnecting observer');
      observerInstance.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
  }
  
  function watchWebflowFilters() {
    createWebflowWatcher();
    reconnectObserver();
    
    // Also watch for Webflow's filter events if available
    if (window.Webflow && window.Webflow.push) {
      window.Webflow.push(function() {
        log('📡 Webflow.push event detected');
        if (!isPopulating) {
          setTimeout(function() {
            // Reapply current country filter instead of full repopulation
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
  }
  
  var resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      updateAllSelectsForScreenSize();
      if (window.forceCountrySelectorLowZIndex) {
        window.forceCountrySelectorLowZIndex();
      }
    }, 150);
  });
  
  function initializeCountryFilter() {
    log('🚀 Country filter starting...');
    
    var filterElements = document.querySelectorAll('[data-country-filter]');
    var dropdownElements = document.querySelectorAll('.country-filter-dropdown');
    var articleElements = document.querySelectorAll('[data-country-id]:not(option)');
    
    log(`Elements: ${filterElements.length} filters, ${dropdownElements.length} dropdowns, ${articleElements.length} articles`);
    
    populateCountryFilter();
    handleCountryChange();
    watchWebflowFilters();
    setInterval(refreshCountryCache, CACHE_DURATION);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCountryFilter);
  } else {
    initializeCountryFilter();
  }
  
  setTimeout(function() {
    if (window.forceCountrySelectorLowZIndex) {
      window.forceCountrySelectorLowZIndex();
    }
  }, 100);
  
  // Global functions
  window.refreshCountries = refreshCountryCache;
  window.applyCountryFilter = applyCountryFilter;
  
  // Enhanced debug function with sample data inspection
  window.debugCountry = function() {
    var selects = document.querySelectorAll('.country-filter-dropdown');
    var articles = document.querySelectorAll('[data-country-id]:not(option)');
    var regions = document.querySelectorAll('[data-region-country-id]:not(option)');
    var visibleArticles = Array.from(articles).filter(isElementVisibleInWebflow);
    
    console.log('🔍 COUNTRY FILTER DEBUG:', {
      isPopulating: isPopulating,
      observerConnected: observerInstance && observerInstance.constructor.name === 'MutationObserver',
      dropdowns: selects.length,
      totalArticles: articles.length,
      totalRegions: regions.length,
      visibleArticles: visibleArticles.length,
      selectedCountry: localStorage.getItem(SELECTED_COUNTRY_KEY),
      firstDropdownValue: selects[0] ? selects[0].value : 'none',
      firstDropdownOptions: selects[0] ? selects[0].options.length : 0,
      pageURL: window.location.href,
      urlCountryParam: new URLSearchParams(window.location.search).get('country')
    });
    
    // Show sample articles with their country IDs
    if (articles.length > 0) {
      console.log('📝 Sample articles:', Array.from(articles).slice(0, 5).map(function(article) {
        return {
          countryId: article.getAttribute('data-country-id'),
          className: article.className,
          display: window.getComputedStyle(article).display,
          tagName: article.tagName
        };
      }));
    }
    
    // Show sample regions with their country IDs
    if (regions.length > 0) {
      console.log('🌍 Sample regions:', Array.from(regions).slice(0, 5).map(function(region) {
        return {
          countryId: region.getAttribute('data-region-country-id'),
          className: region.className,
          display: window.getComputedStyle(region).display,
          tagName: region.tagName
        };
      }));
    }
    
    // Show dropdown contents
    if (selects[0]) {
      console.log('📋 Dropdown options:', Array.from(selects[0].options).map(function(option) {
        return {
          value: option.value,
          text: option.textContent,
          countryId: option.getAttribute('data-country-id')
        };
      }));
    }
    
    // Show country ID distribution
    var countryDistribution = {};
    Array.from(articles).forEach(function(article) {
      var id = article.getAttribute('data-country-id');
      countryDistribution[id] = (countryDistribution[id] || 0) + 1;
    });
    console.log('📊 Article country ID distribution:', countryDistribution);
  };
  
  // Force country selector z-index
  window.forceCountrySelectorLowZIndex = function() {
    var selects = document.querySelectorAll('.country-filter-dropdown');
    
    selects.forEach(function(select) {
      select.style.setProperty('z-index', '1', 'important');
      select.style.setProperty('position', 'relative', 'important');
      
      var parent = select.parentNode;
      var depth = 0;
      
      while (parent && depth < 5) {
        if (parent.classList && parent.classList.contains('navigation-header')) {
          parent = parent.parentNode;
          depth++;
          continue;
        }
        
        var computedStyle = window.getComputedStyle(parent);
        var position = computedStyle.position;
        
        if (position === 'sticky' || position === 'fixed' || position === 'relative' || position === 'absolute') {
          parent.style.setProperty('z-index', '1', 'important');
          parent.style.setProperty('isolation', 'isolate', 'important');
        }
        
        if (parent.hasAttribute && parent.hasAttribute('data-country-filter')) {
          parent.style.setProperty('z-index', '1', 'important');
          parent.style.setProperty('isolation', 'isolate', 'important');
        }
        
        parent = parent.parentNode;
        depth++;
      }
    });
    
    var overlays = document.querySelectorAll('.country-select-overlay');
    overlays.forEach(function(overlay) {
      overlay.style.setProperty('z-index', '1', 'important');
      
      var container = overlay.parentNode;
      if (container && !container.classList.contains('navigation-header')) {
        container.style.setProperty('z-index', '1', 'important');
        container.style.setProperty('isolation', 'isolate', 'important');
      }
    });
  };
  
})();
