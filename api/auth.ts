import api from "./base";

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    console.log(response.data.data);
    return response.data.data;
  },
  register: async (email: string, password: string, fullName: string) => {
    const response = await api.post("/auth/register", {
      email,
      password,
      fullName,
    });
    return response.data.data;
  },
  refreshToken: async (token: string) => {
    const response = await api.post("/auth/refresh", { refreshToken: token });
    return response.data;
  },
  logoutPost: async (token: string) => {
    const response = await api.post("/auth/logout", { refreshToken: token });
    return response.data;
  },
};
