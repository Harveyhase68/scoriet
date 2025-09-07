<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scoriet - Maintenance Mode</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .container {
            text-align: center;
            max-width: 600px;
            padding: 2rem;
            position: relative;
            z-index: 10;
        }
        
        .logo {
            height: 60px;
            width: auto;
            margin-bottom: 2rem;
            filter: brightness(1.2);
        }
        
        h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #cbd5e1;
            font-weight: 300;
        }
        
        .message {
            font-size: 1.1rem;
            color: #94a3b8;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        
        .progress-container {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 1.5rem;
            margin: 2rem 0;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 1rem;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%);
            border-radius: 4px;
            animation: progress 3s ease-in-out infinite;
            width: 0%;
        }
        
        @keyframes progress {
            0% { width: 0%; }
            50% { width: 75%; }
            100% { width: 100%; }
        }
        
        .status-text {
            font-size: 0.9rem;
            color: #60a5fa;
            font-weight: 500;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        
        .feature {
            background: rgba(255, 255, 255, 0.05);
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .feature-icon {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }
        
        .eta {
            font-size: 1rem;
            color: #60a5fa;
            margin-top: 1rem;
            padding: 1rem;
            background: rgba(96, 165, 250, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(96, 165, 250, 0.3);
        }
        
        .social-links {
            margin-top: 2rem;
            display: flex;
            justify-content: center;
            gap: 1rem;
        }
        
        .social-link {
            color: #94a3b8;
            text-decoration: none;
            font-size: 1.5rem;
            transition: color 0.3s ease;
        }
        
        .social-link:hover {
            color: #60a5fa;
        }
        
        .floating-shapes {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            pointer-events: none;
        }
        
        .shape {
            position: absolute;
            background: linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
            border-radius: 50%;
            animation: float 6s ease-in-out infinite;
        }
        
        .shape:nth-child(1) {
            width: 100px;
            height: 100px;
            top: 10%;
            left: 10%;
            animation-delay: 0s;
        }
        
        .shape:nth-child(2) {
            width: 150px;
            height: 150px;
            top: 20%;
            right: 10%;
            animation-delay: 2s;
        }
        
        .shape:nth-child(3) {
            width: 80px;
            height: 80px;
            bottom: 20%;
            left: 20%;
            animation-delay: 4s;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @media (max-width: 640px) {
            .container {
                padding: 1rem;
            }
            
            h1 {
                font-size: 2rem;
            }
            
            .subtitle {
                font-size: 1.2rem;
            }
            
            .features {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="floating-shapes">
        <div class="shape"></div>
        <div class="shape"></div>
        <div class="shape"></div>
    </div>
    
    <div class="container">
        <img src="/images/logos/scoriet-logo.png" alt="Scoriet Logo" class="logo">
        
        <h1>We'll Be Right Back</h1>
        <p class="subtitle">Upgrading Scoriet</p>
        
        <p class="message">
            We're currently performing scheduled maintenance to bring you new features and improvements. 
            Our Enterprise Code Generator will be back online shortly.
        </p>
        
        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="status-text">Update in progress...</div>
        </div>
        
        <div class="features">
            <div class="feature">
                <div class="feature-icon">🚀</div>
                <strong>Performance Boost</strong><br>
                Faster code generation
            </div>
            <div class="feature">
                <div class="feature-icon">✨</div>
                <strong>New Features</strong><br>
                Enhanced templates
            </div>
            <div class="feature">
                <div class="feature-icon">🔧</div>
                <strong>Bug Fixes</strong><br>
                Improved stability
            </div>
        </div>
        
        <div class="eta">
            <strong>Estimated downtime:</strong> 2-5 minutes<br>
            <small>We appreciate your patience!</small>
        </div>
        
        <div class="social-links">
            <a href="#" class="social-link" title="GitHub">⚡</a>
            <a href="#" class="social-link" title="Discord">💬</a>
            <a href="#" class="social-link" title="Twitter">🐦</a>
        </div>
    </div>
</body>
</html>