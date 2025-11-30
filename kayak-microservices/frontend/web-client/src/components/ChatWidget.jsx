import React, { useState, useEffect, useRef } from 'react';
import { sendChatQuery } from '../services/api';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hi! I am your AI Concierge. How can I help you plan your trip?' }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        try {
            const response = await sendChatQuery(input);
            const botMsg = { sender: 'bot', text: response.data.response };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I encountered an error.' }]);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-orange-500 text-white p-4 rounded-full shadow-lg hover:bg-orange-600 transition"
                >
                    💬 AI Concierge
                </button>
            )}

            {isOpen && (
                <div className="bg-white w-80 h-96 rounded-lg shadow-xl flex flex-col border border-gray-200">
                    <div className="bg-orange-500 text-white p-3 rounded-t-lg flex justify-between items-center">
                        <h3 className="font-bold">Kayak Concierge</h3>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 border-t flex">
                        <input
                            type="text"
                            className="flex-1 border rounded-l px-2 py-1 focus:outline-none"
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            onClick={handleSend}
                            className="bg-orange-500 text-white px-3 py-1 rounded-r hover:bg-orange-600"
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
