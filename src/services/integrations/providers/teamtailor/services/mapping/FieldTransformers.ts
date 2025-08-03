/**
 * Field Transformers
 * Collection of transformation functions for field mapping
 */
export class FieldTransformers {
  /**
   * Sanitize HTML content for TeamTailor
   */
  static sanitizeHtml(value: unknown): string {
    if (typeof value !== "string") return String(value || "");
    
    // Basic HTML sanitization - remove dangerous elements but keep formatting
    return value
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
      .replace(/<object[^>]*>.*?<\/object>/gi, "")
      .replace(/<embed[^>]*>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "") // Remove event handlers
      .trim();
  }

  /**
   * Map employment type to TeamTailor format
   */
  static mapEmploymentType(value: unknown): string {
    if (typeof value !== "string") return "";
    
    const typeMap: Record<string, string> = {
      "full-time": "full_time",
      "full_time": "full_time",
      "fulltime": "full_time",
      "part-time": "part_time",
      "part_time": "part_time",
      "parttime": "part_time",
      "contract": "contract",
      "contractor": "contract",
      "freelance": "freelance",
      "intern": "internship",
      "internship": "internship",
      "temporary": "temporary",
      "temp": "temporary",
    };
    
    return typeMap[value.toLowerCase()] || value;
  }

  /**
   * Format date for TeamTailor API
   */
  static formatDate(value: unknown): string {
    if (!value) return "";
    
    try {
      // Convert to string first if it's not already
      const dateString = typeof value === 'string' ? value : String(value);
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      return date.toISOString().split("T")[0]; // YYYY-MM-DD format
    } catch {
      return "";
    }
  }

  /**
   * Ensure value is an array
   */
  static ensureArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map(String).filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
      return value.split(",").map(s => s.trim()).filter(Boolean);
    }
    return [];
  }

  /**
   * Map status to TeamTailor format
   */
  static mapStatus(value: unknown): string {
    if (typeof value !== "string") return "published";
    
    const statusMap: Record<string, string> = {
      "active": "published",
      "published": "published",
      "draft": "draft",
      "inactive": "archived",
      "archived": "archived",
      "closed": "archived",
    };
    
    return statusMap[value.toLowerCase()] || "published";
  }

  /**
   * Reverse map employment type from TeamTailor format
   */
  static reverseMapEmploymentType(value: string): string {
    const reverseMap: Record<string, string> = {
      "full_time": "full-time",
      "part_time": "part-time",
      "contract": "contract",
      "freelance": "freelance",
      "internship": "internship",
      "temporary": "temporary",
    };
    
    return reverseMap[value] || value;
  }

  /**
   * Reverse map status from TeamTailor format
   */
  static reverseMapStatus(value: string): string {
    const reverseMap: Record<string, string> = {
      "published": "active",
      "draft": "draft",
      "archived": "inactive",
    };
    
    return reverseMap[value] || value;
  }
}