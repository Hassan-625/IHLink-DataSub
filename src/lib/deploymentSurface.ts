export type DeploymentSurface = "datasub";

export function deploymentSurface(): DeploymentSurface {
  return "datasub";
}

export function enforceDeploymentSurface() {
  if (typeof window === "undefined") return;

  const path = window.location.pathname;
  const shared = ["/signin", "/register", "/verify-email", "/reset-password", "/auth", "/account", "/admin"];

  if (path === "/" || path === "/dashboard" || path === "/welcome-tour") return;
  if (shared.some((prefix) => path === prefix || path.startsWith(prefix + "/"))) return;
  if (path === "/datasub" || path.startsWith("/datasub/")) return;

  window.location.replace("/datasub");
}
