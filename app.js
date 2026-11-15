/**
 * Personal Health Analyzer — Google-Drive-Test
 *
 * Ablauf:
 * 1. OAuth Client-ID aus den Einstellungen lesen.
 * 2. Per Google Identity Services ein kurzlebiges Access Token anfordern.
 * 3. In Google Drive nach "test.json" suchen.
 * 4. JSON laden und die Trainingsdaten anzeigen.
 *
 * Datenschutz: Nur die öffentliche Client-ID wird lokal gespeichert.
 * Weder Access Token noch JSON-Inhalt werden dauerhaft gespeichert.
 *
 * Diese erste Testversion verwendet drive.readonly. Der Scope erlaubt
 * grundsätzlich Lesezugriff auf alle Drive-Dateien des gewählten Kontos.
 */
(() => {
  "use strict";

  const CONFIG = {
    fileName: "test.json",
    clientIdStorageKey: "pha_client_id",
    scope: "https://www.googleapis.com/auth/drive.readonly",
    driveApi: "https://www.googleapis.com/drive/v3/files"
  };

  const element = id => document.getElementById(id);
  const ui = {
    client: element("client"),
    login: element("login"),
    logout: element("logout"),
    refresh: element("refresh"),
    status: element("status"),
    dataMsg: element("dataMsg"),
    content: element("content"),
    error: element("error"),
    duration: element("duration"),
    distance: element("distance"),
    sport: element("sport"),
    json: element("json")
  };

  // Tokens gehören nur zur aktuellen Browser-Sitzung.
  let accessToken = null;
  let tokenClient = null;

  ui.client.value = localStorage.getItem(CONFIG.clientIdStorageKey) || "";

  function showError(message = "") {
    ui.error.textContent = message;
  }

  function updateAuthenticationUi() {
    const authenticated = Boolean(accessToken);
    ui.status.textContent = authenticated ? "Verbunden" : "Nicht verbunden";
    ui.login.hidden = authenticated;
    ui.logout.hidden = !authenticated;
    ui.refresh.disabled = !authenticated;
  }

  /** Behandelt ein abgelaufenes Google-Token einheitlich. */
  function checkSession(response) {
    if (response.status === 401) {
      accessToken = null;
      updateAuthenticationUi();
      throw new Error("Google-Sitzung abgelaufen. Bitte erneut verbinden.");
    }
  }

  /** Sucht die aktuellste test.json, unabhängig von ihrem Drive-Ordner. */
  async function findTestFile(headers) {
    const query = "name = 'test.json' and trashed = false";
    const params = new URLSearchParams({
      q: query,
      fields: "nextPageToken,files(id,name,mimeType,modifiedTime)",
      pageSize: "100",
      orderBy: "modifiedTime desc",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true"
    });

    const response = await fetch(`${CONFIG.driveApi}?${params}`, {
      headers,
      cache: "no-store"
    });
    checkSession(response);

    if (!response.ok) {
      throw new Error(`Suche in Google Drive fehlgeschlagen (HTTP ${response.status}).`);
    }

    const result = await response.json();
    // Die Dateisuche ist nach Änderungsdatum absteigend sortiert.
    const match = (result.files || []).find(
      file => file.name === CONFIG.fileName && file.mimeType === "application/json"
    );

    if (!match) {
      throw new Error(
        "Keine test.json in diesem Google-Konto gefunden. " +
        "Bitte das Konto mit der Datei verwenden oder die Datei dafür freigeben."
      );
    }

    return match.id;
  }

  /** Lädt die Datei vollständig per Drive API (nicht über GitHub). */
  async function fetchTestData(fileId, headers) {
    const url = `${CONFIG.driveApi}/${encodeURIComponent(fileId)}?alt=media`;
    const response = await fetch(url, { headers, cache: "no-store" });
    checkSession(response);

    if (response.status === 403) {
      throw new Error("Zugriff verweigert. Hat dieses Google-Konto Zugriff auf test.json?");
    }
    if (response.status === 404) {
      throw new Error("Die gefundene test.json kann nicht geöffnet werden.");
    }
    if (!response.ok) {
      throw new Error(`Drive API: HTTP ${response.status}`);
    }

    return response.json();
  }

  /** Aktualisiert ausschließlich Textknoten; JSON wird nie als HTML gerendert. */
  function showTrainingData(data) {
    ui.duration.textContent = data.duration ?? "–";
    ui.distance.textContent = data.distance_km ?? "–";
    ui.sport.textContent = `Sportart: ${data.sport ?? "–"}`;
    ui.json.textContent = JSON.stringify(data, null, 2);
    ui.content.hidden = false;
    ui.dataMsg.textContent =
      "Erfolgreich geladen · " +
      new Date().toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit"
      });
  }

  async function loadTestData() {
    if (!accessToken) return;

    showError();
    ui.refresh.disabled = true;
    ui.dataMsg.textContent = "Lade aus Google Drive …";

    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const fileId = await findTestFile(headers);
      const data = await fetchTestData(fileId, headers);
      showTrainingData(data);
    } catch (error) {
      showError(error.message || String(error));
      ui.dataMsg.textContent = "Laden fehlgeschlagen";
    } finally {
      ui.refresh.disabled = !accessToken;
    }
  }

  /** Startet Google OAuth erst nach einem bewussten Nutzer-Klick. */
  function signIn() {
    const clientId = ui.client.value.trim();

    if (!/^[a-zA-Z0-9_.-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
      showError("Bitte gültige OAuth Client-ID eingeben.");
      return;
    }
    if (!window.google?.accounts?.oauth2) {
      showError("Google Login-Skript nicht geladen.");
      return;
    }

    localStorage.setItem(CONFIG.clientIdStorageKey, clientId);
    showError();

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: CONFIG.scope,
      callback: response => {
        if (response.error) {
          showError(response.error_description || response.error);
          return;
        }

        accessToken = response.access_token;
        updateAuthenticationUi();
        loadTestData();
      }
    });

    tokenClient.requestAccessToken({ prompt: "consent" });
  }

  function signOut() {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken, () => {});
    }
    accessToken = null;
    ui.content.hidden = true;
    ui.dataMsg.textContent = "Abgemeldet";
    updateAuthenticationUi();
  }

  ui.login.addEventListener("click", signIn);
  ui.logout.addEventListener("click", signOut);
  ui.refresh.addEventListener("click", loadTestData);

  updateAuthenticationUi();
})();
