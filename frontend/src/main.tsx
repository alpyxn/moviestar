import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { ReactKeycloakProvider } from "@react-keycloak/web"
import keycloak from "./auth/keycloak"
import { Navbar } from './components/ui/navbar.tsx'

const initOptions = {
  onLoad: "check-sso",
  silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html", 
  checkLoginIframe: false,
  pkceMethod: "S256"
};

const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-lg">Loading...</div>
  </div>
);

const Layout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      <App />
    </main>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={initOptions}
      LoadingComponent={<Loading />}
      autoRefreshToken={true}
    >
      <Layout />
    </ReactKeycloakProvider>
  </BrowserRouter>
)
