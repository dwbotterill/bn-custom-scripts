console.log('🚀 Navigation.js v1.4.0 loaded');

(function() {
    let isMenuOpen = false;
    let menuScrollPosition = 0;
    let outsideClickListener = null;

    const burgerMenu = document.querySelector('.burger-menu');
    const menuIcon = document.querySelector('.menu-icon');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (!burgerMenu || !menuIcon || !mobileMenu) return;

    // Initialize menu
    menuIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width: 24px; height: 24px; fill: currentColor;"><path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/></svg>';
    mobileMenu.style.display = 'none';

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

    function closeMenu() {
        if (!isMenuOpen) return;
        isMenuOpen = false;
        
        mobileMenu.style.display = 'none';
        menuIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width: 24px; height: 24px; fill: currentColor;"><path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/></svg>';
        
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        
        removeOutsideClickListener();
    }

    function toggleMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        isMenuOpen ? closeMenu() : openMenu();
    }

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

    // Initialize
    burgerMenu.addEventListener('click', toggleMenu);
})();
