# HighPipe EKS 아키텍처 다이어그램

이 폴더에는 HighPipe 프로젝트의 EKS 기반 아키텍처를 시각화한 Mermaid 다이어그램들이 포함되어 있습니다.

## 📋 다이어그램 목록

### [01. 전체 시스템 아키텍처](./01-system-architecture.md)
- EKS 클러스터 전체 구조
- 네임스페이스별 컴포넌트 배치
- AWS 관리형 서비스 연동
- 컴포넌트 간 연결 관계

### [02. 노드 그룹 구성](./02-node-groups.md)
- General, GPU, Data, Spot 노드 그룹
- 각 노드 그룹의 인스턴스 타입과 사양
- 워크로드별 노드 배치 전략

### [03. 데이터 플로우](./03-data-flow.md)
- 사용자 요청부터 결과 반환까지의 전체 흐름
- 실시간 상태 업데이트 과정
- Kafka 기반 비동기 메시징
- WebSocket 실시간 통신

### [04. 네트워크 보안](./04-network-security.md)
- VPC 서브넷 구조
- Security Groups 설정
- Network Policies
- 트래픽 흐름과 보안 경계

### [05. Auto Scaling 전략](./05-auto-scaling.md)
- HPA (Horizontal Pod Autoscaler)
- VPA (Vertical Pod Autoscaler)
- Cluster Autoscaler
- 커스텀 스케일링 전략

## 🎨 다이어그램 보는 방법

### VS Code에서 보기
1. 각 `.md` 파일 열기
2. `Ctrl+Shift+P` → "Mermaid: Preview" 선택
3. 새 탭에서 다이어그램 확인

### 온라인에서 보기
1. [Mermaid Live Editor](https://mermaid.live/) 접속
2. 다이어그램 코드 복사/붙여넣기
3. 실시간 미리보기 및 내보내기

### 이미지로 변환
```bash
# CLI 도구 사용
npm install -g @mermaid-js/mermaid-cli
mmdc -i docs/diagrams/01-system-architecture.md -o architecture.png

# Docker 사용
docker run --rm -v $(pwd):/data minlag/mermaid-cli \
  -i /data/docs/diagrams/01-system-architecture.md \
  -o /data/architecture.png
```

## 🏗️ 아키텍처 특징

- **마이크로서비스 아키텍처**: 네임스페이스별 서비스 분리
- **이벤트 기반 아키텍처**: Kafka 중심의 비동기 통신
- **클라우드 네이티브**: Kubernetes 기반 컨테이너 오케스트레이션
- **확장성**: HPA, VPA, Cluster Autoscaler를 통한 자동 확장
- **보안**: 네트워크 정책과 보안 그룹을 통한 다층 보안
- **비용 최적화**: Spot 인스턴스와 예측 기반 스케일링

## 🔗 관련 문서

- [기술 요구사항 명세서 (TRD)](../../기술_요구사항_명세서(TRD).md)
- [Mermaid 시각화 가이드](../mermaid-visualization-guide.md)
- [다이어그램 생성 스크립트](../../scripts/generate-diagrams.sh)