export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message?: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export const validateField = (
  value: string,
  rules: ValidationRule,
): string | null => {
  if (rules.required && !value.trim()) {
    return rules.message || "This field is required";
  }

  if (rules.minLength && value.length < rules.minLength) {
    return rules.message || `Minimum length is ${rules.minLength} characters`;
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    return rules.message || `Maximum length is ${rules.maxLength} characters`;
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    return rules.message || "Invalid format";
  }

  if (rules.custom && !rules.custom(value)) {
    return rules.message || "Validation failed";
  }

  return null;
};

export const validateForm = (
  values: Record<string, string>,
  rules: ValidationRules,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((field) => {
    const error = validateField(values[field] || "", rules[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

// Common validation rules
export const emailRule: ValidationRule = {
  required: true,
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  message: "Please enter a valid email address",
};

export const passwordRule: ValidationRule = {
  required: true,
  minLength: 6,
  message: "Password must be at least 6 characters",
};

export const usernameRule: ValidationRule = {
  required: true,
  minLength: 3,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_]+$/,
  message:
    "Username must be 3-20 characters and contain only letters, numbers, and underscores",
};
