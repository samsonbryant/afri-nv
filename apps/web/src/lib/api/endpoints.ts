export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login/",
    register: "/auth/register/",
    logout: "/auth/logout/",
    refresh: "/auth/refresh/",
    me: "/auth/me/",
  },
  organizations: {
    list: "/organizations/",
    detail: (id: string) => `/organizations/${id}/`,
    members: (id: string) => `/organizations/${id}/members/`,
  },
  workflows: {
    list: "/workflows/",
    detail: (id: string) => `/workflows/${id}/`,
    create: "/workflows/",
    update: (id: string) => `/workflows/${id}/`,
    delete: (id: string) => `/workflows/${id}/`,
    run: (id: string) => `/workflows/${id}/run/`,
  },
  automations: {
    list: "/automations/",
    detail: (id: string) => `/automations/${id}/`,
    create: "/automations/",
    update: (id: string) => `/automations/${id}/`,
    delete: (id: string) => `/automations/${id}/`,
    toggle: (id: string) => `/automations/${id}/toggle/`,
  },
  dashboard: {
    stats: "/dashboard/stats/",
    activity: "/dashboard/activity/",
  },
  settings: {
    profile: "/settings/profile/",
    preferences: "/settings/preferences/",
  },
} as const;
