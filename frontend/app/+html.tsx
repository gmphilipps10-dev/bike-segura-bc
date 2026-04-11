// @ts-nocheck
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR" style={{ height: "100%" }}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />

        {/* iOS PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="Bike Segura BC" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* General */}
        <meta name="application-name" content="Bike Segura BC" />
        <meta name="description" content="Segurança e recuperação de bicicletas e veículos elétricos" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />

        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body > div:first-child { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; }
              [role="tablist"] [role="tab"] * { overflow: visible !important; }
              [role="heading"], [role="heading"] * { overflow: visible !important; }
            `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#000000",
        }}
      >
        {children}

        {/* PWA Install Prompt Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var deferredPrompt = null;

                window.addEventListener('beforeinstallprompt', function(e) {
                  e.preventDefault();
                  deferredPrompt = e;
                  showInstallBanner('android');
                });

                function isIOS() {
                  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                }

                function isStandalone() {
                  return window.matchMedia('(display-mode: standalone)').matches
                    || window.navigator.standalone === true;
                }

                function showInstallBanner(type) {
                  if (isStandalone()) return;
                  if (sessionStorage.getItem('pwa_dismissed')) return;

                  var banner = document.createElement('div');
                  banner.id = 'pwa-install-banner';
                  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#000;border-top:3px solid #FFC107;padding:20px 16px;display:flex;flex-direction:column;align-items:center;gap:12px;z-index:99999;font-family:-apple-system,sans-serif;box-shadow:0 -4px 20px rgba(0,0,0,0.8);';

                  var logo = document.createElement('img');
                  logo.src = '/logo.jpg';
                  logo.style.cssText = 'width:160px;height:auto;margin-bottom:4px;';

                  var text = document.createElement('div');
                  text.style.cssText = 'text-align:center;';

                  var row = document.createElement('div');
                  row.style.cssText = 'display:flex;gap:10px;width:100%;';

                  if (type === 'android') {
                    text.innerHTML = '<div style="color:#fff;font-size:13px;">Instale o app para acesso rapido</div>';
                    var btn = document.createElement('button');
                    btn.textContent = 'Instalar App';
                    btn.style.cssText = 'flex:1;background:#FFC107;color:#000;border:none;padding:14px;border-radius:10px;font-weight:bold;font-size:15px;cursor:pointer;';
                    btn.onclick = function() {
                      if (deferredPrompt) {
                        deferredPrompt.prompt();
                        deferredPrompt.userChoice.then(function() { deferredPrompt = null; });
                      }
                      banner.remove();
                    };
                    var closeBtn = document.createElement('button');
                    closeBtn.textContent = 'Agora nao';
                    closeBtn.style.cssText = 'background:none;border:1px solid #333;color:#999;padding:14px 20px;border-radius:10px;font-size:13px;cursor:pointer;';
                    closeBtn.onclick = function() { banner.remove(); sessionStorage.setItem('pwa_dismissed','1'); };
                    banner.appendChild(logo);
                    banner.appendChild(text);
                    row.appendChild(btn);
                    row.appendChild(closeBtn);
                    banner.appendChild(row);
                  } else {
                    text.innerHTML = '<div style="color:#fff;font-size:13px;line-height:1.5;">Toque em <span style="color:#FFC107;font-weight:bold;">Compartilhar</span> e depois em<br><span style="color:#FFC107;font-weight:bold;">Adicionar a Tela de Inicio</span></div>';
                    var closeBtn2 = document.createElement('button');
                    closeBtn2.textContent = 'Entendi';
                    closeBtn2.style.cssText = 'width:100%;background:#FFC107;color:#000;border:none;padding:14px;border-radius:10px;font-weight:bold;font-size:15px;cursor:pointer;';
                    closeBtn2.onclick = function() { banner.remove(); sessionStorage.setItem('pwa_dismissed','1'); };
                    banner.appendChild(logo);
                    banner.appendChild(text);
                    banner.appendChild(closeBtn2);
                  }

                  document.body.appendChild(banner);
                }

                window.addEventListener('load', function() {
                  setTimeout(function() {
                    if (isIOS() && !isStandalone()) {
                      showInstallBanner('ios');
                    }
                  }, 3000);
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
