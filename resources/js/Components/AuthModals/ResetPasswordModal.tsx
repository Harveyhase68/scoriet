import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';

interface ResetPasswordModalProps {
  visible: boolean;
  onHide: () => void;
  token: string;
  email: string;
  onSwitchToLogin: () => void;
}

export default function ResetPasswordModal({
  visible,
  onHide,
  token,
  email,
  onSwitchToLogin
}: ResetPasswordModalProps) {
  const { data, setData, post, processing, errors } = useForm({
    token: token,
    email: email,
    password: '',
    password_confirmation: '',
  });

  const [success, setSuccess] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetError, setResetError] = useState<string>('');
  const [tokenValidated, setTokenValidated] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);

  // Token validation when loading modal
  React.useEffect(() => {
    if (visible && token && email) {
      setValidatingToken(true);
      setResetError('');
      
      fetch('/api/auth/validate-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          token: token,
          email: email
        })
      })
      .then(response => {
        if (response.ok) {
          setTokenValidated(true);
          setResetError('');
        } else {
          setTokenValidated(false);
          return response.json().then(data => {
            setResetError(data.message || 'This reset link is invalid or expired.');
          });
        }
      })
      .catch(() => {
        setTokenValidated(false);
        setResetError('Error validating reset link.');
      })
      .finally(() => {
        setValidatingToken(false);
      });
    }
  }, [visible, token, email]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setResetError('');
    
    post('/reset-password', {
      onSuccess: () => {
        setSuccess(true);
        setResetError('');
        // Switch to login after 2 seconds
        setTimeout(() => {
          setSuccess(false);
          onSwitchToLogin();
        }, 2000);
      },
      onError: (errors) => {
        // Show error message in UI
        if (errors.email) {
          setResetError(errors.email);
        } else if (errors.password) {
          setResetError('Password error: ' + errors.password);
        } else if (errors.token) {
          setResetError('Token error: ' + errors.token);
        } else {
          setResetError('An unknown error occurred. Please try again.');
        }
      }
    });
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Reset Password
            </h2>
            <button
              onClick={onHide}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none focus:outline-none"
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Error Message */}
          {resetError && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 dark:text-red-300 text-sm">{resetError}</p>
              </div>
            </div>
          )}

          {validatingToken ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg className="animate-spin w-8 h-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Reset link is being validated...
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                One moment please...
              </p>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Password reset successfully!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You will be automatically redirected to login...
              </p>
            </div>
          ) : !tokenValidated && resetError ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Reset link invalid
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {resetError}
              </p>
              <div className="space-y-3">
                <button
                  onClick={onSwitchToLogin}
                  className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                           text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                           focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  To Login
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Request a new reset link if you want to reset your password.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {/* Email Field (readonly) */}
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-Mail
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={data.email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white 
                           focus:ring-blue-500 focus:border-blue-500 cursor-not-allowed"
                />
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  id="reset-password"
                  type="password"
                  placeholder="Enter new password"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                           focus:ring-blue-500 focus:border-blue-500
                           placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="reset-password-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  id="reset-password-confirm"
                  type="password"
                  placeholder="Repeat password"
                  value={data.password_confirmation}
                  onChange={(e) => setData('password_confirmation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                           focus:ring-blue-500 focus:border-blue-500
                           placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
                {errors.password_confirmation && (
                  <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                         text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-200"
              >
                {processing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>

              {/* Fallback Button - nach Submit anzeigen */}
              {submitted && !processing && !success && (
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="w-full mt-3 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium 
                           text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                           transition-colors duration-200"
                >
                  Continue to Login
                </button>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {!success && !validatingToken && tokenValidated && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg text-center">
            {resetError ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The reset link is invalid or expired.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <button
                    onClick={onSwitchToLogin}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                  >
                    To Login
                  </button>
                  {' '}or request a{' '}
                  <button
                    onClick={() => {
                      // Here you could switch to Forgot-Password-Modal
                      onSwitchToLogin(); // First to login, from there to Forgot Password
                    }}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                  >
                    new reset link
                  </button>
                  {' '}.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Back to{' '}
                <button
                  onClick={onSwitchToLogin}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                >
                  Login
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}