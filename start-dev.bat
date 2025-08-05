@echo off
echo ========================================
echo KOSA 개발환경 시작
echo ========================================

echo.
echo 1. Airflow 디렉토리 생성...
if not exist "airflow" mkdir airflow
if not exist "airflow\dags" mkdir airflow\dags
if not exist "airflow\logs" mkdir airflow\logs
if not exist "airflow\plugins" mkdir airflow\plugins

echo.
echo 2. Docker 서비스 시작...
docker-compose up -d

echo.
echo 3. 서비스 상태 확인 (30초 대기)...
timeout /t 30 /nobreak > nul
docker-compose ps

echo.
echo 4. 백엔드 환경 설정...
cd backend
if not exist ".env" (
    echo DATABASE_URL=postgresql://postgres:password@localhost:5432/kosa?schema=public > .env
    echo REDIS_HOST=localhost >> .env
    echo REDIS_PORT=6379 >> .env
    echo KAFKA_BROKERS=localhost:9092 >> .env
    echo AIRFLOW_API_URL=http://localhost:8081/api/v1 >> .env
    echo AIRFLOW_USERNAME=admin >> .env
    echo AIRFLOW_PASSWORD=admin >> .env
    echo JWT_SECRET=kosa-dev-secret-key >> .env
    echo JWT_REFRESH_SECRET=kosa-dev-refresh-secret >> .env
    echo NODE_ENV=development >> .env
    echo PORT=3001 >> .env
)

echo.
echo 5. 프론트엔드 환경 설정...
cd ..\front
if not exist ".env" (
    echo REACT_APP_API_BASE_URL=http://localhost:3001 > .env
    echo REACT_APP_WS_URL=ws://localhost:3001 >> .env
    echo REACT_APP_ENV=development >> .env
)

echo.
echo ========================================
echo 개발환경 준비 완료!
echo ========================================
echo.
echo 서비스 접속 정보:
echo - 프론트엔드: http://localhost:3000
echo - 백엔드 API: http://localhost:3001
echo - API 문서: http://localhost:3001/api-docs
echo - Kafka UI: http://localhost:8080
echo - Airflow UI: http://localhost:8081 (admin/admin)
echo.
echo 다음 단계:
echo 1. 백엔드 서버 시작:
echo    cd backend
echo    npm install
echo    npx prisma generate
echo    npx prisma db push
echo    npm run dev
echo.
echo 2. 프론트엔드 서버 시작 (새 터미널):
echo    cd front
echo    npm install
echo    npm start
echo.
echo ========================================

pause