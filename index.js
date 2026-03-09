import { GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync';
import { exec } from "child_process"; 
import { promisify } from "util";

const History = [];
const ai = new GoogleGenAI({ apiKey: "AIzaSyDFPZaeHhE_Yqb1jAbetqoSxWUWQlU7rDI" });

const asyncExec = promisify(exec);

async function exececuteCommand({command})
{
    try
    {
        const { stdout, stderr } = await asyncExec(command);
        if (stderr)
        {
            return `Error: ${stderr}`;
        }

        return `Success: ${stdout} || Task Completed Successfully!`;
    }
    catch(error)
    {
        return `Error: ${error.message}`;
    }
}

const executeCommandDeclaration = {
    name:'exececuteCommand',
    description:"Execute a signle term command in terminal. A command can be anything like create a folder or create a file file or run code, write file , edit file, or delete file etc",
    parameters:{
        type:'OBJECT',
        properties:{
            command:{
                type:'STRING',
                description: 'It will be the single terminal command e.g. "mkdir myFolder" or "touch file.txt" or "node app.js" or "rm -rf myFolder" etc'
            },
        },
        required: ['command']   
    }
}


const availableTools = {
    exececuteCommand
}



async function runAgent(userProblem) {

    History.push({
        role:'user',
        parts:[{text:userProblem}]
    });

   
    while(true){
    
   const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: History,
    config: {
        systemInstruction: `You are an Website designer expert, you have to create tge website. you have access of tool which can execute terminal commands`,
    tools: [{
      functionDeclarations: [executeCommandDeclaration]
    }],
    },
   });


   if(response.functionCalls&&response.functionCalls.length>0){
    
    console.log(response.functionCalls[0]);
    const {name,args} = response.functionCalls[0];

    const funCall =  availableTools[name];
    const result = await funCall(args);

    const functionResponsePart = {
      name: name,
      response: {
        result: result,
      },
    };
   
    // model 
    History.push({
      role: "model",
      parts: [
        {
          functionCall: response.functionCalls[0],
        },
      ],
    });

    // result Ko history daalna

    History.push({
      role: "user",
      parts: [
        {
          functionResponse: functionResponsePart,
        },
      ],
    });
   }
   else{

    History.push({
        role:'model',
        parts:[{text:response.text}]
    })
    console.log(response.text);
    break;
   }


  }

}

async function main() {
    const userProblem = readlineSync.question("Ask me anything--> ");
    await runAgent(userProblem);
    main();
}


main();
