import { rest } from 'msw';

export const handlers = [
  // Auth handlers
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: '로그인 성공',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      })
    );
  }),

  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: '회원가입이 완료되었습니다.',
        user: {
          id: 'new-user-id',
          email: 'new@example.com',
          name: 'New User',
        },
      })
    );
  }),

  rest.get('/api/auth/me', (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          error: '인증 토큰이 필요합니다.',
        })
      );
    }

    return res(
      ctx.json({
        success: true,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      })
    );
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: '로그아웃되었습니다.',
      })
    );
  }),

  rest.post('/api/auth/refresh', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        token: 'new-mock-jwt-token',
        refreshToken: 'new-mock-refresh-token',
      })
    );
  }),

  // Product search handlers
  rest.get('/api/products/search', (req, res, ctx) => {
    const query = req.url.searchParams.get('q');
    
    if (!query) {
      return res(
        ctx.status(400),
        ctx.json({
          success: false,
          error: '검색어를 입력해주세요.',
        })
      );
    }

    // Mock search results
    const mockProducts = [
      {
        id: 'product-1',
        name: `${query} 상품 1`,
        price: 29900,
        rating: 4.5,
        reviewCount: 128,
        imageUrl: 'https://example.com/product1.jpg',
        url: 'https://www.coupang.com/vp/products/123456',
      },
      {
        id: 'product-2',
        name: `${query} 상품 2`,
        price: 39900,
        rating: 4.2,
        reviewCount: 89,
        imageUrl: 'https://example.com/product2.jpg',
        url: 'https://www.coupang.com/vp/products/123457',
      },
    ];

    return res(
      ctx.json({
        success: true,
        products: mockProducts,
        total: mockProducts.length,
        query,
      })
    );
  }),

  // Analysis handlers
  rest.post('/api/analyze/airflow/single', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: '단일 상품 분석이 시작되었습니다.',
        dagRunId: 'single_test-product_123456',
        dagId: 'single_product_analysis',
        status: 'triggered',
      })
    );
  }),

  rest.post('/api/analyze/airflow/multi', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: '다중 상품 분석이 시작되었습니다.',
        dagRunId: 'multi_smartphone_123456',
        dagId: 'multi_product_analysis',
        status: 'triggered',
      })
    );
  }),

  rest.post('/api/analyze/airflow/watchlist', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: '관심 상품 배치 분석이 시작되었습니다.',
        dagRunId: 'watchlist_user123_123456',
        dagId: 'watchlist_batch_analysis',
        status: 'triggered',
      })
    );
  }),

  rest.get('/api/analyze/airflow/status/:dagId/:dagRunId', (req, res, ctx) => {
    const { dagId, dagRunId } = req.params;
    
    return res(
      ctx.json({
        success: true,
        dagId,
        dagRunId,
        state: 'success',
        progress: {
          total: 5,
          completed: 5,
          failed: 0,
          running: 0,
          percentage: 100,
        },
        tasks: [
          {
            taskId: 'start_task',
            state: 'success',
            startDate: '2025-01-01T00:01:00Z',
            endDate: '2025-01-01T00:02:00Z',
            duration: 60,
          },
          {
            taskId: 'collect_reviews',
            state: 'success',
            startDate: '2025-01-01T00:02:00Z',
            endDate: '2025-01-01T00:05:00Z',
            duration: 180,
          },
        ],
      })
    );
  }),

  rest.get('/api/analyze/result/:productId', (req, res, ctx) => {
    const { productId } = req.params;
    
    return res(
      ctx.json({
        success: true,
        status: 'completed',
        result: {
          productId,
          sentiment: {
            positive: 0.6,
            negative: 0.2,
            neutral: 0.2,
          },
          summary: '전반적으로 긍정적인 리뷰가 많습니다. 특히 품질과 가격 면에서 만족도가 높습니다.',
          keywords: ['품질', '가격', '배송', '디자인', '성능'],
          totalReviews: 150,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T01:00:00Z',
        },
      })
    );
  }),

  rest.get('/api/analyze/airflow/active/:userId', (req, res, ctx) => {
    const { userId } = req.params;
    
    return res(
      ctx.json({
        success: true,
        analyses: [
          {
            dagId: 'single_product_analysis',
            dagRunId: 'single_test_123',
            type: 'single',
            status: 'running',
            createdAt: '2025-01-01T00:00:00Z',
          },
        ],
        count: 1,
      })
    );
  }),

  // Watchlist handlers
  rest.get('/api/watchlist', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        watchlist: [
          {
            id: 'watchlist-1',
            productId: 'product-1',
            productName: '관심 상품 1',
            productUrl: 'https://www.coupang.com/vp/products/123456',
            addedAt: '2025-01-01T00:00:00Z',
            lastAnalyzedAt: '2025-01-01T01:00:00Z',
          },
        ],
      })
    );
  }),

  rest.post('/api/watchlist', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: '관심 상품이 추가되었습니다.',
        item: {
          id: 'new-watchlist-item',
          productId: 'new-product',
          productName: '새로운 관심 상품',
          addedAt: new Date().toISOString(),
        },
      })
    );
  }),

  // Error handlers for testing
  rest.get('/api/error/500', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: '서버 내부 오류가 발생했습니다.',
      })
    );
  }),

  rest.get('/api/error/404', (req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        error: '요청한 리소스를 찾을 수 없습니다.',
      })
    );
  }),

  rest.get('/api/error/network', (req, res, ctx) => {
    return res.networkError('Network connection failed');
  }),
];