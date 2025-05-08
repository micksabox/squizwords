// @ts-ignore
import acvm from '@noir-lang/acvm_js/web/acvm_js_bg.wasm?url';
// @ts-ignore
import noirc from '@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url';
import initNoirC from '@noir-lang/noirc_abi';
import initACVM from '@noir-lang/acvm_js';
// @ts-ignore
await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))]);

import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import Squizword from './components/Squizword.jsx';
import Homepage from './components/Homepage.jsx';
import Layout from './components/Layout.jsx';
import { BrowserRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { defineChain, createClient } from 'viem';
import { injected } from 'wagmi/connectors';
import networkConfig from '../../deployment.json' assert { type: 'json' };

const queryClient = new QueryClient();

const chain = defineChain({
  ...networkConfig.networkConfig,
});

const config = createConfig({
  connectors: [injected()],
  chains: [chain],
  client({ chain }) {
    return createClient({ chain, transport: http() });
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{mounted && children}</QueryClientProvider>
    </WagmiProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
          <Route path="/" element={<Homepage />} />
          <Route path="/puzzle/:slug" element={<Squizword />} />
          </Route>
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </Providers>
  </React.StrictMode>,
);
