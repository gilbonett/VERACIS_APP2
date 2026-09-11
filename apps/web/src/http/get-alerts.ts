export async function getAlerts() {
  const response = await fetch("/api/proxy/alerts");
  return response.json();
}
