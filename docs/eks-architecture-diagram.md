# HighPipe EKS 아키텍처 다이어그램

## 전체 시스템 아키텍처

```mermaid
graph TB
    %% External Components
    User[👤 사용자]
    Internet[🌐 인터넷]
    
    %% AWS Services
    subgraph AWS["☁️ AWS Cloud"]
        subgraph VPC["🏢 VPC"]
            subgraph PublicSubnet["🌐 Public Subnet"]
                ALB[⚖️ Application Load Balancer]
                NAT[🚪 NAT Gateway]
            end
            
            subgraph PrivateSubnet["🔒 Private Subnet"]
                subgraph EKS["☸️ EKS Cluster"]
                    
                    %% Web Tier Namespace
                    subgraph WebTier["📱 web-tier namespace"]
                        Frontend[⚛️ React Frontend<br/>Pods: 3]
                        Nginx[🔄 Nginx LoadBalancer<br/>Pods: 2]
                        Ingress[🚪 Ingress Controller]
                    end
                    
                    %% Application Tier Namespace
                    subgraph AppTier["🔧 app-tier namespace"]
                        BackendAPI[🖥️ Backend API<br/>Node.js<br/>Pods: 3-20 (HPA)]
                        WebSocket[🔌 WebSocket Server<br/>Pods: 2-10 (HPA)]
                        
                        subgraph AirflowCluster["🌊 Airflow Cluster"]
                            AirflowScheduler[📅 Scheduler<br/>Pod: 1]
                            AirflowWebserver[🌐 Webserver<br/>Pods: 2]
                            AirflowWorker[👷 Workers<br/>Pods: 2-10 (HPA)]
                        end
                    end
                    
                    %% Pipeline Tier Namespace
                    subgraph PipelineTier["🔄 pipeline-tier namespace"]
                        CrawlingServer[🕷️ Crawling Server<br/>FastAPI + Selenium<br/>Pods: 2-8 (HPA)]
                        AnalysisServer[🧠 LLM Analysis Server<br/>FastAPI + GPU<br/>Pods: 1-5 (HPA)]
                        SparkCluster[⚡ Spark Cluster<br/>Driver: 1, Executors: 2-10]
                    end
                    
                    %% Data Tier Namespace
                    subgraph DataTier["💾 data-tier namespace"]
                        subgraph KafkaCluster["📨 Kafka Cluster"]
                            Kafka1[📨 Kafka Broker 1]
                            Kafka2[📨 Kafka Broker 2]
                            Kafka3[📨 Kafka Broker 3]
                            Zookeeper[🐘 Zookeeper<br/>Pods: 3]
                        end
                        
                        Redis[🔴 Redis Cluster<br/>Master: 1, Slaves: 2]
                        PostgresProxy[🐘 PostgreSQL Proxy<br/>Connection Pooling]
                    end
                    
                    %% Monitoring Namespace
                    subgraph Monitoring["📊 monitoring namespace"]
                        Prometheus[📈 Prometheus<br/>Pod: 1]
                        Grafana[📊 Grafana<br/>Pod: 1]
                        AlertManager[🚨 AlertManager<br/>Pod: 1]
                    end
                end
            end
        end
        
        %% Managed AWS Services
        subgraph ManagedServices["🛠️ AWS Managed Services"]
            RDS[🗄️ RDS PostgreSQL<br/>Multi-AZ]
            S3[🪣 S3 Data Lake<br/>Raw Data Storage]
            Redshift[🏭 Redshift<br/>Data Warehouse]
            ECR[📦 ECR<br/>Container Registry]
            SecretsManager[🔐 Secrets Manager]
            CloudWatch[📊 CloudWatch Logs]
        end
    end
    
    %% Connections
    User --> Internet
    Internet --> ALB
    ALB --> Ingress
    Ingress --> Frontend
    Ingress --> BackendAPI
    Ingress --> AirflowWebserver
    
    Frontend --> BackendAPI
    BackendAPI --> WebSocket
    BackendAPI --> Redis
    BackendAPI --> PostgresProxy
    BackendAPI --> Kafka1
    
    AirflowScheduler --> AirflowWorker
    AirflowWorker --> CrawlingServer
    AirflowWorker --> AnalysisServer
    AirflowWorker --> SparkCluster
    
    CrawlingServer --> Kafka2
    AnalysisServer --> Kafka3
    SparkCluster --> S3
    SparkCluster --> Redshift
    
    Kafka1 --> Zookeeper
    Kafka2 --> Zookeeper
    Kafka3 --> Zookeeper
    
    PostgresProxy --> RDS
    
    %% Monitoring connections
    Prometheus --> BackendAPI
    Prometheus --> Kafka1
    Prometheus --> Redis
    Grafana --> Prometheus
    AlertManager --> Prometheus
    
    %% External connections
    BackendAPI --> SecretsManager
    CrawlingServer --> S3
    AnalysisServer --> S3
    
    %% Logging
    BackendAPI --> CloudWatch
    CrawlingServer --> CloudWatch
    AnalysisServer --> CloudWatch
    
    %% Styling
    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:#fff
    classDef k8s fill:#326CE5,stroke:#fff,stroke-width:2px,color:#fff
    classDef app fill:#4CAF50,stroke:#fff,stroke-width:2px,color:#fff
    classDef data fill:#2196F3,stroke:#fff,stroke-width:2px,color:#fff
    classDef monitor fill:#FF5722,stroke:#fff,stroke-width:2px,color:#fff
    
    class AWS,ManagedServices aws
    class EKS,WebTier,AppTier,PipelineTier,DataTier k8s
    class Frontend,BackendAPI,WebSocket,CrawlingServer,AnalysisServer app
    class KafkaCluster,Redis,PostgresProxy,RDS,S3,Redshift data
    class Monitoring,Prometheus,Grafana,AlertManager monitor
```

## 노드 그룹 구성

```mermaid
graph TB
    subgraph EKSCluster["☸️ EKS Cluster"]
        subgraph GeneralNodeGroup["🖥️ General Node Group"]
            GeneralNode1[💻 m5.large<br/>General Workload<br/>2-4 vCPU, 8-16GB RAM]
            GeneralNode2[💻 m5.xlarge<br/>General Workload<br/>4 vCPU, 16GB RAM]
            GeneralNode3[💻 m5.large<br/>General Workload<br/>2-4 vCPU, 8-16GB RAM]
        end
        
        subgraph GPUNodeGroup["🎮 GPU Node Group"]
            GPUNode1[🎮 g4dn.xlarge<br/>LLM Analysis<br/>4 vCPU, 16GB RAM<br/>1x NVIDIA T4]
            GPUNode2[🎮 g4dn.2xlarge<br/>LLM Analysis<br/>8 vCPU, 32GB RAM<br/>1x NVIDIA T4]
        end
        
        subgraph DataNodeGroup["💾 Data Processing Node Group"]
            DataNode1[💾 r5.large<br/>Memory Intensive<br/>2 vCPU, 16GB RAM]
            DataNode2[💾 r5.xlarge<br/>Memory Intensive<br/>4 vCPU, 32GB RAM]
        end
        
        subgraph SpotNodeGroup["💰 Spot Node Group"]
            SpotNode1[💰 m5.large (Spot)<br/>Batch Processing<br/>2-4 vCPU, 8-16GB RAM]
            SpotNode2[💰 c5.xlarge (Spot)<br/>CPU Intensive<br/>4 vCPU, 8GB RAM]
        end
    end
    
    %% Workload placement
    GeneralNode1 --> Frontend
    GeneralNode1 --> BackendAPI
    GeneralNode2 --> WebSocket
    GeneralNode2 --> AirflowWebserver
    GeneralNode3 --> Nginx
    GeneralNode3 --> Ingress
    
    GPUNode1 --> AnalysisServer
    GPUNode2 --> MLTraining[🤖 ML Model Training]
    
    DataNode1 --> Kafka
    DataNode1 --> Redis
    DataNode2 --> SparkDriver[⚡ Spark Driver]
    
    SpotNode1 --> CrawlingServer
    SpotNode1 --> SparkExecutor[⚡ Spark Executors]
    SpotNode2 --> BatchJobs[📦 Batch Processing Jobs]
    
    classDef general fill:#4CAF50,stroke:#fff,stroke-width:2px,color:#fff
    classDef gpu fill:#FF5722,stroke:#fff,stroke-width:2px,color:#fff
    classDef data fill:#2196F3,stroke:#fff,stroke-width:2px,color:#fff
    classDef spot fill:#FF9800,stroke:#fff,stroke-width:2px,color:#fff
    
    class GeneralNode1,GeneralNode2,GeneralNode3 general
    class GPUNode1,GPUNode2 gpu
    class DataNode1,DataNode2 data
    class SpotNode1,SpotNode2 spot
```

## 데이터 플로우 다이어그램

```mermaid
sequenceDiagram
    participant User as 👤 사용자
    participant Frontend as ⚛️ Frontend
    participant API as 🖥️ Backend API
    participant WS as 🔌 WebSocket
    participant Kafka as 📨 Kafka
    participant Airflow as 🌊 Airflow
    participant Crawler as 🕷️ Crawler
    participant Analysis as 🧠 Analysis
    participant DB as 🗄️ Database
    participant Cache as 🔴 Redis
    
    User->>Frontend: 상품 분석 요청
    Frontend->>API: POST /api/analysis/start
    API->>Kafka: 분석 요청 메시지 발행
    API->>Cache: 요청 상태 캐싱
    API-->>Frontend: 분석 ID 반환
    
    Frontend->>WS: WebSocket 연결 (분석 ID)
    
    Kafka->>Airflow: 메시지 수신 및 DAG 트리거
    Airflow->>Crawler: 크롤링 작업 시작
    
    loop 크롤링 진행
        Crawler->>Kafka: 진행 상태 업데이트
        Kafka->>API: 상태 메시지 수신
        API->>WS: 실시간 상태 전송
        WS-->>Frontend: 진행률 업데이트
    end
    
    Crawler->>Kafka: 수집된 리뷰 데이터
    Kafka->>Analysis: 분석 작업 시작
    
    loop 분석 진행
        Analysis->>Kafka: 분석 진행 상태
        Kafka->>API: 상태 메시지 수신
        API->>WS: 실시간 상태 전송
        WS-->>Frontend: 분석 진행률
        
        Analysis->>Kafka: 개별 감정 카드 결과
        Kafka->>API: 카드 데이터 수신
        API->>Cache: 카드 데이터 임시 저장
        API->>WS: 실시간 카드 전송
        WS-->>Frontend: 감정 카드 표시
    end
    
    Analysis->>DB: 최종 분석 결과 저장
    Analysis->>Kafka: 분석 완료 알림
    Kafka->>API: 완료 메시지 수신
    API->>WS: 분석 완료 알림
    WS-->>Frontend: 결과 페이지로 이동
    
    Frontend->>API: GET /api/analysis/{id}/results
    API->>DB: 분석 결과 조회
    API->>Cache: 결과 캐싱
    API-->>Frontend: 분석 결과 반환
```

## 네트워크 보안 다이어그램

```mermaid
graph TB
    subgraph Internet["🌐 인터넷"]
        Users[👥 사용자들]
    end
    
    subgraph AWS["☁️ AWS VPC"]
        subgraph PublicSubnet["🌐 Public Subnet"]
            IGW[🚪 Internet Gateway]
            ALB[⚖️ Application Load Balancer<br/>443, 80]
            NAT[🚪 NAT Gateway]
        end
        
        subgraph PrivateSubnet1["🔒 Private Subnet AZ-1a"]
            subgraph EKSNodes1["☸️ EKS Worker Nodes"]
                WebPods1[📱 Web Tier Pods<br/>Port: 3000, 80]
                AppPods1[🔧 App Tier Pods<br/>Port: 8000, 8080]
            end
        end
        
        subgraph PrivateSubnet2["🔒 Private Subnet AZ-1b"]
            subgraph EKSNodes2["☸️ EKS Worker Nodes"]
                DataPods2[💾 Data Tier Pods<br/>Port: 9092, 6379, 5432]
                PipelinePods2[🔄 Pipeline Pods<br/>Port: 8002, 8003]
            end
        end
        
        subgraph DatabaseSubnet["🗄️ Database Subnet"]
            RDS[🐘 RDS PostgreSQL<br/>Port: 5432]
        end
    end
    
    %% Network flows
    Users -->|HTTPS:443| IGW
    IGW --> ALB
    ALB -->|HTTP:80| WebPods1
    WebPods1 -->|HTTP:8000| AppPods1
    AppPods1 -->|TCP:9092| DataPods2
    AppPods1 -->|TCP:6379| DataPods2
    AppPods1 -->|TCP:5432| RDS
    
    %% Outbound internet access
    AppPods1 --> NAT
    DataPods2 --> NAT
    PipelinePods2 --> NAT
    NAT --> IGW
    
    %% Security Groups
    subgraph SecurityGroups["🛡️ Security Groups"]
        ALBSG[ALB-SG<br/>Inbound: 80,443 from 0.0.0.0/0<br/>Outbound: 3000,8000 to EKS-SG]
        EKSSG[EKS-SG<br/>Inbound: 3000,8000 from ALB-SG<br/>Inbound: 9092,6379 from EKS-SG<br/>Outbound: All to 0.0.0.0/0]
        RDSSG[RDS-SG<br/>Inbound: 5432 from EKS-SG<br/>Outbound: None]
    end
    
    %% Network Policies
    subgraph NetworkPolicies["🔐 Network Policies"]
        WebPolicy[Web Tier Policy<br/>Allow: Ingress from ALB<br/>Allow: Egress to App Tier]
        AppPolicy[App Tier Policy<br/>Allow: Ingress from Web Tier<br/>Allow: Egress to Data Tier]
        DataPolicy[Data Tier Policy<br/>Allow: Ingress from App/Pipeline Tier<br/>Deny: Direct external access]
    end
    
    classDef public fill:#FF9800,stroke:#fff,stroke-width:2px,color:#fff
    classDef private fill:#4CAF50,stroke:#fff,stroke-width:2px,color:#fff
    classDef database fill:#2196F3,stroke:#fff,stroke-width:2px,color:#fff
    classDef security fill:#F44336,stroke:#fff,stroke-width:2px,color:#fff
    
    class PublicSubnet,IGW,ALB,NAT public
    class PrivateSubnet1,PrivateSubnet2,EKSNodes1,EKSNodes2 private
    class DatabaseSubnet,RDS database
    class SecurityGroups,NetworkPolicies,ALBSG,EKSSG,RDSSG security
```

## Auto Scaling 전략

```mermaid
graph TB
    subgraph Scaling["📈 Auto Scaling 전략"]
        subgraph HPA["🔄 Horizontal Pod Autoscaler"]
            BackendHPA[🖥️ Backend API HPA<br/>Min: 3, Max: 20<br/>CPU: 70%, Memory: 80%]
            WebSocketHPA[🔌 WebSocket HPA<br/>Min: 2, Max: 10<br/>CPU: 60%, Memory: 70%]
            CrawlerHPA[🕷️ Crawler HPA<br/>Min: 2, Max: 8<br/>CPU: 80%, Memory: 85%]
            AnalysisHPA[🧠 Analysis HPA<br/>Min: 1, Max: 5<br/>GPU: 70%, Memory: 80%]
        end
        
        subgraph VPA["📊 Vertical Pod Autoscaler"]
            BackendVPA[🖥️ Backend VPA<br/>CPU: 500m-2000m<br/>Memory: 512Mi-2Gi]
            KafkaVPA[📨 Kafka VPA<br/>CPU: 1000m-4000m<br/>Memory: 1Gi-4Gi]
            RedisVPA[🔴 Redis VPA<br/>CPU: 250m-1000m<br/>Memory: 256Mi-1Gi]
        end
        
        subgraph ClusterAS["🏗️ Cluster Autoscaler"]
            GeneralAS[💻 General Nodes<br/>Min: 2, Max: 10<br/>Scale on: Pod pending]
            GPUAS[🎮 GPU Nodes<br/>Min: 0, Max: 5<br/>Scale on: GPU requests]
            SpotAS[💰 Spot Nodes<br/>Min: 1, Max: 15<br/>Scale on: Batch workloads]
        end
        
        subgraph CustomScaling["⚙️ Custom Scaling"]
            KafkaScaling[📨 Kafka Consumer Lag<br/>Scale crawlers based on<br/>message queue depth]
            TimeBasedScaling[⏰ Time-based Scaling<br/>Scale up during peak hours<br/>8AM-10PM KST]
            PredictiveScaling[🔮 Predictive Scaling<br/>ML-based scaling<br/>based on historical patterns]
        end
    end
    
    %% Scaling triggers
    BackendHPA -->|High CPU/Memory| GeneralAS
    AnalysisHPA -->|GPU requests| GPUAS
    CrawlerHPA -->|Batch jobs| SpotAS
    
    KafkaScaling -->|Queue depth > 1000| CrawlerHPA
    TimeBasedScaling -->|Peak hours| BackendHPA
    PredictiveScaling -->|Traffic prediction| GeneralAS
    
    classDef hpa fill:#4CAF50,stroke:#fff,stroke-width:2px,color:#fff
    classDef vpa fill:#2196F3,stroke:#fff,stroke-width:2px,color:#fff
    classDef cluster fill:#FF9800,stroke:#fff,stroke-width:2px,color:#fff
    classDef custom fill:#9C27B0,stroke:#fff,stroke-width:2px,color:#fff
    
    class BackendHPA,WebSocketHPA,CrawlerHPA,AnalysisHPA hpa
    class BackendVPA,KafkaVPA,RedisVPA vpa
    class GeneralAS,GPUAS,SpotAS cluster
    class KafkaScaling,TimeBasedScaling,PredictiveScaling custom
```

이 다이어그램들은 HighPipe 프로젝트의 EKS 기반 아키텍처를 시각적으로 보여줍니다. 각 컴포넌트의 역할과 상호작용, 그리고 확장성과 보안을 고려한 설계를 확인할 수 있습니다.