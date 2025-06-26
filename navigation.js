// Settings Panel Management
(function() {
  'use strict';
  
  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = `
    #settings-panel,
    .settings-panel,
    [id*="settings-panel"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      transform: translateX(100%) !important;
      pointer-events: none !important;
    }
    .settings-overlay {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  `;
  
  var firstStyle = document.querySelector('style');
  if (firstStyle) {
    firstStyle.parentNode.insertBefore(style, firstStyle);
  } else {
    document.head.appendChild(style);
  }
})();

(function() {
  'use strict';
  
  function isMobileView() {
    return window.innerWidth <= 478;
  }
  
  var isInitialized = false;
  var isOpening = false;
  var outsideClickListener = null;
  var overlayClickHandler = null;
  var closeButtonHandler = null;

  (function() {
    var panel = document.getElementById('settings-panel') || 
                document.querySelector('#settings-panel') || 
                document.querySelector('.settings-panel');
    var overlay = document.querySelector('.settings-overlay');
    
    if (panel) {
      panel.style.setProperty('display', 'none', 'important');
      panel.style.setProperty('visibility', 'hidden', 'important');
      panel.style.setProperty('opacity', '0', 'important');
      panel.style.setProperty('transform', 'translateX(100%)', 'important');
      panel.style.setProperty('pointer-events', 'none', 'important');
    }
    
    if (overlay) {
      overlay.style.setProperty('display', 'none', 'important');
      overlay.style.setProperty('visibility', 'hidden', 'important');
      overlay.style.setProperty('pointer-events', 'none', 'important');
    }
    
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  })();

  function initializeSettingsPanel() {
    if (isInitialized) {
      return;
    }
    
    var button = document.getElementById('settings-button') || 
                 document.querySelector('#settings-button') || 
                 document.querySelector('.settings-button');
    var panel = document.getElementById('settings-panel') || 
                document.querySelector('#settings-panel') || 
                document.querySelector('.settings-panel');
    
    if (panel) {
      panel.style.setProperty('display', 'none', 'important');
      panel.style.setProperty('visibility', 'hidden', 'important');
      panel.style.setProperty('opacity', '0', 'important');
      panel.style.setProperty('transform', 'translateX(100%)', 'important');
      panel.style.setProperty('pointer-events', 'none', 'important');
    }
    
    var settingsOverlay = document.querySelector('.settings-overlay');
    if (settingsOverlay) {
      settingsOverlay.style.setProperty('display', 'none', 'important');
      settingsOverlay.style.setProperty('visibility', 'hidden', 'important');
      settingsOverlay.style.setProperty('pointer-events', 'none', 'important');
    }
    
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    
    if (button && panel) {
      button.onclick = null;
      var newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      newButton.addEventListener('click', function(e) {
        togglePanel(e, panel, settingsOverlay);
      }, true);
      
      isInitialized = true;
    }
  }

  var scrollPosition = 0;
  
  function togglePanel(e, panel, overlay) {
    e.preventDefault();
    e.stopPropagation();
    
    var currentDisplay = window.getComputedStyle(panel).display;
    var isHidden = currentDisplay === 'none';
    var burgerMenu = document.querySelector('.burger-menu');
    var menuIcon = document.querySelector('.menu-icon');
    
    if (isHidden) {
      isOpening = true;
      
      scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      
      if (isMobileView()) {
        if (burgerMenu) burgerMenu.style.display = 'none';
        if (menuIcon) menuIcon.style.display = 'none';
      }
      
      if (overlay) {
        overlay.style.setProperty('display', 'block', 'important');
        overlay.style.setProperty('visibility', 'visible', 'important');
        overlay.style.setProperty('pointer-events', 'auto', 'important');
        overlay.style.removeProperty('opacity');
      }
      
      panel.style.display = 'block';
      panel.style.setProperty('display', 'block', 'important');
      panel.style.setProperty('visibility', 'visible', 'important');
      panel.style.setProperty('opacity', '1', 'important');
      panel.style.setProperty('transform', 'translateX(0)', 'important');
      panel.style.setProperty('pointer-events', 'auto', 'important');
      panel.style.setProperty('z-index', '99999', 'important');
      panel.style.setProperty('position', 'fixed', 'important');
      
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      
      setTimeout(function() {
        isOpening = false;
        addEventHandlers();
        
        if (window.forceDefaultVisibleState) window.forceDefaultVisibleState();
        
        setTimeout(function() {
          if (window.initializeToggle) {
            window.initializeToggle('context');
            window.initializeToggle('language');
          }
        }, 50);
      }, 100);
    } else {
      if (isMobileView()) {
        if (burgerMenu) burgerMenu.style.display = '';
        if (menuIcon) menuIcon.style.display = '';
      }
      
      if (overlay) {
        overlay.style.display = 'none';
        overlay.style.setProperty('visibility', 'hidden', 'important');
        overlay.style.setProperty('display', 'none', 'important');
        overlay.style.setProperty('pointer-events', 'none', 'important');
      }
      panel.style.display = 'none';
      panel.style.setProperty('visibility', 'hidden', 'important');
      panel.style.setProperty('opacity', '0', 'important');
      panel.style.setProperty('transform', 'translateX(100%)', 'important');
      panel.style.setProperty('pointer-events', 'none', 'important');
      
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      
      removeEventHandlers();
    }
  }

  function addEventHandlers() {
    removeEventHandlers();
    
    var closeButton = document.querySelector('.settings-close-button');
    if (closeButton && !closeButtonHandler) {
      var closeButtonContainer = closeButton.closest('.settings-close-wrapper') || closeButton.parentNode;
      
      if (closeButtonContainer) {
        closeButtonHandler = function(e) {
          e.preventDefault();
          e.stopPropagation();
          var settingsPanel = document.getElementById('settings-panel');
          var settingsOverlay = document.querySelector('.settings-overlay');
          
          if (isMobileView()) {
            var burgerMenu = document.querySelector('.burger-menu');
            var menuIcon = document.querySelector('.menu-icon');
            if (burgerMenu) burgerMenu.style.display = '';
            if (menuIcon) menuIcon.style.display = '';
          }
          
          if (settingsOverlay) {
            settingsOverlay.style.display = 'none';
            settingsOverlay.style.setProperty('visibility', 'hidden', 'important');
            settingsOverlay.style.setProperty('display', 'none', 'important');
            settingsOverlay.style.setProperty('pointer-events', 'none', 'important');
          }
          if (settingsPanel) {
            settingsPanel.style.display = 'none';
            settingsPanel.style.setProperty('visibility', 'hidden', 'important');
            settingsPanel.style.setProperty('opacity', '0', 'important');
            settingsPanel.style.setProperty('transform', 'translateX(100%)', 'important');
            settingsPanel.style.setProperty('pointer-events', 'none', 'important');
          }
          
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          
          removeEventHandlers();
        };
        
        closeButtonContainer.addEventListener('click', closeButtonHandler);
        closeButtonContainer.style.cursor = 'pointer';
      }
    }

    var settingsOverlay = document.querySelector('.settings-overlay');
    if (settingsOverlay && !overlayClickHandler) {
      overlayClickHandler = function(e) {
        e.preventDefault();
        var settingsPanel = document.getElementById('settings-panel');
        
        if (isMobileView()) {
          var burgerMenu = document.querySelector('.burger-menu');
          var menuIcon = document.querySelector('.menu-icon');
          if (burgerMenu) burgerMenu.style.display = '';
          if (menuIcon) menuIcon.style.display = '';
        }
        
        if (settingsOverlay) {
          settingsOverlay.style.display = 'none';
          settingsOverlay.style.setProperty('visibility', 'hidden', 'important');
          settingsOverlay.style.setProperty('display', 'none', 'important');
          settingsOverlay.style.setProperty('pointer-events', 'none', 'important');
        }
        if (settingsPanel) {
          settingsPanel.style.display = 'none';
          settingsPanel.style.setProperty('visibility', 'hidden', 'important');
          settingsPanel.style.setProperty('opacity', '0', 'important');
          settingsPanel.style.setProperty('transform', 'translateX(100%)', 'important');
          settingsPanel.style.setProperty('pointer-events', 'none', 'important');
        }
        
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        
        removeEventHandlers();
      };
      
      settingsOverlay.addEventListener('click', overlayClickHandler);
    }

    if (!outsideClickListener && !isOpening) {
      outsideClickListener = function(e) {
        var settingsButton = document.getElementById('settings-button');
        var settingsPanel = document.getElementById('settings-panel');
        var settingsOverlay = document.querySelector('.settings-overlay');
        var contextCheckbox = document.getElementById('context-checkbox');
        var languageCheckbox = document.getElementById('language-checkbox');
        var closeButton = document.querySelector('.settings-close-button');
        
        var clickedOnCheckbox = (contextCheckbox && contextCheckbox.contains(e.target)) ||
                               (languageCheckbox && languageCheckbox.contains(e.target));
        var clickedOnCloseButton = closeButton && closeButton.contains(e.target);
        var clickedOnSettingsButton = (settingsButton && settingsButton.contains(e.target)) || 
                                     (document.querySelector('#settings-button') && document.querySelector('#settings-button').contains(e.target));
        
        if (!clickedOnSettingsButton && 
            !settingsPanel.contains(e.target) && 
            !clickedOnCheckbox &&
            !clickedOnCloseButton) {
          
          if (isMobileView()) {
            var burgerMenu = document.querySelector('.burger-menu');
            var menuIcon = document.querySelector('.menu-icon');
            if (burgerMenu) burgerMenu.style.display = '';
            if (menuIcon) menuIcon.style.display = '';
          }
          
          settingsPanel.style.display = 'none';
          settingsPanel.style.setProperty('visibility', 'hidden', 'important');
          settingsPanel.style.setProperty('opacity', '0', 'important');
          if (settingsOverlay) {
            settingsOverlay.style.display = 'none';
            settingsOverlay.style.setProperty('visibility', 'hidden', 'important');
            settingsOverlay.style.setProperty('display', 'none', 'important');
            settingsOverlay.style.setProperty('pointer-events', 'none', 'important');
          }
          
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          
          removeEventHandlers();
        }
      };
      
      document.addEventListener('click', outsideClickListener);
    }
  }

  function removeEventHandlers() {
    if (closeButtonHandler) {
      var closeButton = document.querySelector('.settings-close-button');
      if (closeButton) {
        var closeButtonContainer = closeButton.closest('.settings-close-wrapper') || closeButton.parentNode;
        if (closeButtonContainer) {
          closeButtonContainer.removeEventListener('click', closeButtonHandler);
        }
      }
      closeButtonHandler = null;
    }

    if (overlayClickHandler) {
      var settingsOverlay = document.querySelector('.settings-overlay');
      if (settingsOverlay) {
        settingsOverlay.removeEventListener('click', overlayClickHandler);
      }
      overlayClickHandler = null;
    }

    if (outsideClickListener) {
      document.removeEventListener('click', outsideClickListener);
      outsideClickListener = null;
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initializeSettingsPanel, 50);
    });
  } else {
    setTimeout(initializeSettingsPanel, 50);
  }
  
  setTimeout(function() {
    initializeSettingsPanel();
  }, 200);
  
})();

// Mobile Menu Management
document.addEventListener('DOMContentLoaded', function() {
    const burgerMenu = document.querySelector('.burger-menu');
    const menuIcon = document.querySelector('.menu-icon');
    const mobileMenu = document.querySelector('.mobile-menu');
    let isMenuOpen = false;
    let menuScrollPosition = 0;
    
    if (!burgerMenu || !menuIcon || !mobileMenu) return;
    
    menuIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width: 24px; height: 24px; fill: currentColor;"><path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/></svg>';
    mobileMenu.style.display = 'none';
    
    function closeMenu() {
        if (!isMenuOpen) return;
        isMenuOpen = false;
        mobileMenu.style.display = 'none';
        
        menuIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width: 24px; height: 24px; fill: currentColor;"><path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/></svg>';
        
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        
        removeOutsideClickListener();
    }
    
    function openMenu() {
        if (isMenuOpen) return;
        isMenuOpen = true;
        
        menuScrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        
        mobileMenu.style.display = 'block';
        mobileMenu.style.setProperty('z-index', '99999', 'important');
        mobileMenu.style.setProperty('position', 'fixed', 'important');
        
        menuIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="width: 24px; height: 24px; fill: currentColor;"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>';
        menuIcon.style.pointerEvents = 'auto';
        menuIcon.style.position = 'relative';
        menuIcon.style.setProperty('z-index', '100000', 'important');
        
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        
        addOutsideClickListener();
    }
    
    function toggleMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        isMenuOpen ? closeMenu() : openMenu();
    }
    
    burgerMenu.addEventListener('click', toggleMenu);
    
    let outsideClickListener = null;
    
    function addOutsideClickListener() {
        if (outsideClickListener) return;
        
        outsideClickListener = function(e) {
            const settingsButton = document.getElementById('settings-button');
            const settingsPanel = document.getElementById('settings-panel');
            
            const isClickingSettings = (settingsButton && settingsButton.contains(e.target)) || 
                                     (settingsPanel && settingsPanel.contains(e.target));
            
            if (!isClickingSettings &&
                !mobileMenu.contains(e.target) && 
                !burgerMenu.contains(e.target)) {
                closeMenu();
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', outsideClickListener);
        }, 100);
    }
    
    function removeOutsideClickListener() {
        if (outsideClickListener) {
            document.removeEventListener('click', outsideClickListener);
            outsideClickListener = null;
        }
    }
});
