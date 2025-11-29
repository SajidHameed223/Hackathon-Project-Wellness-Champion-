import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';


export default function VoiceChatbot() {
  useEffect(() => {
    // Inject the font style
    const style = document.createElement('style');
    style.textContent = jetbrainsStyle;
    document.head.appendChild(style);
  }, []);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
      // Send the transcript to backend
      if (transcript.trim()) {
        handleSendToBackend();
      }
    } else {
      setIsListening(true);
      setTranscript('');
      // Simulate recording
      setTimeout(() => {
        const sampleInput = "What's the weather like today?";
        setTranscript(sampleInput);
      }, 2000);
    }
  };

  const handleSendToBackend = () => {
    setIsProcessing(true);
    const userText = transcript;
    setTranscript('');
    
    // Add user input to history
    setConversationHistory([...conversationHistory, { type: 'user', text: userText }]);

    // Simulate backend API call and voice response
    setTimeout(() => {
      const botResponse = "That's an interesting question! Based on the current data, the weather is partly cloudy with a temperature around 72 degrees Fahrenheit.";
      setConversationHistory(prev => [...prev, { type: 'bot', text: botResponse }]);
      setIsPlayingResponse(true);
      setIsProcessing(false);
      
      // Simulate audio playing
      setTimeout(() => {
        setIsPlayingResponse(false);
      }, 3000);
    }, 1500);
  };

  const handleStopPlayback = () => {
    setIsPlayingResponse(false);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Container */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="jetbrains-mono text-3xl font-bold text-gray-900 mb-2">Voice Chatbot</h1>
            <p className="jetbrains-mono text-gray-600 text-sm">Speak naturally • Get instant responses</p>
          </div>

          {/* Conversation History */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 max-h-64 overflow-y-auto space-y-4">
            {conversationHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <Volume2 size={32} className="mx-auto opacity-30" />
                </div>
                <p className="text-gray-500 text-sm">No conversation yet</p>
                <p className="text-gray-400 text-xs mt-1">Press the microphone to start</p>
              </div>
            ) : (
              conversationHistory.map((item, index) => (
                <div key={index} className={`p-3 rounded-lg ${item.type === 'user' ? 'bg-blue-100 ml-4' : 'bg-indigo-100 mr-4'}`}>
                  <p className={`jetbrains-mono text-sm font-medium ${item.type === 'user' ? 'text-blue-900' : 'text-indigo-900'}`}>
                    {item.type === 'user' ? 'You' : 'Bot'}
                  </p>
                  <p className={`jetbrains-mono text-sm mt-1 ${item.type === 'user' ? 'text-blue-800' : 'text-indigo-800'}`}>
                    {item.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Current Input Display */}
          {transcript && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-8">
              <p className="jetbrains-mono text-gray-700 text-sm">
                <span className="font-semibold text-blue-600">Listening:</span> {transcript}
              </p>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <p className="text-gray-700 text-sm font-medium">Processing your request...</p>
              </div>
            </div>
          )}

          {/* Playing Response State */}
          {isPlayingResponse && (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-8 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-8 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-8 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    <div className="w-2 h-8 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                  </div>
                  <p className="text-gray-700 text-sm font-medium">Playing response...</p>
                </div>
                <button
                  onClick={handleStopPlayback}
                  className="p-2 hover:bg-green-200 rounded-lg transition-colors"
                >
                  <VolumeX size={18} className="text-green-600" />
                </button>
              </div>
            </div>
          )}

          {/* Microphone Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleMicClick}
              disabled={isProcessing}
              className={`p-6 rounded-full transition-all transform hover:scale-110 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/50'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
          </div>

          {/* Instructions */}
          <div className="text-center">
            <p className="text-gray-600 text-sm font-medium">
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : isPlayingResponse ? 'Playing response...' : 'Click to speak'}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              {isListening ? 'Release button to send' : 'Press and hold to record'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}