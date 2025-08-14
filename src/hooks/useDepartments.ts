'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  fetchAllDepartments, 
  createNewDepartment,
  type DepartmentOption, 
  type DepartmentPayload 
} from '@/app/actions/teamtailor';

interface UseDepartmentsReturn {
  departments: DepartmentOption[];
  loading: boolean;
  error: string | null;
  refreshDepartments: () => Promise<void>;
  createDepartment: (data: DepartmentPayload) => Promise<DepartmentOption>;
}

export function useDepartments(): UseDepartmentsReturn {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedDepartments = await fetchAllDepartments();
      setDepartments(fetchedDepartments);
    } catch (err) {
      console.warn('TeamTailor departments not available, falling back to static departments:', err);
      setError(err instanceof Error ? err.message : 'TeamTailor departments not available');
    } finally {
      setLoading(false);
    }
  }, []);

  const createDepartment = useCallback(async (data: DepartmentPayload): Promise<DepartmentOption> => {
    try {
      const newDepartment = await createNewDepartment(data);
      setDepartments(prev => [...prev, newDepartment]);
      return newDepartment;
    } catch (err) {
      console.error('Failed to create department:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    refreshDepartments();
  }, [refreshDepartments]);

  return {
    departments,
    loading,
    error,
    refreshDepartments,
    createDepartment,
  };
}