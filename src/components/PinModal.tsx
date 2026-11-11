import React, { useState, useEffect, useRef } from 'react';
import { Lock, AlertCircle, Loader2, X, Eye, EyeOff } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  actionTitle: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  actionTitle,
  onSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMessage(null);
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMessage('Please enter the security PIN.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Validate PIN securely on backend API
      const response = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsLoading(false);
        onSuccess();
      } else {
        setIsLoading(false);
        setErrorMessage(data.message || 'Incorrect PIN. Please try again.');
        inputRef.current?.select();
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Server connection error. Please verify dev server is running.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
            <Lock className="w-5 h-5 text-stone-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 leading-tight">
              PIN Required
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Authorization needed to {actionTitle.toLowerCase()}.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Enter 6-Digit Admin PIN
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={12}
                value={pin}
                onChange={e => {
                  setPin(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="••••••"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-center text-lg font-mono tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400 transition-all"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !pin.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-stone-50 bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Verify & Proceed</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
