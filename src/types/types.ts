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
    userId: string;
    formData: string;
    website: string;
} 