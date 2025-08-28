export interface UserSettings {
  name: string;
  themeSelected: 'light' | 'dark' | 'rosa';
}

export interface EditUserRequest {
  user_id: number;
  name: string;
  themeSelected: 'light' | 'dark' | 'rosa';
}

export interface EditUserResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    themeSelected: 'light' | 'dark' | 'rosa';
  };
}
