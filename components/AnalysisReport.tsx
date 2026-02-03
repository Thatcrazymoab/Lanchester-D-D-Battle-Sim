import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { UnitStats, SimulationResult, LawType } from '../types';
import { Bot, RefreshCw, AlertCircle, Send, User, Sparkles } from 'lucide-react';

interface Props {
  unitA: UnitStats;
  unitB: UnitStats;
  result: SimulationResult;
  law: LawType;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AnalysisReport: React.FC<Props> = ({ unitA, unitB, result, law }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to hold the chat instance so it persists between renders
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset chat when simulation results change significantly
  useEffect(() => {
    setMessages([]);
    chatRef.current = null;
    setError(null);
  }, [unitA, unitB, result, law]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const startAnalysis = async () => {
    if (!process.env.API_KEY) {
      setError("API Key not found. Cannot generate AI report.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `
        You are a fantasy combat tactician and mathematician helping a D&D player understand Lanchester's laws.
        
        Current Battle Scenario:
        - Law Used: Lanchester's ${law} Law.
        - Side A: ${unitA.name} (Count: ${unitA.count}, HP: ${unitA.hp}, AC: ${unitA.ac}, Avg Dmg: ${unitA.damageDiceAvg + unitA.damageMod}).
        - Side B: ${unitB.name} (Count: ${unitB.count}, HP: ${unitB.hp}, AC: ${unitB.ac}, Avg Dmg: ${unitB.damageDiceAvg + unitB.damageMod}).
        
        Simulation Outcome:
        - Winner: Side ${result.winner} (${result.winner === 'A' ? unitA.name : result.winner === 'B' ? unitB.name : 'Draw'}).
        - Duration: ${result.duration} rounds.
        - Lanchester Coefficients: 
          * Alpha (Effectiveness of B vs A): ${result.alpha.toFixed(4)}
          * Beta (Effectiveness of A vs B): ${result.beta.toFixed(4)}
        
        Your goal is to explain *why* the outcome happened based on the math (Action Economy, Focus Fire vs Saturation) and D&D mechanics. Keep initial responses concise.
      `;

      // Create a new chat session
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemInstruction,
        },
      });
      
      chatRef.current = chat;

      const initialPrompt = `Analyze this battle result. Explain if the "Action Economy" favored the horde or the elites, and why.`;
      
      // We don't add the initial prompt to the UI "messages" to keep it clean, 
      // or we can add it as a user message. Let's add the bot response directly.
      const response: GenerateContentResponse = await chat.sendMessage({ message: initialPrompt });
      
      if (response.text) {
        setMessages([
          { role: 'model', text: response.text }
        ]);
      }

    } catch (err: any) {
      console.error(err);
      setError("Failed to generate analysis. " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatRef.current) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response: GenerateContentResponse = await chatRef.current.sendMessage({ message: userMsg });
      if (response.text) {
        setMessages(prev => [...prev, { role: 'model', text: response.text }]);
      }
    } catch (err: any) {
      setError("Failed to send message: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl mt-6 shadow-lg flex flex-col overflow-hidden h-[500px]">
      {/* Header */}
      <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex items-center justify-between shrink-0">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-purple-400">
          <Bot size={20} />
          AI Tactical Analysis
        </h3>
        {messages.length > 0 && (
          <button
            onClick={startAnalysis}
            className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            title="Restart Analysis"
          >
            <RefreshCw size={12} /> Restart
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/30" ref={scrollRef}>
        {messages.length === 0 && !loading && !error && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 p-8 text-center">
            <Sparkles size={48} className="text-slate-700 mb-2" />
            <p>Ready to analyze tactical data.</p>
            <button
              onClick={startAnalysis}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-full transition-all shadow-lg hover:shadow-purple-500/25 flex items-center gap-2"
            >
              <Bot size={18} />
              Generate Initial Report
            </button>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-700 flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} className="text-purple-300" />
              </div>
            )}
            
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none prose prose-invert prose-sm'
            }`}>
               {msg.text.split('\n').map((line, i) => (
                 <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
               ))}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-700 flex items-center justify-center shrink-0 mt-1">
                <User size={16} className="text-indigo-300" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
             <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-700 flex items-center justify-center shrink-0">
                <RefreshCw size={16} className="text-purple-300 animate-spin" />
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-700 flex items-center gap-1">
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></span>
              </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 text-red-300 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-900/50">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* Input Area */}
      {messages.length > 0 && (
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-800/50 border-t border-slate-700 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up question..."
            disabled={loading}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg px-4 py-2 transition-colors flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </form>
      )}
    </div>
  );
};

export default AnalysisReport;