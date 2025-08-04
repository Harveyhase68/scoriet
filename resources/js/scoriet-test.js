// Test Script für Scoriet Template Engine
console.log('🚀 Scoriet JavaScript loaded successfully!');

class ScorietTest {
    constructor() {
        this.name = 'Scoriet Template Engine';
        this.version = '1.0.0';
    }

    test() {
        console.log(`✅ ${this.name} v${this.version} is working!`);
        return {
            success: true,
            message: 'JavaScript execution successful',
            timestamp: new Date().toISOString()
        };
    }

	async testApiConnection() {
		try {
			// Dynamisch die Base-URL ermitteln
			const baseUrl = window.location.origin; // http://localhost:8000
			const response = await fetch(`${baseUrl}/api/schema-versions`);
			const data = await response.json();
			console.log('✅ API connection successful:', data);
			return data;
		} catch (error) {
			console.error('❌ API connection failed:', error);
			return { success: false, error: error.message };
		}
	}
}

// Global verfügbar machen
window.ScorietTest = ScorietTest;

// Automatischer Test beim Laden
document.addEventListener('DOMContentLoaded', function() {
    const test = new ScorietTest();
    const result = test.test();
    console.log('Test Result:', result);
});

console.log('📄 Scoriet test script loaded and ready!');