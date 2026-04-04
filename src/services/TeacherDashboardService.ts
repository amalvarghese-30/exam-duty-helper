// src/services/TeacherDashboardService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
console.log('API_BASE_URL:', API_BASE_URL);

export class TeacherDashboardService {
    /**
     * Get teacher dashboard statistics
     */
    static async getTeacherStats() {
        try {
            const token = localStorage.getItem('token');
            const userEmail = localStorage.getItem('userEmail');

            // Use the correct endpoint path
            const response = await axios.get(`${API_BASE_URL}/teacher/dashboard/stats`, {
                params: { email: userEmail },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch teacher stats:', error);
            throw error;
        }
    }

    /**
     * Get teacher profile
     */
    static async getTeacherProfile() {
        try {
            const token = localStorage.getItem('token');
            const userEmail = localStorage.getItem('userEmail');

            const response = await axios.get(`${API_BASE_URL}/teacher/dashboard/profile`, {
                params: { email: userEmail },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch teacher profile:', error);
            throw error;
        }
    }

    /**
     * Get teacher's duties
     */
    static async getTeacherDuties(params?: {
        status?: string;
        limit?: number;
        page?: number;
    }) {
        try {
            const token = localStorage.getItem('token');
            const userEmail = localStorage.getItem('userEmail');

            const response = await axios.get(`${API_BASE_URL}/teacher/dashboard/duties`, {
                params: { ...params, email: userEmail },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch teacher duties:', error);
            // Return empty data instead of throwing to avoid UI errors
            return { success: true, data: [] };
        }
    }

    /**
     * Get upcoming duties only
     */
    static async getUpcomingDuties(params?: {
        days?: number;
        limit?: number;
        page?: number;
    }) {
        try {
            const token = localStorage.getItem('token');
            const userEmail = localStorage.getItem('userEmail');

            const response = await axios.get(`${API_BASE_URL}/teacher/dashboard/duties/upcoming`, {
                params: { ...params, email: userEmail },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch upcoming duties:', error);
            return { success: true, data: [] };
        }
    }

    /**
     * Get teacher's leave records
     */
    static async getTeacherLeaves(params?: {
        limit?: number;
        page?: number;
    }) {
        try {
            const token = localStorage.getItem('token');
            const userEmail = localStorage.getItem('userEmail');

            const response = await axios.get(`${API_BASE_URL}/teacher/dashboard/leaves`, {
                params: { ...params, email: userEmail },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch teacher leaves:', error);
            return { success: true, data: [] };
        }
    }
}