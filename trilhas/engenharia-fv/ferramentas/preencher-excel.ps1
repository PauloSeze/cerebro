<#
Preenche o Memorial GD da Energisa no Excel (Windows), a partir do celulas.json gerado pelo memorial.mjs.

  Modo normal (o aluno já abriu a planilha oficial no Excel, com macros ativadas, e passou da tela inicial):
    powershell -NoProfile -ExecutionPolicy Bypass -File preencher-excel.ps1 -Celulas <pasta>\celulas.json

  Modo conferência (sem abrir nada na tela; a planilha não é alterada nem salva):
    powershell -NoProfile -ExecutionPolicy Bypass -File preencher-excel.ps1 -Celulas <...>\celulas.json -Arquivo <planilha.xlsm> [-Pdf <previa.pdf>]

Escreve só nas células de entrada, com os eventos do Excel desligados durante a escrita, recalcula e mostra o que a
própria planilha conta como faltando (SAIDA!B17 e B19). Quem gera o PDF e o XLSX oficiais é o botão da planilha.
#>
param(
  [Parameter(Mandatory = $true)][string]$Celulas,
  [string]$Arquivo,
  [string]$Pdf
)
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$data = Get-Content -Raw -Encoding UTF8 -LiteralPath $Celulas | ConvertFrom-Json
$own = [bool]$Arquivo
$xl = $null; $wb = $null; $newPid = $null

if ($own) {
  $before = @(Get-Process EXCEL -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
  $xl = New-Object -ComObject Excel.Application
  $newPid = @(Get-Process EXCEL -ErrorAction SilentlyContinue | Where-Object { $before -notcontains $_.Id } | ForEach-Object { $_.Id }) | Select-Object -First 1
  $xl.Visible = $false
  $xl.DisplayAlerts = $false
  $xl.AutomationSecurity = 3   # macros desligadas: nada da planilha roda
  $xl.EnableEvents = $false
  $wb = $xl.Workbooks.Open((Resolve-Path -LiteralPath $Arquivo).Path, 0, $true)
} else {
  try { $xl = [Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application") }
  catch { Write-Output "ERRO: nenhum Excel aberto. Abra a planilha oficial do Memorial GD, ative as macros e passe da tela inicial."; exit 3 }
  foreach ($w in $xl.Workbooks) {
    try { $null = $w.Worksheets.Item("SAIDA"); $null = $w.Worksheets.Item("MD-SOLAR"); $wb = $w; break } catch { }
  }
  if (-not $wb) { Write-Output "ERRO: o Excel aberto não tem a planilha do Memorial GD. Abra o arquivo baixado do site da Energisa."; exit 3 }
}

$problems = New-Object System.Collections.Generic.List[string]
$eventsBefore = $xl.EnableEvents
try {
  $xl.EnableEvents = $false
  $count = 0
  foreach ($tab in $data.celulas.PSObject.Properties) {
    $ws = $wb.Worksheets.Item($tab.Name)
    foreach ($c in $tab.Value.PSObject.Properties) {
      $v = $c.Value
      if ($v -is [int] -or $v -is [long] -or $v -is [decimal] -or $v -is [double]) { $v = [double]$v }
      # InvokeMember: a atribuição direta (.Value2 = ) prende o tipo do primeiro valor e recusa número depois de texto
      try { $r = $ws.Range($c.Name); [void]$r.GetType().InvokeMember("Value2", [Reflection.BindingFlags]::SetProperty, $null, $r, @($v)); $count++ }
      catch { $problems.Add("$($tab.Name)!$($c.Name): não aceitou o valor ($($_.Exception.Message))") }
    }
  }
  $xl.CalculateFull()
  # a validação de dados da própria planilha, célula a célula (só as que bloqueiam; a da UC é lista de sugestão)
  foreach ($tab in $data.celulas.PSObject.Properties) {
    $ws = $wb.Worksheets.Item($tab.Name)
    foreach ($c in $tab.Value.PSObject.Properties) {
      try {
        $val = $ws.Range($c.Name).Validation
        if (-not $val.Value -and $val.ShowError) { $problems.Add("$($tab.Name)!$($c.Name) = '$($c.Value)' fora da lista ou da regra da planilha") }
      } catch { }
    }
  }
} finally {
  $xl.EnableEvents = $eventsBefore
}

$saida = $wb.Worksheets.Item("SAIDA")
$b17 = $saida.Range("B17").Value2
$b19 = [string]$saida.Range("B19").Text
$errors = 0
foreach ($cell in $saida.Range("A2:DS2").Cells) { if ($cell.Text -like "#*") { $errors++ } }
$md = $wb.Worksheets.Item("MD-SOLAR")
Write-Output "Células escritas: $count"
Write-Output "Ficha ativa (CONFIG!B4): $($wb.Worksheets.Item('CONFIG').Range('B4').Text)"
Write-Output "Módulos (MD-SOLAR!L41): $($md.Range('L41').Text) kW · Inversores (MD-SOLAR!K56): $($md.Range('K56').Text) kW"
Write-Output "Carga: relação $($wb.Worksheets.Item('RELACAO DE CARGA').Range('G36').Text) kW · solicitação $($wb.Worksheets.Item('SOLICITACAO').Range('D15').Text) kW"
Write-Output "Campos que a planilha conta como faltando (SAIDA!B17): $b17"
if ($b17 -ne 0) { Write-Output "  Quais (SAIDA!B19): $b19" }
Write-Output "Erros de fórmula no registro que vai para a Energisa (SAIDA linha 2): $errors"
foreach ($p in $problems) { Write-Output "PROBLEMA: $p" }

if ($own) {
  if ($Pdf) {
    $sheets = @("FORMULARIO", "RELACAO DE CARGA", "DU-SOLAR", "MD-SOLAR", "SOLICITACAO")
    if ([string]$wb.Worksheets.Item("UC BENEFICIARIAS").Range("B15").Text -ne "") { $sheets += "UC BENEFICIARIAS" }
    foreach ($s in $sheets) { $wb.Worksheets.Item($s).Visible = -1 }
    $wb.Worksheets.Item($sheets).Select()
    $xl.ActiveSheet.ExportAsFixedFormat(0, [IO.Path]::GetFullPath($Pdf))
    Write-Output "Prévia em PDF (não é o arquivo oficial): $Pdf"
  }
  $wb.Close($false)
  $xl.Quit()
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($xl)
  if ($newPid) { Start-Sleep -Seconds 2; Stop-Process -Id $newPid -Force -ErrorAction SilentlyContinue }
} else {
  try { $s = $wb.Worksheets.Item("SOLICITACAO"); $s.Visible = -1; $s.Activate() } catch { }
  Write-Output "Pronto. No Excel: confira a SOLICITAÇÃO e vá clicando em Avançar até o fim; lá, o botão de imprimir o memorial gera o PDF e o XLSX oficiais."
}
if ($b17 -ne 0 -or $errors -gt 0 -or $problems.Count -gt 0) { exit 1 }
exit 0
