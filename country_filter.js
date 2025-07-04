// Country Filter System with Debug Logging
(function() {
  'use strict';
  
  // Compact logging for critical issues
  function log(msg, data) {
    console.log(`🌍 ${msg}`, data || '');
  }
  
  var CACHE_KEY = 'webflow_countries_cache';
  var CACHE_DURATION = 6 * 60 * 60 * 1000;
  var SELECTED_COUNTRY_KEY = 'selected_country';
  
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
 
  function populateCountryFilter() {
    var selects = document.querySelectorAll('.country-filter-dropdown');
    log(`Init: Found ${selects.length} dropdowns`);
    
    if (selects.length === 0) {
      var filterElements = document.querySelectorAll('[data-country-filter]');
      log(`Init: Found ${filterElements.length} filter containers`);
      return;
    }
    
    selects.forEach(function(select) {
      select.innerHTML = '<option value="">Loading countries...</option>';
    });
    
    fetchCountries()
      .then(function(countries) {
        var countriesArray = countries;
        if (!Array.isArray(countries)) {
          if (typeof countries === 'object' && countries !== null) {
            countriesArray = Object.values(countries);
          } else {
            throw new Error('Countries is not an array or object');
          }
        }
        
        countriesArray.sort(function(a, b) {
          var idA = parseInt(a.database_id || a.id);
          var idB = parseInt(b.database_id || b.id);
          return idA - idB;
        });
        
        selects.forEach(function(select) {
          select.innerHTML = '';
          
          countriesArray.forEach(function(country) {
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
        
        if (!selectedCountry && countriesArray.length > 0) {
          selectedCountry = countriesArray[0].code;
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
      })
      .catch(function(error) {
        log('Population error:', error);
        selects.forEach(function(select) {
          select.innerHTML = '<option value="">Error loading countries</option>';
        });
      });
  }
  
  function applyCountryFilter(countryId) {
    var allArticles = document.querySelectorAll('[data-country-id]:not(option)');
    var allRegions = document.querySelectorAll('[data-region-country-id]:not(option)');
    
    log(`Filter: ${allArticles.length} articles, ${allRegions.length} regions for ID ${countryId}`);
    
    if (!countryId) {
      allArticles.forEach(function(article) {
        article.classList.remove('country-filtered');
        article.style.display = '';
      });
      allRegions.forEach(function(region) {
        region.classList.remove('country-filtered');
        region.style.display = '';
      });
      return;
    }
    
    var visible = 0, hidden = 0;
    
    allArticles.forEach(function(article) {
      var articleCountryId = article.getAttribute('data-country-id');
      if (articleCountryId === countryId) {
        article.classList.remove('country-filtered');
        article.style.display = '';
        visible++;
      } else {
        article.classList.add('country-filtered');
        article.style.display = 'none';
        hidden++;
      }
    });
    
    allRegions.forEach(function(region) {
      var regionCountryId = region.getAttribute('data-region-country-id');
      if (regionCountryId === countryId) {
        region.classList.remove('country-filtered');
        region.style.display = '';
      } else {
        region.classList.add('country-filtered');
        region.style.display = 'none';
      }
    });
    
    log(`Result: ${visible} visible, ${hidden} hidden`);
  }
  
  function handleCountryChange() {
    var selects = document.querySelectorAll('.country-filter-dropdown');
    if (selects.length === 0) return;
    
    selects.forEach(function(select) {
      select.addEventListener('change', function() {
        var selectedCountryCode = this.value;
        
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
    
    // Quick element check
    var filterElements = document.querySelectorAll('[data-country-filter]');
    var dropdownElements = document.querySelectorAll('.country-filter-dropdown');
    var articleElements = document.querySelectorAll('[data-country-id]:not(option)');
    
    log(`Elements: ${filterElements.length} filters, ${dropdownElements.length} dropdowns, ${articleElements.length} articles`);
    
    populateCountryFilter();
    handleCountryChange();
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
  
  // 🔧 FIXED: Force country selector z-index - EXCLUDING navigation-header
  window.forceCountrySelectorLowZIndex = function() {
    var selects = document.querySelectorAll('.country-filter-dropdown');
    
    selects.forEach(function(select) {
      select.style.setProperty('z-index', '1', 'important');
      select.style.setProperty('position', 'relative', 'important');
      
      var parent = select.parentNode;
      var depth = 0;
      
      while (parent && depth < 5) {
        // 🔧 CRITICAL FIX: Skip navigation-header to preserve its z-index!
        if (parent.classList && parent.classList.contains('navigation-header')) {
          console.log('🚫 Skipping navigation-header - preserving z-index');
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
      // 🔧 ALSO skip navigation-header for overlays
      if (container && !container.classList.contains('navigation-header')) {
        container.style.setProperty('z-index', '1', 'important');
        container.style.setProperty('isolation', 'isolate', 'important');
      }
    });
  };
  
  // Quick debug function
  window.debugCountry = function() {
    var selects = document.querySelectorAll('.country-filter-dropdown');
    var articles = document.querySelectorAll('[data-country-id]:not(option)');
    console.log('Country Debug:', {
      dropdowns: selects.length,
      articles: articles.length,
      selectedCountry: localStorage.getItem(SELECTED_COUNTRY_KEY),
      firstDropdownValue: selects[0] ? selects[0].value : 'none'
    });
  };
  
})();
