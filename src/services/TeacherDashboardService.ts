/**
 * Teacher Dashboard Service
 * File: src/services/TeacherDashboardService.ts
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class TeacherDashboardService {
    /**
     * Get teacher dashboard statistics
     */
    static async getTeacherStats() {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/teacher/dashboard/stats`, {
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
            const response = await axios.get(`${API_BASE_URL}/teacher/profile`, {
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
            const response = await axios.get(`${API_BASE_URL}/teacher/duties`, {
                params,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch teacher duties:', error);
            throw error;
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
            const response = await axios.get(`${API_BASE_URL}/teacher/duties/upcoming`, {
                params,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch upcoming duties:', error);
            throw error;
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
            const response = await axios.get(`${API_BASE_URL}/teacher/leaves`, {
                params,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch teacher leaves:', error);
            throw error;
        }
    }
}
