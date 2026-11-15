# Personal Health Analyzer

Eine einfache, für das iPhone optimierte Test-Web-App. Sie meldet sich über Google OAuth an, sucht im angemeldeten Google Drive nach einer Datei namens `test.json` und zeigt ihren JSON-Inhalt an.

**Web-App:** https://arthurbrack.github.io/personal-health-analyzer/

## Google OAuth Client-ID erstellen

Die App benötigt **eine OAuth Client-ID für eine Webanwendung**. Sie wird **nicht im Quellcode hinterlegt**, sondern beim ersten Start in der App eingegeben und lokal im Browser gespeichert.

### 1. Google-Cloud-Projekt erstellen

1. Die [Google Cloud Console](https://console.cloud.google.com/) öffnen.
2. Ein neues Projekt anlegen, z. B. **Personal Health Analyzer**, und dieses auswählen.

### 2. Google Auth Platform konfigurieren

1. [Google Auth Platform](https://console.cloud.google.com/auth/overview) öffnen und ggf. die Einrichtung starten.
2. Als **App-Name** z. B. `Personal Health Analyzer` eintragen und eine Support-/Kontakt-E-Mail hinterlegen.
3. Bei **Audience/Zielgruppe** für ein privates Google-Konto **External/Extern** wählen.
4. Die App zunächst im Status **Testing/Testen** lassen.
5. Unter **Audience → Test users/Testnutzer** das Google-Konto hinzufügen, mit dem du dich in der App anmelden möchtest.

### 3. Google Drive API aktivieren

In der [Google API Library](https://console.cloud.google.com/apis/library/drive.googleapis.com) die **Google Drive API** für dieses Projekt aktivieren.

### 4. Drive-Scope konfigurieren

Unter [Google Auth Platform → Data Access/Datenzugriff](https://console.cloud.google.com/auth/data-access) folgenden Scope hinzufügen:

```text
https://www.googleapis.com/auth/drive.readonly
```

**Achtung:** Dieser Scope erlaubt das Lesen **aller Drive-Dateien**, auf die das angemeldete Google-Konto Zugriff hat, nicht nur `test.json`. Er ist für den einfachen Test vorgesehen. Keine sensiblen Gesundheitsdaten mit dieser Testversion verwenden. Für die spätere Anwendung sollten die Berechtigungen gezielter eingeschränkt werden (z. B. `drive.file` mit Google Picker oder ein separates Testkonto).

### 5. OAuth-Client anlegen

1. [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients) öffnen.
2. **Create client/Client erstellen** auswählen.
3. **Application type/Anwendungstyp:** `Web application` / `Webanwendung`.
4. **Name:** `Personal Health Analyzer`.
5. Unter **Authorized JavaScript origins/Autorisierte JavaScript-Quellen** genau diesen Ursprung eintragen:

   ```text
   https://arthurbrack.github.io
   ```

   **Wichtig:** Hier **nicht** den Pfad `/personal-health-analyzer/` ergänzen; ein Origin besteht aus Protokoll, Host und ggf. Port.

6. **Authorized redirect URIs/Autorisierte Weiterleitungs-URIs** für den hier eingesetzten Google Identity Services JavaScript-Token-Flow leer lassen.
7. **Erstellen** auswählen und die **Client-ID** kopieren. Sie endet auf `.apps.googleusercontent.com`.

**Der Clientschlüssel / Client Secret wird von dieser Web-App nicht benötigt.** Er darf niemals in GitHub, JavaScript oder Browser-`localStorage` eingetragen werden.

### 6. App starten

1. Die [Web-App](https://arthurbrack.github.io/personal-health-analyzer/) auf dem iPhone in Safari öffnen.
2. Die **OAuth Client-ID** eingeben.
3. Auf **Mit Google anmelden** tippen und das zuvor als Testnutzer eingetragene Google-Konto auswählen.
4. Die angeforderte Drive-Leseberechtigung bestätigen.
5. Die App sucht automatisch nach `test.json` (auch in Unterordnern und zugänglichen freigegebenen Dateien) und zeigt den Inhalt an. Bei mehreren gleichnamigen Dateien wird die zuletzt geänderte angezeigt.

Die Client-ID bleibt lokal im Browser gespeichert; das Google-Zugriffstoken verbleibt nur im Arbeitsspeicher. Nach dem Neuladen der Seite kann daher eine erneute Google-Verbindung erforderlich sein.

## Beispieldatei

Lege im Google Drive **des angemeldeten Kontos** eine Datei namens `test.json` an:

```json
{
  "sport": "running",
  "duration": 75,
  "distance_km": 10
}
```

Die Datei muss für das angemeldete Google-Konto zugänglich sein. Liegt sie in einem anderen Konto, musst du dich damit anmelden oder die Datei für das verwendete Konto freigeben. Eine Datei-ID brauchst du nicht einzugeben.

## Häufige Fehler

| Meldung | Mögliche Ursache und Abhilfe |
| --- | --- |
| `403 access_denied` beim Google-Login | Google-Konto unter **Audience → Test users** hinzufügen und korrektes Cloud-Projekt prüfen. |
| `origin_mismatch` / `idpiframe_initialization_failed` | Unter **Authorized JavaScript origins** `https://arthurbrack.github.io` eintragen; keine Pfade verwenden. |
| Suche fehlgeschlagen (HTTP 403) | Google Drive API für das Projekt aktivieren, Scope und erteilte Berechtigungen prüfen. |
| Keine `test.json` gefunden | Richtiges Google-Konto wählen; Datei muss vorhanden und für dieses Konto zugänglich sein. |
| Google-Sitzung abgelaufen | Erneut auf **Mit Google anmelden** tippen. |

## GitHub Pages

In den [Repository-Einstellungen → Pages](https://github.com/arthurbrack/personal-health-analyzer/settings/pages) **Deploy from a branch**, Branch **main**, Ordner **/(root)** auswählen. GitHub Pages veröffentlicht die `index.html` unter der oben angegebenen URL.

Das Repository und die Pages-Website können öffentlich lesbar sein. **Keine persönlichen Gesundheitsdaten, Tokens oder Client Secrets ins Repository committen.**
