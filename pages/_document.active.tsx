
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR" className="scroll-smooth">
      <Head>
        <meta name="application-name" content="Divvy" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Divvy" />
        <meta name="description" content="Divisão de despesas em grupo simplificada." />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#8b5cf6" />
        
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>
      <body className="bg-gray-50 dark:bg-dark-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storage = localStorage.getItem('divvy-theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (storage === 'dark' || (!storage && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
