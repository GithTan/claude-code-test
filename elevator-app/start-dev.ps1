Write-Host "Starting Elevator App dev server..." -ForegroundColor Green
npm run dev
# Server stopped — show notification
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

$xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$xml.GetElementsByTagName("text")[0].InnerText = "Elevator App Dev Server Stopped"
$xml.GetElementsByTagName("text")[1].InnerText = "The localhost:5173 server has stopped running."
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Elevator App").Show($toast)

# Also beep so you hear it
[console]::beep(1000, 500)
Write-Host "Server stopped!" -ForegroundColor Red
