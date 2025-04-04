export interface ArticleFormData {
  titel: string;
  event: string;
  beschrijving: string;
  potentialKeywords: string;
  datum: string;
  winkelvoorbeelden: string;
}

export interface form_check_input {
  form_input: string;
  rules: string;
}

export interface ArticleGenerationRequest {
  orgId: string;
  formData: ArticleFormData;
  website?: string;
  moduleId?: number;
  imageUrls?: string[];
}

// Basic field definition
export interface FormField {
  id:  string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;  // For select, checkbox, radio
}

// Form schema definition
export interface FormSchema {
  title?: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
}
