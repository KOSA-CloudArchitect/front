import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavBar from "../components/NavBar";
import BottomBar from "../components/BottomBar";
import { RealtimeProgressIndicator } from "../components/RealtimeProgressIndicator";
import { RealtimeEmotionCards } from "../components/RealtimeEmotionCards";
import { RealtimeAnalysisChart } from "../components/RealtimeAnalysisChart";
import { 
  AnalysisStatus, 
  WebSocketAnalysisEvent,
} from "../types";
import { apiService, ApiError } from "../services/api";
import { useWebSocket } from "../hooks/useWebSocket";
import { useRealtimeActions } from "../stores/realtimeAnalysisStore";

export default function AnalysisPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const isDummy = new URLSearchParams(location.search).get("dummy") === "true";
  const productIdRef = useRef<string>(
    isDummy
      ? (Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000)).toString()
      : new URLSearchParams(location.search).get("productId") || ""
  );
  const productId = productIdRef.current;

  // WebSocket 훅 사용
  const { isConnected } = useWebSocket({ productId });
  const { reset } = useRealtimeActions();

  // 분석 상태 확인 및 요청 함수
  const checkAndStartAnalysis = useCallback(async (): Promise<void> => {
    try {
      if (isDummy) {
        // 더미 분석인 경우 바로 분석 요청
        await apiService.requestDummyAnalysis(productId);
        return;
      }

      try {
        // 기존 분석 상태 확인
        const statusData = await apiService.getAnalysisStatus(productId);
        
        if (statusData.status === "completed") {
          navigate(`/result/${productId}`);
        } else if (statusData.status === "failed") {
          setError(statusData.error || "분석에 실패했습니다.");
        } else {
          // 진행 중 상태
          setEstimatedTime(statusData.estimatedTime || null);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          // 분석 정보가 없는 경우 → 분석 요청
          await apiService.requestAnalysis({ productId });
        } else {
          throw err;
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId, navigate, isDummy]); // 필요한 의존성만 포함

  // 분석 시작 및 정리
  useEffect(() => {
    if (!productId) {
      navigate("/");
      return;
    }

    // 스토어 초기화
    reset();

    // 분석 시작
    checkAndStartAnalysis();

    return () => {
      // 컴포넌트 언마운트 시 스토어 정리
      reset();
    };
  }, [productId]); // 의존성을 최소화

  // 로딩 상태 처리
  if (loading) {
    return (
      <>
        <NavBar title="KOSA" />
        <div className="max-w-2xl mx-auto p-4 bg-gray-100 min-h-screen pt-16 pb-24 flex flex-col items-center justify-center">
          <div className="text-lg text-gray-700">분석을 준비 중입니다...</div>
        </div>
        <BottomBar />
      </>
    );
  }

  // 에러 화면 처리
  if (error) {
    return (
      <>
        <NavBar title="KOSA" />
        <div className="max-w-2xl mx-auto p-4 bg-gray-100 min-h-screen pt-16 pb-24 flex flex-col items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">오류가 발생했습니다</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              이전 페이지로 돌아가기
            </button>
          </div>
        </div>
        <BottomBar />
      </>
    );
  }

  // 정상 분석 진행 화면
  return (
    <>
      <NavBar title="실시간 리뷰 분석" />
      <div className="max-w-4xl mx-auto p-4 bg-gray-100 min-h-screen pt-16 pb-24">
        <div className="space-y-6">
          {/* 진행 상황 표시 */}
          <RealtimeProgressIndicator />
          
          {/* 실시간 차트와 감정 카드를 나란히 배치 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RealtimeAnalysisChart />
            <RealtimeEmotionCards />
          </div>
          
          {/* 연결 상태 정보 */}
          {!isConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="font-medium">서버 연결을 재시도하는 중...</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                네트워크 연결을 확인하고 잠시 후 다시 시도해주세요.
              </p>
            </div>
          )}
          
          {/* 예상 시간 표시 */}
          {estimatedTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-blue-800">
                예상 완료 시간: 약 {estimatedTime}초
              </p>
            </div>
          )}
        </div>
      </div>
      <BottomBar />
    </>
  );
}