export interface UserSettings {
  name: string;
  themeSelected: string;
}

export interface EditUserRequest {
  user_id: number;
  name: string;
  themeSelected: string;
}

export interface EditUserResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    themeSelected: string;
  };
}
