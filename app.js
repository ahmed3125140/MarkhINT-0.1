// MarkhINT - Simple working version
// This loads all dependencies from CDN and creates the app

const { useState, useEffect, useCallback, useMemo, useRef } = React;
const { createRoot } = ReactDOM;

// Simple UUID generation
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const AppMode = {
  CHAT: 'chat',
  IMAGE_GEN: 'image',
  VIDEO_GEN: 'video',
  LIVE: 'live'
};

const App = () => {
  const [mode, setMode] = useState(AppMode.CHAT);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const savedUser = localStorage.getItem('markhint_user');
    if (savedUser) {
      setUserName(savedUser);
      setIsAuthorized(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem('markhint_user', userName);
      setIsAuthorized(true);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: generateUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate API response
    setTimeout(() => {
      const responses = {
        'hello': 'Greetings, Operator. MarkhINT systems online and ready for deployment.',
        'help': 'MarkhINT provides intelligence gathering, analysis, and tactical support. Commands: chat, image, video, live.',
        'default': `Strategic acknowledgment received. Your input has been processed and catalogued in the MarkhINT intelligence database.`
      };

      const keyword = input.toLowerCase();
      const responseText = responses[keyword] || responses['default'];

      const aiMessage = {
        id: generateUUID(),
        role: 'model',
        content: responseText,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-900 bg-opacity-50 backdrop-blur-md border border-emerald-500 border-opacity-20 rounded-lg p-8">
            <h1 className="text-4xl font-black text-center mb-2 text-white">
              MARK<span className="text-emerald-500">HINT</span>
            </h1>
            <p className="text-emerald-400 text-center text-sm tracking-widest mb-8">TACTICAL ASSET v0.1</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-emerald-400 text-sm mb-2">OPERATOR DESIGNATION</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your codename..."
                  className="w-full bg-gray-950 border border-emerald-500 border-opacity-20 rounded px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                AUTHORIZE ACCESS
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-black flex flex-col">
      {/* Header */}
      <div className="border-b border-emerald-500 border-opacity-10 bg-gray-950 bg-opacity-50 backdrop-blur-md p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">
              MARK<span className="text-emerald-500">INT</span>
            </h1>
            <p className="text-emerald-400 text-xs tracking-widest">Operator: {userName}</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('markhint_user');
              setIsAuthorized(false);
              setUserName('');
            }}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-emerald-400 text-lg mb-2">MARKHINT INITIALIZATION COMPLETE</p>
              <p className="text-gray-400 text-sm">Begin tactical operations...</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-emerald-500 border-opacity-20'
                }`}
              >
                <p className="break-words">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-100 border border-emerald-500 border-opacity-20 px-4 py-2 rounded-lg">
              <p className="text-sm">Processing tactical data...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-emerald-500 border-opacity-10 bg-gray-950 bg-opacity-50 backdrop-blur-md p-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter tactical intelligence..."
            className="flex-1 bg-gray-900 border border-emerald-500 border-opacity-20 rounded px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white font-bold px-6 py-2 rounded transition-colors"
          >
            {isLoading ? 'Processing...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Mount the app
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
