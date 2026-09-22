# enriquecer-fotos.ps1 - completa fotos de incumbentes via Camara (uriFoto)
param($JsonPath='data/candidatos-2026.json')
$ErrorActionPreference='Stop'
if(-not (Test-Path $JsonPath)){ Write-Host ('SKIP: '+$JsonPath+' nao existe'); exit 0 }
function Norm($s){ if(-not $s){return ''}; $s=$s.Normalize('FormD') -replace '[\u0300-\u036f]',''; return ($s.ToUpper() -replace '\s+',' ').Trim() }
$d=Get-Content $JsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
$list=$d.candidatos; if(-not $list){ $list=$d }
$dep=Invoke-RestMethod 'https://dadosabertos.camara.leg.br/api/v2/deputados?itens=513'
$map=@{}
foreach($x in $dep.dados){ if($x.uriFoto){ $map[(Norm $x.nome)]=$x.uriFoto } }
$n=0
foreach($c in $list){ if(-not $c.foto){ $u=$map[(Norm $c.nomeUrna)]; if($u){ $c.foto=$u; $n++ } } }
if($n -gt 0){ [IO.File]::WriteAllText((Resolve-Path $JsonPath).Path, ($d | ConvertTo-Json -Depth 6 -Compress), [System.Text.Encoding]::UTF8) }
Write-Host ('Fotos enriquecidas: '+$n)
