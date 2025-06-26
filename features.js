// Context Processing and Language Features
(function() {
  'use strict';
  
  // Initialize dropdown creation for country filters
  document.addEventListener('DOMContentLoaded', function() {
    var targetDivs = document.querySelectorAll('[data-country-filter]');
    var dropdownCount = 0;
    
    targetDivs.forEach(function(targetDiv) {
      if (!targetDiv.querySelector('select')) {
        dropdownCount++;
        var select = document.createElement('select');
        select.className = 'country-filter-dropdown';
        select.id = 'country-filter-' + dropdownCount;
        select.innerHTML = '<option value="">Loading countries...</option>';
        targetDiv.appendChild(select);
      }
    });
  });
  
})();

// Context and Language Tag Processing
(function() {
  'use strict';
  
  function processNestedContextTags() {
    var contentElements = document.querySelectorAll('.article-content');
    
    for (var i = 0; i < contentElements.length; i++) {
      var element = contentElements[i];
      if (element.dataset.contextProcessed) continue;
      
      var content = element.innerHTML;
      var txt = document.createElement('textarea');
      txt.innerHTML = content;
      content = txt.value;
      
      if (!content.trim() || content.indexOf('<context') === -1) continue;
      
      var processed = false;
      
      // Process nested context tags
      if (content.indexOf('<context>') !== -1 && (content.indexOf('<context1>') !== -1 || content.indexOf('<context2>') !== -1)) {
        content = content.replace(/<context>([\s\S]*?)<\/context>/gi, function(match, contextContent) {
          var processedContent = '';
          
          var context1Match = contextContent.match(/<context1>([\s\S]*?)<\/context1>/i);
          if (context1Match) {
            var marginBottom = contextContent.indexOf('<context2>') !== -1 ? '0px' : '0';
            processedContent += '<div style="margin-bottom: ' + marginBottom + '">' + context1Match[1].trim() + '</div>';
          }
          
          var context2Match = contextContent.match(/<context2>([\s\S]*?)<\/context2>/i);
          if (context2Match) {
            var uniqueId = 'context-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
            processedContent += '<div class="context-advanced" style="border-top: 0px solid rgba(13, 110, 253, 0.2); padding-top: 5px;">' +
              '<button class="context-toggle" data-target="' + uniqueId + '"><strong>Read more</strong><span class="chevron">chevron_right</span></button>' +
              '<div class="collapsible-content" id="' + uniqueId + '">' + context2Match[1].trim() + '</div></div>';
          }
          
          return '<div class="context-box">' + processedContent + '</div>';
        });
        processed = true;
      }
      
      // Process individual context tags
      if (content.indexOf('<context1>') !== -1 && content.indexOf('<context><context1>') === -1) {
        content = content.replace(/<context1>([\s\S]*?)<\/context1>/gi, function(match, contextContent) {
          return '<div class="context-box">' + contextContent.trim() + '</div>';
        });
        processed = true;
      }
      
      if (content.indexOf('<context2>') !== -1 && content.indexOf('<context><context2>') === -1) {
        content = content.replace(/<context2>([\s\S]*?)<\/context2>/gi, function(match, contextContent) {
          var uniqueId = 'context-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
          return '<div class="context-box"><div class="context-advanced">' +
            '<button class="context-toggle" data-target="' + uniqueId + '"><strong>Read more</strong><span class="chevron">chevron_right</span></button>' +
            '<div class="collapsible-content" id="' + uniqueId + '">' + contextContent.trim() + '</div></div></div>';
        });
        processed = true;
      }
      
      if (content.indexOf('<context>') !== -1 && content.indexOf('<context1>') === -1 && content.indexOf('<context2>') === -1) {
        content = content.replace(/<context>([\s\S]*?)<\/context>/gi, function(match, contextContent) {
          return '<div class="context-box"><div class="context-label">Context</div><div>' + contextContent.trim() + '</div></div>';
        });
        processed = true;
      }
      
      // Process language tags
      if (content.indexOf('<language>') !== -1) {
        content = content.replace(/<language>([\s\S]*?)<\/language>/gi, function(match, languageContent) {
          return '<div class="language-box"><div>' + languageContent.trim() + '</div></div>';
        });
        processed = true;
      }
      
      if (processed) {
        element.innerHTML = content;
        element.dataset.contextProcessed = 'true';
        addClickHandlers(element);
      }
    }
  }
  
  function addClickHandlers(element) {
    var toggleButtons = element.querySelectorAll('.context-toggle');
    
    for (var i = 0; i < toggleButtons.length; i++) {
      var button = toggleButtons[i];
      var newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      (function(btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          var targetId = this.getAttribute('data-target');
          var targetElement = document.getElementById(targetId);
          var chevron = this.querySelector('.chevron');
          
          if (targetElement) {
            var isHidden = targetElement.style.display === 'none' || targetElement.style.display === '' || !targetElement.classList.contains('show');
            
            if (isHidden) {
              targetElement.style.display = 'block';
              targetElement.classList.add('show');
              chevron.classList.add('expanded');
            } else {
              targetElement.style.display = 'none';
              targetElement.classList.remove('show');
              chevron.classList.remove('expanded');
            }
          }
        });
      })(newButton);
    }
  }
  
  function processImageUrls() {
    var imageUrlElements = document.querySelectorAll('.image-url');
    
    for (var i = 0; i < imageUrlElements.length; i++) {
      var element = imageUrlElements[i];
      if (element.dataset.imageProcessed) continue;
      
      var urlText = element.textContent.trim();
      var imageUrlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/i;
      var match = urlText.match(imageUrlRegex);
      
      if (match) {
        var img = document.createElement('img');
        img.src = match[1];
        img.alt = 'Article image';
        element.innerHTML = '';
        element.appendChild(img);
        element.dataset.imageProcessed = 'true';
      }
    }
  }
  
  function startContentObserver() {
    var observer = new MutationObserver(function(mutations) {
      var shouldProcess = false;
      
      for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];
        if (mutation.type === 'childList') {
          for (var j = 0; j < mutation.addedNodes.length; j++) {
            var node = mutation.addedNodes[j]; // FIXED: was mutations[j].addedNodes[j]
            if (node && node.nodeType === 1) { // FIXED: added null check
              if ((node.classList && (node.classList.contains('article-content') || node.classList.contains('image-url'))) ||
                  (node.querySelector && (node.querySelector('.article-content') || node.querySelector('.image-url'))) ||
                  (node.innerHTML && node.innerHTML.indexOf('<context') !== -1)) {
                shouldProcess = true;
                break;
              }
            }
          }
        }
        if (mutation.type === 'characterData' && mutation.target.parentNode && 
            mutation.target.parentNode.classList && mutation.target.parentNode.classList.contains('image-url')) {
          shouldProcess = true;
        }
      }
      
      if (shouldProcess) {
        setTimeout(function() {
          processNestedContextTags();
          processImageUrls();
        }, 50);
      }
    });
    
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: false
      });
    }
  }
  
  function initialProcessing() {
    processNestedContextTags();
    processImageUrls();
  }
  
  startContentObserver();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialProcessing);
  } else {
    initialProcessing();
  }
  
  setTimeout(initialProcessing, 500);
  setTimeout(initialProcessing, 3000);
  
  window.processNestedContextTags = processNestedContextTags;
  window.addClickHandlers = addClickHandlers;
  window.processImageUrls = processImageUrls;
  
})();

// Toggle System for Context and Language Visibility
(function() {
  'use strict';
  
  // Force default visible state on page load
  function forceDefaultVisibleState() {
    console.log('Settings panel opened - respecting saved user preferences');
  }
  
  function initializeToggle(type) {
    var checkbox = document.getElementById(type + '-checkbox');
    if (!checkbox || checkbox.dataset.initialized === 'true') return;
    
    checkbox.dataset.initialized = 'true';
    
    // Read saved state from localStorage
    var hideKey = 'hide' + type.charAt(0).toUpperCase() + type.slice(1);
    var savedState = localStorage.getItem(hideKey);
    
    // For NEW users (no saved state): default to ON (visible)
    // For RETURNING users: use their saved preference
    var contentShouldBeVisible;
    if (savedState === null) {
      // New user - default to visible (toggle ON)
      contentShouldBeVisible = true;
      localStorage.setItem(hideKey, 'false'); // Save the default state
      console.log(type + ' toggle: NEW USER - defaulting to ON (visible)');
    } else {
      // Returning user - use saved preference
      contentShouldBeVisible = savedState === 'false';
      console.log(type + ' toggle: RETURNING USER - using saved state:', savedState, '(visible:', contentShouldBeVisible + ')');
    }
    
    // Apply the determined state
    if (contentShouldBeVisible) {
      checkbox.setAttribute('data-checked', 'true');
      checkbox.setAttribute('aria-checked', 'true');
      document.body.classList.remove('hide-' + type);
    } else {
      checkbox.setAttribute('data-checked', 'false');
      checkbox.setAttribute('aria-checked', 'false');
      document.body.classList.add('hide-' + type);
    }
    
    // Clean up element to remove any existing handlers
    var newCheckbox = checkbox.cloneNode(true);
    checkbox.parentNode.replaceChild(newCheckbox, checkbox);
    checkbox = newCheckbox;
    
    // Add click handler
    checkbox.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      var currentlyChecked = this.getAttribute('data-checked') === 'true';
      var newCheckedState = !currentlyChecked;
      
      console.log(type + ' toggle clicked: was', currentlyChecked, 'now', newCheckedState);
      
      // Update toggle state
      this.setAttribute('data-checked', newCheckedState ? 'true' : 'false');
      this.setAttribute('aria-checked', newCheckedState ? 'true' : 'false');
      
      // Update content visibility and save to localStorage
      if (newCheckedState) {
        document.body.classList.remove('hide-' + type);
        localStorage.setItem(hideKey, 'false');
        console.log(type + ' content now VISIBLE - saved to localStorage');
      } else {
        document.body.classList.add('hide-' + type);
        localStorage.setItem(hideKey, 'true');
        console.log(type + ' content now HIDDEN - saved to localStorage');
      }
    });
  }
  
  // Apply saved states immediately on page load
  function applySavedStatesOnPageLoad() {
    console.log('🟣 Applying saved toggle states on page load...');
    
    // Apply context toggle state
    var contextState = localStorage.getItem('hideContext');
    if (contextState === 'true') {
      document.body.classList.add('hide-context');
      console.log('🟣 Applied HIDDEN state for context on page load');
    } else {
      document.body.classList.remove('hide-context');
      console.log('🟣 Applied VISIBLE state for context on page load');
    }
    
    // Apply language toggle state
    var languageState = localStorage.getItem('hideLanguage');
    if (languageState === 'true') {
      document.body.classList.add('hide-language');
      console.log('🟣 Applied HIDDEN state for language on page load');
    } else {
      document.body.classList.remove('hide-language');
      console.log('🟣 Applied VISIBLE state for language on page load');
    }
  }
  
  // Apply saved states immediately when the script loads
  applySavedStatesOnPageLoad();
  
  // Make functions available globally
  window.initializeToggle = initializeToggle;
  window.forceDefaultVisibleState = forceDefaultVisibleState;
  window.applySavedStatesOnPageLoad = applySavedStatesOnPageLoad;
  
})();

// Periodic Processing and State Management
(function() {
  'use strict';
  
  function periodicProcessing() {
    if (window.processNestedContextTags) window.processNestedContextTags();
    if (window.processImageUrls) window.processImageUrls();
  }
  
  // Apply saved toggle states on every page load
  function ensureToggleStatesApplied() {
    if (window.applySavedStatesOnPageLoad) {
      window.applySavedStatesOnPageLoad();
    }
  }
  
  setInterval(periodicProcessing, 5000);
  setTimeout(periodicProcessing, 2000);
  
  // Ensure toggle states are applied when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureToggleStatesApplied);
  } else {
    ensureToggleStatesApplied();
  }
  
  // Also apply after a short delay to catch any late-loading content
  setTimeout(ensureToggleStatesApplied, 100);
  setTimeout(ensureToggleStatesApplied, 500);
  
})();
