const MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (request.method === 'GET') {
      return json({
        ok: true,
        service: 'CLOSET MIX AI',
        provider: 'Cloudflare Workers AI',
        aiBinding: !!env.AI,
        model: MODEL
      }, 200, cors);
    }

    if (request.method !== 'POST') return json({ ok:false, error:'POST only' }, 405, cors);

    try {
      if (!env.AI) throw new Error("Workers AI binding 'AI' is not configured.");
      const body = await request.json();
      const image = body.clothesImage || body.image || body.imageBase64 || body.base64;
      if (!image || typeof image !== 'string') return json({ok:false,error:'画像データがありません。'},400,cors);

      const prompt = `あなたはCLOSET MIXの衣類画像解析AIです。画像を見て、次のJSONだけを返してください。説明文やMarkdownは不要です。\n\n{
  "brand":"",
  "productName":"",
  "category":"",
  "color":"",
  "colorCode":"",
  "size":"",
  "price":"",
  "productCode":"",
  "janCode":"",
  "material":"",
  "maker":"",
  "countryOfOrigin":"",
  "pattern":"",
  "season":"",
  "features":"",
  "description":""
}\n\ncategoryは可能なら Tシャツ / シャツ / アウター / パンツ / スカート / 靴 / バッグ / その他 のどれか。タグやラベルが写っている場合は文字を読み取り、ブランド、サイズ、価格、品番、JAN、素材などを優先して抽出してください。priceは数字だけで返し、税込価格が明記されている場合は必ず税込価格を採用してください。税抜価格と税込価格が併記されている場合は税込価格を採用してください。SALE・SERVICE PRICEなど現在の販売価格がある場合は、定価ではなく現在の販売価格の税込額を採用してください。読めない・断定できない項目は推測せず空文字にしてください。日本語で返してください。`;

      const result = await env.AI.run(MODEL, {
        prompt,
        image,
        max_tokens: 900,
        temperature: 0.1
      });

      const text = result?.response || '';
      const analysis = parseJson(text);
      if (!analysis) throw new Error('AIの回答をJSONとして読み取れませんでした。');

      return json({ok:true,analysis,model:MODEL},200,cors);
    } catch (e) {
      console.error(e?.stack || e?.message || String(e));
      return json({ok:false,error:'AI解析中にエラーが発生しました。',details:e?.message||String(e)},500,cors);
    }
  }
};

function parseJson(text) {
  if (typeof text !== 'string') return null;
  let s = text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
  try { return JSON.parse(s); } catch (_) {}
  const a=s.indexOf('{'), b=s.lastIndexOf('}');
  if (a>=0 && b>a) { try { return JSON.parse(s.slice(a,b+1)); } catch (_) {} }
  return null;
}

function json(data,status,cors){
  return new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json; charset=UTF-8'}});
}
