describe('Product Analysis Flow', () => {
  beforeEach(() => {
    cy.loginAsTestUser();
    cy.mockAnalysisAPI();
    cy.mockWebSocket();
    cy.visit('/');
  });

  describe('Product Search and Selection', () => {
    it('should search for products and display results', () => {
      cy.searchProduct('아이폰 15');
      
      // Should display search results
      cy.getByTestId('search-results').should('be.visible');
      cy.getByTestId('product-item').should('have.length.greaterThan', 0);
      
      // Each product item should have required information
      cy.getByTestId('product-item').first().within(() => {
        cy.getByTestId('product-name').should('be.visible');
        cy.getByTestId('product-price').should('be.visible');
        cy.getByTestId('product-rating').should('be.visible');
        cy.getByTestId('product-review-count').should('be.visible');
        cy.getByTestId('product-image').should('be.visible');
      });
    });

    it('should handle empty search results', () => {
      cy.intercept('GET', '/api/products/search*', {
        statusCode: 200,
        body: {
          success: true,
          products: [],
          total: 0
        }
      }).as('emptySearch');

      cy.searchProduct('존재하지않는상품');
      
      cy.wait('@emptySearch');
      
      cy.getByTestId('empty-results').should('be.visible');
      cy.getByTestId('empty-results').should('contain', '검색 결과가 없습니다');
      cy.getByTestId('coupang-link').should('be.visible').and('have.attr', 'href');
    });

    it('should navigate to product detail page', () => {
      cy.searchProduct('스마트폰');
      cy.selectFirstProduct();
      
      // Should navigate to product detail page
      cy.url().should('include', '/product/');
      cy.getByTestId('product-detail').should('be.visible');
      cy.getByTestId('analyze-button').should('be.visible');
    });
  });

  describe('Single Product Analysis', () => {
    beforeEach(() => {
      cy.searchProduct('테스트 상품');
      cy.selectFirstProduct();
    });

    it('should start single product analysis successfully', () => {
      cy.startAnalysis();
      
      // Should show analysis progress
      cy.getByTestId('analysis-progress').should('be.visible');
      cy.getByTestId('progress-bar').should('be.visible');
      cy.getByTestId('progress-text').should('contain', '분석 중');
      
      // Wait for analysis API call
      cy.wait('@singleAnalysis');
      
      // Should show progress updates
      cy.getByTestId('current-step').should('be.visible');
      cy.getByTestId('progress-percentage').should('be.visible');
    });

    it('should display real-time progress updates', () => {
      cy.startAnalysis();
      
      // Simulate WebSocket progress updates
      cy.window().then((win) => {
        const mockWs = win.mockWebSocket;
        
        // Simulate progress updates
        setTimeout(() => {
          mockWs.simulateMessage({
            type: 'analysis_progress',
            dagRunId: 'test-dag-run-123',
            progress: 25,
            currentStep: '리뷰 수집 중',
            message: '상품 리뷰를 수집하고 있습니다.'
          });
        }, 1000);
        
        setTimeout(() => {
          mockWs.simulateMessage({
            type: 'analysis_progress',
            dagRunId: 'test-dag-run-123',
            progress: 50,
            currentStep: '텍스트 전처리 중',
            message: '수집된 리뷰를 전처리하고 있습니다.'
          });
        }, 2000);
        
        setTimeout(() => {
          mockWs.simulateMessage({
            type: 'analysis_progress',
            dagRunId: 'test-dag-run-123',
            progress: 75,
            currentStep: '감정 분석 중',
            message: '리뷰의 감정을 분석하고 있습니다.'
          });
        }, 3000);
        
        setTimeout(() => {
          mockWs.simulateMessage({
            type: 'analysis_complete',
            dagRunId: 'test-dag-run-123',
            progress: 100,
            message: '분석이 완료되었습니다.'
          });
        }, 4000);
      });
      
      // Check progress updates
      cy.getByTestId('progress-percentage').should('contain', '25%');
      cy.getByTestId('current-step').should('contain', '리뷰 수집 중');
      
      cy.getByTestId('progress-percentage').should('contain', '50%');
      cy.getByTestId('current-step').should('contain', '텍스트 전처리 중');
      
      cy.getByTestId('progress-percentage').should('contain', '75%');
      cy.getByTestId('current-step').should('contain', '감정 분석 중');
      
      // Should complete and show results
      cy.getByTestId('progress-percentage').should('contain', '100%');
      cy.waitForAnalysisComplete();
    });

    it('should display analysis results after completion', () => {
      cy.startAnalysis();
      cy.waitForAnalysisComplete();
      
      // Should display analysis results
      cy.getByTestId('analysis-results').should('be.visible');
      
      // Sentiment chart
      cy.getByTestId('sentiment-chart').should('be.visible');
      cy.getByTestId('positive-percentage').should('contain', '60%');
      cy.getByTestId('negative-percentage').should('contain', '20%');
      cy.getByTestId('neutral-percentage').should('contain', '20%');
      
      // Summary
      cy.getByTestId('analysis-summary').should('be.visible');
      cy.getByTestId('summary-text').should('contain', '전반적으로 긍정적인 리뷰가 많습니다');
      
      // Keywords
      cy.getByTestId('keywords-section').should('be.visible');
      cy.getByTestId('keyword-item').should('have.length.greaterThan', 0);
      
      // Review count
      cy.getByTestId('total-reviews').should('contain', '150');
    });

    it('should handle analysis errors gracefully', () => {
      cy.intercept('POST', '/api/analyze/airflow/single', {
        statusCode: 500,
        body: {
          success: false,
          error: '분석 서버에 연결할 수 없습니다.'
        }
      }).as('analysisError');

      cy.startAnalysis();
      
      cy.wait('@analysisError');
      
      cy.expectError('분석 서버에 연결할 수 없습니다');
      cy.getByTestId('retry-button').should('be.visible');
    });

    it('should allow retrying failed analysis', () => {
      // First request fails
      cy.intercept('POST', '/api/analyze/airflow/single', {
        statusCode: 500,
        body: { success: false, error: '서버 오류' }
      }).as('firstAttempt');

      cy.startAnalysis();
      cy.wait('@firstAttempt');
      
      // Second request succeeds
      cy.intercept('POST', '/api/analyze/airflow/single', {
        statusCode: 200,
        body: {
          success: true,
          message: '분석이 시작되었습니다.',
          dagRunId: 'retry-dag-run-123'
        }
      }).as('retryAttempt');

      cy.getByTestId('retry-button').click();
      cy.wait('@retryAttempt');
      
      cy.getByTestId('analysis-progress').should('be.visible');
    });
  });

  describe('Multi Product Analysis', () => {
    it('should start multi product analysis from search results', () => {
      cy.searchProduct('스마트폰');
      
      cy.getByTestId('analyze-all-button').click();
      
      // Should show multi-analysis modal
      cy.getByTestId('multi-analysis-modal').should('be.visible');
      cy.getByTestId('max-products-input').should('be.visible');
      
      // Set max products and start
      cy.getByTestId('max-products-input').clear().type('5');
      cy.getByTestId('start-multi-analysis-button').click();
      
      // Should start multi-product analysis
      cy.getByTestId('multi-analysis-progress').should('be.visible');
      cy.getByTestId('analyzed-products-count').should('be.visible');
    });

    it('should display multi-product analysis results', () => {
      cy.intercept('POST', '/api/analyze/airflow/multi', {
        statusCode: 200,
        body: {
          success: true,
          message: '다중 상품 분석이 시작되었습니다.',
          dagRunId: 'multi_analysis_123'
        }
      }).as('multiAnalysis');

      cy.searchProduct('노트북');
      cy.getByTestId('analyze-all-button').click();
      cy.getByTestId('start-multi-analysis-button').click();
      
      cy.wait('@multiAnalysis');
      
      // Simulate completion
      cy.window().then((win) => {
        win.mockWebSocket.simulateMessage({
          type: 'multi_analysis_complete',
          dagRunId: 'multi_analysis_123',
          results: [
            {
              productId: 'product-1',
              productName: '노트북 A',
              sentiment: { positive: 0.7, negative: 0.2, neutral: 0.1 },
              totalReviews: 200
            },
            {
              productId: 'product-2',
              productName: '노트북 B',
              sentiment: { positive: 0.5, negative: 0.3, neutral: 0.2 },
              totalReviews: 150
            }
          ]
        });
      });
      
      // Should display comparison results
      cy.getByTestId('multi-analysis-results').should('be.visible');
      cy.getByTestId('product-comparison-chart').should('be.visible');
      cy.getByTestId('product-ranking').should('be.visible');
    });
  });

  describe('Watchlist Analysis', () => {
    beforeEach(() => {
      cy.visit('/watchlist');
    });

    it('should add product to watchlist', () => {
      cy.getByTestId('add-product-button').click();
      cy.getByTestId('product-url-input').type('https://www.coupang.com/vp/products/123456');
      cy.getByTestId('add-to-watchlist-button').click();
      
      cy.getByTestId('watchlist-item').should('have.length', 1);
      cy.getByTestId('watchlist-item').first().should('contain', '상품이 추가되었습니다');
    });

    it('should start watchlist batch analysis', () => {
      // Assume watchlist has items
      cy.getByTestId('watchlist-item').should('have.length.greaterThan', 0);
      
      cy.getByTestId('analyze-watchlist-button').click();
      
      cy.getByTestId('watchlist-analysis-progress').should('be.visible');
      cy.getByTestId('batch-progress-bar').should('be.visible');
    });
  });

  describe('Analysis History', () => {
    beforeEach(() => {
      cy.visit('/analysis-history');
    });

    it('should display analysis history', () => {
      cy.getByTestId('analysis-history-list').should('be.visible');
      cy.getByTestId('history-item').should('have.length.greaterThan', 0);
      
      cy.getByTestId('history-item').first().within(() => {
        cy.getByTestId('product-name').should('be.visible');
        cy.getByTestId('analysis-date').should('be.visible');
        cy.getByTestId('analysis-status').should('be.visible');
        cy.getByTestId('view-results-button').should('be.visible');
      });
    });

    it('should view previous analysis results', () => {
      cy.getByTestId('history-item').first().within(() => {
        cy.getByTestId('view-results-button').click();
      });
      
      cy.url().should('include', '/analysis/');
      cy.getByTestId('analysis-results').should('be.visible');
    });

    it('should filter analysis history', () => {
      cy.getByTestId('filter-dropdown').click();
      cy.getByTestId('filter-completed').click();
      
      cy.getByTestId('history-item').each(($item) => {
        cy.wrap($item).findByTestId('analysis-status').should('contain', '완료');
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should receive real-time sentiment cards during analysis', () => {
      cy.searchProduct('테스트 상품');
      cy.selectFirstProduct();
      cy.startAnalysis();
      
      // Simulate real-time sentiment cards
      cy.window().then((win) => {
        setTimeout(() => {
          win.mockWebSocket.simulateMessage({
            type: 'sentiment_card',
            data: {
              reviewId: 'review-1',
              sentiment: 'positive',
              text: '정말 좋은 상품입니다!',
              keywords: ['좋은', '품질']
            }
          });
        }, 1000);
        
        setTimeout(() => {
          win.mockWebSocket.simulateMessage({
            type: 'sentiment_card',
            data: {
              reviewId: 'review-2',
              sentiment: 'negative',
              text: '배송이 너무 늦었어요.',
              keywords: ['배송', '늦음']
            }
          });
        }, 2000);
      });
      
      // Should display sentiment cards
      cy.getByTestId('sentiment-cards').should('be.visible');
      cy.getByTestId('sentiment-card').should('have.length', 2);
      
      // Check card colors
      cy.getByTestId('sentiment-card').first().should('have.class', 'positive');
      cy.getByTestId('sentiment-card').last().should('have.class', 'negative');
    });

    it('should update analysis chart in real-time', () => {
      cy.searchProduct('테스트 상품');
      cy.selectFirstProduct();
      cy.startAnalysis();
      
      // Initial state
      cy.getByTestId('real-time-chart').should('be.visible');
      
      // Simulate chart updates
      cy.window().then((win) => {
        win.mockWebSocket.simulateMessage({
          type: 'chart_update',
          data: {
            positive: 10,
            negative: 5,
            neutral: 3,
            total: 18
          }
        });
      });
      
      cy.getByTestId('positive-count').should('contain', '10');
      cy.getByTestId('negative-count').should('contain', '5');
      cy.getByTestId('neutral-count').should('contain', '3');
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket connection errors', () => {
      cy.window().then((win) => {
        // Simulate WebSocket error
        win.mockWebSocket.onerror = () => {
          win.dispatchEvent(new CustomEvent('websocket-error'));
        };
      });
      
      cy.searchProduct('테스트 상품');
      cy.selectFirstProduct();
      cy.startAnalysis();
      
      cy.getByTestId('connection-error').should('be.visible');
      cy.getByTestId('reconnect-button').should('be.visible');
    });

    it('should handle analysis timeout', () => {
      cy.searchProduct('테스트 상품');
      cy.selectFirstProduct();
      cy.startAnalysis();
      
      // Simulate timeout
      cy.wait(35000); // Wait longer than expected analysis time
      
      cy.getByTestId('timeout-error').should('be.visible');
      cy.getByTestId('contact-support-button').should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load analysis results quickly', () => {
      cy.measurePerformance('analysis-results-load');
      
      cy.searchProduct('성능 테스트 상품');
      cy.selectFirstProduct();
      cy.startAnalysis();
      cy.waitForAnalysisComplete();
      
      cy.endPerformanceMeasure('analysis-results-load');
    });

    it('should handle large datasets efficiently', () => {
      // Mock large dataset response
      cy.intercept('GET', '/api/analyze/result/*', {
        statusCode: 200,
        body: {
          success: true,
          result: {
            sentiment: { positive: 0.6, negative: 0.2, neutral: 0.2 },
            totalReviews: 10000,
            keywords: Array(100).fill().map((_, i) => `keyword-${i}`),
            summary: '대용량 데이터 분석 결과입니다.'
          }
        }
      }).as('largeDataset');

      cy.searchProduct('대용량 데이터 상품');
      cy.selectFirstProduct();
      cy.startAnalysis();
      cy.waitForAnalysisComplete();
      
      cy.wait('@largeDataset');
      
      // Should render without performance issues
      cy.getByTestId('analysis-results').should('be.visible');
      cy.getByTestId('total-reviews').should('contain', '10,000');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible during analysis', () => {
      cy.searchProduct('접근성 테스트 상품');
      cy.selectFirstProduct();
      cy.startAnalysis();
      
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should announce progress updates to screen readers', () => {
      cy.searchProduct('스크린 리더 테스트');
      cy.selectFirstProduct();
      cy.startAnalysis();
      
      cy.getByTestId('progress-announcement').should('have.attr', 'aria-live', 'polite');
      cy.getByTestId('current-step').should('have.attr', 'role', 'status');
    });
  });
});