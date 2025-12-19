<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connecting to <?php echo e(ucfirst($provider)); ?>...</title>
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
        <?php if($error): ?>
            <div class="error">
                <h2>Connection Failed</h2>
                <p><?php echo e($errorDescription ?? $error); ?></p>
                <p>This window will close automatically...</p>
            </div>
        <?php else: ?>
            <div class="spinner"></div>
            <p>Connecting to <?php echo e(ucfirst($provider)); ?>...</p>
        <?php endif; ?>
    </div>

    <script>
        (function() {
            const data = {
                provider: <?php echo json_encode($provider, 15, 512) ?>,
                code: <?php echo json_encode($code, 15, 512) ?>,
                state: <?php echo json_encode($state, 15, 512) ?>,
                error: <?php echo json_encode($error, 15, 512) ?>,
                errorDescription: <?php echo json_encode($errorDescription, 15, 512) ?>
            };

            // Send message to parent window (opener)
            if (window.opener) {
                window.opener.postMessage({
                    type: 'git-oauth-callback',
                    ...data
                }, window.location.origin);
            }

            // Close this window after a short delay
            setTimeout(function() {
                window.close();
            }, data.error ? 2000 : 500);
        })();
    </script>
</body>
</html>
<?php /**PATH C:\wamp\www\scoriet\resources\views/auth/git-callback.blade.php ENDPATH**/ ?>