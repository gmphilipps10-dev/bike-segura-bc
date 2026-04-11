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
                  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#1a1a1a;border-top:2px solid #FFC107;padding:16px;display:flex;align-items:center;gap:12px;z-index:99999;font-family:-apple-system,sans-serif;';

                  var icon = document.createElement('div');
                  icon.style.cssText = 'width:44px;height:44px;border-radius:10px;overflow:hidden;flex-shrink:0;';
                  icon.innerHTML = '<img src="/icon-192.png" style="width:100%;height:100%;" />';

                  var text = document.createElement('div');
                  text.style.cssText = 'flex:1;';

                  if (type === 'android') {
                    text.innerHTML = '<div style="color:#FFC107;font-weight:bold;font-size:14px;">Instalar Bike Segura BC</div><div style="color:#999;font-size:12px;margin-top:2px;">Acesse mais rapido pela tela inicial</div>';
                    var btn = document.createElement('button');
                    btn.textContent = 'Instalar';
                    btn.style.cssText = 'background:#FFC107;color:#000;border:none;padding:10px 20px;border-radius:8px;font-weight:bold;font-size:14px;cursor:pointer;flex-shrink:0;';
                    btn.onclick = function() {
                      if (deferredPrompt) {
                        deferredPrompt.prompt();
                        deferredPrompt.userChoice.then(function() { deferredPrompt = null; });
                      }
                      banner.remove();
                    };
                    banner.appendChild(icon);
                    banner.appendChild(text);
                    banner.appendChild(btn);
                  } else {
                    text.innerHTML = '<div style="color:#FFC107;font-weight:bold;font-size:14px;">Instalar Bike Segura BC</div><div style="color:#999;font-size:12px;margin-top:2px;">Toque em <span style="color:#FFC107;">Compartilhar</span> e depois em <span style="color:#FFC107;">Adicionar a Tela de Inicio</span></div>';
                    banner.appendChild(icon);
                    banner.appendChild(text);
                  }

                  var close = document.createElement('button');
                  close.textContent = '✕';
                  close.style.cssText = 'background:none;border:none;color:#666;font-size:20px;cursor:pointer;padding:8px;flex-shrink:0;';
                  close.onclick = function() {
                    banner.remove();
                    sessionStorage.setItem('pwa_dismissed', '1');
                  };
                  banner.appendChild(close);

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
