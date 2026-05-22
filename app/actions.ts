import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey:process.env.GEMINI_API_KEY
});
const chat = ai.chats.create({ model: "gemini-3.5-flash" });

async function main() {
  

  let response = await chat.sendMessage({ message: "I have 2 dogs in my house." });
  console.log("Response 1:", response.text);

  response = await chat.sendMessage({ message: "How many paws are in my house?" });
  console.log("Response 2:", response.text);
  
  const chat2 = ai.chats.create({model:'gemini-3.5-flash'})

  response = await chat2.sendMessage({ message: "How many paws are in my house?" });
  console.log("Response 3:", response.text);
}

main();

export async function getStreamedResponse(input: string){

}