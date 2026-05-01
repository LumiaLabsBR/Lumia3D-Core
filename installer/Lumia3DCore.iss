#ifndef AppVersion
  #define AppVersion "0.1.0-alpha.1"
#endif

#define AppName      "Lumia3D Core"
#define AppPublisher "LumiaLabs"
#define AppURL       "https://github.com/LumiaLabsBR/Lumia3D-Core"
#define AppExeName   "Lumia3DCore.exe"
#define AppGUID      "{A7C3B2D1-5E6F-4A7B-8C9D-0E1F2A3B4C5D}"

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
; Windows 10+: Photino usa WebView2 (já incluso a partir do Win 11, redistribuível no Win 10)
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na &área de trabalho"; GroupDescription: "Ícones adicionais:"; Flags: unchecked

[Files]
; Build self-contained: dotnet publish -c Release -r win-x64 --self-contained -o publish\Lumia3DCore-win-x64
Source: "..\publish\Lumia3DCore-win-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}";              Filename: "{app}\{#AppExeName}"
Name: "{group}\Desinstalar {#AppName}";  Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}";        Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Iniciar {#AppName}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Garante que o processo não está rodando ao desinstalar
Filename: "taskkill.exe"; Parameters: "/f /im {#AppExeName}"; Flags: runhidden skipifdoesntexist; RunOnceId: "KillApp"

[Code]
{ Verifica se WebView2 está instalado. Sem ele o Photino não funciona no Windows 10. }
function WebView2Installed: Boolean;
var
  Version: String;
begin
  Result := RegQueryStringValue(HKLM,
    'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}',
    'pv', Version) and (Version <> '');
  if not Result then
    Result := RegQueryStringValue(HKCU,
      'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}',
      'pv', Version) and (Version <> '');
end;

function InitializeSetup: Boolean;
begin
  if not WebView2Installed then begin
    MsgBox(
      'O Lumia3D Core requer o Microsoft Edge WebView2.' + #13#10 +
      'Baixe em: https://go.microsoft.com/fwlink/p/?LinkId=2124703' + #13#10#13#10 +
      'No Windows 11 o WebView2 já está incluso.',
      mbInformation, MB_OK);
  end;
  Result := True;
end;
