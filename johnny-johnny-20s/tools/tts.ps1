param([string]$OutDir)
Add-Type -AssemblyName System.Speech
$lines = @(
  @{ id = 'l1';  voice = 'Microsoft David Desktop'; rate = 0;  text = 'Johnny, Johnny?' },
  @{ id = 'l2';  voice = 'Microsoft Zira Desktop';  rate = 0;  text = 'Yes, Papa!' },
  @{ id = 'l3';  voice = 'Microsoft David Desktop'; rate = 0;  text = 'Eating sugar?' },
  @{ id = 'l4';  voice = 'Microsoft Zira Desktop';  rate = 0;  text = 'No, Papa!' },
  @{ id = 'l5';  voice = 'Microsoft David Desktop'; rate = 0;  text = 'Telling lies?' },
  @{ id = 'l6';  voice = 'Microsoft Zira Desktop';  rate = 0;  text = 'No, Papa!' },
  @{ id = 'l7';  voice = 'Microsoft David Desktop'; rate = 0;  text = 'Open your mouth!' },
  @{ id = 'l8';  voice = 'Microsoft David Desktop'; rate = 0;  text = 'Ha ha ha ha!' },
  @{ id = 'l9';  voice = 'Microsoft Zira Desktop';  rate = 0;  text = 'Hee hee hee hee!' }
)
foreach ($l in $lines) {
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $s.SelectVoice($l.voice)
  $s.Rate = $l.rate
  $s.SetOutputToWaveFile((Join-Path $OutDir ($l.id + '.wav')))
  $s.Speak($l.text)
  $s.Dispose()
}
