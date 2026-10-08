const BASE_URL = '/api/v1';

function getHeaders(isMultipart = false): HeadersInit {
  const token = localStorage.getItem('educaro_token');
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  auth: {
    guest: async (goal?: string) => {
      const res = await fetch(`${BASE_URL}/auth/guest`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ goal }),
      });
      if (!res.ok) throw new Error('Guest login failed');
      return res.json();
    },
    login: async (email: string, password?: string) => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Login failed');
      return res.json();
    },
    google: async (data: {
      credential?: string;
      email?: string;
      name?: string;
      googleId?: string;
      avatarUrl?: string;
    }) => {
      const res = await fetch(`${BASE_URL}/auth/google`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Google authentication failed');
      }
      return res.json();
    },
    register: async (email: string, password?: string, role = 'APPLICANT') => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password, role }),
      });
      if (!res.ok) throw new Error('Registration failed');
      return res.json();
    },
    me: async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch user session');
      return res.json();
    },
  },

  // Profile & Facts
  profile: {
    get: async () => {
      const res = await fetch(`${BASE_URL}/profile`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to load profile');
      return res.json();
    },
    update: async (data: any) => {
      const res = await fetch(`${BASE_URL}/profile`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    consent: async (version?: string) => {
      const res = await fetch(`${BASE_URL}/profile/consent`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ version }),
      });
      return res.json();
    },
    confirmFact: async (factId: string) => {
      const res = await fetch(`${BASE_URL}/profile/facts/${factId}/confirm`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      return res.json();
    },
    editFact: async (factId: string, value: any) => {
      const res = await fetch(`${BASE_URL}/profile/facts/${factId}/edit`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ value }),
      });
      return res.json();
    },
    rejectFact: async (factId: string) => {
      const res = await fetch(`${BASE_URL}/profile/facts/${factId}/reject`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      return res.json();
    },
  },

  // Conversations & Messages
  conversations: {
    getMessages: async (conversationId: string) => {
      const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
        headers: getHeaders(),
      });
      return res.json();
    },
    sendMessage: async (conversationId: string, content: string, uiResponse?: any) => {
      const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content, uiResponse }),
      });
      return res.json();
    },
  },

  // Documents
  documents: {
    upload: async (file: File, conversationId?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      const url = conversationId
        ? `${BASE_URL}/documents?conversationId=${conversationId}`
        : `${BASE_URL}/documents`;
      const res = await fetch(url, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      return res.json();
    },
    list: async () => {
      const res = await fetch(`${BASE_URL}/documents`, { headers: getHeaders() });
      return res.json();
    },
    updateExtraction: async (id: string, status: string, editedValue?: any) => {
      const res = await fetch(`${BASE_URL}/documents/extractions/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, editedValue }),
      });
      return res.json();
    },
  },

  // Media
  media: {
    uploadVideo: async (file: Blob | File) => {
      const formData = new FormData();
      formData.append('file', file, 'intro_video.webm');
      const res = await fetch(`${BASE_URL}/media/intro-video`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });
      return res.json();
    },
    get: async (id: string) => {
      const res = await fetch(`${BASE_URL}/media/${id}`, { headers: getHeaders() });
      return res.json();
    },
  },

  // Validation
  validation: {
    run: async () => {
      const res = await fetch(`${BASE_URL}/validation/run`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return res.json();
    },
    getClarifications: async () => {
      const res = await fetch(`${BASE_URL}/clarifications`, { headers: getHeaders() });
      return res.json();
    },
    resolveTask: async (id: string, resolution: any) => {
      const res = await fetch(`${BASE_URL}/clarifications/${id}/resolve`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ resolution }),
      });
      return res.json();
    },
  },

  // Qualification
  qualification: {
    run: async () => {
      const res = await fetch(`${BASE_URL}/qualification/run`, {
        method: 'POST',
        headers: getHeaders(),
      });
      return res.json();
    },
    getLatest: async () => {
      const res = await fetch(`${BASE_URL}/qualification/latest`, { headers: getHeaders() });
      return res.json();
    },
    whatIf: async (params: { germanLevel?: string; englishLevel?: string; yearsOfExperience?: number; hasAps?: boolean }) => {
      const q = new URLSearchParams();
      if (params.germanLevel) q.set('germanLevel', params.germanLevel);
      if (params.englishLevel) q.set('englishLevel', params.englishLevel);
      if (params.yearsOfExperience) q.set('yearsOfExperience', String(params.yearsOfExperience));
      if (params.hasAps !== undefined) q.set('hasAps', String(params.hasAps));
      const res = await fetch(`${BASE_URL}/qualification/what-if?${q.toString()}`, {
        headers: getHeaders(),
      });
      return res.json();
    },
  },

  // Recommendations & Referrals
  recommendations: {
    list: async () => {
      const res = await fetch(`${BASE_URL}/recommendations`, { headers: getHeaders() });
      return res.json();
    },
    bookReferral: async (notes?: string, slotRequestedAt?: string) => {
      const res = await fetch(`${BASE_URL}/referrals`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ notes, slotRequestedAt }),
      });
      return res.json();
    },
  },

  // CV Studio
  cv: {
    generate: async (templateId = 'modern_german', language = 'EN') => {
      const res = await fetch(`${BASE_URL}/cv/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ templateId, language }),
      });
      return res.json();
    },
    get: async (id: string) => {
      const res = await fetch(`${BASE_URL}/cv/${id}`, { headers: getHeaders() });
      return res.json();
    },
    updateSections: async (id: string, sections: any) => {
      const res = await fetch(`${BASE_URL}/cv/${id}/sections`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ sections }),
      });
      return res.json();
    },
    getPdfUrl: (id: string) => `${BASE_URL}/cv/${id}/pdf`,
  },

  // Consultant & Analytics
  consultant: {
    getFunnel: async () => {
      const res = await fetch(`${BASE_URL}/analytics/funnel`, { headers: getHeaders() });
      return res.json();
    },
    getApplicants: async () => {
      const res = await fetch(`${BASE_URL}/consultant/applicants`, { headers: getHeaders() });
      return res.json();
    },
    getApplicantDetail: async (id: string) => {
      const res = await fetch(`${BASE_URL}/consultant/applicants/${id}`, { headers: getHeaders() });
      return res.json();
    },
  },
};
