# KOSA 개발환경 구축 가이드

## 🚀 빠른 시작 (Docker 사용)

### 1. 필수 요구사항
- Docker Desktop 설치
- Node.js 18+ 설치
- Git 설치

### 2. 프로젝트 클론 및 설정
```bash
git clone <repository-url>
cd kosa-project
```

### 3. Docker로 인프라 서비스 실행
```bash
# Docker Compose 파일 생성
curl -o docker-compose.yml https://raw.githubusercontent.com/your-repo/docker-compose.yml

# 서비스 시작 (PostgreSQL, Redis, Kafka, Airflow)
docker-compose up -d

# 서비스 상태 확인
docker-compose ps
```

### 4. 백엔드 설정
```bash
cd backend

# 환경 변수 설정
cp .env.example .env

# 의존성 설치
npm install

# 데이터베이스 초기화
npx prisma generate
npx prisma db push

# 개발 서버 시작
npm run dev
```

### 5. 프론트엔드 설정
```bash
cd front

# 환경 변수 설정
cp .env.example .env

# 의존성 설치
npm install

# 개발 서버 시작
npm start
```

## 📋 서비스 접속 정보

| 서비스 | URL | 계정 |
|--------|-----|------|
| 프론트엔드 | http://localhost:3000 | - |
| 백엔드 API | http://localhost:3001 | - |
| API 문서 | http://localhost:3001/api-docs | - |
| Kafka UI | http://localhost:8080 | - |
| Airflow | http://localhost:8081 | admin/admin |

## ⚙️ 환경 변수 설정

### backend/.env
```env
# 데이터베이스
DATABASE_URL="postgresql://postgres:password@localhost:5432/kosa?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Kafka
KAFKA_BROKERS=localhost:9092

# Airflow
AIRFLOW_API_URL=http://localhost:8081/api/v1
AIRFLOW_USERNAME=admin
AIRFLOW_PASSWORD=admin

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### front/.env
```env
REACT_APP_API_BASE_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

## 🐳 Docker Compose 설정

### docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: kosa
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    ports:
      - "9092:9092"
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    ports:
      - "8080:8080"
    depends_on:
      - kafka
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092

  airflow-postgres:
    image: postgres:13-alpine
    environment:
      POSTGRES_USER: airflow
      POSTGRES_PASSWORD: airflow
      POSTGRES_DB: airflow

  airflow-webserver:
    image: apache/airflow:2.7.0
    ports:
      - "8081:8080"
    depends_on:
      - airflow-postgres
    environment:
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@airflow-postgres/airflow
      AIRFLOW__CORE__EXECUTOR: LocalExecutor
    volumes:
      - ./airflow/dags:/opt/airflow/dags
    command: webserver

volumes:
  postgres_data:
  redis_data:
```

## 🧪 테스트

### API 테스트
```bash
# 헬스체크
curl http://localhost:3001/health

# 회원가입
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","name":"테스트"}'

# 로그인
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

## 🔧 문제 해결

### 포트 충돌
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### Docker 컨테이너 재시작
```bash
docker-compose restart
docker-compose logs <service-name>
```

### 데이터베이스 초기화
```bash
cd backend
npx prisma db push --force-reset
```

## 📚 추가 리소스

- [Prisma 문서](https://www.prisma.io/docs/)
- [Kafka 문서](https://kafka.apache.org/documentation/)
- [Airflow 문서](https://airflow.apache.org/docs/)
- [Docker Compose 문서](https://docs.docker.com/compose/)

## 🎯 체크리스트

- [ ] Docker 서비스 실행
- [ ] 백엔드 서버 실행 (http://localhost:3001)
- [ ] 프론트엔드 서버 실행 (http://localhost:3000)
- [ ] 데이터베이스 연결 확인
- [ ] API 테스트 완료
- [ ] WebSocket 연결 확인

완료되면 개발 준비 끝! 🎉