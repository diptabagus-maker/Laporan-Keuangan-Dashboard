# Script untuk membuat Task Scheduler
# Klik kanan file ini -> Run with PowerShell (as Administrator)

$taskName = "Laporan Keuangan Backend"
$serverPath = "c:\laragon\Laporan Keuangan Dashboard\server"
$batFile = "$serverPath\start-server.bat"

# Cek apakah task sudah ada
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "Task '$taskName' sudah ada. Menghapus task lama..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Buat action
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batFile`"" -WorkingDirectory $serverPath

# Trigger saat login
$trigger = New-ScheduledTaskTrigger -AtLogOn

# Settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Register task
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Auto-start backend server for Laporan Keuangan Dashboard" -RunLevel Highest

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Task Scheduler berhasil dibuat!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Nama Task: $taskName"
Write-Host "Server akan otomatis berjalan saat Anda login ke Windows."
Write-Host ""

Read-Host "Tekan Enter untuk menutup"
