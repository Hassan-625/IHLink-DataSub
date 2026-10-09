import {AppSecurityStatusSync} from '@/components/AppSecurityStatusSync';
import {DataSubSecuritySetup} from '@/components/DataSubSecuritySetup';
import {ReferralCapture} from '@/components/ReferralCapture';
import {NativeSessionGate} from '@/components/NativeSessionGate';
import {NativeMobileShell} from '@/components/NativeMobileShell';
import{AccountClosureControl}from'@/components/AccountClosureControl';
import { Component, StrictMode, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { AuthProvider } from "@/context/AuthContext";
import "./index.css";
import { enforceDeploymentSurface } from "@/lib/deploymentSurface";

class StartupErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("IHLink startup/render error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: "100vh", padding: "32px", fontFamily: "system-ui, sans-serif", background: "#fff", color: "#071A3D" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>IHLink could not start</h1>
          <p style={{ marginTop: "12px", maxWidth: "720px" }}>
            We could not open this page. Please reopen the app or refresh your browser and try again.
          </p>
          <button type="button" onClick={()=>window.location.reload()} style={{marginTop:20,padding:12,borderRadius:12}}>Try again</button>
        </main>
      );
    }
    return this.props.children;
  }
}

enforceDeploymentSurface();
const savedAppearance=localStorage.getItem('ihlink-appearance')||'light';
document.documentElement.dataset.appearance=savedAppearance;
document.documentElement.dataset.density=localStorage.getItem('ihlink-density')||'comfortable';

const root = document.getElementById("root");
if (!root) {
  throw new Error("IHLink root element was not found.");
}

createRoot(root).render(
  <StrictMode>
    <StartupErrorBoundary>
      <BrowserRouter>
        <NativeSessionGate><AuthProvider>
          <NativeMobileShell><ReferralCapture/><App/><DataSubSecuritySetup/><AppSecurityStatusSync/><AccountClosureControl/></NativeMobileShell>
        </AuthProvider></NativeSessionGate>
      </BrowserRouter>
    </StartupErrorBoundary>
  </StrictMode>,
);
