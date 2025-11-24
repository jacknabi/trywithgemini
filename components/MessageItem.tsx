import React from 'react';
import { ChatMessage, Role } from '../types';
import { SparklesIcon } from './Icons';

interface MessageItemProps {
  message: ChatMessage;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar / Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-500 to-indigo-600'}`}>
           {isUser ? (
             <div className="w-full h-full rounded-full bg-slate-200 overflow-hidden">
                <svg className="w-full h-full text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
             </div>
           ) : (
             <SparklesIcon className="w-4 h-4 text-white" />
           )}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className={`px-4 py-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words
              ${isUser 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
              }
            `}
          >
            {/* Attached Image Preview in User Message */}
            {message.image && (
              <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                <img 
                  src={message.image} 
                  alt="User attachment" 
                  className="max-w-full max-h-64 object-cover"
                />
              </div>
            )}
            
            {message.text}
            
            {/* Blinking cursor for streaming model response */}
            {message.role === Role.MODEL && message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 align-middle bg-slate-400 animate-pulse"></span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MessageItem;
