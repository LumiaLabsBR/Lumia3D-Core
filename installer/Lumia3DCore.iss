#ifndef AppVersion
  #define AppVersion "0.1.0"
#endif

#define AppName      "Lumia3D Core"
#define AppPublisher "LumiaLabs"
#define AppURL       "https://github.com/LumiaLabsBR/Lumia3D-Core"
#define AppExeName   "Lumia3DCore.exe"
; AppId requer "{{" para escapar a chave literal (Inno usa "{" como marcador de constante).
#define AppGUID      "{{A7C3B2D1-5E6F-4A7B-8C9D-0E1F2A3B4C5D}"

[Setup]
AppId={#AppGUID}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}/issues
AppUpdatesURL={#AppURL}/releases
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
AllowNoIcons=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
OutputDir=..\installer-output
OutputBaseFilename=Lumia3DCore-Setup-{#AppVersion}
SetupIconFile=..\src\Lumia3DCore\Assets\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
MinVersion=10.0
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na &área de trabalho"; GroupDescription: "Ícones adicionais:"; Flags: unchecked

[Files]
; App publicada (self-contained)
Source: "..\publish\Lumia3DCore-win-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; WebView2 bootstrapper (~150 KB) — baixado pelo CI antes do build do instalador.
; Só extraído para temp; instalado em runtime se ausente. Use NoCompression
; pois o setup do MS já é comprimido.
Source: "redist\MicrosoftEdgeWebView2Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall nocompression; Check: not WebView2Installed

[Icons]
Name: "{group}\{#AppName}";              Filename: "{app}\{#AppExeName}"
Name: "{group}\Desinstalar {#AppName}";  Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}";        Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
; Instala WebView2 silenciosamente se ausente. /silent /install são as flags
; oficiais do bootstrapper. Aguarda terminar antes de seguir pro app.
Filename: "{tmp}\MicrosoftEdgeWebView2Setup.exe"; Parameters: "/silent /install"; \
  StatusMsg: "Instalando o Microsoft Edge WebView2 (necessário)..."; \
  Flags: waituntilterminated; Check: not WebView2Installed
; Inicia o app
Filename: "{app}\{#AppExeName}"; Description: "Iniciar {#AppName}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Garante que o processo não está rodando ao desinstalar
Filename: "taskkill.exe"; Parameters: "/f /im {#AppExeName}"; Flags: runhidden skipifdoesntexist; RunOnceId: "KillApp"

[Code]
{ Verifica se WebView2 está instalado. Sem ele o Photino não funciona. }
function WebView2Installed: Boolean;
var
  Version: String;
begin
  Result := RegQueryStringValue(HKLM,
    'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}',
    'pv', Version) and (Version <> '');
  if not Result then
    Result := RegQueryStringValue(HKLM,
      'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}',
      'pv', Version) and (Version <> '');
  if not Result then
    Result := RegQueryStringValue(HKCU,
      'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}',
      'pv', Version) and (Version <> '');
end;
