function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth < 768;
  }

  if (isMobileDevice()) {
    const overlay = document.getElementById('mobile-warning');
    overlay.style.display = 'block';

    const hideElements = ['board', 'pieces', 'check-btn', 'reset-btn', 'instructions-btn', 'colorblind-toggle-container'];
    hideElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }
