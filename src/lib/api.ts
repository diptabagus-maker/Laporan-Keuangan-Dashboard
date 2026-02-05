const API_BASE_URL = '/api';

export interface User {
    id: string;
    username: string;
}

export interface Section {
    id: string;
    label: string;
    user_id?: string;
}

export interface MenuItem {
    id: string;
    label: string;
    type: string;
    icon_name?: string;
    section_id?: string;
    user_id?: string;
    icon?: any; // For frontend compatibility
}

export interface Transaction {
    id: string;
    menu_id?: string;
    user_id?: string;
    date: string;
    description: string;
    type: 'in' | 'out';
    amount: number;
    category: string;
    proof_image?: string;
}

export interface DivisionSetting {
    id: string;
    name: string;
    nominal: number;
    display_order?: number;
}

const api = {
    // Auth
    login: async (username: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        return response.json();
    },

    // Sections
    getSections: async (): Promise<Section[]> => {
        const response = await fetch(`${API_BASE_URL}/sections`);
        return response.json();
    },

    createSection: async (section: Partial<Section>): Promise<Section> => {
        const response = await fetch(`${API_BASE_URL}/sections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(section),
        });
        return response.json();
    },

    updateSection: async (id: string, section: Partial<Section>): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE_URL}/sections/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(section),
        });
        return response.json();
    },

    deleteSection: async (id: string): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE_URL}/sections/${id}`, {
            method: 'DELETE',
        });
        return response.json();
    },

    // Menus
    getMenus: async (): Promise<MenuItem[]> => {
        const response = await fetch(`${API_BASE_URL}/menus`);
        return response.json();
    },

    createMenu: async (menu: Partial<MenuItem>): Promise<MenuItem> => {
        const response = await fetch(`${API_BASE_URL}/menus`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(menu),
        });
        return response.json();
    },

    updateMenu: async (id: string, menu: Partial<MenuItem>): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE_URL}/menus/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(menu),
        });
        return response.json();
    },

    deleteMenu: async (id: string): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE_URL}/menus/${id}`, {
            method: 'DELETE',
        });
        return response.json();
    },

    // Transactions
    getTransactions: async (menuId: string): Promise<Transaction[]> => {
        const response = await fetch(`${API_BASE_URL}/transactions/${menuId}`);
        return response.json();
    },

    createTransaction: async (transaction: Partial<Transaction>): Promise<Transaction> => {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction),
        });
        if (!response.ok) {
            const text = await response.text();
            console.error('Server error body:', text);
            try {
                const errorData = JSON.parse(text);
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}. Body: ${text.substring(0, 200)}`);
            }
        }
        return response.json();
    },

    updateTransaction: async (id: string, transaction: Partial<Transaction>): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    deleteTransaction: async (id: string): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    // Users
    getUsers: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/users`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    createUser: async (user: any): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    deleteUser: async (id: string): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    // Division Settings
    getDivisionSettings: async (): Promise<DivisionSetting[]> => {
        const response = await fetch(`${API_BASE_URL}/division-settings`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    createDivisionSetting: async (setting: Partial<DivisionSetting>): Promise<DivisionSetting> => {
        const response = await fetch(`${API_BASE_URL}/division-settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setting),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    updateDivisionSetting: async (id: string, setting: Partial<DivisionSetting>): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE_URL}/division-settings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setting),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    deleteDivisionSetting: async (id: string): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_BASE_URL}/division-settings/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    },
};

export default api;
