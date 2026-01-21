"use strict";(()=>{var e={};e.id=1980,e.ids=[1980],e.modules={20145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},51309:e=>{e.exports=import("@supabase/supabase-js")},56249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,a){return a in t?t[a]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,a)):"function"==typeof t&&"default"===a?t:void 0}}})},46954:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.r(t),a.d(t,{config:()=>c,default:()=>p,routeModule:()=>l});var o=a(71802),n=a(47153),i=a(56249),s=a(69694),d=e([s]);s=(d.then?(await d)():d)[0];let p=(0,i.l)(s,"default"),c=(0,i.l)(s,"config"),l=new o.PagesAPIRouteModule({definition:{kind:n.x.PAGES_API,page:"/api/payments/mark-sent.active",pathname:"/api/payments/mark-sent.active",bundlePath:"",filename:""},userland:s});r()}catch(e){r(e)}})},60262:(e,t,a)=>{a.d(t,{hx:()=>i,j1:()=>s,sI:()=>n});var r=a(96544);async function o(e){try{let t=`${(0,r.A)()}/api/send-email`,a=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),o=await a.json();if(!a.ok)throw Error(o.error||"Error sending email");return o}catch(e){throw console.error("Email sending failed:",e),e}}async function n(e,t,a,r,n){let i=`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: #7c3aed; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .content { padding: 40px 30px; text-align: center; }
          .content p { font-size: 16px; color: #4b5563; margin-bottom: 24px; }
          .button { display: inline-block; padding: 14px 28px; background: #7c3aed; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background 0.2s; }
          .button:hover { background: #6d28d9; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
          .qr-container { margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 12px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Voc\xea foi convidado! 🎉</h1>
          </div>
          <div class="content">
            <p>Ol\xe1!</p>
            <p><strong>${a}</strong> convidou voc\xea para participar do grupo de despesas <strong>"${t}"</strong> no Divvy.</p>
            
            <a href="${r}" class="button">Aceitar Convite</a>
            
            ${n?`
              <div style="margin-top: 30px;">
                <p style="font-size: 14px; margin-bottom: 10px;">Ou escaneie com seu celular:</p>
                <div class="qr-container">
                  <img src="${n}" width="150" height="150" alt="QR Code" style="display: block;" />
                </div>
              </div>
            `:""}
            
            <p style="font-size: 12px; margin-top: 30px;">Este link expira em 7 dias.</p>
          </div>
          <div class="footer">
            <p>\xa9 2026 Divvy. Gest\xe3o inteligente de despesas.</p>
          </div>
        </div>
      </body>
    </html>
  `;return await o({to:e,subject:`${a} convidou voc\xea para ${t} no Divvy`,html:i})}async function i(e,t,a,r,n){let i=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #1f2937;">Nova despesa em ${t} 💸</h2>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Valor:</strong> <span style="font-size: 18px; color: #059669;">R$ ${a}</span></p>
        <p style="margin: 5px 0;"><strong>Descri\xe7\xe3o:</strong> ${r}</p>
        <p style="margin: 5px 0;"><strong>Pago por:</strong> ${n}</p>
      </div>
      <p style="color: #666; font-size: 14px;">Acesse o app para ver os detalhes e seu saldo atualizado.</p>
    </div>
  `;return await o({to:e,subject:`Nova despesa de R$ ${a} em ${t}`,html:i})}async function s(e,t,a,r){let n=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1f2937;">Pagamento Enviado 💰</h2>
      <p><strong>${t}</strong> marcou um pagamento de <strong>R$ ${a}</strong> para voc\xea no grupo <strong>${r}</strong>.</p>
      <p>Por favor, verifique se recebeu o valor e confirme no app.</p>
      <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; color: #92400e;">
        Acesse o Divvy para confirmar ou recusar.
      </div>
    </div>
  `;return await o({to:e,subject:`${t} enviou R$ ${a} no Divvy`,html:n})}},96544:(e,t,a)=>{a.d(t,{A:()=>r});let r=()=>{let e=process.env.NEXT_PUBLIC_SITE_URL||process.env.NEXT_PUBLIC_VERCEL_URL||"http://localhost:3000";return(e=e.startsWith("http")?e:`https://${e}`).replace(/\/$/,"")}},76215:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.d(t,{m:()=>i});var o=a(51309),n=e([o]);o=(n.then?(await n)():n)[0];let s="https://jpgifiumxqzbroejhudc.supabase.co",d="sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi";if(!s)throw Error("Missing env NEXT_PUBLIC_SUPABASE_URL");if(!d)throw Error("Missing env NEXT_PUBLIC_SUPABASE_ANON_KEY");async function i(e){let t=e.headers.get("authorization")?.split(" ")[1];if(!t)throw Error("Unauthorized");let a=(0,o.createClient)(s,d),{data:{user:r},error:n}=await a.auth.getUser(t);if(n||!r)throw Error("Unauthorized");return r}r()}catch(e){r(e)}})},30497:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.d(t,{f:()=>d});var o=a(51309),n=e([o]);o=(n.then?(await n)():n)[0];let i="https://jpgifiumxqzbroejhudc.supabase.co",s=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!i)throw Error("Missing env NEXT_PUBLIC_SUPABASE_URL");if(!s)throw Error("Missing env SUPABASE_SERVICE_ROLE_KEY");let d=()=>(0,o.createClient)(i,s,{auth:{autoRefreshToken:!1,persistSession:!1}});r()}catch(e){r(e)}})},69694:(e,t,a)=>{a.a(e,async(e,r)=>{try{a.r(t),a.d(t,{default:()=>d});var o=a(30497),n=a(76215),i=a(60262),s=e([o,n]);async function d(e,t){if("POST"!==e.method)return t.status(405).json({error:"Method not allowed"});let{transactionId:a,fromUserId:r}=e.body;if(!a||!r)return t.status(400).json({error:"transactionId e fromUserId s\xe3o obrigat\xf3rios."});try{let s=await (0,n.m)(e,t),d=(0,o.f)();if(s.id!==r)return t.status(403).json({error:"Voc\xea s\xf3 pode registrar pagamentos que voc\xea enviou."});let{data:p,error:c}=await d.from("transactions").select("*").eq("id",a).single();if(c||!p)return t.status(404).json({error:"Transa\xe7\xe3o n\xe3o encontrada."});if("pending"!==p.status)return t.status(400).json({error:"Somente transa\xe7\xf5es pendentes podem ser marcadas como enviadas."});if(p.fromuserid!==r)return t.status(403).json({error:"Voc\xea s\xf3 pode registrar pagamentos que voc\xea enviou."});let l=new Date().toISOString(),{data:u,error:f}=await d.from("transactions").update({status:"paymentsent",updatedat:l}).eq("id",a).select().single();if(f)throw f;let{data:g}=await d.from("userprofiles").select("email").eq("id",u.touserid).single(),{data:m}=await d.from("userprofiles").select("fullname, displayname").eq("id",u.fromuserid).single(),{data:h}=await d.from("divvies").select("name").eq("id",u.divvyid).single(),v=m?.displayname||m?.fullname||"Algu\xe9m";return await d.from("notifications").insert({user_id:u.touserid,divvy_id:u.divvyid,type:"settlement",title:"Pagamento Recebido",message:`${v} marcou um pagamento de R$ ${u.amount.toFixed(2)} como enviado.`,created_at:new Date().toISOString(),is_read:!1}),g?.email&&await (0,i.j1)(g.email,v,u.amount.toFixed(2),h?.name||"Grupo"),t.status(200).json({success:!0,transaction:u})}catch(e){if("Unauthorized"===e.message)return t.status(401).json({error:"N\xe3o autorizado"});return console.error("Mark Sent Error:",e),t.status(500).json({error:e.message})}}[o,n]=s.then?(await s)():s,r()}catch(e){r(e)}})},47153:(e,t)=>{var a;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return a}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(a||(a={}))},71802:(e,t,a)=>{e.exports=a(20145)}};var t=require("../../../webpack-api-runtime.js");t.C(e);var a=t(t.s=46954);module.exports=a})();