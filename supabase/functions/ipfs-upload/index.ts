import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * ipfs-upload edge function (Deno)
 * - Expects multipart/form-data with:
 *    - file: File
 *    - fileName: optional string (fallback to file.name)
 * - Uses PINATA_API_KEY and PINATA_SECRET_KEY from env (JWT off)
 * - Returns structured Pinata error details on failure for debugging
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read env vars (do not log secret values)
    const pinataApiKey = Deno.env.get("PINATA_API_KEY");
    const pinataSecretKey = Deno.env.get("PINATA_SECRET_KEY");

    console.log("Pinata env presence:", { apiKey: !!pinataApiKey, secretKey: !!pinataSecretKey });
    if (!pinataApiKey || !pinataSecretKey) {
      console.error("Pinata credentials not configured");
      return new Response(
        JSON.stringify({ error: "IPFS service not configured (missing Pinata credentials)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse formData defensively
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (err) {
      console.error("Failed to parse formData:", err);
      return new Response(
        JSON.stringify({ error: "Invalid request body — expected multipart/form-data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileEntry = formData.get("file");
    const fileNameField = formData.get("fileName");

    if (!fileEntry || !(fileEntry instanceof File)) {
      console.error("No file provided or invalid file field:", fileEntry);
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const file = fileEntry as File;
    const fileName = (typeof fileNameField === "string" && fileNameField) ? fileNameField : file.name;

    console.log("Uploading file to Pinata:", fileName, "size:", file.size, "type:", file.type);

    // Build form data for Pinata
    const pinataFormData = new FormData();
    pinataFormData.append("file", file, fileName);
    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size.toString(),
      },
    });
    pinataFormData.append("pinataMetadata", metadata);

    // Send to Pinata using key/secret auth (do NOT set Content-Type header)
    const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretKey,
      },
      body: pinataFormData,
    });

    const rawText = await pinataResponse.text();

    // Parse Pinata response safely (so we can return structured details)
    let parsed: unknown;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch (err) {
      parsed = { raw: rawText };
    }

    if (!pinataResponse.ok) {
      console.error("Pinata upload failed:", { status: pinataResponse.status, body: parsed });
      // Return structured details to aid debugging (remove or sanitize for production)
      return new Response(
        JSON.stringify({
          error: "Pinata upload failed",
          status: pinataResponse.status,
          details: parsed,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Success - return canonical fields plus the raw response
    const result = parsed as Record<string, unknown> | null;
    console.log("File uploaded successfully. CID:", result?.IpfsHash ?? null);

    return new Response(
      JSON.stringify({
        success: true,
        hash: result?.IpfsHash ?? null,
        size: result?.PinSize ?? null,
        timestamp: result?.Timestamp ?? null,
        raw: result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in ipfs-upload function:", error?.stack ?? error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
