
import { GoogleGenAI, Type } from "@google/genai";
import { Fine, ProcessingResult, VehicleData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const VEHICLE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    plate: { 
      type: Type.STRING, 
      description: "A placa do veículo identificada no texto (ex: ACV5H33)" 
    },
    fines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: "Data e hora da multa (ex: 22/11/2025 10:52)" },
          description: { type: Type.STRING, description: "Descrição detalhada da infração" },
          location: { type: Type.STRING, description: "Local da infração se disponível" },
          infractionId: { type: Type.STRING, description: "Auto de Infração (ex: J005020835)" },
          points: { type: Type.STRING, description: "Pontuação estimada" },
          amount: { type: Type.NUMBER, description: "Valor em reais apenas números (ex: 130.16)" },
        },
        required: ["date", "description", "infractionId", "amount"],
      },
    }
  },
  required: ["plate", "fines"]
};

const PROCESSING_SCHEMA = {
  type: Type.ARRAY,
  items: VEHICLE_SCHEMA,
  description: "Lista de veículos e suas multas encontradas no texto"
};

export async function processFinesData(
  content: string,
  isImage: boolean = false
): Promise<ProcessingResult> {
  try {
    const model = 'gemini-3-flash-preview';
    
    let contents: any;
    if (isImage) {
      const base64Data = content.split(',')[1];
      contents = {
        parts: [
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
          { text: "Identifique TODAS as PLACAS de veículos e extraia todas as multas da imagem. Retorne uma lista para cada placa encontrada." }
        ]
      };
    } else {
      contents = `Identifique TODAS as PLACAS de veículos e extraia as multas do seguinte texto. \n\n${content}`;
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: PROCESSING_SCHEMA,
        systemInstruction: "Você é um especialista em processamento de dados do portal SENATRAN/DETRAN. Sua missão é ler o texto fornecido, localizar TODAS as PLACAS de veículos mencionadas e listar as infrações para cada uma delas separadamente. O 'Auto de Infração' é o identificador único."
      }
    });

    const results = JSON.parse(response.text || "[]");
    
    return results.map((v: any) => ({
      plate: v.plate?.toUpperCase().replace(/[^A-Z0-9]/g, '') || '',
      fines: (v.fines || []).map((f: any) => ({
        ...f,
        id: crypto.randomUUID(),
        amount: typeof f.amount === 'string' ? parseFloat(f.amount.replace(/[^\d,.]/g, '').replace(',', '.')) : f.amount,
        plate: v.plate?.toUpperCase().replace(/[^A-Z0-9]/g, '') || ''
      }))
    }));

  } catch (error) {
    console.error("Error processing fines:", error);
    throw error;
  }
}
