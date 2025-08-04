// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Import code coverage
import '@cypress/code-coverage/support';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test on uncaught exceptions
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Custom assertions
chai.use((chai, utils) => {
  chai.Assertion.addMethod('beVisible', function () {
    const obj = this._obj;
    this.assert(
      obj.should('be.visible'),
      'expected #{this} to be visible',
      'expected #{this} not to be visible'
    );
  });
});

// Global hooks
beforeEach(() => {
  // Clear local storage and cookies before each test
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Set up API interceptors
  cy.intercept('POST', '/api/auth/login', { fixture: 'auth/login-success.json' }).as('login');
  cy.intercept('POST', '/api/auth/register', { fixture: 'auth/register-success.json' }).as('register');
  cy.intercept('GET', '/api/auth/me', { fixture: 'auth/user-profile.json' }).as('userProfile');
});

// Custom viewport sizes
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667); // iPhone SE
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024); // iPad
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720); // Desktop
});

// Performance monitoring
Cypress.Commands.add('measurePerformance', (name) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-start`);
  });
});

Cypress.Commands.add('endPerformanceMeasure', (name) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-end`);
    win.performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = win.performance.getEntriesByName(name)[0];
    cy.log(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
  });
});