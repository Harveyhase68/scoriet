<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{__('git-callbackbladephp6')}}{{ ucfirst($provider) }}...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #1a1a2e;
            color: #fff;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid #333;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .error {
            color: #ef4444;
            margin-top: 1rem;
        }
        .success {
            color: #22c55e;
        }
    </style>
</head>
<body>
    <div class="container">
        @if($error)
            <div class="error">
                <h2>{{__('git-callbackbladephp47')}}</h2>
                <p>{{ $errorDescription ?? $error }}</p>
                <p>{{__('git-callbackbladephp49')}}</p>
            </div>
        @else
            <div class="spinner"></div>
            <p>{{__('git-callbackbladephp53')}}{{ ucfirst($provider) }}...</p>
        @endif
    </div>

    <script>
        (function() {
            const data = {
                provider: @json($provider),
                code: @json($code),
                state: @json($state),
                error: @json($error),
                errorDescription: @json($errorDescription)
            };

            // Send message to parent window (opener)
            let messageSent = false;
            if (window.opener && !window.opener.closed) {
                try {
                    window.opener.postMessage({
                        type: 'git-oauth-callback',
                        ...data
                    }, window.location.origin);
                    messageSent = true;
                } catch (e) {
                    console.error('Failed to send OAuth message to parent window:', e);
                }
            }

            // If we couldn't send the message, show an error
            if (!messageSent && !data.error) {
                document.querySelector('.container').innerHTML = `
                    <div class="error">
                        <h2>{{__('git-callbackbladephp85')}}</h2>
                        <p>{{__('git-callbackbladephp86')}}</p>
                        <p>{{__('git-callbackbladephp87')}}</p>
                    </div>
                `;
                return; // Don't auto-close
            }

            // Close this window after a short delay
            setTimeout(function() {
                window.close();
            }, data.error ? 2000 : 500);
        })();
    </script>
</body>
</html>
