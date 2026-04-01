/**
 * Admin Dashboard Service
 * File: src/services/AdminDashboardService.ts
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class AdminDashboardService {
  /**
   * Get admin dashboard statistics
   */
  static async getDashboardStats() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get admin overview
   */
  static async getAdminOverview() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/overview`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch admin overview:', error);
      throw error;
    }
  }

  /**
   * Get all teachers list
   */
  static async getTeachersList(params?: {
    department?: string;
    limit?: number;
    page?: number;
  }) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/teachers`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch teachers list:', error);
      throw error;
    }
  }

  /**
   * Get teacher detail with allocation info
   */
  static async getTeacherDetail(teacherId: string) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/teachers/${teacherId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch teacher ${teacherId}:`, error);
      throw error;
    }
  }

  /**
   * Get all allocated duties
   */
  static async getAllDuties(params?: {
    exam_id?: string;
    teacher_id?: string;
    limit?: number;
    page?: number;
  }) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/duties`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch duties:', error);
      throw error;
    }
  }

  /**
   * Get teachers on leave
   */
  static async getTeachersOnLeave(params?: {
    date?: string;
    limit?: number;
    page?: number;
  }) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/leaves`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch teachers on leave:', error);
      throw error;
    }
  }
}
