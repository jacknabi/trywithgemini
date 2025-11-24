import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GeminiService } from './services/geminiService';
import { ChatMessage, Role } from './types';
import MessageItem from './components/MessageItem';
import { SendIcon, ImageIcon, XIcon, LoaderIcon } from './components/Icons';

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const geminiServiceRef = useRef<GeminiService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Gemini Service once
  useEffect(() => {
    geminiServiceRef.current = new GeminiService();
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if ((!inputText.trim() && !selectedImage) || isLoading) return;

    const userMessageText = inputText.trim();
    const userImageFile = selectedImage;
    const userImagePreview = imagePreview; // Capture current state before clearing

    // Reset input state immediately for better UX
    setInputText('');
    removeImage();
    setIsLoading(true);

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userMessageText,
      image: userImagePreview || undefined
    };

    setMessages(prev => [...prev, userMsg]);

    // 2. Add Placeholder Model Message
    const modelMsgId = (Date.now() + 1).toString();
    const modelMsgPlaceholder: ChatMessage = {
      id: modelMsgId,
      role: Role.MODEL,
      text: '',
      isStreaming: true
    };

    setMessages(prev => [...prev, modelMsgPlaceholder]);

    try {
      if (!geminiServiceRef.current) {
        throw new Error("Gemini Service not initialized");
      }

      // 3. Stream Response
      let accumulatedText = "";
      
      await geminiServiceRef.current.sendMessageStream(
        userMessageText,
        userImageFile,
        (chunkText) => {
          accumulatedText += chunkText;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === modelMsgId 
                ? { ...msg, text: accumulatedText }
                : msg
            )
          );
        }
      );

      // 4. Finalize
      setMessages(prev => 
        prev.map(msg => 
          msg.id === modelMsgId 
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

    } catch (error) {
      console.error("Failed to send message", error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === modelMsgId 
            ? { ...msg, text: "Sorry, something went wrong. Please try again.", isStreaming: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputText, selectedImage, imagePreview, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-slate-50 shadow-2xl shadow-slate-200 overflow-hidden md:border-x md:border-slate-200">
      
      {/* Header */}
      <header className="flex-none bg-white border-b border-slate-100 p-4 z-10 sticky top-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
               G
             </div>
             <div>
               <h1 className="font-semibold text-slate-800 tracking-tight">Gemini Minimal</h1>
               <p className="text-xs text-slate-500 font-medium">Powered by Google Gemini 2.5 Flash</p>
             </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
             <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <span className="text-3xl">👋</span>
             </div>
             <p className="text-center max-w-xs">
               Welcome! Ask me anything, or upload an image to get started.
             </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 bg-white border-t border-slate-100">
        <div className="flex flex-col gap-2 relative">
          
          {/* Image Preview Thumbnail */}
          {imagePreview && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-xl shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
                <button 
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 shadow-md hover:bg-slate-700 transition-colors"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all shadow-sm">
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-xl transition-colors flex-shrink-0 ${selectedImage ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`}
              title="Upload Image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden" 
            />

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 resize-none py-3 max-h-32 min-h-[44px]"
              rows={1}
              style={{ height: 'auto', minHeight: '44px' }}
            />

            <button 
              onClick={() => handleSubmit()}
              disabled={isLoading || (!inputText.trim() && !selectedImage)}
              className={`p-3 rounded-xl transition-all duration-200 flex-shrink-0
                ${(isLoading || (!inputText.trim() && !selectedImage))
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95'
                }
              `}
            >
              {isLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <SendIcon className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-[10px] text-slate-400">Gemini may display inaccurate info, including about people, so double-check its responses.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
