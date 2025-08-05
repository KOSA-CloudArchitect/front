import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth handlers
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      message: '로그인 성공',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
    });
  }),

  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: 'new-user-id',
        email: 'new@example.com',
        name: 'New User',
      },
    });
  }),

  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          success: false,
          error: '인증 토큰이 필요합니다.',
        },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({
      success: true,
      message: '로그아웃되었습니다.',
    });
  }),

  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({
      success: true,
      token: 'new-mock-jwt-token',
      refreshToken: 'new-mock-refresh-token',
    });
  }),

  // Product search handlers
  http.get('/api/products/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    
    if (!query) {
      return HttpResponse.json(
        {
          success: false,
          error: '검색어를 입력해주세요.',
        },
        { status: 400 }
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
      },
      {
        id: 'product-2',
        name: `${query} 상품 2`,
        price: 15900,
        rating: 4.2,
        reviewCount: 89,
        imageUrl: 'https://example.com/product2.jpg',
      },
    ];

    return HttpResponse.json({
      success: true,
      products: mockProducts,
      total: mockProducts.length,
    });
  }),

  // Analysis handlers
  http.post('/api/analyze/airflow/single', () => {
    return HttpResponse.json({
      success: true,
      message: '분석이 시작되었습니다.',
      dagId: 'single_product_analysis',
      dagRunId: 'mock-run-id-123',
    });
  }),

  http.post('/api/analyze/airflow/multi', () => {
    return HttpResponse.json({
      success: true,
      message: '다중 상품 분석이 시작되었습니다.',
      dagId: 'multi_product_analysis',
      dagRunId: 'mock-run-id-456',
    });
  }),

  http.post('/api/analyze/airflow/watchlist', () => {
    return HttpResponse.json({
      success: true,
      message: '관심 상품 분석이 시작되었습니다.',
      dagId: 'watchlist_analysis',
      dagRunId: 'mock-run-id-789',
    });
  }),

  http.get('/api/analyze/airflow/status/:dagId/:dagRunId', ({ params }) => {
    const { dagId, dagRunId } = params;

    return HttpResponse.json({
      success: true,
      status: 'success',
      dagId,
      dagRunId,
      state: 'success',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-01T00:05:00Z',
      duration: 300,
    });
  }),

  http.get('/api/analyze/result/:productId', ({ params }) => {
    const { productId } = params;

    return HttpResponse.json({
      success: true,
      productId,
      analysis: {
        sentiment: {
          positive: 75,
          negative: 15,
          neutral: 10,
        },
        summary: '이 상품은 전반적으로 긍정적인 리뷰를 받고 있으며, 품질과 가격 대비 만족도가 높습니다.',
        keywords: [
          { word: '품질', count: 45 },
          { word: '가격', count: 32 },
          { word: '배송', count: 28 },
          { word: '디자인', count: 25 },
        ],
        totalReviews: 128,
        averageRating: 4.5,
      },
    });
  }),

  http.get('/api/analyze/airflow/active/:userId', ({ params }) => {
    const { userId } = params;

    return HttpResponse.json({
      success: true,
      activeRuns: [
        {
          dagId: 'single_product_analysis',
          dagRunId: 'mock-run-id-123',
          state: 'running',
          startDate: '2024-01-01T00:00:00Z',
        },
      ],
    });
  }),

  // Watchlist handlers
  http.get('/api/watchlist', () => {
    return HttpResponse.json({
      success: true,
      watchlist: [
        {
          id: 'watch-1',
          productId: 'product-1',
          productName: '테스트 상품 1',
          addedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'watch-2',
          productId: 'product-2',
          productName: '테스트 상품 2',
          addedAt: '2024-01-01T00:00:00Z',
        },
      ],
    });
  }),

  http.post('/api/watchlist', () => {
    return HttpResponse.json({
      success: true,
      message: '관심 상품에 추가되었습니다.',
    });
  }),

  // Error handlers for testing
  http.get('/api/error/500', () => {
    return HttpResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
      },
      { status: 500 }
    );
  }),

  http.get('/api/error/404', () => {
    return HttpResponse.json(
      {
        success: false,
        error: 'Not Found',
      },
      { status: 404 }
    );
  }),

  http.get('/api/error/network', () => {
    return HttpResponse.error();
  }),
];