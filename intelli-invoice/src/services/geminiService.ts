import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InvoiceData, InvoiceStatus } from "../types";

// Helper to convert File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64," or "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

const invoiceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    vendorName: { type: Type.STRING, description: "Name of the vendor, payee, or management organization (e.g., ООО 'МосОблЕИРЦ')" },
    invoiceNumber: { type: Type.STRING, description: "Invoice identifier number" },
    accountNumber: { type: Type.STRING, description: "Customer account number (specifically 'Лицевой счет' for Russian invoices)" },
    city: { type: Type.STRING, description: "City name extracted from the address line (e.g. from 'Адрес: ... Г.О. ДОЛГОПРУДНЫЙ'). Extract just the city name." },
    date: { type: Type.STRING, description: "Invoice date in YYYY-MM-DD format. Look for 'Period' or date of issue." },
    dueDate: { type: Type.STRING, description: "Payment due date in YYYY-MM-DD format (e.g., 'оплатить счет до')" },
    subtotal: { type: Type.NUMBER, description: "Sum of line items before tax or additional charges" },
    tax: { type: Type.NUMBER, description: "Total tax amount if applicable" },
    total: { type: Type.NUMBER, description: "Final total amount due (Look for 'ИТОГО К ОПЛАТЕ')" },
    currency: { type: Type.STRING, description: "Currency code (e.g., RUB, USD, EUR)" },
    category: { type: Type.STRING, description: "Category of expense (e.g., Utilities, Housing, Software, Office Supplies)"},
    lineItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "Name of service or product (e.g., 'Виды услуг', 'ВЗНОС НА КАПИТАЛЬНЫЙ РЕМОНТ', 'ОТОПЛЕНИЕ')" },
          quantity: { type: Type.NUMBER, description: "Volume or quantity (e.g., 'Объем услуг' or 'Объем')" },
          unitPrice: { type: Type.NUMBER, description: "Tariff or price per unit (e.g., 'Тариф')" },
          total: { type: Type.NUMBER, description: "Total cost for this item (e.g., 'Начислено' or 'ИТОГО')" },
        },
        required: ["description", "total"]
      }
    }
  },
  required: ["vendorName", "total", "lineItems"]
};

export const processInvoiceWithGemini = async (base64Image: string, mimeType: string, selectionKeywords: string[]): Promise<Partial<InvoiceData>> => {
  try {
    // Fixed: Use process.env.API_KEY directly as per @google/genai guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: `Analyze this document and extract the structured invoice data.

            The document might be in Russian (e.g., "ЕДИНЫЙ ПЛАТЕЖНЫЙ ДОКУМЕНТ").
            - Map 'Лицевой счет' to 'accountNumber'.
            - Look for the address line starting with 'Адрес:'. Extract the city name (e.g. 'ДОЛГОПРУДНЫЙ' or 'ЛОБНЯ') into the 'city' field.
            - Map 'ИТОГО К ОПЛАТЕ' or the final payable amount to 'total'.
            - Map 'Период' or the document date to 'date'.

            EXTRACTING LINE ITEMS:
            - Look for the table section often titled "РАСЧЕТ РАЗМЕРА ПЛАТЫ" or "Виды услуг".
            - Extract each row representing a service (e.g., ВЗНОС НА КАПИТАЛЬНЫЙ РЕМОНТ, ВОДООТВЕДЕНИЕ, ОТОПЛЕНИЕ, ХОЛОДНОЕ В/С, ГОРЯЧЕЕ В/С).
            - 'description': Name of the service.
            - 'quantity': The volume/consumption amount (Объем).
            - 'unitPrice': The tariff rate (Тариф).
            - 'total': The charged amount (Начислено or Итого).

            - Map 'Получатель платежа' or 'Управляющая организация' to 'vendorName'.
            - If currency is 'руб.', use 'RUB'.

            If a field is missing, make a reasonable estimate or leave it as null/0.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: invoiceSchema,
        temperature: 0.1, // Low temperature for factual extraction
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);

    // Logic to select specific items based on description
    const lineItemsWithSelection = data.lineItems?.map((item: any) => {
        const desc = item.description?.toUpperCase().trim() || "";
        // Check if description starts with any of the keywords
        const isSelected = selectionKeywords.some(keyword => desc.startsWith(keyword.toUpperCase()));

        return {
            ...item,
            selected: isSelected
        };
    }) || [];

    // Recalculate totals based ONLY on selected items
    const selectedSubtotal = lineItemsWithSelection.reduce((acc: number, item: any) => {
        return item.selected ? acc + (item.total || 0) : acc;
    }, 0);

    // For these invoices, we treat the sum of selected items as the total to pay
    // Only override the total if we actually found matching selected items
    const selectedTotal = selectedSubtotal;

    // If we have selected items, use their sum. Otherwise fallback to extracted total.
    const finalTotal = selectedSubtotal > 0 ? selectedTotal : (data.total || 0);
    const finalSubtotal = selectedSubtotal > 0 ? selectedSubtotal : (data.subtotal || 0);

    return {
      ...data,
      lineItems: lineItemsWithSelection,
      subtotal: parseFloat(finalSubtotal.toFixed(2)),
      total: parseFloat(finalTotal.toFixed(2)),
      tax: 0, // Reset extracted tax as we are often calculating a custom total
      status: InvoiceStatus.DRAFT, // Default to draft for bulk upload
      id: crypto.randomUUID(),
    };
  } catch (error) {
    console.error("Gemini processing error:", error);
    throw error;
  }
};
