const testDirect = async () => {
  const url = process.env.NEXUSBASE_LLM_BASE_URL || 'http://127.0.0.1:11434/v1/chat/completions';
  const model = process.env.NEXUSBASE_LLM_MODEL || 'qwen3:8b';
  
  const payload = {
    model: model,
    messages: [{ role: "user", content: "Reply with exactly: NEXUSBASE_OK" }],
    temperature: 0
  };

  console.log(`URL: ${url}`);
  console.log(`Model: ${model}`);
  
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    console.log(`HTTP Status: ${response.status}`);
    
    if (!response.ok) {
      console.log(`Error: HTTP ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`Response Text: ${text}`);
      return;
    }
    
    const data: any = await response.json();
    console.log(`Response: ${data?.choices?.[0]?.message?.content}`);
    
  } catch (e: any) {
    clearTimeout(timeout);
    console.log(`Error: ${e.message}`);
    if (e.cause) {
      console.log(`Exact Cause: ${e.cause.message || e.cause}`);
    }
  } finally {
    console.log(`Elapsed: ${Date.now() - start}ms`);
  }
};

testDirect();
