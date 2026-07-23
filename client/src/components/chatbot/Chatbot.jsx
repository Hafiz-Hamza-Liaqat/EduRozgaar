import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { chatbotApi } from '../../services/listingsService';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export function Chatbot({ onClose, className = '' }) {
  const { isAuthenticated } = useAuth();
  const { lang } = useLanguage();
  const { t } = useTranslation('chatbot');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    chatbotApi.history().then(({ data }) => setMessages(data?.data || [])).catch(() => {}).finally(() => setHistoryLoaded(true));
  }, [isAuthenticated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', message: msg }]);
    setLoading(true);
    try {
      const { data } = await chatbotApi.query(msg, { language: lang });
      setMessages((prev) => [...prev, { role: 'assistant', message: data?.reply || t('noResponse') }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', message: e.response?.data?.error || t('error') }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('loginRequired')}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex flex-col ${className}`}>
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">{t('title')}</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" aria-label={t('close')}>
            ×
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[320px] p-3 space-y-3">
        {!historyLoaded && <p className="text-sm text-gray-500">{t('loading')}</p>}
        {historyLoaded && messages.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('greeting')}</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
              {m.message}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 text-sm">{t('typing')}</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={t('placeholder')}
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
        />
        <button type="button" onClick={handleSend} disabled={loading} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover btn-theme disabled:opacity-50">
          {t('send')}
        </button>
      </div>
    </div>
  );
}
