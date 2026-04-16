/**
 * Entry point -- reads the page type from a data attribute and mounts
 * the appropriate page module.
 * @module main
 */

const pageType = document.body.dataset.page;

switch (pageType) {
    case 'login': {
        const { initLoginPage } = await import('./pages/loginPage.js');
        initLoginPage();
        break;
    }
    case 'register': {
        const { initRegisterPage } = await import('./pages/registerPage.js');
        initRegisterPage();
        break;
    }
    case 'scan': {
        const { initScanPage } = await import('./pages/scanPage.js');
        initScanPage();
        break;
    }
    case 'history': {
        const { initHistoryPage } = await import('./pages/historyPage.js');
        initHistoryPage();
        break;
    }
    case 'admin': {
        const { initAdminPage } = await import('./pages/adminPage.js');
        initAdminPage();
        break;
    }
    default:
        console.warn('Unknown page type:', pageType);
}
