import { Image } from "../entities/images.js";
import { Module } from "../entities/Module.js";

export interface form_check_input {
  form_input: string;
  rules: string;
}

export interface formData {
  titel: string;
  [key: string]: any;
}

export interface generateContentItemPayload {
  orgId: string;
  moduleId: number;
  formData: formData;
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

export interface imagePayload {
  images: {
    contentType: string;
    filename: string;
    uniqueFilename: string;
  }[];
}

export interface imagePayloadWithUrls {
  images: {
    contentType: string;
    filename: string;
    uniqueFilename: string;
    authenticatedUrl: string;
  }[];
}

export interface imagesWithDescription {
  images: {
    contentType: string;
    filename: string;
    uniqueFilename: string;
    authenticatedUrl: string;
    description: string;
  }[];
}

export interface imagesWithEmbeddings {
  images: {
    contentType: string;
    filename: string;
    uniqueFilename: string;
    authenticatedUrl: string;
    description: string;
    embedding: number[];
  }[];
}

export interface GenerateMetadataRequest {
  images: {
    contentType: string;
    filename: string;
    uniqueFilename: string;
    authenticatedUrl: string;
  }[];
  accessId: number;
}

export interface imagesSearchEmbeddings {
  paragraaf: string;
  beschrijving_afbeelding: string;
  searchEmbedding: number[];
  assets?: Image[];
}

export interface contentItemContext {
  formData: formData;
  contentCalendarId: number;
  availableStores: string;
  filteredStoresUrls: string[];
  scrapedWebPages: scrapedWebPages[];
  summarizedContext: scrapedWebPagesSummarized[];
  draftArticle: string;
  module: Module;
  internetSearch: string;
  nearestNeighborEmbeddings:imagesSearchEmbeddings[];
  relevantAssets:imagesSearchEmbeddings[];
  finalArticle: string;
}

export interface scrapedWebPages {
  [webpageName: string]: {
    url: string;
    content: string;
  } | {
    url: string;
    error: string;
  }
}

export interface scrapedWebPagesSummarized {
  [webpageName: string]: {
    url: string;
    content: string;
    summary: string;
  } | {
    url: string;
    error: string;
  }
}
