# CWIE System - ตัวควบคุมระบบ (GUI)
# เปิดผ่าน start.bat  |  ไฟล์นี้ไม่แตะโค้ดโปรเจกต์ แค่สั่ง "npm run dev" ของ backend / frontend
# หน้าต่าง GUI แสดงภาษาไทย ส่วนหน้าต่าง cmd (log) แสดงภาษาอังกฤษ

try {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    [System.Windows.Forms.Application]::EnableVisualStyles()

    Add-Type -Namespace CWIE -Name Win -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
'@

    $root = $PSScriptRoot
    if (-not $root) { $root = (Get-Location).Path }
    $root = $root.TrimEnd('\')

    # ---------- ตรวจความพร้อม ----------
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        [System.Windows.Forms.MessageBox]::Show("ไม่พบ Node.js / npm ในเครื่องนี้`nกรุณาติดตั้ง Node.js ก่อน (https://nodejs.org)", 'CWIE System', 'OK', 'Error') | Out-Null
        return
    }
    if (-not (Test-Path (Join-Path $root 'backend')) -or -not (Test-Path (Join-Path $root 'frontend'))) {
        [System.Windows.Forms.MessageBox]::Show("ไม่พบโฟลเดอร์ backend / frontend`nกรุณาวาง start.bat และ start.ps1 ไว้ในโฟลเดอร์โปรเจกต์", 'CWIE System', 'OK', 'Error') | Out-Null
        return
    }

    # ---------- ข้อมูลบริการ ----------
    $svc = @{
        Backend  = @{ Name = 'Backend';  Title = 'CWIE Backend';  Dir = (Join-Path $root 'backend');  Ports = @(4000);       Port = 4000; Url = 'http://localhost:4000/api'; Proc = $null; StartedAt = $null }
        Frontend = @{ Name = 'Frontend'; Title = 'CWIE Frontend'; Dir = (Join-Path $root 'frontend'); Ports = @(5173, 5174); Port = 5173; Url = 'http://localhost:5173';     Proc = $null; StartedAt = $null }
    }

    function Get-ListeningPorts {
        try { [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() | ForEach-Object { $_.Port } } catch { }
    }

    function Test-Alive($s) { [bool]($s.Proc -and -not $s.Proc.HasExited) }

    function Stop-Svc($s) {
        if (Test-Alive $s) { & taskkill.exe /T /F /PID $s.Proc.Id 2>&1 | Out-Null }
        # ปิดหน้าต่างเก่าที่ค้างจากรอบก่อน
        Get-Process cmd -ErrorAction SilentlyContinue |
            Where-Object { $_.MainWindowTitle -like "*$($s.Title)*" } |
            ForEach-Object { & taskkill.exe /T /F /PID $_.Id 2>&1 | Out-Null }
        # ปิดโปรแกรมที่ยังจับพอร์ตอยู่
        foreach ($p in $s.Ports) {
            Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue |
                ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
        }
        $s.Proc = $null
        $s.StartedAt = $null
    }

    # ตัวกรอง log ของ Backend: แปลบรรทัด "API พร้อมใช้งานที่ <url>" (จาก backend/src/server.js) เป็น "API ready at <url>"
    # ทำตอนแสดงผลเท่านั้น ไม่ได้แก้โค้ดโปรเจกต์  (ผลข้างเคียง: log ของ Backend จะไม่มีสี)
    $backendLogFilter = 'try{[Console]::InputEncoding=[Text.Encoding]::UTF8}catch{}; while(($l=[Console]::In.ReadLine()) -ne $null){[Console]::WriteLine(($l -replace ''^API .*? (https?://\S+)'',''API ready at $1''))}'

    function Start-Svc($s) {
        Stop-Svc $s
        Start-Sleep -Milliseconds 500
        $runCmd = 'npm run dev'
        if ($s.Name -eq 'Backend') {
            $runCmd = "npm run dev 2>&1 | powershell -NoProfile -ExecutionPolicy Bypass -Command `"$backendLogFilter`""
        }
        $cmdArgs = "/k title $($s.Title) & cd /d `"$($s.Dir)`" & echo ================================================ & echo  $($s.Title) - $($s.Url) & echo  Press Stop in the CWIE GUI to stop this service. & echo ================================================ & echo. & (if not exist node_modules call npm install) & $runCmd"
        $s.Proc = Start-Process cmd.exe -ArgumentList $cmdArgs -WindowStyle Minimized -PassThru
        $s.StartedAt = Get-Date
    }

    function Show-Log($s) {
        if (-not (Test-Alive $s)) { return }
        $s.Proc.Refresh()
        $h = $s.Proc.MainWindowHandle
        if ($h -ne [IntPtr]::Zero) {
            [CWIE.Win]::ShowWindow($h, 9) | Out-Null
            [CWIE.Win]::SetForegroundWindow($h) | Out-Null
        }
    }

    # ---------- ฟอนต์และสี ----------
    $installed = (New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }
    $fontName = if ($installed -contains 'Leelawadee UI') { 'Leelawadee UI' } else { 'Tahoma' }
    function New-UiFont([float]$size, [string]$style = 'Regular') {
        New-Object System.Drawing.Font($fontName, $size, [System.Drawing.FontStyle]$style)
    }
    function RGB([int]$r, [int]$g, [int]$b) { [System.Drawing.Color]::FromArgb($r, $g, $b) }
    $C = @{
        Red      = RGB 163 22 33
        RedDark  = RGB 122 16 25
        Green    = RGB 30 132 73
        GreenDk  = RGB 22 101 55
        Amber    = RGB 204 122 0
        Gray     = RGB 140 140 140
        Text     = RGB 38 38 38
        Sub      = RGB 110 110 110
        Card     = RGB 248 244 244
        Disabled = RGB 228 228 228
        Pink     = RGB 252 234 236
        PinkText = RGB 255 226 229
        White    = [System.Drawing.Color]::White
    }

    # ---------- ตัวช่วยสร้าง UI ----------
    function New-Lbl([string]$text, [int]$x, [int]$y, [float]$size, [string]$style = 'Regular', $color = $null) {
        $l = New-Object System.Windows.Forms.Label
        $l.Text = $text
        $l.AutoSize = $true
        $l.Location = New-Object System.Drawing.Point($x, $y)
        $l.Font = New-UiFont $size $style
        $l.ForeColor = if ($null -ne $color) { $color } else { $C.Text }
        $l.BackColor = [System.Drawing.Color]::Transparent
        return $l
    }

    function New-Btn([string]$text, [int]$x, [int]$y, [int]$w, [int]$h) {
        $b = New-Object System.Windows.Forms.Button
        $b.Text = $text
        $b.Location = New-Object System.Drawing.Point($x, $y)
        $b.Size = New-Object System.Drawing.Size($w, $h)
        $b.Font = New-UiFont 10.5 'Bold'
        $b.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
        $b.Cursor = [System.Windows.Forms.Cursors]::Hand
        $b.UseVisualStyleBackColor = $false
        return $b
    }

    function Set-BtnStyle($b, [bool]$enabled, [string]$kind) {
        $b.Enabled = $enabled
        if (-not $enabled) {
            $b.BackColor = $C.Disabled; $b.ForeColor = $C.Gray; $b.FlatAppearance.BorderSize = 0
            return
        }
        switch ($kind) {
            'green' { $b.BackColor = $C.Green; $b.ForeColor = $C.White; $b.FlatAppearance.BorderSize = 0; $b.FlatAppearance.MouseOverBackColor = $C.GreenDk }
            'red'   { $b.BackColor = $C.Red;   $b.ForeColor = $C.White; $b.FlatAppearance.BorderSize = 0; $b.FlatAppearance.MouseOverBackColor = $C.RedDark }
            default { $b.BackColor = $C.White; $b.ForeColor = $C.Red;   $b.FlatAppearance.BorderSize = 1; $b.FlatAppearance.BorderColor = $C.Red; $b.FlatAppearance.MouseOverBackColor = $C.Pink }
        }
    }

    function New-Dot([int]$x, [int]$y) {
        $d = New-Object System.Windows.Forms.Panel
        $d.Size = New-Object System.Drawing.Size(12, 12)
        $d.Location = New-Object System.Drawing.Point($x, $y)
        $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
        $gp.AddEllipse(0, 0, 12, 12)
        $d.Region = New-Object System.Drawing.Region($gp)
        $d.BackColor = $C.Gray
        return $d
    }

    # ---------- หน้าต่างหลัก ----------
    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'CWIE System - ตัวควบคุมระบบ'
    $form.ClientSize = New-Object System.Drawing.Size(600, 512)
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedSingle'
    $form.MaximizeBox = $false
    $form.BackColor = $C.White
    $form.Font = New-UiFont 10

    $header = New-Object System.Windows.Forms.Panel
    $header.Dock = 'Top'
    $header.Height = 92
    $header.BackColor = $C.Red
    $header.Controls.Add((New-Lbl 'ระบบสารสนเทศสหกิจศึกษา (CWIE)' 20 12 17 'Bold' $C.White))
    $header.Controls.Add((New-Lbl 'ตัวควบคุมการรันระบบ  |  คณะวิศวกรรมศาสตร์ มทร.รัตนโกสินทร์' 22 56 10 'Regular' $C.PinkText))
    $form.Controls.Add($header)

    function Add-Card($s, [string]$display, [int]$y) {
        $p = New-Object System.Windows.Forms.Panel
        $p.Location = New-Object System.Drawing.Point(20, $y)
        $p.Size = New-Object System.Drawing.Size(560, 100)
        $p.BackColor = $C.Card
        $p.Controls.Add((New-Lbl $display 16 8 13 'Bold'))
        $p.Controls.Add((New-Lbl $s.Url 18 42 9.5 'Regular' $C.Sub))
        $s.Dot = New-Dot 19 74
        $p.Controls.Add($s.Dot)
        $s.Status = New-Lbl 'หยุดทำงาน' 36 68 10 'Bold' $C.Gray
        $p.Controls.Add($s.Status)
        $s.BtnRun  = New-Btn 'รัน'    290 28 82 44
        $s.BtnStop = New-Btn 'หยุด'   380 28 82 44
        $s.BtnLog  = New-Btn 'ดู Log' 470 28 76 44
        foreach ($b in @($s.BtnRun, $s.BtnStop, $s.BtnLog)) { $b.Tag = $s.Name; $p.Controls.Add($b) }
        $s.BtnRun.add_Click({  param($sender, $e) Start-Svc $svc[$sender.Tag]; Update-UI })
        $s.BtnStop.add_Click({ param($sender, $e) Stop-Svc  $svc[$sender.Tag]; Update-UI })
        $s.BtnLog.add_Click({  param($sender, $e) Show-Log  $svc[$sender.Tag] })
        $form.Controls.Add($p)
    }

    Add-Card $svc.Backend  'Backend (API)'        110
    Add-Card $svc.Frontend 'Frontend (หน้าเว็บ)'  220

    $btnAllRun  = New-Btn 'รันทั้งหมด'                 20  340 275 46
    $btnAllStop = New-Btn 'หยุดทั้งหมด'                305 340 275 46
    $btnWeb     = New-Btn 'เปิดหน้าเว็บ'               20  396 275 46
    $btnPre     = New-Btn 'เปิดโหมดทดสอบ (6 บทบาท)'   305 396 275 46
    $form.Controls.AddRange(@($btnAllRun, $btnAllStop, $btnWeb, $btnPre))
    Set-BtnStyle $btnWeb $true 'outline'
    Set-BtnStyle $btnPre $true 'outline'

    $form.Controls.Add((New-Lbl 'บัญชีทดลอง: รหัสผ่านทุกบัญชีคือ 123456' 20 456 9.5 'Bold' $C.Sub))
    $form.Controls.Add((New-Lbl 'เช่น student@cwie.test, office@cwie.test, admin@cwie.test' 20 480 9.5 'Regular' $C.Sub))

    # ---------- อัปเดตสถานะ ----------
    function Update-UI {
        try {
            $ports = @(Get-ListeningPorts)
            foreach ($s in @($svc.Backend, $svc.Frontend)) {
                $alive = Test-Alive $s
                $up = $ports -contains $s.Port
                if ($up -and $alive) { $t = 'กำลังทำงาน'; $col = $C.Green }
                elseif ($up)         { $t = 'กำลังทำงาน (เปิดจากที่อื่น)'; $col = $C.Green }
                elseif ($alive) {
                    if ($s.StartedAt -and ((Get-Date) - $s.StartedAt).TotalSeconds -gt 90) { $t = 'ไม่ตอบสนอง - กด ดู Log'; $col = $C.Red }
                    else { $t = 'กำลังเริ่ม...'; $col = $C.Amber }
                }
                else { $t = 'หยุดทำงาน'; $col = $C.Gray }

                $s.Dot.BackColor = $col
                if ($s.Status.Text -ne $t) { $s.Status.Text = $t }
                $s.Status.ForeColor = $col

                $running = $alive -or $up
                $s.Running = $running
                Set-BtnStyle $s.BtnRun  (-not $running) 'green'
                Set-BtnStyle $s.BtnStop $running 'red'
                Set-BtnStyle $s.BtnLog  $alive 'outline'
            }
            Set-BtnStyle $btnAllRun  (-not ($svc.Backend.Running -and $svc.Frontend.Running)) 'green'
            Set-BtnStyle $btnAllStop ($svc.Backend.Running -or $svc.Frontend.Running) 'red'
        } catch { }
    }

    # ---------- ปุ่มรวม ----------
    $btnAllRun.add_Click({
        $form.Cursor = 'WaitCursor'
        foreach ($s in @($svc.Backend, $svc.Frontend)) { if (-not $s.Running) { Start-Svc $s } }
        $form.Cursor = 'Default'
        Update-UI
    })
    $btnAllStop.add_Click({
        $form.Cursor = 'WaitCursor'
        Stop-Svc $svc.Backend
        Stop-Svc $svc.Frontend
        $form.Cursor = 'Default'
        Update-UI
    })
    $btnWeb.add_Click({ Start-Process 'http://localhost:5173' })
    $btnPre.add_Click({ Start-Process 'http://localhost:5173/pretest' })

    $timer = New-Object System.Windows.Forms.Timer
    $timer.Interval = 1000
    $timer.add_Tick({ Update-UI })

    $form.add_Shown({
        $form.Activate()
        Update-UI
        $timer.Start()
    })

    $form.add_FormClosing({
        param($sender, $e)
        Update-UI
        if ($svc.Backend.Running -or $svc.Frontend.Running) {
            $r = [System.Windows.Forms.MessageBox]::Show(
                "ต้องการหยุด Backend และ Frontend ด้วยหรือไม่?`n`nYes = หยุดทั้งหมดแล้วปิดโปรแกรม`nNo = ปิดเฉพาะหน้าต่างนี้ (ระบบยังทำงานต่อ)`nCancel = ยกเลิก",
                'CWIE System',
                [System.Windows.Forms.MessageBoxButtons]::YesNoCancel,
                [System.Windows.Forms.MessageBoxIcon]::Question)
            if ($r -eq [System.Windows.Forms.DialogResult]::Cancel) { $e.Cancel = $true; return }
            if ($r -eq [System.Windows.Forms.DialogResult]::Yes) { Stop-Svc $svc.Backend; Stop-Svc $svc.Frontend }
        }
        $timer.Stop()
    })

    [void]$form.ShowDialog()
    $timer.Dispose()
}
catch {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show("เกิดข้อผิดพลาดในการเปิดตัวควบคุมระบบ:`n$($_.Exception.Message)", 'CWIE System', 'OK', 'Error') | Out-Null
}
