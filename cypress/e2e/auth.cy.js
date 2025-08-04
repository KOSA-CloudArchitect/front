describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('User Registration', () => {
    it('should register a new user successfully', () => {
      const userData = {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!'
      };

      cy.visit('/register');
      
      // Fill registration form
      cy.getByTestId('name-input').type(userData.name);
      cy.getByTestId('email-input').type(userData.email);
      cy.getByTestId('password-input').type(userData.password);
      cy.getByTestId('confirm-password-input').type(userData.password);
      
      // Submit form
      cy.getByTestId('register-button').click();
      
      // Wait for registration API call
      cy.wait('@register');
      
      // Should redirect to login page
      cy.url().should('include', '/login');
      cy.expectSuccess('회원가입이 완료되었습니다');
    });

    it('should show validation errors for invalid input', () => {
      cy.visit('/register');
      
      // Try to submit empty form
      cy.getByTestId('register-button').click();
      
      // Should show validation errors
      cy.getByTestId('name-error').should('be.visible').and('contain', '이름을 입력해주세요');
      cy.getByTestId('email-error').should('be.visible').and('contain', '이메일을 입력해주세요');
      cy.getByTestId('password-error').should('be.visible').and('contain', '비밀번호를 입력해주세요');
    });

    it('should validate email format', () => {
      cy.visit('/register');
      
      cy.getByTestId('name-input').type('Test User');
      cy.getByTestId('email-input').type('invalid-email');
      cy.getByTestId('password-input').type('TestPassword123!');
      cy.getByTestId('confirm-password-input').type('TestPassword123!');
      
      cy.getByTestId('register-button').click();
      
      cy.getByTestId('email-error').should('be.visible').and('contain', '올바른 이메일 형식을 입력해주세요');
    });

    it('should validate password strength', () => {
      cy.visit('/register');
      
      cy.getByTestId('name-input').type('Test User');
      cy.getByTestId('email-input').type('test@example.com');
      cy.getByTestId('password-input').type('weak');
      cy.getByTestId('confirm-password-input').type('weak');
      
      cy.getByTestId('register-button').click();
      
      cy.getByTestId('password-error').should('be.visible').and('contain', '비밀번호는 최소 8자 이상이어야 합니다');
    });

    it('should validate password confirmation', () => {
      cy.visit('/register');
      
      cy.getByTestId('name-input').type('Test User');
      cy.getByTestId('email-input').type('test@example.com');
      cy.getByTestId('password-input').type('TestPassword123!');
      cy.getByTestId('confirm-password-input').type('DifferentPassword123!');
      
      cy.getByTestId('register-button').click();
      
      cy.getByTestId('confirm-password-error').should('be.visible').and('contain', '비밀번호가 일치하지 않습니다');
    });
  });

  describe('User Login', () => {
    it('should login with valid credentials', () => {
      const { email, password } = Cypress.env('testUser');
      
      cy.visit('/login');
      
      // Fill login form
      cy.getByTestId('email-input').type(email);
      cy.getByTestId('password-input').type(password);
      
      // Submit form
      cy.getByTestId('login-button').click();
      
      // Wait for login API call
      cy.wait('@login');
      
      // Should redirect to dashboard
      cy.url().should('not.include', '/login');
      cy.getByTestId('user-menu').should('be.visible');
      
      // Should store auth token
      cy.getLocalStorage('token').should('exist');
    });

    it('should show error for invalid credentials', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          success: false,
          error: '이메일 또는 비밀번호가 올바르지 않습니다.'
        }
      }).as('loginError');

      cy.visit('/login');
      
      cy.getByTestId('email-input').type('wrong@example.com');
      cy.getByTestId('password-input').type('wrongpassword');
      cy.getByTestId('login-button').click();
      
      cy.wait('@loginError');
      
      cy.expectError('이메일 또는 비밀번호가 올바르지 않습니다');
      cy.url().should('include', '/login');
    });

    it('should validate required fields', () => {
      cy.visit('/login');
      
      // Try to submit empty form
      cy.getByTestId('login-button').click();
      
      cy.getByTestId('email-error').should('be.visible').and('contain', '이메일을 입력해주세요');
      cy.getByTestId('password-error').should('be.visible').and('contain', '비밀번호를 입력해주세요');
    });

    it('should handle network errors gracefully', () => {
      cy.intercept('POST', '/api/auth/login', { forceNetworkError: true }).as('networkError');

      cy.visit('/login');
      
      cy.getByTestId('email-input').type('test@example.com');
      cy.getByTestId('password-input').type('password');
      cy.getByTestId('login-button').click();
      
      cy.wait('@networkError');
      
      cy.expectError('네트워크 오류가 발생했습니다');
    });
  });

  describe('User Logout', () => {
    beforeEach(() => {
      cy.loginAsTestUser();
      cy.visit('/');
    });

    it('should logout successfully', () => {
      cy.getByTestId('user-menu').click();
      cy.getByTestId('logout-button').click();
      
      // Should redirect to login page
      cy.url().should('include', '/login');
      
      // Should clear auth token
      cy.getLocalStorage('token').should('not.exist');
      
      // Should show login form
      cy.getByTestId('login-form').should('be.visible');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/dashboard');
      
      cy.url().should('include', '/login');
      cy.getByTestId('login-form').should('be.visible');
    });

    it('should allow access to protected route when authenticated', () => {
      cy.loginAsTestUser();
      cy.visit('/dashboard');
      
      cy.url().should('include', '/dashboard');
      cy.getByTestId('dashboard-content').should('be.visible');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token automatically when expired', () => {
      cy.intercept('POST', '/api/auth/refresh', {
        statusCode: 200,
        body: {
          success: true,
          token: 'new-access-token',
          refreshToken: 'new-refresh-token'
        }
      }).as('tokenRefresh');

      cy.loginAsTestUser();
      
      // Simulate expired token
      cy.setLocalStorage('token', 'expired-token');
      
      // Make an API request that should trigger token refresh
      cy.visit('/dashboard');
      
      cy.wait('@tokenRefresh');
      
      // Should update token in localStorage
      cy.getLocalStorage('token').should('eq', 'new-access-token');
    });

    it('should redirect to login when refresh token is invalid', () => {
      cy.intercept('POST', '/api/auth/refresh', {
        statusCode: 401,
        body: {
          success: false,
          error: '유효하지 않은 리프레시 토큰입니다.'
        }
      }).as('refreshError');

      cy.loginAsTestUser();
      
      // Simulate expired tokens
      cy.setLocalStorage('token', 'expired-token');
      cy.setLocalStorage('refreshToken', 'expired-refresh-token');
      
      cy.visit('/dashboard');
      
      cy.wait('@refreshError');
      
      // Should redirect to login
      cy.url().should('include', '/login');
      cy.getLocalStorage('token').should('not.exist');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible on login page', () => {
      cy.visit('/login');
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should be accessible on register page', () => {
      cy.visit('/register');
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should support keyboard navigation', () => {
      cy.visit('/login');
      
      // Tab through form elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'email-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'password-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'login-button');
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.setMobileViewport();
      cy.visit('/login');
      
      cy.getByTestId('login-form').should('be.visible');
      cy.getByTestId('email-input').should('be.visible');
      cy.getByTestId('password-input').should('be.visible');
      cy.getByTestId('login-button').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.setTabletViewport();
      cy.visit('/login');
      
      cy.getByTestId('login-form').should('be.visible');
      cy.getByTestId('email-input').should('be.visible');
      cy.getByTestId('password-input').should('be.visible');
      cy.getByTestId('login-button').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load login page quickly', () => {
      cy.measurePerformance('login-page-load');
      cy.visit('/login');
      cy.getByTestId('login-form').should('be.visible');
      cy.endPerformanceMeasure('login-page-load');
    });

    it('should handle login request quickly', () => {
      const { email, password } = Cypress.env('testUser');
      
      cy.visit('/login');
      cy.getByTestId('email-input').type(email);
      cy.getByTestId('password-input').type(password);
      
      cy.measurePerformance('login-request');
      cy.getByTestId('login-button').click();
      cy.wait('@login');
      cy.endPerformanceMeasure('login-request');
    });
  });
});