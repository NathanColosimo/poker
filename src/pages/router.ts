import { useState, useEffect } from "react";

// Simple hash-based router for this app
export function useRoute() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || "/");

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash.slice(1) || "/");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return route;
}

export function useNavigate() {
  return (path: string) => {
    window.location.hash = path;
  };
}

export function parseRoute(route: string): { path: string; params: Record<string, string> } {
  const [path, ...segments] = route.split("/").filter(Boolean);
  const params: Record<string, string> = {};
  
  // Simple pattern matching for routes like /lobby/:gameId
  if (route.startsWith("/lobby/") && segments.length >= 2) {
    params.gameId = segments[1];
  } else if (route.startsWith("/ordering/") && segments.length >= 2) {
    params.gameId = segments[1];
  } else if (route.startsWith("/game/") && segments.length >= 2) {
    params.gameId = segments[1];
  }

  return { path: `/${path || ""}`, params };
}

