# KOSA Backend

리뷰 분석 서버 연동 및 API 게이트웨이 (JWT 인증, Redis 캐싱 포함)

## 설치 및 실행

### 필수 요구사항

- Node.js 16 이상
- PostgreSQL 12 이상
- Redis 6 이상 (캐싱용)
- npm 또는 yarn

### 환경 설정

1. 저장소 클론

```bash
git clone <repository-url>
cd backend
```

2. 의존성 설치

```bash
npm install
```

3. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 환경 변수를 설정합니다.

```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 설정을 변경합니다.
```

4. 데이터베이스 설정

PostgreSQL에 데이터베이스를 생성합니다.

```bash
psql -U postgres
CREATE DATABASE kosa;
\q
```

5. Redis 서버 시작

```bash
# Docker를 사용하는 경우
docker run -d --name redis -p 6379:6379 redis:7-alpine

# 또는 로컬 Redis 서버 시작
redis-server
```

6. 데이터베이스 마이그레이션 실행

```bash
npm run db:setup
```

### 개발 모드 실행

```bash
npm run dev
```

### 프로덕션 빌드 및 실행

```bash
npm run build
npm start
```

## 캐싱 시스템

### Redis 캐시 전략

이 프로젝트는 **Cache-Aside 패턴**을 사용하여 성능을 최적화합니다:

1. **분석 결과 캐싱**: 완료된 분석 결과를 1시간 동안 캐시
2. **분석 상태 캐싱**: 진행 중인 분석 상태를 5분 동안 캐시
3. **자동 무효화**: 데이터 업데이트 시 관련 캐시 자동 삭제

### 캐시 키 구조

```
analysis:result:{productId}  # 분석 결과 (TTL: 1시간)
analysis:status:{productId}  # 분석 상태 (TTL: 5분)
analysis:task:{taskId}       # 작업별 분석 정보 (TTL: 30분)
```

### 캐시 관리 API

```bash
# 캐시 헬스체크
GET /api/analyze/cache/health

# 캐시 통계 조회
GET /api/analyze/cache/stats

# 특정 상품 캐시 무효화
DELETE /api/analyze/cache/{productId}
```

## 인증 시스템

### JWT 기반 인증

KOSA 백엔드는 JWT(JSON Web Token) 기반의 인증 시스템을 사용합니다.

#### 토큰 구조

- **Access Token**: 15분 만료, API 요청 시 사용
- **Refresh Token**: 7일 만료, Access Token 갱신용, HttpOnly 쿠키로 저장

#### 인증 API

##### 회원가입

```
POST /api/auth/register
```

**요청 본문:**

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "confirmPassword": "StrongPassword123!",
  "role": "user"
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2023-05-01T12:00:00Z",
      "isActive": true
    },
    "message": "회원가입이 완료되었습니다."
  }
}
```

##### 로그인

```
POST /api/auth/login
```

**요청 본문:**

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900
  },
  "message": "로그인 성공"
}
```

##### 토큰 갱신

```
POST /api/auth/refresh
```

**응답:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900
  },
  "message": "토큰 갱신 성공"
}
```

##### 로그아웃

```
POST /api/auth/logout
Authorization: Bearer {accessToken}
```

**응답:**

```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

##### 현재 사용자 정보

```
GET /api/auth/me
Authorization: Bearer {accessToken}
```

**응답:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2023-05-01T12:00:00Z",
      "isActive": true
    }
  }
}
```

#### 보안 기능

- **Rate Limiting**: IP별 요청 제한
- **로그인 실패 제한**: 5회 실패 시 15분 차단
- **비밀번호 강도 검증**: 대소문자, 숫자, 특수문자 포함 8자 이상
- **Refresh Token 관리**: Redis 기반 토큰 저장 및 무효화
- **IP 차단**: 비정상적인 접근 패턴 감지 시 자동 차단

#### 미들웨어 사용법

```javascript
const { authenticateToken, authorize } = require('./middleware/auth');

// 인증 필요한 라우트
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// 관리자 권한 필요한 라우트
app.get('/api/admin', authenticateToken, authorize(['admin']), (req, res) => {
  res.json({ message: 'Admin only' });
});
```

## API 문서

### 분석 요청 시작

```
POST /api/analyze
```

**요청 본문:**

```json
{
  "productId": "product-123",
  "url": "https://example.com/product/123",
  "keywords": ["품질", "가격", "배송"]
}
```

**응답:**

```json
{
  "success": true,
  "message": "분석이 시작되었습니다.",
  "taskId": "task-123",
  "estimatedTime": 120,
  "fromCache": false
}
```

### 분석 상태 확인

```
GET /api/analyze/status/:productId
```

**응답:**

```json
{
  "status": "processing",
  "progress": 50,
  "estimatedTime": 60,
  "fromCache": true
}
```

### 분석 결과 조회

```
GET /api/analyze/result/:productId
```

**응답:**

```json
{
  "success": true,
  "status": "completed",
  "result": {
    "productId": "product-123",
    "sentiment": {
      "positive": 65,
      "negative": 20,
      "neutral": 15
    },
    "summary": "이 상품은 전반적으로 긍정적인 평가를 받고 있습니다.",
    "keywords": ["가성비", "품질", "배송"],
    "totalReviews": 150,
    "createdAt": "2023-05-01T12:00:00Z",
    "updatedAt": "2023-05-01T12:05:00Z"
  },
  "fromCache": true
}
```

## 데이터베이스 스키마

### analysis_results 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 기본 키 |
| product_id | VARCHAR(255) | 상품 ID |
| task_id | VARCHAR(255) | 분석 작업 ID (외부 서버) |
| status | VARCHAR(50) | 상태 (pending, processing, completed, failed) |
| sentiment_positive | DECIMAL(5,2) | 긍정 감성 비율 |
| sentiment_negative | DECIMAL(5,2) | 부정 감성 비율 |
| sentiment_neutral | DECIMAL(5,2) | 중립 감성 비율 |
| summary | TEXT | 분석 요약 |
| keywords | JSONB | 주요 키워드 배열 |
| total_reviews | INTEGER | 총 리뷰 수 |
| error | TEXT | 오류 메시지 |
| created_at | TIMESTAMP | 생성 시간 |
| updated_at | TIMESTAMP | 업데이트 시간 |

## 캐싱 시스템

### Redis 캐싱

KOSA 백엔드는 Redis를 사용한 Cache-Aside 패턴을 구현하여 성능을 최적화합니다.

#### 캐시 키 구조

- `analysis:result:{productId}` - 분석 결과 (TTL: 1시간)
- `analysis:status:{productId}` - 분석 상태 (TTL: 5분)
- `analysis:task:{taskId}` - 작업별 분석 정보 (TTL: 30분)

#### 캐시 관리 API

```bash
# 캐시 상태 확인
GET /api/analyze/cache/health

# 캐시 통계 조회
GET /api/analyze/cache/stats

# 캐시 히트율 조회
GET /api/analyze/cache/hitrate?days=7

# 특정 상품 캐시 무효화
DELETE /api/analyze/cache/{productId}

# 배치 캐시 무효화
DELETE /api/analyze/cache/batch
Content-Type: application/json
{
  "productIds": ["product1", "product2", "product3"]
}

# 캐시 워밍업
POST /api/analyze/cache/warmup
Content-Type: application/json
{
  "productIds": ["product1", "product2", "product3"]
}
```

#### 성능 요구사항

- 캐시 히트 시 평균 응답 시간: ≤50ms
- 캐시 히트율 목표: ≥80%

### 테스트 및 벤치마크

```bash
# 캐시 단위 테스트
npm run test:cache

# 캐시 통합 테스트 (Redis 서버 필요)
npm run test:integration

# 캐시 성능 벤치마크
npm run benchmark:cache
```

## 마이그레이션

### 마이그레이션 실행

```bash
# 모든 마이그레이션 적용
npm run migrate:up

# 특정 마이그레이션까지 적용
npm run migrate:up 1

# 모든 마이그레이션 롤백
npm run migrate:down

# 특정 마이그레이션까지 롤백
npm run migrate:down 1
```

## 성능 최적화

### 캐시 적중률 모니터링

```bash
# Redis 통계 확인
redis-cli info stats

# 캐시 적중률 확인
curl http://localhost:3001/api/analyze/cache/stats
```

### 예상 성능 개선

- **캐시 적중 시**: 평균 응답 시간 50ms 이하
- **캐시 미스 시**: DB 조회로 인한 100-200ms 응답 시간
- **메모리 사용량**: 상품당 약 1-2KB 캐시 데이터

## 테스트

```bash
# 전체 테스트 실행
npm test

# 캐시 서비스 테스트만 실행
npm test -- --testPathPattern=cacheService

# 테스트 커버리지 확인
npm test -- --coverage
```

## 환경 변수

### JWT 설정

```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m                    # Access Token 만료 시간
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d             # Refresh Token 만료 시간
```

### Redis 설정

```bash
REDIS_HOST=localhost          # Redis 서버 호스트
REDIS_PORT=6379              # Redis 서버 포트
REDIS_PASSWORD=              # Redis 비밀번호 (선택사항)
REDIS_DB=0                   # Redis 데이터베이스 번호
```

### 데이터베이스 설정

```bash
DB_HOST=localhost            # PostgreSQL 호스트
DB_PORT=5432                # PostgreSQL 포트
DB_NAME=kosa                # 데이터베이스 이름
DB_USER=postgres            # 데이터베이스 사용자
DB_PASSWORD=password        # 데이터베이스 비밀번호
DB_POOL_MAX=20              # 최대 연결 풀 크기
DB_IDLE_TIMEOUT=30000       # 유휴 연결 타임아웃 (ms)
DB_CONNECTION_TIMEOUT=2000  # 연결 타임아웃 (ms)
```

## 모니터링

### 헬스체크

```bash
# 전체 시스템 헬스체크
curl http://localhost:3001/health

# 캐시 시스템 헬스체크
curl http://localhost:3001/api/analyze/cache/health
```

### 로그 모니터링

- 캐시 적중/미스 로그
- 데이터베이스 연결 상태 로그
- Redis 연결 상태 로그
- 성능 메트릭 로그

## 트러블슈팅

### Redis 연결 문제

```bash
# Redis 서버 상태 확인
redis-cli ping

# Redis 로그 확인
redis-cli monitor
```

### 데이터베이스 연결 문제

```bash
# PostgreSQL 연결 테스트
psql -h localhost -U postgres -d kosa -c "SELECT 1;"
```

### 캐시 성능 문제

```bash
# 캐시 통계 확인
curl http://localhost:3001/api/analyze/cache/stats

# 특정 상품 캐시 무효화
curl -X DELETE http://localhost:3001/api/analyze/cache/product-123
```