import React, { useRef, useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Camera, StopCircle, RefreshCw, Zap, Frown, Smile, Meh, AlertCircle } from 'lucide-react';
import { SimulationResult, UnitStats } from '../types';

interface Props {
  unitA: UnitStats;
  unitB: UnitStats;
  result: SimulationResult;
}

interface SentimentResponse {
  emotion: 'Happy' | 'Sad' | 'Angry' | 'Surprised' | 'Neutral';
  explanation: string;
}

const SentimentScanner: React.FC<Props> = ({ unitA, unitB, result }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [sentiment, setSentiment] = useState<SentimentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
        setError(null);
      }
    } catch (err: any) {
      setError("Could not access camera: " + err.message);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const analyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !process.env.API_KEY) return;
    
    // Don't overlap requests
    if (loading) return;

    setLoading(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        You are observing the facial expression of a D&D player reacting to a battle simulation result.
        
        Battle Context:
        - Winner: Side ${result.winner} (${result.winner === 'A' ? unitA.name : result.winner === 'B' ? unitB.name : 'Draw'})
        - Duration: ${result.duration} rounds
        
        Analyze the person's face in the image.
        Classify their emotion into exactly one of these categories: Happy, Sad, Angry, Surprised, Neutral.
        
        Provide a creative, roleplay-style explanation (max 2 sentences) of why the commander (the user) feels this way about the battle outcome. 
        Example: "The commander looks joyous, celebrating the crushing victory of the ${unitA.name}s."
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              emotion: { type: "STRING", enum: ["Happy", "Sad", "Angry", "Surprised", "Neutral"] },
              explanation: { type: "STRING" }
            }
          }
        }
      });

      if (response.text) {
        const json = JSON.parse(response.text) as SentimentResponse;
        setSentiment(json);
      }
    } catch (err: any) {
      console.error("Analysis failed", err);
      // Don't set global error to avoid blocking UI, just log it
    } finally {
      setLoading(false);
    }
  };

  // Set up polling when active
  useEffect(() => {
    if (isActive) {
      // Analyze every 4 seconds
      intervalRef.current = window.setInterval(analyzeFrame, 4000);
      // Run immediately once
      analyzeFrame();
    } else {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isActive, result, unitA, unitB]); // Re-run setup if these change

  const getEmotionIcon = (emotion?: string) => {
    switch(emotion) {
      case 'Happy': return <Smile className="text-green-400" size={32} />;
      case 'Sad': return <Frown className="text-blue-400" size={32} />;
      case 'Angry': return <Zap className="text-red-400" size={32} />;
      case 'Surprised': return <AlertCircle className="text-yellow-400" size={32} />;
      default: return <Meh className="text-slate-400" size={32} />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mt-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-pink-400">
          <Camera size={20} />
          Commander Sentiment Scanner
        </h3>
        <button
          onClick={isActive ? stopCamera : startCamera}
          className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
            isActive 
              ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70 border border-red-800' 
              : 'bg-pink-600 hover:bg-pink-700 text-white'
          }`}
        >
          {isActive ? <><StopCircle size={16} /> Stop Cam</> : <><Camera size={16} /> Activate Cam</>}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 text-red-300 p-3 rounded mb-4 text-sm border border-red-900/50">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Camera Feed */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
          {!isActive && (
            <div className="text-slate-600 text-center p-4">
              <Camera size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Camera inactive</p>
            </div>
          )}
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover ${isActive ? 'block' : 'hidden'}`}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {isActive && loading && (
            <div className="absolute top-2 right-2">
               <div className="bg-black/50 backdrop-blur rounded-full p-1">
                 <RefreshCw className="animate-spin text-white" size={16} />
               </div>
            </div>
          )}
        </div>

        {/* Sentiment Result */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 flex flex-col items-center justify-center text-center">
          {isActive && sentiment ? (
            <div className="animate-in fade-in duration-500">
               <div className="mb-3 flex justify-center">
                 {getEmotionIcon(sentiment.emotion)}
               </div>
               <h4 className="text-xl font-bold text-white mb-2">{sentiment.emotion}</h4>
               <p className="text-slate-300 text-sm leading-relaxed">
                 "{sentiment.explanation}"
               </p>
            </div>
          ) : isActive ? (
             <div className="text-slate-500 text-sm animate-pulse">
               Scanning commander's expression...
             </div>
          ) : (
            <div className="text-slate-500 text-sm italic">
              Activate the camera to analyze your reaction to the battle outcome.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SentimentScanner;