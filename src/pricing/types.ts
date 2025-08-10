import { z } from 'zod';

// Schema for a single model's pricing information
export const ModelPricingSchema = z.object({
  // Token limits (can be string or number in the source data)
  max_tokens: z.union([z.number(), z.string()]).optional(),
  max_input_tokens: z.union([z.number(), z.string()]).optional(),
  max_output_tokens: z.union([z.number(), z.string()]).optional(),
  
  // Base pricing (optional for image models)
  input_cost_per_token: z.number().optional(),
  output_cost_per_token: z.number().optional(),
  
  // Tiered pricing (for models like Gemini)
  input_cost_per_token_above_200k_tokens: z.number().optional(),
  output_cost_per_token_above_200k_tokens: z.number().optional(),
  
  // Cache pricing
  cache_read_input_token_cost: z.number().optional(),
  
  // Provider info
  litellm_provider: z.string().optional(),
  mode: z.string().optional(),
  
  // Capabilities
  supports_vision: z.boolean().optional(),
  supports_function_calling: z.boolean().optional(),
  supports_parallel_function_calling: z.boolean().optional(),
  supports_response_schema: z.boolean().optional(),
  supports_prompt_caching: z.boolean().optional(),
  supports_system_messages: z.boolean().optional(),
  supports_tool_choice: z.boolean().optional(),
  supports_native_streaming: z.boolean().optional(),
  supports_reasoning: z.boolean().optional(),
  supports_web_search: z.boolean().optional(),
  supports_audio_input: z.boolean().optional(),
  supports_video_input: z.boolean().optional(),
  supports_pdf_input: z.boolean().optional(),
  
  // Media limits
  max_images_per_prompt: z.number().optional(),
  max_videos_per_prompt: z.number().optional(),
  max_video_length: z.number().optional(),
  max_audio_length_hours: z.number().optional(),
  max_audio_per_prompt: z.number().optional(),
  max_pdf_size_mb: z.number().optional(),
  
  // Endpoints and modalities
  supported_endpoints: z.array(z.string()).optional(),
  supported_modalities: z.array(z.string()).optional(),
  supported_output_modalities: z.array(z.string()).optional(),
  
  // Source
  source: z.string().optional(),
  
  // Image model pricing
  input_cost_per_image: z.number().optional(),
  output_cost_per_image: z.number().optional(),
  cost_per_image: z.number().optional(),
}).refine(
  (data) => {
    // Must have either token-based or image-based pricing
    const hasTokenPricing = data.input_cost_per_token !== undefined && data.output_cost_per_token !== undefined;
    const hasImagePricing = data.input_cost_per_image !== undefined || data.output_cost_per_image !== undefined || data.cost_per_image !== undefined;
    return hasTokenPricing || hasImagePricing;
  },
  {
    message: "Model must have either token-based or image-based pricing",
  }
);

export type ModelPricing = z.infer<typeof ModelPricingSchema>;

// Schema for the entire pricing data structure from LiteLLM
export const PricingDataSchema = z.record(z.string(), ModelPricingSchema);

export type PricingData = z.infer<typeof PricingDataSchema>;

// Cache metadata
export interface CacheMetadata {
  timestamp: number;
  source: string;
  ttl: number;
}

// Cache file structure
export interface CacheFile {
  metadata: CacheMetadata;
  data: PricingData;
}

// Simplified pricing info for cost calculation
export interface SimplifiedPricing {
  model: string;
  inputCostPerToken: number;
  outputCostPerToken: number;
  inputCostPerTokenAbove200k?: number;
  outputCostPerTokenAbove200k?: number;
  maxInputTokens?: number;
  maxOutputTokens?: number;
}

// Cost calculation result
export interface CostCalculation {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
  tieredPricingApplied: boolean;
}