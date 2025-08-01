# 기술 요구사항 명세서 (TRD)
## 리뷰 기반 실시간 감정 분석 및 요약 서비스

### 문서 정보
- **프로젝트명**: 리뷰 기반 실시간 감정 분석 및 요약 서비스
- **문서 버전**: 1.0
- **작성일**: 2025-01-31
- **문서 유형**: Technical Requirements Document (TRD)

---

## 1. 개요

본 문서는 리뷰 기반 실시간 감정 분석 및 요약 서비스의 기술적 요구사항을 정의합니다. 전체 시스템은 마이크로서비스 아키텍처와 이벤트 기반 아키텍처를 기반으로 하며, 클라우드 네이티브 환경에서 운영됩니다.

### 1.1 시스템 목표
- **실시간 처리**: 리뷰 데이터 수집부터 분석까지 2분 이내 완료
- **고가용성**: 99.9% 이상의 서비스 가용성 확보
- **확장성**: 동시 사용자 100명 이상 처리 가능
- **모듈 독립성**: 각 컴포넌트 간 느슨한 결합 구조

---

## 2. 시스템 아키텍처 요구사항

### 2.1 전체 아키텍처
- **아키텍처 패턴**: 마이크로서비스 + 이벤트 기반 아키텍처
- **배포 환경**: Kubernetes 기반 컨테이너 오케스트레이션
- **통신 방식**: RESTful API + WebSocket + Apache Kafka

### 2.2 컴포넌트 구성

#### 2.2.1 웹 서비스 계층
```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │
│   (React 18)    │◄──►│   (Node.js)     │
│   - TypeScript  │    │   - Express     │
│   - Tailwind    │    │   - JWT Auth    │
│   - Socket.IO   │    │   - WebSocket   │
│   - Zustand     │    │   - Kafka       │
└─────────────────┘    └─────────────────┘
```

#### 2.2.2 데이터 파이프라인 계층
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Crawling   │    │  Streaming  │    │  Analysis   │
│  Server     │───►│  Processing │───►│  Server     │
│ (FastAPI)   │    │(Spark/Flink)│    │ (FastAPI)   │
└─────────────┘    └─────────────┘    └─────────────┘
```

#### 2.2.3 데이터 저장 계층
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│     S3      │    │  Redshift   │    │   RDS/      │
│ (Data Lake) │    │(Data Warehouse)│  │  NoSQL      │
│             │    │             │    │ (Web DB)    │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## 3. 프론트엔드 기술 요구사항

### 3.1 핵심 기술 스택
- **프레임워크**: React 18.x
- **언어**: TypeScript 5.x
- **스타일링**: Tailwind CSS 3.x
- **상태 관리**: Zustand
- **실시간 통신**: Socket.IO Client
- **빌드 도구**: Vite 또는 Create React App

### 3.2 성능 요구사항
- **초기 로딩 시간**: 3초 이내
- **페이지 전환 시간**: 1초 이내
- **실시간 업데이트 지연**: 500ms 이내
- **번들 크기**: 메인 청크 500KB 이하

### 3.3 브라우저 지원
- **데스크톱**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **모바일**: iOS Safari 14+, Chrome Mobile 90+

### 3.4 반응형 디자인
- **브레이크포인트**: 
  - Mobile: 320px - 768px
  - Tablet: 768px - 1024px
  - Desktop: 1024px+

---

## 4. 백엔드 기술 요구사항

### 4.1 핵심 기술 스택
- **런타임**: Node.js 18.x LTS
- **프레임워크**: Express.js 4.x
- **언어**: TypeScript 5.x
- **인증**: JWT + Refresh Token
- **실시간 통신**: Socket.IO Server
- **메시지 큐**: Apache Kafka Client (KafkaJS)
- **HTTP 클라이언트**: Axios
- **검증 라이브러리**: Zod 또는 Joi

### 4.2 API 설계 요구사항
- **아키텍처**: RESTful API
- **문서화**: OpenAPI 3.0 (Swagger)
- **버전 관리**: URL 경로 기반 (/api/v1/)
- **응답 형식**: JSON
- **에러 처리**: 표준 HTTP 상태 코드

#### 4.2.1 주요 API 엔드포인트
```typescript
// 사용자 인증
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh

// 상품 검색
GET /api/v1/products/search?q={query}
GET /api/v1/products/search/autocomplete?q={query}
GET /api/v1/products/search/history

// 리뷰 분석
POST /api/v1/analysis/start
GET /api/v1/analysis/{analysisId}/status
GET /api/v1/analysis/{analysisId}/results
GET /api/v1/analysis/{productId}/latest

// 관심 상품
POST /api/v1/watchlist
GET /api/v1/watchlist
DELETE /api/v1/watchlist/{productId}
```

### 4.3 외부 서비스 연동 요구사항

#### 4.3.1 Kafka Producer 구현
```typescript
// Kafka 메시지 전송 서비스
class KafkaProducerService {
  // 상품 검색 요청 전송
  async sendProductSearchRequest(searchQuery: string, userId: string): Promise<void>
  
  // 리뷰 분석 요청 전송  
  async sendAnalysisRequest(productId: string, analysisId: string): Promise<void>
  
  // 관심 상품 등록 요청 전송
  async sendWatchlistRequest(productId: string, userId: string): Promise<void>
}
```

#### 4.3.2 Kafka Consumer 구현
```typescript
// Kafka 메시지 수신 서비스
class KafkaConsumerService {
  // 크롤링 상태 업데이트 수신
  async handleCrawlingStatusUpdate(message: CrawlingStatusMessage): Promise<void>
  
  // 분석 진행 상태 수신
  async handleAnalysisProgressUpdate(message: AnalysisProgressMessage): Promise<void>
  
  // 분석 결과 수신
  async handleAnalysisResults(message: AnalysisResultMessage): Promise<void>
  
  // 상품 검색 결과 수신
  async handleProductSearchResults(message: ProductSearchResultMessage): Promise<void>
}
```

#### 4.3.3 Airflow DAG 트리거
```typescript
// Airflow API 클라이언트
class AirflowClient {
  private baseURL: string = process.env.AIRFLOW_API_URL;
  
  // 단일 상품 분석 DAG 트리거
  async triggerSingleProductAnalysis(productId: string, analysisId: string): Promise<string>
  
  // 검색어 기반 다중 상품 분석 DAG 트리거
  async triggerMultiProductAnalysis(searchQuery: string, requestId: string): Promise<string>
  
  // DAG 실행 상태 확인
  async getDagRunStatus(dagId: string, runId: string): Promise<DagRunStatus>
}
```

### 4.4 실시간 통신 요구사항

#### 4.4.1 WebSocket 이벤트 정의
```typescript
// 클라이언트 → 서버 이벤트
interface ClientToServerEvents {
  'join-analysis': (analysisId: string) => void;
  'leave-analysis': (analysisId: string) => void;
}

// 서버 → 클라이언트 이벤트
interface ServerToClientEvents {
  'analysis-progress': (data: AnalysisProgressData) => void;
  'analysis-complete': (data: AnalysisResultData) => void;
  'analysis-error': (error: AnalysisErrorData) => void;
  'sentiment-card': (card: SentimentCardData) => void;
}
```

#### 4.4.2 실시간 상태 브로드캐스팅
```typescript
class WebSocketService {
  // 분석 진행 상태 브로드캐스트
  broadcastAnalysisProgress(analysisId: string, progress: AnalysisProgress): void
  
  // 감정 분석 카드 실시간 전송
  broadcastSentimentCard(analysisId: string, card: SentimentCard): void
  
  // 분석 완료 알림
  broadcastAnalysisComplete(analysisId: string, results: AnalysisResults): void
  
  // 오류 상태 브로드캐스트
  broadcastAnalysisError(analysisId: string, error: AnalysisError): void
}
```

#### 4.4.3 실시간 감정 분석 카드 구현 방안

**데이터 흐름**:
1. **LLM 분석 서버**에서 개별 리뷰 분석 완료 시마다 Kafka로 `sentiment-card-update` 메시지 전송
2. **백엔드 Kafka Consumer**가 메시지 수신하여 NoSQL DB에 임시 저장
3. **WebSocket**을 통해 연결된 클라이언트에게 실시간 카드 데이터 전송
4. **프론트엔드**에서 카드를 순차적으로 화면에 렌더링

**구현 세부사항**:

```typescript
// 실시간 감정 카드 데이터 구조
interface SentimentCardStream {
  analysisId: string;
  cardId: string;
  reviewText: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  keywords: string[];
  timestamp: Date;
  sequenceNumber: number; // 순서 보장을 위한 시퀀스
}

// Kafka 메시지 처리
class SentimentCardProcessor {
  async processSentimentCard(message: SentimentCardStream): Promise<void> {
    // 1. NoSQL DB에 카드 데이터 저장 (빠른 조회를 위해)
    await this.nosqlService.saveSentimentCard(message);
    
    // 2. WebSocket으로 실시간 전송
    this.webSocketService.broadcastSentimentCard(message.analysisId, message);
    
    // 3. 진행률 업데이트 (전체 리뷰 수 대비 완료된 카드 수)
    const progress = await this.calculateProgress(message.analysisId);
    this.webSocketService.broadcastAnalysisProgress(message.analysisId, progress);
  }
}

// NoSQL 저장소 구조 (MongoDB 예시)
interface SentimentCardDocument {
  _id: string;
  analysisId: string;
  cardId: string;
  reviewText: string;
  sentiment: string;
  confidence: number;
  keywords: string[];
  timestamp: Date;
  sequenceNumber: number;
  createdAt: Date;
}

// 프론트엔드 WebSocket 이벤트 처리
interface ClientSentimentCardHandler {
  onSentimentCard: (card: SentimentCardStream) => void;
  onAnalysisProgress: (progress: AnalysisProgress) => void;
}
```

**성능 최적화 방안**:

1. **배치 처리**: 개별 카드가 아닌 5-10개씩 배치로 전송하여 네트워크 오버헤드 감소
```typescript
interface SentimentCardBatch {
  analysisId: string;
  cards: SentimentCardStream[];
  batchNumber: number;
  totalBatches: number;
}
```

2. **메모리 캐싱**: Redis를 활용한 실시간 카드 데이터 캐싱
```typescript
class SentimentCardCache {
  // 분석 ID별 카드 리스트 캐싱 (TTL: 1시간)
  async cacheCards(analysisId: string, cards: SentimentCardStream[]): Promise<void>
  
  // 캐시된 카드 조회 (재접속 시 기존 카드 복원용)
  async getCachedCards(analysisId: string): Promise<SentimentCardStream[]>
}
```

3. **연결 관리**: 분석 ID별 WebSocket 룸 관리
```typescript
class AnalysisRoomManager {
  // 사용자를 특정 분석 룸에 참여
  joinAnalysisRoom(socketId: string, analysisId: string): void
  
  // 분석 룸에서 나가기
  leaveAnalysisRoom(socketId: string, analysisId: string): void
  
  // 특정 분석 룸의 모든 사용자에게 브로드캐스트
  broadcastToRoom(analysisId: string, event: string, data: any): void
}
```

### 4.5 데이터 모델 요구사항

#### 4.5.1 핵심 데이터 타입
```typescript
// 상품 정보
interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  category: string;
  url: string;
}

// 분석 요청
interface AnalysisRequest {
  id: string;
  productId: string;
  userId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

// 분석 결과
interface AnalysisResult {
  id: string;
  productId: string;
  sentimentRatio: {
    positive: number;
    neutral: number;
    negative: number;
  };
  summary: string;
  keywords: string[];
  ratingDistribution: Record<number, number>;
  timeSeriesData: TimeSeriesPoint[];
}

// 실시간 감정 카드
interface SentimentCard {
  id: string;
  reviewText: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  confidence: number;
  timestamp: Date;
}
```

### 4.6 서비스 계층 아키텍처

#### 4.6.1 서비스 구조
```typescript
// 사용자 서비스
class UserService {
  async register(userData: RegisterData): Promise<User>
  async login(credentials: LoginCredentials): Promise<AuthResult>
  async refreshToken(refreshToken: string): Promise<AuthResult>
}

// 상품 서비스
class ProductService {
  async searchProducts(query: string, userId?: string): Promise<Product[]>
  async getProductDetails(productId: string): Promise<Product>
  async getSearchHistory(userId: string): Promise<string[]>
  async saveSearchHistory(userId: string, query: string): Promise<void>
}

// 분석 서비스
class AnalysisService {
  async startAnalysis(productId: string, userId: string): Promise<AnalysisRequest>
  async getAnalysisStatus(analysisId: string): Promise<AnalysisRequest>
  async getAnalysisResults(analysisId: string): Promise<AnalysisResult>
  async getLatestAnalysis(productId: string): Promise<AnalysisResult | null>
}

// 관심 상품 서비스
class WatchlistService {
  async addToWatchlist(productId: string, userId: string): Promise<void>
  async removeFromWatchlist(productId: string, userId: string): Promise<void>
  async getUserWatchlist(userId: string): Promise<Product[]>
}
```

### 4.7 미들웨어 요구사항

#### 4.7.1 인증 미들웨어
```typescript
// JWT 토큰 검증
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // JWT 토큰 검증 로직
}

// 권한 확인
const authorize = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  // 사용자 권한 확인 로직
}
```

#### 4.7.2 보안 미들웨어
```typescript
// Rate Limiting
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 100, // IP당 최대 100 요청
  message: 'Too many requests from this IP'
});

// 요청 검증
const validateRequest = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  // 요청 데이터 검증 로직
}
```

### 4.8 성능 요구사항
- **API 응답 시간**: 평균 200ms 이하
- **처리량**: 초당 1000 요청 처리
- **동시 WebSocket 연결**: 1000개 연결 지원
- **메모리 사용량**: 컨테이너당 512MB 이하
- **Kafka 메시지 처리**: 초당 1000 메시지 처리

### 4.9 보안 요구사항
- **인증**: JWT 기반 토큰 인증 (15분 만료)
- **Refresh Token**: 7일 만료, 안전한 저장
- **인가**: Role-based Access Control
- **데이터 검증**: Zod 스키마 검증
- **Rate Limiting**: IP당 분당 100 요청 제한
- **CORS**: 허용된 도메인만 접근 가능
- **HTTPS**: 모든 통신 TLS 1.3 암호화

### 4.10 에러 처리 요구사항

#### 4.10.1 표준 에러 응답
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  }
}

// 에러 코드 정의
enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  ANALYSIS_IN_PROGRESS = 'ANALYSIS_IN_PROGRESS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
```

### 4.11 로깅 및 모니터링 요구사항
- **구조화된 로깅**: JSON 형태의 로그 출력
- **로그 레벨**: ERROR, WARN, INFO, DEBUG
- **요청 추적**: 각 요청에 고유 ID 부여
- **성능 메트릭**: 응답 시간, 처리량, 에러율 수집
- **헬스 체크**: /health 엔드포인트 제공

---

## 5. 데이터베이스 요구사항

### 5.1 관계형 데이터베이스 (PostgreSQL)
- **버전**: PostgreSQL 14.x
- **용도**: 사용자 정보, 상품 기본 정보, 분석 요청 기록
- **성능**: 
  - 연결 풀: 최대 100개 연결
  - 쿼리 응답 시간: 평균 50ms 이하
- **고가용성**: Multi-AZ 배포
- **백업**: 자동 백업 (7일 보관)

### 5.2 NoSQL 데이터베이스 (미정)
- **후보**: MongoDB, DynamoDB, DocumentDB
- **용도**: 실시간 감정 분석 카드 데이터
- **성능**: 
  - 읽기 지연시간: 10ms 이하
  - 쓰기 지연시간: 20ms 이하

### 5.3 캐시 (Redis)
- **버전**: Redis 7.x
- **용도**: 
  - 세션 관리
  - 검색 결과 캐싱
  - 실시간 분석 상태 캐싱
  - 인기 검색어 저장
- **성능**: 
  - 응답 시간: 1ms 이하
  - 메모리 사용량: 최대 4GB

---

## 6. 데이터 파이프라인 기술 요구사항

### 6.1 워크플로우 오케스트레이션 (Apache Airflow)
- **버전**: Apache Airflow 2.8.x
- **배포**: Kubernetes 기반 (Helm Chart)
- **구성 요소**:
  - **Scheduler**: DAG 스케줄링 및 태스크 실행 관리
  - **Webserver**: 웹 UI 및 API 서버
  - **Worker**: 태스크 실행 워커 (Celery Executor)
  - **Redis**: 메시지 브로커 (Celery Backend)
  - **PostgreSQL**: 메타데이터 저장소
- **DAG 구성**:
  - 실시간 단일 상품 분석 DAG
  - 검색어 기반 다중 상품 분석 DAG  
  - 관심 상품 주기적 배치 분석 DAG
- **트리거 방식**:
  - **API 트리거**: 웹 서비스에서 REST API 호출
  - **Kafka 트리거**: Kafka 메시지 기반 트리거 (KafkaOperator)
  - **스케줄 트리거**: Cron 기반 주기적 실행
- **성능 요구사항**:
  - DAG 트리거 응답 시간: 1초 이내
  - 동시 실행 DAG: 최대 50개
  - 태스크 실행 지연시간: 평균 5초
  - 워커 수: 10-50개 (Auto Scaling)
- **모니터링**:
  - Airflow 메트릭 수집 (Prometheus)
  - DAG 실행 상태 알림 (Slack/Email)
  - 실패 태스크 자동 재시도 (3회)

### 6.2 크롤링 서버
- **프레임워크**: FastAPI
- **웹 드라이버**: Selenium with Chrome/Firefox
- **병렬 처리**: Python Multiprocessing
- **Airflow 연동**: 
  - PythonOperator를 통한 크롤링 태스크 실행
  - XCom을 통한 태스크 간 데이터 전달
  - 크롤링 상태를 Kafka로 실시간 전송
- **성능**: 
  - 동시 크롤링: 10개 프로세스
  - 페이지당 처리 시간: 평균 2초
  - 시간당 처리량: 10,000 리뷰

### 6.3 스트리밍 처리
- **엔진**: Apache Spark Structured Streaming 또는 Apache Flink
- **배포**: Kubernetes 기반
- **Airflow 연동**:
  - SparkSubmitOperator를 통한 Spark Job 실행
  - 스트리밍 작업 상태 모니터링
  - 실패 시 자동 재시작 로직
- **성능**: 
  - 처리 지연시간: 평균 100ms
  - 처리량: 초당 1000 메시지
  - 메모리 사용량: 워커당 2GB

### 6.4 LLM 분석 서버
- **프레임워크**: FastAPI
- **하드웨어**: Nvidia L4 GPU (G6.xlarge 또는 유사)
- **모델**: 
  - 요약: Fine-tuned LLM
  - 감정 분석: Fine-tuned Classification Model
- **Airflow 연동**:
  - KubernetesPodOperator를 통한 GPU 작업 실행
  - 온디맨드 GPU 인스턴스 관리
  - 분석 결과를 Kafka 및 데이터베이스로 전송
- **성능**: 
  - 리뷰당 분석 시간: 평균 500ms
  - 배치 크기: 32개 리뷰
  - GPU 메모리: 최대 16GB

### 6.5 데이터 파이프라인 흐름

#### 6.5.1 실시간 단일 상품 분석 파이프라인
```python
# Airflow DAG 구조
single_product_analysis_dag = DAG(
    'single_product_analysis',
    schedule_interval=None,  # API 트리거
    catchup=False
)

# 태스크 정의
trigger_crawling = PythonOperator(
    task_id='trigger_crawling',
    python_callable=crawl_product_reviews
)

process_streaming = SparkSubmitOperator(
    task_id='process_streaming',
    application='/opt/spark/streaming_processor.py'
)

analyze_sentiment = KubernetesPodOperator(
    task_id='analyze_sentiment',
    image='llm-analysis-server:latest',
    namespace='data-pipeline'
)

store_results = PythonOperator(
    task_id='store_results',
    python_callable=store_analysis_results
)

# 태스크 의존성
trigger_crawling >> process_streaming >> analyze_sentiment >> store_results
```

#### 6.5.2 검색어 기반 다중 상품 분석 파이프라인
```python
# 병렬 처리를 위한 Dynamic Task 생성
def create_product_analysis_tasks(**context):
    products = context['task_instance'].xcom_pull(task_ids='get_products')
    tasks = []
    for product in products:
        task = PythonOperator(
            task_id=f'analyze_product_{product["id"]}',
            python_callable=analyze_single_product,
            op_args=[product]
        )
        tasks.append(task)
    return tasks
```

#### 6.5.3 관심 상품 배치 분석 파이프라인
```python
# 스케줄 기반 배치 처리
batch_analysis_dag = DAG(
    'batch_analysis',
    schedule_interval='0 2 * * *',  # 매일 새벽 2시
    catchup=False
)

# S3 데이터 처리
process_batch_data = SparkSubmitOperator(
    task_id='process_batch_data',
    application='/opt/spark/batch_processor.py',
    conf={'spark.sql.adaptive.enabled': 'true'}
)
```

---

## 7. 메시지 큐 요구사항 (Apache Kafka)

### 7.1 클러스터 구성
- **브로커 수**: 최소 3개 (고가용성)
- **복제 팩터**: 3
- **파티션 수**: 토픽당 6개 (확장성 고려)

### 7.2 토픽 설계
```
- product-search-requests: 상품 검색 요청
- product-analysis-requests: 상품 분석 요청
- crawling-status-updates: 크롤링 상태 업데이트
- raw-review-data: 원본 리뷰 데이터
- processed-review-data: 전처리된 리뷰 데이터
- analysis-results: 분석 결과
- analysis-status-updates: 분석 상태 업데이트
```

### 7.3 성능 요구사항
- **처리량**: 초당 10,000 메시지
- **지연시간**: 평균 10ms
- **보관 기간**: 7일
- **압축**: gzip 압축 적용

### 7.4 보안 요구사항
- **인증**: SASL/PLAIN 또는 SASL/SCRAM
- **암호화**: SSL/TLS 적용
- **접근 제어**: ACL 기반 권한 관리

---

## 8. 데이터 저장소 요구사항

### 8.1 Amazon S3 (Data Lake)
- **스토리지 클래스**: Standard, Intelligent-Tiering
- **암호화**: SSE-S3
- **폴더 구조**:
```
/raw-data/
  /year=2025/month=01/day=31/hour=14/
    - product_reviews_batch_001.json
    - product_info_batch_001.json
/processed-data/
  /year=2025/month=01/day=31/
    - sentiment_analysis_results.parquet
    - summary_results.parquet
```
- **성능**: 
  - 업로드 속도: 100MB/s
  - 다운로드 속도: 200MB/s

### 8.2 Amazon Redshift (Data Warehouse)
- **노드 타입**: dc2.large (초기), ra3.xlplus (확장)
- **클러스터 크기**: 2노드 (초기)
- **압축**: ZSTD
- **분산 키**: product_id
- **정렬 키**: created_at
- **성능**: 
  - 쿼리 응답 시간: 평균 5초 이하
  - 동시 쿼리: 최대 50개

---

## 9. 인프라 요구사항

### 9.1 Kubernetes 클러스터
- **플랫폼**: Amazon EKS
- **노드 그룹**: 
  - 일반 워크로드: m5.large (2-10 노드)
  - GPU 워크로드: g4dn.xlarge (1-5 노드)
- **네트워킹**: AWS VPC CNI
- **스토리지**: EBS CSI Driver

### 9.2 Auto Scaling
- **HPA (Horizontal Pod Autoscaler)**: CPU 70% 기준
- **VPA (Vertical Pod Autoscaler)**: 메모리 사용량 기준
- **Cluster Autoscaler**: 노드 자동 확장/축소

### 9.3 로드 밸런싱
- **Ingress Controller**: AWS Load Balancer Controller
- **로드 밸런서**: Application Load Balancer (ALB)
- **SSL/TLS**: AWS Certificate Manager

---

## 10. 모니터링 및 로깅 요구사항

### 10.1 메트릭 수집
- **수집 도구**: Prometheus
- **시각화**: Grafana
- **장기 저장**: Thanos
- **알림**: AlertManager

### 10.2 로그 관리
- **수집**: Fluent Bit
- **저장**: Amazon CloudWatch Logs
- **분석**: Amazon OpenSearch Service
- **보관 기간**: 30일

### 10.3 추적 (Tracing)
- **도구**: Jaeger 또는 AWS X-Ray
- **샘플링 비율**: 1%
- **보관 기간**: 7일

---

## 11. 보안 요구사항

### 11.1 네트워크 보안
- **VPC**: Private/Public 서브넷 분리
- **보안 그룹**: 최소 권한 원칙
- **NACL**: 필요시 추가 보안 계층
- **WAF**: DDoS 방어 (향후 적용)

### 11.2 인증 및 인가
- **IAM**: Role-based 접근 제어
- **IRSA**: Kubernetes ServiceAccount와 IAM Role 연동
- **Secret 관리**: AWS Secrets Manager
- **키 관리**: AWS KMS

### 11.3 데이터 보안
- **암호화**: 
  - 전송 중: TLS 1.3
  - 저장 시: AES-256
- **백업 암호화**: 모든 백업 데이터 암호화
- **접근 로그**: 모든 데이터 접근 기록

---

## 12. 성능 요구사항

### 12.1 응답 시간
- **웹 페이지 로딩**: 3초 이내
- **API 응답**: 200ms 이내
- **실시간 분석 완료**: 2분 이내
- **WebSocket 메시지 전달**: 100ms 이내

### 12.2 처리량
- **동시 사용자**: 100명
- **API 요청**: 초당 1000 요청
- **Kafka 메시지**: 초당 10000 메시지
- **리뷰 분석**: 시간당 50000 리뷰

### 12.3 가용성
- **서비스 가용성**: 99.9%
- **데이터베이스 가용성**: 99.95%
- **복구 시간**: 5분 이내
- **백업 복구**: 1시간 이내

---

## 13. 확장성 요구사항

### 13.1 수평 확장
- **웹 서버**: 로드 밸런서 기반 확장
- **API 서버**: Kubernetes HPA 기반 확장
- **데이터베이스**: 읽기 복제본 추가
- **캐시**: Redis Cluster 구성

### 13.2 수직 확장
- **CPU**: 필요시 인스턴스 타입 업그레이드
- **메모리**: 메모리 집약적 워크로드 대응
- **스토리지**: EBS 볼륨 확장
- **네트워크**: Enhanced Networking 적용

---

## 14. 재해 복구 요구사항

### 14.1 백업 전략
- **데이터베이스**: 일일 자동 백업
- **파일 시스템**: S3 Cross-Region Replication
- **설정 파일**: Git 기반 버전 관리
- **시크릿**: Secrets Manager 자동 백업

### 14.2 복구 계획
- **RTO (Recovery Time Objective)**: 1시간
- **RPO (Recovery Point Objective)**: 15분
- **복구 절차**: 자동화된 복구 스크립트
- **테스트**: 월 1회 재해 복구 테스트

---

## 15. 개발 및 배포 요구사항

### 15.1 CI/CD 파이프라인
- **소스 관리**: Git (GitHub/GitLab)
- **CI 도구**: GitHub Actions 또는 Jenkins
- **CD 도구**: ArgoCD
- **컨테이너 레지스트리**: Amazon ECR

### 15.2 환경 관리
- **개발 환경**: 로컬 Docker Compose
- **스테이징 환경**: 프로덕션과 동일한 구성
- **프로덕션 환경**: Kubernetes 클러스터
- **설정 관리**: Helm Charts

### 15.3 코드 품질
- **정적 분석**: ESLint, SonarQube
- **테스트 커버리지**: 80% 이상
- **보안 스캔**: Snyk, OWASP ZAP
- **의존성 관리**: Dependabot

---

## 16. 규정 준수 요구사항

### 16.1 데이터 보호
- **개인정보 보호**: GDPR, CCPA 준수
- **데이터 최소화**: 필요한 데이터만 수집
- **데이터 보관**: 법적 요구사항 준수
- **데이터 삭제**: 사용자 요청 시 완전 삭제

### 16.2 감사 및 로깅
- **접근 로그**: 모든 시스템 접근 기록
- **변경 로그**: 설정 및 데이터 변경 기록
- **보안 이벤트**: 보안 관련 모든 이벤트 기록
- **로그 보관**: 최소 1년간 보관

---

## 17. 비용 최적화 요구사항

### 17.1 리소스 최적화
- **Spot 인스턴스**: 배치 작업에 활용
- **Reserved 인스턴스**: 안정적인 워크로드에 적용
- **Auto Scaling**: 사용량에 따른 자동 조절
- **스토리지 계층화**: S3 Intelligent-Tiering

### 17.2 모니터링 및 알림
- **비용 모니터링**: AWS Cost Explorer
- **예산 알림**: 예산 초과 시 알림
- **리소스 태깅**: 비용 추적을 위한 태깅
- **사용량 분석**: 정기적인 사용량 리뷰

---

## 18. 테스트 요구사항

### 18.1 테스트 유형
- **단위 테스트**: 각 모듈별 테스트
- **통합 테스트**: 컴포넌트 간 연동 테스트
- **성능 테스트**: 부하 및 스트레스 테스트
- **보안 테스트**: 취약점 스캔 및 침투 테스트

### 18.2 테스트 자동화
- **테스트 실행**: CI/CD 파이프라인 통합
- **테스트 데이터**: 자동 생성 및 정리
- **테스트 환경**: 격리된 테스트 환경
- **결과 보고**: 자동화된 테스트 리포트

---

## 부록

### A. 기술 스택 매트릭스

| 계층 | 기술 | 버전 | 용도 |
|------|------|------|------|
| Frontend | React | 18.x | UI 프레임워크 |
| Frontend | TypeScript | 5.x | 타입 안전성 |
| Frontend | Tailwind CSS | 3.x | 스타일링 |
| Backend | Node.js | 18.x | 런타임 |
| Backend | Express | 4.x | 웹 프레임워크 |
| Database | PostgreSQL | 14.x | 관계형 DB |
| Cache | Redis | 7.x | 캐시 |
| Message Queue | Apache Kafka | 3.x | 메시지 큐 |
| Workflow | Apache Airflow | 2.8.x | 워크플로우 오케스트레이션 |
| Streaming | Apache Spark | 3.5.x | 스트리밍 처리 |
| Streaming | Apache Flink | 1.18.x | 스트리밍 처리 (대안) |
| Crawling | FastAPI | 0.104.x | 크롤링 서버 |
| Crawling | Selenium | 4.x | 웹 드라이버 |
| ML/AI | PyTorch | 2.1.x | 딥러닝 프레임워크 |
| ML/AI | Transformers | 4.35.x | LLM 라이브러리 |
| Container | Docker | 24.x | 컨테이너화 |
| Orchestration | Kubernetes | 1.28.x | 컨테이너 오케스트레이션 |
| Cloud | AWS | - | 클라우드 플랫폼 |

### B. 포트 할당

| 서비스 | 포트 | 프로토콜 | 용도 |
|--------|------|----------|------|
| Frontend | 3000 | HTTP | 개발 서버 |
| Backend API | 8000 | HTTP | REST API |
| WebSocket | 8001 | WS | 실시간 통신 |
| PostgreSQL | 5432 | TCP | 데이터베이스 |
| Redis | 6379 | TCP | 캐시 |
| Kafka | 9092 | TCP | 메시지 큐 |
| Airflow Webserver | 8080 | HTTP | Airflow UI |
| Airflow Worker | 8793 | TCP | Celery Worker |
| Crawling Server | 8002 | HTTP | 크롤링 API |
| LLM Analysis Server | 8003 | HTTP | 분석 API |
| Spark Master | 7077 | TCP | Spark 클러스터 |
| Spark UI | 4040 | HTTP | Spark 모니터링 |

### C. 환경 변수

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379

# Kafka
KAFKA_BROKERS=broker1:9092,broker2:9092,broker3:9092

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# Airflow
AIRFLOW__CORE__EXECUTOR=CeleryExecutor
AIRFLOW__DATABASE__SQL_ALCHEMY_CONN=postgresql://airflow:pass@postgres:5432/airflow
AIRFLOW__CELERY__BROKER_URL=redis://redis:6379/0
AIRFLOW__CELERY__RESULT_BACKEND=db+postgresql://airflow:pass@postgres:5432/airflow
AIRFLOW__CORE__FERNET_KEY=your-fernet-key
AIRFLOW__WEBSERVER__SECRET_KEY=your-webserver-secret

# External Services
CRAWLING_SERVER_URL=http://crawling-server:8002
ANALYSIS_SERVER_URL=http://analysis-server:8003

# Spark
SPARK_MASTER_URL=spark://spark-master:7077
SPARK_DRIVER_MEMORY=2g
SPARK_EXECUTOR_MEMORY=2g

# AWS
AWS_REGION=ap-northeast-2
S3_BUCKET=your-bucket-name
S3_DATA_LAKE_BUCKET=your-data-lake-bucket
REDSHIFT_CLUSTER_ENDPOINT=your-cluster.redshift.amazonaws.com:5439

# GPU/ML
CUDA_VISIBLE_DEVICES=0
TRANSFORMERS_CACHE=/opt/ml/cache
MODEL_PATH=/opt/ml/models
```

---

**문서 승인**
- 기술 검토: [ ]
- 보안 검토: [ ]
- 아키텍처 검토: [ ]
- 최종 승인: [ ]