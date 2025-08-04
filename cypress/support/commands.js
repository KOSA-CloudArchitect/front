// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Authentication commands
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.wait('@login');
    cy.url().should('not.include', '/login');
    cy.window().its('localStorage.token').should('exist');
  });
});

Cypress.Commands.add('loginAsTestUser', () => {
  const { email, password } = Cypress.env('testUser');
  cy.login(email, password);
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
  cy.window().its('localStorage.token').should('not.exist');
});

// Registration command
Cypress.Commands.add('register', (userData) => {
  cy.visit('/register');
  cy.get('[data-testid="name-input"]').type(userData.name);
  cy.get('[data-testid="email-input"]').type(userData.email);
  cy.get('[data-testid="password-input"]').type(userData.password);
  cy.get('[data-testid="confirm-password-input"]').type(userData.password);
  cy.get('[data-testid="register-button"]').click();
  cy.wait('@register');
});

// Search commands
Cypress.Commands.add('searchProduct', (query) => {
  cy.get('[data-testid="search-input"]').clear().type(query);
  cy.get('[data-testid="search-button"]').click();
  cy.get('[data-testid="search-results"]').should('be.visible');
});

Cypress.Commands.add('selectFirstProduct', () => {
  cy.get('[data-testid="product-item"]').first().click();
  cy.url().should('include', '/product/');
});

// Analysis commands
Cypress.Commands.add('startAnalysis', () => {
  cy.get('[data-testid="analyze-button"]').click();
  cy.get('[data-testid="analysis-progress"]').should('be.visible');
});

Cypress.Commands.add('waitForAnalysisComplete', (timeout = 30000) => {
  cy.get('[data-testid="analysis-progress"]', { timeout }).should('not.exist');
  cy.get('[data-testid="analysis-results"]').should('be.visible');
});

// WebSocket commands
Cypress.Commands.add('mockWebSocket', () => {
  cy.window().then((win) => {
    // Mock WebSocket for testing
    win.WebSocket = class MockWebSocket {
      constructor(url) {
        this.url = url;
        this.readyState = 1; // OPEN
        setTimeout(() => {
          if (this.onopen) this.onopen();
        }, 100);
      }
      
      send(data) {
        // Mock sending data
        console.log('WebSocket send:', data);
      }
      
      close() {
        this.readyState = 3; // CLOSED
        if (this.onclose) this.onclose();
      }
      
      // Simulate receiving messages
      simulateMessage(data) {
        if (this.onmessage) {
          this.onmessage({ data: JSON.stringify(data) });
        }
      }
    };
  });
});

// API mocking commands
Cypress.Commands.add('mockAnalysisAPI', () => {
  cy.intercept('POST', '/api/analyze/airflow/single', {
    statusCode: 200,
    body: {
      success: true,
      message: '단일 상품 분석이 시작되었습니다.',
      dagRunId: 'test-dag-run-123',
      dagId: 'single_product_analysis',
      status: 'triggered'
    }
  }).as('singleAnalysis');

  cy.intercept('GET', '/api/analyze/airflow/status/*/test-dag-run-123', {
    statusCode: 200,
    body: {
      success: true,
      dagId: 'single_product_analysis',
      dagRunId: 'test-dag-run-123',
      state: 'success',
      progress: {
        total: 5,
        completed: 5,
        failed: 0,
        running: 0,
        percentage: 100
      }
    }
  }).as('analysisStatus');

  cy.intercept('GET', '/api/analyze/result/*', {
    statusCode: 200,
    body: {
      success: true,
      status: 'completed',
      result: {
        productId: 'test-product',
        sentiment: {
          positive: 0.6,
          negative: 0.2,
          neutral: 0.2
        },
        summary: '전반적으로 긍정적인 리뷰가 많습니다.',
        keywords: ['품질', '가격', '배송'],
        totalReviews: 150
      }
    }
  }).as('analysisResult');
});

// Utility commands
Cypress.Commands.add('getByTestId', (testId) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('findByTestId', { prevSubject: 'element' }, (subject, testId) => {
  return cy.wrap(subject).find(`[data-testid="${testId}"]`);
});

// Accessibility commands
Cypress.Commands.add('checkA11y', (context, options) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

// Visual regression commands
Cypress.Commands.add('matchImageSnapshot', (name, options = {}) => {
  cy.screenshot(name, options);
  // In a real implementation, you would compare with baseline images
});

// Form helpers
Cypress.Commands.add('fillForm', (formData) => {
  Object.keys(formData).forEach(field => {
    cy.get(`[data-testid="${field}-input"]`).clear().type(formData[field]);
  });
});

Cypress.Commands.add('submitForm', (formTestId = 'form') => {
  cy.get(`[data-testid="${formTestId}"]`).submit();
});

// Wait for loading states
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading-spinner"]').should('not.exist');
  cy.get('[data-testid="skeleton-loader"]').should('not.exist');
});

// Error handling
Cypress.Commands.add('expectError', (message) => {
  cy.get('[data-testid="error-message"]').should('be.visible').and('contain', message);
});

Cypress.Commands.add('expectSuccess', (message) => {
  cy.get('[data-testid="success-message"]').should('be.visible').and('contain', message);
});

// Local storage helpers
Cypress.Commands.add('setLocalStorage', (key, value) => {
  cy.window().then((win) => {
    win.localStorage.setItem(key, JSON.stringify(value));
  });
});

Cypress.Commands.add('getLocalStorage', (key) => {
  return cy.window().then((win) => {
    const value = win.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  });
});

// Cookie helpers
Cypress.Commands.add('setCookie', (name, value, options = {}) => {
  cy.setCookie(name, value, options);
});

// Network simulation
Cypress.Commands.add('simulateSlowNetwork', () => {
  cy.intercept('**', (req) => {
    req.reply((res) => {
      res.delay(2000); // 2 second delay
    });
  });
});

Cypress.Commands.add('simulateOffline', () => {
  cy.intercept('**', { forceNetworkError: true });
});