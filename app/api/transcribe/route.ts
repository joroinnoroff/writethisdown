import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { writeFile } from "fs/promises";
import { unlink } from "fs/promises";
import path from "path";
import os from "os";

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: { message: "No file provided" } },
        { status: 400 }
      );
    }

    // Konverter fil til buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Opprett temp-filbane
    const tempDir = os.tmpdir();
    const uniqueFileName = `upload-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}${path.extname(file.name)}`;
    tempFilePath = path.join(tempDir, uniqueFileName);

    // Skriv buffer til midlertidig fil
    await writeFile(tempFilePath, buffer);

    // Opprett en Groq-instans og send filen
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY, // Pass API-nøkkelen som en miljøvariabel
    });

    const transcription = await groq.audio.transcriptions.create({
      file: require("fs").createReadStream(tempFilePath),
      model: "whisper-large-v3",
      response_format: "json",
      language: "en",
      temperature: 0.0
    });


    //clean up delete temp file 

    if (tempFilePath) {
      await unlink(tempFilePath);
    }

    return NextResponse.json(transcription);

  } catch (error) {
    console.error("Error:", error);

    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (unlinkError) {
        console.error("Failed to delete temp file:", unlinkError);
      }
    }

    return NextResponse.json(
      { error: { message: "Something went wrong." } },
      { status: 500 }
    );
  }
}
