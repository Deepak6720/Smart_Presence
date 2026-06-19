import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import {
  Brain, TrendingUp, TrendingDown, Minus,
  RefreshCw, AlertTriangle, CheckCircle,
  Clock, ChevronDown, ChevronUp, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const RISK_CONFIG = {
  safe: {
    label: 'Safe',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    icon: CheckCircle,
    iconColor: 'text-green-600',
    bar: 'bg-green-500'
  },
  low: {
    label: 'Low Risk',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    icon: TrendingUp,
    iconColor: 'text-blue-600',
    bar: 'bg-blue-500'
  },
  medium: {
    label: 'Medium Risk',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
    icon: Minus,
    iconColor: 'text-yellow-600',
    bar: 'bg-yellow-500'
  },
  high: {
    label: 'High Risk',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    icon: TrendingDown,
    iconColor: 'text-orange-600',
    bar: 'bg-orange-500'
  },
  critical: {
    label: 'CRITICAL',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    bar: 'bg-red-500'
  }
};

const TREND_CONFIG = {
  improving: { icon: TrendingUp, color: 'text-green-600', label: 'Improving ↑' },
  stable: { icon: Minus, color: 'text-blue-600', label: 'Stable →' },
  declining: { icon: TrendingDown, color: 'text-orange-600', label: 'Declining ↓' },
  rapidly_declining: { icon: TrendingDown, color: 'text-red-600', label: 'Rapidly Declining ↓↓' }
};

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff} minute${diff > 1 ? 's' : ''} ago`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''} ago`;
};

const SubjectPredictionCard = ({ subjectPrediction }) => {
  const [expanded, setExpanded] = useState(false);
  const config = RISK_CONFIG[subjectPrediction.riskLevel] || RISK_CONFIG.medium;
  const TrendIcon = TREND_CONFIG[subjectPrediction.trend]?.icon || Minus;
  const trendColor = TREND_CONFIG[subjectPrediction.trend]?.color || 'text-gray-500';
  const trendLabel = TREND_CONFIG[subjectPrediction.trend]?.label || 'Unknown';
  const StatusIcon = config.icon;

  return (
    <div className={`rounded-xl border ${config.border} overflow-hidden`}>

      <div className={`px-5 py-4 ${config.bg}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md">
                {subjectPrediction.subjectCode}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
                <StatusIcon className="w-3 h-3 inline mr-1" />
                {config.label}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">{subjectPrediction.subjectName}</h3>
          </div>

          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span>{trendLabel}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 bg-white">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Current</p>
            <p className={`text-2xl font-bold ${
              subjectPrediction.currentPercentage >= 75 ? 'text-green-600' : 'text-red-600'
            }`}>
              {subjectPrediction.currentPercentage}%
            </p>
          </div>
          <div className="text-center bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Predicted (14 days)</p>
            <p className={`text-2xl font-bold ${
              subjectPrediction.predictedPercentage14Days >= 75 ? 'text-green-600' : 'text-red-600'
            }`}>
              {subjectPrediction.predictedPercentage14Days}%
            </p>
          </div>
        </div>

        <div className="mb-3">
          <div className="relative w-full bg-gray-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${config.bar} opacity-40`}
              style={{ width: `${Math.min(subjectPrediction.currentPercentage, 100)}%` }}
            />
            <div
              className={`absolute top-0 left-0 h-3 rounded-full ${config.bar}`}
              style={{ width: `${Math.min(subjectPrediction.predictedPercentage14Days, 100)}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gray-500"
              style={{ left: '75%' }}
            >
              <span className="absolute -top-5 -translate-x-1/2 text-xs text-gray-500 font-medium whitespace-nowrap">
                75%
              </span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {subjectPrediction.maxAbsencesAllowed !== undefined && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              subjectPrediction.maxAbsencesAllowed <= 1
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {subjectPrediction.maxAbsencesAllowed <= 0
                ? '⚠️ No absences left'
                : `Max ${subjectPrediction.maxAbsencesAllowed} more absence${subjectPrediction.maxAbsencesAllowed > 1 ? 's' : ''} allowed`
              }
            </span>
          )}

          {subjectPrediction.estimatedDaysToBreach && (
            <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">
              <Clock className="w-3 h-3 inline mr-1" />
              Breach in ~{subjectPrediction.estimatedDaysToBreach} days at current rate
            </span>
          )}

          {subjectPrediction.patternObserved && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">
              🔍 {subjectPrediction.patternObserved}
            </span>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Hide AI reasoning' : 'Show AI reasoning'}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-1">🤖 AI Analysis</p>
              <p className="text-sm text-gray-700">{subjectPrediction.reasoning}</p>
            </div>
            <div className={`rounded-lg p-3 border ${config.border} ${config.bg}`}>
              <p className="text-xs font-semibold text-gray-600 mb-1">📌 Recommendation</p>
              <p className="text-sm text-gray-700">{subjectPrediction.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RiskPrediction = () => {
  const [state, setState] = useState('idle');
  const [predictionData, setPredictionData] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [displayMessage, setDisplayMessage] = useState('');

  useEffect(() => {
    fetchPrediction(false);
  }, []);

  const fetchPrediction = async (forceRefresh = false) => {
    setState('loading');

    try {
      const url = `/api/ai/my-risk${forceRefresh ? '?refresh=true' : ''}`;
      const res = await axiosInstance.get(url);

      if (res.data.prediction === null) {
        setState(res.data.message || 'insufficient_data');
        setDisplayMessage(res.data.displayMessage || '');
        return;
      }

      setPredictionData(res.data.prediction);
      setGeneratedAt(res.data.generatedAt);
      setFromCache(res.data.fromCache);
      setState('success');

      if (forceRefresh) {
        toast.success('AI prediction refreshed!');
      }

    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to get AI prediction';
      setErrorMsg(msg);
      setState('error');
      toast.error(msg);
    }
  };

  const overallConfig = predictionData
    ? (RISK_CONFIG[predictionData.overallRisk] || RISK_CONFIG.medium)
    : null;

  if (state === 'loading') {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Risk Prediction</h2>
          <p className="text-sm text-gray-500 mt-0.5">Powered by Google Gemini</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-purple-600 animate-pulse" />
          </div>
          <p className="font-semibold text-gray-800 mb-2">Gemini AI is analyzing your attendance...</p>
          <p className="text-sm text-gray-500 mb-6">
            Reading your 30-day history, detecting patterns, predicting your trajectory
          </p>
          <div className="flex justify-center gap-1.5">
            {['Fetching records', 'Detecting trends', 'Running prediction', 'Generating insights'].map(
              (step, i) => (
                <span key={step} className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium"
                  style={{ animationDelay: `${i * 0.2}s` }}>
                  {step}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  if (state === 'no_subjects') {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Risk Prediction</h2>
          <p className="text-sm text-gray-500 mt-0.5">Powered by Google Gemini</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-2">No subjects yet</p>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            {displayMessage || 'Ask your admin to enroll you in subjects before AI predictions are available.'}
          </p>
        </div>
      </div>
    );
  }

  if (state === 'insufficient_data') {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Risk Prediction</h2>
          <p className="text-sm text-gray-500 mt-0.5">Powered by Google Gemini</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Brain className="w-6 h-6 text-blue-500" />
          </div>
          <p className="font-medium text-gray-700 mb-2">Not enough data yet</p>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            {displayMessage || 'Attend a few more classes and come back for your AI risk prediction.'}
          </p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Risk Prediction</h2>
          <p className="text-sm text-gray-500 mt-0.5">Powered by Google Gemini</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="font-medium text-red-700 mb-4">{errorMsg}</p>
          <button
            onClick={() => fetchPrediction(false)}
            className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (state === 'idle' || !predictionData) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const OverallIcon = overallConfig.icon;

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Risk Prediction</h2>
          <p className="text-sm text-gray-500 mt-0.5">Powered by Google Gemini 1.5 Flash</p>
        </div>
        <button
          onClick={() => fetchPrediction(true)}
          className="flex items-center gap-2 text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${
        fromCache ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${fromCache ? 'text-blue-500' : 'text-green-500'}`} />
          <span className={`text-xs font-medium ${fromCache ? 'text-blue-700' : 'text-green-700'}`}>
            {fromCache
              ? `Prediction from cache — generated ${timeAgo(generatedAt)}`
              : `Fresh prediction generated just now`
            }
          </span>
        </div>
        <span className="text-xs text-gray-400">
          Auto-refreshes every 24h
        </span>
      </div>

      <div className={`rounded-xl p-6 border-2 ${overallConfig.border} ${overallConfig.bg}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Overall Risk Assessment</p>
            <div className="flex items-center gap-3">
              <span className={`text-lg font-bold px-4 py-1.5 rounded-full ${overallConfig.badge}`}>
                <OverallIcon className="w-5 h-5 inline mr-2" />
                {overallConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-3 max-w-lg">
              {predictionData.overallSummary}
            </p>
          </div>
          <div className="hidden sm:block">
            <OverallIcon className={`w-14 h-14 ${overallConfig.iconColor} opacity-20`} />
          </div>
        </div>

        {predictionData.immediateAction && (
          <div className="mt-4 bg-white/60 border border-white rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-gray-600 mb-0.5">
              ⚡ Most Important Action Right Now
            </p>
            <p className="text-sm font-medium text-gray-800">
              {predictionData.immediateAction}
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-gray-800 mb-3">
          Subject-wise Predictions
          <span className="text-xs text-gray-400 font-normal ml-2">
            (showing predicted % after 14 more days)
          </span>
        </h3>
        <div className="space-y-4">
          {predictionData.subjectPredictions?.map((sp, index) => (
            <SubjectPredictionCard key={index} subjectPrediction={sp} />
          ))}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-500">
          <Brain className="w-3.5 h-3.5 inline mr-1" />
          <strong>AI Prediction Disclaimer:</strong> These predictions are generated by Google Gemini AI
          based on your attendance patterns. They are estimates, not guarantees.
          Actual outcomes depend on future attendance. Always verify with your teacher or admin.
        </p>
      </div>
    </div>
  );
};

export default RiskPrediction;