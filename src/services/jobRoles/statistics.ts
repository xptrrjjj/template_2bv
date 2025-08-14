// SOLID Principle: Single Responsibility - Statistics and analytics
import type { 
  IJobRoleStatisticsService,
  IJobRoleRepository,
  JobRoleStatistics
} from './interfaces';

export class JobRoleStatisticsService implements IJobRoleStatisticsService {
  constructor(private repository: IJobRoleRepository) {}

  async getStatistics(): Promise<JobRoleStatistics> {
    try {
      const jobRoles = await this.repository.getAllJobRoles();

      const stats: JobRoleStatistics = {
        total_roles: jobRoles.length,
        active_roles: jobRoles.filter(r => r.status === 'active').length,
        filled_roles: jobRoles.filter(r => r.status === 'filled').length,
        total_openings: jobRoles.reduce((sum, r) => sum + r.openings_count, 0),
        total_filled: jobRoles.reduce((sum, r) => sum + r.filled_count, 0),
        fill_rate: 0,
        avg_time_to_fill: 0,
        roles_by_department: {},
        roles_by_level: {} as Record<string, number>,
        priority_roles: jobRoles.filter(r => r.is_priority).length,
        teamtailor_published: jobRoles.filter(r => r.published_to_teamtailor).length
      };

      // Calculate fill rate
      if (stats.total_openings > 0) {
        stats.fill_rate = (stats.total_filled / stats.total_openings) * 100;
      }

      // Calculate average time to fill for filled roles
      const filledRoles = jobRoles.filter(r => r.status === 'filled');
      if (filledRoles.length > 0) {
        const totalDays = filledRoles.reduce((sum, r) => sum + r.days_open, 0);
        stats.avg_time_to_fill = totalDays / filledRoles.length;
      }

      // Group by department
      jobRoles.forEach(role => {
        stats.roles_by_department[role.department] = 
          (stats.roles_by_department[role.department] || 0) + 1;
      });

      // Group by level
      jobRoles.forEach(role => {
        stats.roles_by_level[role.level] = 
          (stats.roles_by_level[role.level] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('JobRoleStatisticsService.getStatistics error:', error);
      throw error;
    }
  }

  async getRolesByDepartment(): Promise<Record<string, number>> {
    try {
      const stats = await this.getStatistics();
      return stats.roles_by_department;
    } catch (error) {
      console.error('JobRoleStatisticsService.getRolesByDepartment error:', error);
      throw error;
    }
  }

  async getFilledVsOpenRoles(): Promise<{ filled: number; open: number }> {
    try {
      const stats = await this.getStatistics();
      return {
        filled: stats.total_filled,
        open: stats.total_openings - stats.total_filled
      };
    } catch (error) {
      console.error('JobRoleStatisticsService.getFilledVsOpenRoles error:', error);
      throw error;
    }
  }
}