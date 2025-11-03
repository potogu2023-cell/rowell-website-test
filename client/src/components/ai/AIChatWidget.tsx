import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Minimize2, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import ConsentDialog from './ConsentDialog';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageId?: number;
  source?: 'cache' | 'llm';
  feedback?: 'like' | 'dislike' | 'none';
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string>();
  const [consentMode, setConsentMode] = useState<'standard' | 'privacy' | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // tRPC mutations and queries
  const greetingQuery = trpc.ai.greeting.useQuery(undefined, {
    enabled: isOpen && messages.length === 0,
  });

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        source: data.source,
      }]);
      setSessionId(data.sessionId);
      
      // Scroll to bottom
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    },
    onError: (error) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again or contact Oscar directly at oscar@rowellhplc.com`,
      }]);
    },
  });

  const feedbackMutation = trpc.ai.feedback.useMutation();

  // Check consent on mount
  useEffect(() => {
    const storedConsent = localStorage.getItem('ai_consent');
    if (storedConsent) {
      setConsentMode(storedConsent as 'standard' | 'privacy');
    }
  }, []);

  // Show consent dialog if needed
  useEffect(() => {
    if (isOpen && !consentMode && !showConsent) {
      setShowConsent(true);
    }
  }, [isOpen, consentMode, showConsent]);

  // Load greeting message
  useEffect(() => {
    if (greetingQuery.data && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: greetingQuery.data.message,
      }]);
    }
  }, [greetingQuery.data, messages.length]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || chatMutation.isLoading) return;

    // Add user message to UI
    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Send to backend
    chatMutation.mutate({
      message: inputMessage.trim(),
      sessionId,
    });

    // Clear input
    setInputMessage('');
    
    // Scroll to bottom
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFeedback = (messageIndex: number, feedback: 'like' | 'dislike') => {
    const message = messages[messageIndex];
    if (message.messageId) {
      feedbackMutation.mutate({
        messageId: message.messageId,
        feedback,
      });
    }
    
    // Update UI
    setMessages(prev => prev.map((msg, idx) => 
      idx === messageIndex ? { ...msg, feedback } : msg
    ));
  };

  const handleConsent = (mode: 'standard' | 'privacy') => {
    setConsentMode(mode);
    localStorage.setItem('ai_consent', mode);
    setShowConsent(false);
  };

  const handleSkipConsent = () => {
    setConsentMode('privacy'); // Default to privacy mode if skipped
    localStorage.setItem('ai_consent', 'privacy');
    setShowConsent(false);
  };

  // Floating button (collapsed state)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 
                   rounded-full shadow-lg flex items-center justify-center text-white 
                   transition-all duration-200 hover:scale-110 z-50"
        aria-label="Open AI Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  // Chat window (expanded state)
  return (
    <>
      {/* Consent Dialog */}
      {showConsent && (
        <ConsentDialog 
          onConsent={handleConsent}
          onSkip={handleSkipConsent}
        />
      )}

      {/* Chat Window */}
      <Card 
        className={`fixed bottom-6 right-6 w-96 bg-white shadow-2xl z-50 flex flex-col
                    transition-all duration-200 ${isMinimized ? 'h-14' : 'h-[600px]'}`}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <h3 className="font-semibold">AI Product Advisor</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hover:bg-blue-700 p-1 rounded"
              aria-label={isMinimized ? "Maximize" : "Minimize"}
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        {!isMinimized && (
          <>
            <ScrollArea 
              className="flex-1 p-4 space-y-4"
              ref={scrollAreaRef}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {/* Message Content */}
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>

                    {/* Source indicator */}
                    {message.source && (
                      <div className="text-xs mt-1 opacity-70">
                        {message.source === 'cache' ? '⚡ Instant' : '🤖 AI'}
                      </div>
                    )}

                    {/* Feedback buttons for assistant messages */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleFeedback(index, 'like')}
                          className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                            message.feedback === 'like' ? 'text-green-600' : 'text-gray-500'
                          }`}
                          disabled={feedbackMutation.isLoading}
                          aria-label="Like"
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleFeedback(index, 'dislike')}
                          className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                            message.feedback === 'dislike' ? 'text-red-600' : 'text-gray-500'
                          }`}
                          disabled={feedbackMutation.isLoading}
                          aria-label="Dislike"
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {chatMutation.isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about chromatography products..."
                  className="flex-1 min-h-[60px] max-h-[120px] resize-none"
                  disabled={chatMutation.isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || chatMutation.isLoading}
                  className="self-end"
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Footer disclaimer */}
              <div className="text-xs text-gray-500 text-center mt-2">
                📌 Suggestions are for reference only
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
