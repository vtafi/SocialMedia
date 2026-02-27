import { useState, ChangeEvent, FormEvent } from "react";
import { ValidationRules, validateForm } from "../utils/validation";

interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: ValidationRules;
  onSubmit: (values: T) => Promise<void> | void;
}

export const useForm = <T extends Record<string, string>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: UseFormOptions<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof T]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate on blur
    if (validationRules[name]) {
      const formErrors = validateForm(values, validationRules);
      if (formErrors[name]) {
        setErrors((prev) => ({ ...prev, [name]: formErrors[name] }));
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce(
      (acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      },
      {} as Partial<Record<keyof T, boolean>>,
    );
    setTouched(allTouched);

    // Validate all fields
    const formErrors = validateForm(values, validationRules);

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors as Partial<Record<keyof T, string>>);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  const setFieldError = (field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldError,
  };
};
