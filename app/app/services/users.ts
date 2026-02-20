export type UserInfo = {
  id: number;
  name: string;
  email: string;
};

const API_BASE_URL = "http://localhost:3000";

export async function getInfos(): Promise<UserInfo[]> {
  const response = await fetch(`${API_BASE_URL}/infos`);

  if (!response.ok) {
    throw new Error(`Failed to fetch infos: ${response.status}`);
  }

  return response.json();
}
