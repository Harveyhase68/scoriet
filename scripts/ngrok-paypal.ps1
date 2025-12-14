# ============================================================
# PayPal Webhook Tunnel via ngrok
# ============================================================
#
# Dieses Skript startet ngrok um PayPal Webhooks lokal zu empfangen.
#
# VORAUSSETZUNGEN:
# 1. ngrok installieren: https://ngrok.com/download
# 2. ngrok authtoken setzen: ngrok authtoken YOUR_AUTH_TOKEN
#
# NACH DEM START:
# 1. Kopiere die https://*.ngrok-free.app URL aus der Ausgabe
# 2. Gehe zu: https://developer.paypal.com/dashboard/applications
# 3. Wähle deine App -> Webhooks -> Add Webhook
# 4. Trage ein: https://DEINE-NGROK-URL/api/paypal/webhook
# 5. Wähle Events: BILLING.SUBSCRIPTION.* (alle Subscription Events)
#
# ============================================================

Write-Host ""
Write-Host "🔗 Starte ngrok Tunnel für PayPal Webhooks..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 Nach dem Start:" -ForegroundColor Yellow
Write-Host "   1. Kopiere die https://*.ngrok-free.app URL" -ForegroundColor DarkGray
Write-Host "   2. PayPal Developer Dashboard: https://developer.paypal.com/dashboard/applications" -ForegroundColor DarkGray
Write-Host "   3. Deine App -> Webhooks -> Add Webhook" -ForegroundColor DarkGray
Write-Host "   4. URL: https://DEINE-URL/api/paypal/webhook" -ForegroundColor DarkGray
Write-Host "   5. Events: BILLING.SUBSCRIPTION.* (alle)" -ForegroundColor DarkGray
Write-Host ""

ngrok http 10.0.0.8:8000
