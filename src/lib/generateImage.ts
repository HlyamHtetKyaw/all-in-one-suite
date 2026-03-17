export type ImageProvider = 'openai' | 'gemini';
export type TextMode = 'ai' | 'overlay' | 'both';

export type GenerateImageRequest = {
  provider: ImageProvider;
  prompt: string;
  size?: string; // e.g. "1024x1024" (backend also accepts "16:9")
  burmeseText?: string; // used for AI text and/or overlay depending on textMode
  textMode?: TextMode; // default: "overlay"
  overlay?: {
    fontFamily?: string;
    fontSizePx?: number;
    textColorHex?: string;
    strokeColorHex?: string;
    strokeWidthPx?: number;
    position?: 'top' | 'center' | 'bottom';
    paddingPx?: number;
    addShadow?: boolean;
  };
};

export type GenerateImageResponse = {
  provider: ImageProvider;
  mimeType: string; // "image/png"
  imageBase64: string;
};

const API_BASE = 'http://localhost:8080';

export async function generateImage(req: GenerateImageRequest): Promise<GenerateImageResponse> {
  const res = await fetch(`${API_BASE}/api/images/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to generate image');
  }
  return data as GenerateImageResponse;
}

export function base64ToDataUrl(mimeType: string, base64: string): string {
  return `data:${mimeType};base64,${base64}`;
}

